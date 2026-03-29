interface SkillHostCapabilities {
  llm: {
    complete(req: {
      purposeId: string;
      systemPrompt: string;
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      temperature?: number;
      maxTokens?: number;
    }): Promise<{ text: string; tokensUsed: { prompt: number; completion: number } }>;
  };
  events: { emitProgress(progress: number, message: string): void };
  log: {
    debug(msg: string, data?: Record<string, unknown>): void;
    info(msg: string, data?: Record<string, unknown>): void;
    warn(msg: string, data?: Record<string, unknown>): void;
    error(msg: string, data?: Record<string, unknown>): void;
  };
  run: {
    reportStep(label: string, role?: string): void;
    getStepCount(): number;
    getStepBudget(): number | null;
    requestInput(opts: {
      title: string;
      message: string;
      inputSchema: Record<string, unknown>;
    }): Promise<unknown>;
    checkpoint(): Promise<void>;
  };
  workspace: {
    getState(): Promise<ResearchState | null>;
    setState(state: ResearchState): Promise<void>;
    createArtifact(artifact: {
      type: string;
      title: string;
      content: Record<string, unknown>;
      createdByRole?: string;
      parentArtifactId?: string;
    }): Promise<{ id: string }>;
    updateArtifact(
      artifactId: string,
      update: { title?: string; status?: string; content?: Record<string, unknown> },
    ): Promise<void>;
    listArtifacts(): Promise<Array<{ id: string; type: string; title: string; status: string }>>;
    setPhase(phase: string): Promise<void>;
    setRole(role: string): Promise<void>;
  };
  [key: string]: unknown;
}

interface Subtopic {
  title: string;
  description: string;
  analyzed: boolean;
  findingsSummary: string | null;
}

interface ResearchState {
  query: string;
  depth: 'shallow' | 'moderate' | 'deep';
  phase: 'research' | 'analysis' | 'report';
  subtopics: Subtopic[];
  synthesizedFindings: string | null;
  artifactIds: string[];
  completedPhases: string[];
}

const DEPTH_SUBTOPIC_LIMITS: Record<string, number> = {
  shallow: 2,
  moderate: 4,
  deep: 6,
};

/**
 * Checks whether the step budget allows at least `needed` more steps.
 * Returns true if execution should continue, false if the budget is exhausted.
 */
function hasBudgetFor(host: SkillHostCapabilities, needed: number): boolean {
  const budget = host.run.getStepBudget();
  if (budget === null) return true;
  return host.run.getStepCount() + needed <= budget;
}

/**
 * Agentic research assistant.
 *
 * Phases:
 *   1. Research  — identify subtopics from the query, analyze each one
 *   2. Analysis  — synthesize findings across subtopics
 *   3. Report    — produce a final report artifact, request user review
 *
 * Roles:
 *   - "researcher" — identifies and analyzes subtopics
 *   - "analyst"    — synthesizes cross-topic findings
 *   - "writer"     — produces the final report
 *
 * The skill respects the step budget: if the budget is close to exhaustion,
 * it skips remaining subtopics and moves to synthesis early.
 */
export async function execute(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const query = args.query as string;
  const depth = (args.depth as ResearchState['depth']) ?? 'moderate';
  const subtopicLimit = DEPTH_SUBTOPIC_LIMITS[depth] ?? 4;

  // ── Initialize workspace state ────────────────────────────────────────

  let state: ResearchState = (await host.workspace.getState()) ?? {
    query,
    depth,
    phase: 'research',
    subtopics: [],
    synthesizedFindings: null,
    artifactIds: [],
    completedPhases: [],
  };

  // ══════════════════════════════════════════════════════════════════════
  //  Phase 1: Research — identify subtopics and analyze each
  // ══════════════════════════════════════════════════════════════════════

  if (state.phase === 'research') {
    await host.workspace.setPhase('research');
    await host.workspace.setRole('researcher');

    // Step: identify subtopics
    host.run.reportStep('identify-subtopics', 'researcher');
    host.events.emitProgress(0.1, 'Identifying subtopics');

    const subtopicResult = await host.llm.complete({
      purposeId: 'research',
      systemPrompt: `You are a research assistant. Given a research query, identify up to ${subtopicLimit} distinct subtopics worth investigating. Output each subtopic on its own line in the format: "TITLE: description". Output nothing else.`,
      messages: [{ role: 'user', content: query }],
      temperature: 0.3,
      maxTokens: 800,
    });

    state.subtopics = subtopicResult.text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, subtopicLimit)
      .map((line) => {
        const colonIndex = line.indexOf(':');
        const title = colonIndex > 0 ? line.slice(0, colonIndex).trim() : line;
        const description = colonIndex > 0 ? line.slice(colonIndex + 1).trim() : '';
        return { title, description, analyzed: false, findingsSummary: null };
      });

    host.log.info('Subtopics identified', { count: state.subtopics.length });
    await host.workspace.setState(state);
    await host.run.checkpoint();

    // Analyze each subtopic
    for (const subtopic of state.subtopics) {
      if (subtopic.analyzed) continue;

      // Check budget: we need at least 3 more steps (this analysis + synthesis + report)
      if (!hasBudgetFor(host, 3)) {
        host.log.warn('Step budget nearly exhausted, skipping remaining subtopics', {
          remaining: state.subtopics.filter((s) => !s.analyzed).length,
        });
        break;
      }

      host.run.reportStep(`analyze-${subtopic.title}`, 'researcher');
      host.events.emitProgress(
        0.1 + 0.5 * (state.subtopics.filter((s) => s.analyzed).length / state.subtopics.length),
        `Analyzing: ${subtopic.title}`,
      );

      const analysisResult = await host.llm.complete({
        purposeId: 'research',
        systemPrompt:
          'You are a research assistant. Analyze the given subtopic in the context of the broader research query. Provide a concise but substantive summary of key findings (3-5 sentences). Output only the findings.',
        messages: [
          {
            role: 'user',
            content: `Research query: ${query}\n\nSubtopic: ${subtopic.title}\nDescription: ${subtopic.description}`,
          },
        ],
        temperature: 0.3,
        maxTokens: 500,
      });

      subtopic.analyzed = true;
      subtopic.findingsSummary = analysisResult.text.trim();

      // Create an artifact for each subtopic's findings
      const artifact = await host.workspace.createArtifact({
        type: 'finding',
        title: `Finding: ${subtopic.title}`,
        content: {
          subtopic: subtopic.title,
          description: subtopic.description,
          findings: subtopic.findingsSummary,
          query,
        },
        createdByRole: 'researcher',
      });
      state.artifactIds.push(artifact.id);

      host.log.info('Subtopic analyzed', { subtopic: subtopic.title, artifactId: artifact.id });
      await host.workspace.setState(state);
      await host.run.checkpoint();
    }

    state.phase = 'analysis';
    state.completedPhases.push('research');
    await host.workspace.setState(state);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Phase 2: Analysis — synthesize findings across subtopics
  // ══════════════════════════════════════════════════════════════════════

  if (state.phase === 'analysis') {
    await host.workspace.setPhase('analysis');
    await host.workspace.setRole('analyst');

    host.run.reportStep('synthesize-findings', 'analyst');
    host.events.emitProgress(0.65, 'Synthesizing findings');

    const analyzedSubtopics = state.subtopics.filter((s) => s.analyzed);
    const findingsBlock = analyzedSubtopics
      .map((s) => `## ${s.title}\n${s.findingsSummary}`)
      .join('\n\n');

    const synthesisResult = await host.llm.complete({
      purposeId: 'research',
      systemPrompt:
        'You are a research analyst. Synthesize the following subtopic findings into a coherent overview. Identify common themes, contradictions, and key takeaways. Output a structured synthesis (no more than 500 words).',
      messages: [
        {
          role: 'user',
          content: `Research query: ${query}\n\nFindings:\n\n${findingsBlock}`,
        },
      ],
      temperature: 0.2,
      maxTokens: 800,
    });

    state.synthesizedFindings = synthesisResult.text.trim();
    state.phase = 'report';
    state.completedPhases.push('analysis');
    await host.workspace.setState(state);
    await host.run.checkpoint();

    host.log.info('Findings synthesized', { length: state.synthesizedFindings.length });
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Phase 3: Report — produce final report and request user review
  // ══════════════════════════════════════════════════════════════════════

  if (state.phase === 'report') {
    await host.workspace.setPhase('report');
    await host.workspace.setRole('writer');

    host.run.reportStep('write-report', 'writer');
    host.events.emitProgress(0.8, 'Writing final report');

    const analyzedSubtopics = state.subtopics.filter((s) => s.analyzed);

    const reportResult = await host.llm.complete({
      purposeId: 'research',
      systemPrompt:
        'You are a report writer. Produce a well-structured research report in Markdown. Include an executive summary, a section for each subtopic, and a conclusion with key takeaways. The report should be professional and thorough.',
      messages: [
        {
          role: 'user',
          content: `Research query: ${query}\n\nSynthesis:\n${state.synthesizedFindings}\n\nSubtopic details:\n${analyzedSubtopics.map((s) => `### ${s.title}\n${s.findingsSummary}`).join('\n\n')}`,
        },
      ],
      temperature: 0.3,
      maxTokens: 2000,
    });

    const reportArtifact = await host.workspace.createArtifact({
      type: 'report',
      title: `Research Report: ${query}`,
      content: {
        body: reportResult.text.trim(),
        query,
        subtopicsAnalyzed: analyzedSubtopics.length,
        depth,
        generatedAt: new Date().toISOString(),
      },
      createdByRole: 'writer',
    });
    state.artifactIds.push(reportArtifact.id);

    host.log.info('Report created', { artifactId: reportArtifact.id });
    host.events.emitProgress(0.9, 'Report ready for review');

    // Request user review
    host.run.reportStep('request-review', 'writer');

    const feedback = (await host.run.requestInput({
      title: 'Review Research Report',
      message:
        'The research report has been generated. Please review the report artifact and provide feedback.',
      inputSchema: {
        type: 'object',
        properties: {
          approved: {
            type: 'boolean',
            description: 'Whether the report is approved as-is',
          },
          feedback: {
            type: 'string',
            description: 'Optional feedback or revision notes',
          },
        },
        required: ['approved'],
      },
    })) as { approved: boolean; feedback?: string };

    if (feedback.approved) {
      await host.workspace.updateArtifact(reportArtifact.id, { status: 'approved' });
      host.log.info('Report approved by user');
    } else {
      await host.workspace.updateArtifact(reportArtifact.id, {
        status: 'needs-revision',
        content: {
          body: reportResult.text.trim(),
          query,
          subtopicsAnalyzed: analyzedSubtopics.length,
          depth,
          generatedAt: new Date().toISOString(),
          userFeedback: feedback.feedback ?? '',
        },
      });
      host.log.info('Report marked for revision', { feedback: feedback.feedback });
    }

    state.completedPhases.push('report');
    await host.workspace.setState(state);
    await host.run.checkpoint();
  }

  host.events.emitProgress(1.0, 'Research complete');

  return {
    summary: state.synthesizedFindings ?? 'No findings synthesized.',
    artifactIds: state.artifactIds,
    stepsUsed: host.run.getStepCount(),
    phases: state.completedPhases,
  };
}

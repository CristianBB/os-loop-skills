'use client';

import { useState } from 'react';
import { isRoadmapArtifactContent } from '../types';
import type { RoadmapArtifactContent, RoadmapPhase, RoadmapPhaseRiskLevel, RoadmapPhaseComplexity, CeoStrategicValidationCoherence, CeoStrategicValidation, RoadmapVersionMetadata } from '../types';

const RISK_STYLES: Record<RoadmapPhaseRiskLevel, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const COMPLEXITY_STYLES: Record<RoadmapPhaseComplexity, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

const COHERENCE_STYLES: Record<CeoStrategicValidationCoherence, string> = {
  'aligned': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'minor-concerns': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'misaligned': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  'ceo': 'CEO',
  'product-manager': 'Product Manager',
  'ux-ui': 'UX/UI',
  'software-architect': 'Architect',
  'developer': 'Developer',
  'qa': 'QA',
};

interface RoadmapArtifactRendererProps {
  content: Record<string, unknown>;
  previousContent?: RoadmapArtifactContent | null;
}

export function RoadmapArtifactRenderer({ content, previousContent }: RoadmapArtifactRendererProps) {
  if (!isRoadmapArtifactContent(content)) {
    return (
      <pre data-testid="roadmap-raw-json" className="whitespace-pre-wrap text-xs text-muted-foreground">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  }

  const roadmap = content as RoadmapArtifactContent;

  return (
    <div data-testid="roadmap-structured-view" className="space-y-4 text-xs">
      <ProductSummarySection summary={roadmap.productSummary} />
      <ScopeSection scope={roadmap.productScope} />
      <TopologySection topology={roadmap.projectTopology} />
      <PhasesSection phases={roadmap.phases} />
      <MilestonesSection milestones={roadmap.milestones} phases={roadmap.phases} />
      {roadmap.assumptions.length > 0 && <AssumptionsSection assumptions={roadmap.assumptions} />}
      {roadmap.openQuestions.length > 0 && <OpenQuestionsSection questions={roadmap.openQuestions} />}
      {roadmap.strategicValidation && <StrategicValidationSection validation={roadmap.strategicValidation} />}
      {previousContent && <VersionDiffSection current={roadmap} previous={previousContent} />}
      {roadmap.versionMetadata && <VersionMetadataFooter metadata={roadmap.versionMetadata} />}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">{children}</h3>;
}

function ProductSummarySection({ summary }: { summary: RoadmapArtifactContent['productSummary'] }) {
  return (
    <div data-testid="roadmap-product-summary" className="space-y-2">
      <SectionHeader>Product Summary</SectionHeader>
      <p className="text-muted-foreground">{summary.description}</p>
      <div className="flex flex-wrap gap-1">
        {summary.targetUsers.map((user) => (
          <span key={user} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
            {user}
          </span>
        ))}
      </div>
      <p className="text-muted-foreground italic">{summary.coreValueProposition}</p>
    </div>
  );
}

function ScopeSection({ scope }: { scope: RoadmapArtifactContent['productScope'] }) {
  return (
    <div data-testid="roadmap-scope" className="space-y-2">
      <SectionHeader>Scope</SectionHeader>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-medium text-green-700 dark:text-green-400 mb-1">Included</p>
          <ul className="space-y-0.5">
            {scope.included.map((item) => (
              <li key={item} className="flex items-start gap-1 text-muted-foreground">
                <span className="text-green-600 shrink-0">&#10003;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-medium text-red-700 dark:text-red-400 mb-1">Excluded</p>
          <ul className="space-y-0.5">
            {scope.excluded.map((item) => (
              <li key={item} className="flex items-start gap-1 text-muted-foreground">
                <span className="text-red-600 shrink-0">&#10007;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TopologySection({ topology }: { topology: RoadmapArtifactContent['projectTopology'] }) {
  return (
    <div data-testid="roadmap-topology" className="space-y-2">
      <SectionHeader>Project Topology</SectionHeader>
      <div className="grid gap-2">
        {topology.map((project) => (
          <div key={project.projectId} className="rounded-md border bg-card p-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{project.name}</span>
              <span className="text-muted-foreground">({project.projectId})</span>
            </div>
            <p className="text-muted-foreground">{project.purpose}</p>
            {project.techConsiderations.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.techConsiderations.map((tech) => (
                  <span key={tech} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhasesSection({ phases }: { phases: RoadmapPhase[] }) {
  return (
    <div data-testid="roadmap-phases" className="space-y-2">
      <SectionHeader>Phases</SectionHeader>
      <div className="space-y-2">
        {phases.map((phase) => (
          <PhaseCard key={phase.id} phase={phase} />
        ))}
      </div>
    </div>
  );
}

function PhaseCard({ phase }: { phase: RoadmapPhase }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 hover:bg-accent transition-colors text-left"
        data-testid={`phase-toggle-${phase.id}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{phase.name}</span>
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${RISK_STYLES[phase.riskLevel]}`}>
            {phase.riskLevel} risk
          </span>
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${COMPLEXITY_STYLES[phase.estimatedComplexity]}`}>
            {phase.estimatedComplexity} complexity
          </span>
        </div>
        <span className="text-muted-foreground ml-2">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>
      {expanded && (
        <div data-testid={`phase-details-${phase.id}`} className="border-t px-3 py-2 space-y-2 bg-muted/30">
          <p className="text-muted-foreground">{phase.description}</p>

          {phase.goals.length > 0 && (
            <div>
              <p className="font-medium mb-0.5">Goals</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {phase.goals.map((g) => <li key={g}>{g}</li>)}
              </ul>
            </div>
          )}

          {phase.deliverables.length > 0 && (
            <div>
              <p className="font-medium mb-0.5">Deliverables</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {phase.deliverables.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
          )}

          {phase.involvedProjects.length > 0 && (
            <div>
              <p className="font-medium mb-0.5">Involved Projects</p>
              <div className="flex flex-wrap gap-1">
                {phase.involvedProjects.map((p) => (
                  <span key={p} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{p}</span>
                ))}
              </div>
            </div>
          )}

          {phase.dependencies.length > 0 && (
            <div>
              <p className="font-medium mb-0.5">Dependencies</p>
              <div className="flex flex-wrap gap-1">
                {phase.dependencies.map((d) => (
                  <span key={d} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{d}</span>
                ))}
              </div>
            </div>
          )}

          {phase.validationCriteria.length > 0 && (
            <div>
              <p className="font-medium mb-0.5">Validation Criteria</p>
              <ul className="space-y-0.5 text-muted-foreground">
                {phase.validationCriteria.map((c) => (
                  <li key={c} className="flex items-start gap-1">
                    <span className="shrink-0">&#9744;</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MilestonesSection({ milestones, phases }: { milestones: RoadmapArtifactContent['milestones']; phases: RoadmapPhase[] }) {
  const phaseNameMap = new Map(phases.map((p) => [p.id, p.name]));

  return (
    <div data-testid="roadmap-milestones" className="space-y-2">
      <SectionHeader>Milestones</SectionHeader>
      <div className="space-y-2">
        {milestones.map((ms) => (
          <div key={ms.id} className="rounded-md border bg-card p-2 space-y-1">
            <p className="font-medium">{ms.name}</p>
            <p className="text-muted-foreground">{ms.description}</p>
            <div className="flex flex-wrap gap-1">
              {ms.phaseIds.map((pid) => (
                <span key={pid} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                  {phaseNameMap.get(pid) ?? pid}
                </span>
              ))}
            </div>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {ms.successCriteria.map((sc) => <li key={sc}>{sc}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssumptionsSection({ assumptions }: { assumptions: string[] }) {
  return (
    <div data-testid="roadmap-assumptions" className="space-y-2">
      <SectionHeader>Assumptions</SectionHeader>
      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
        {assumptions.map((a) => <li key={a}>{a}</li>)}
      </ul>
    </div>
  );
}

function OpenQuestionsSection({ questions }: { questions: string[] }) {
  return (
    <div data-testid="roadmap-open-questions" className="space-y-2">
      <SectionHeader>Open Questions</SectionHeader>
      <ul className="space-y-0.5">
        {questions.map((q) => (
          <li key={q} className="flex items-start gap-1 text-amber-700 dark:text-amber-400">
            <span className="shrink-0">?</span>
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StrategicValidationSection({ validation }: { validation: CeoStrategicValidation }) {
  return (
    <div data-testid="roadmap-strategic-validation" className="space-y-2">
      <SectionHeader>Strategic Validation</SectionHeader>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-muted-foreground">Coherence:</span>
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${COHERENCE_STYLES[validation.coherenceScore]}`}>
          {validation.coherenceScore}
        </span>
      </div>
      {validation.flaggedIssues.length > 0 && (
        <div>
          <p className="font-medium mb-0.5 text-red-700 dark:text-red-400">Flagged Issues</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
            {validation.flaggedIssues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      )}
      {validation.suggestedAdjustments.length > 0 && (
        <div>
          <p className="font-medium mb-0.5">Suggested Adjustments</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
            {validation.suggestedAdjustments.map((adj) => <li key={adj}>{adj}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function VersionDiffSection({ current, previous }: { current: RoadmapArtifactContent; previous: RoadmapArtifactContent }) {
  const [expanded, setExpanded] = useState(false);
  const prevVersion = previous.versionMetadata?.version ?? '?';

  const currentPhaseIds = new Set(current.phases.map((p) => p.id));
  const previousPhaseIds = new Set(previous.phases.map((p) => p.id));
  const addedPhases = current.phases.filter((p) => !previousPhaseIds.has(p.id));
  const removedPhases = previous.phases.filter((p) => !currentPhaseIds.has(p.id));

  const addedIncluded = current.productScope.included.filter((i) => !previous.productScope.included.includes(i));
  const removedIncluded = previous.productScope.included.filter((i) => !current.productScope.included.includes(i));
  const addedExcluded = current.productScope.excluded.filter((i) => !previous.productScope.excluded.includes(i));
  const removedExcluded = previous.productScope.excluded.filter((i) => !current.productScope.excluded.includes(i));

  const riskChanges = current.phases
    .filter((p) => {
      const prev = previous.phases.find((pp) => pp.id === p.id);
      return prev && prev.riskLevel !== p.riskLevel;
    })
    .map((p) => {
      const prev = previous.phases.find((pp) => pp.id === p.id)!;
      return { name: p.name, from: prev.riskLevel, to: p.riskLevel };
    });

  const hasChanges =
    addedPhases.length > 0 ||
    removedPhases.length > 0 ||
    addedIncluded.length > 0 ||
    removedIncluded.length > 0 ||
    addedExcluded.length > 0 ||
    removedExcluded.length > 0 ||
    riskChanges.length > 0;

  if (!hasChanges) return null;

  return (
    <div data-testid="roadmap-version-diff" className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        data-testid="version-diff-toggle"
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{expanded ? '\u25B2' : '\u25BC'}</span>
        <span>Changes from v{prevVersion}</span>
      </button>
      {expanded && (
        <div data-testid="version-diff-content" className="rounded-md border bg-muted/30 p-2 space-y-1.5 text-[10px]">
          {addedPhases.length > 0 && (
            <div>
              <span className="font-medium text-green-700 dark:text-green-400">Added phases: </span>
              <span className="text-muted-foreground">{addedPhases.map((p) => p.name).join(', ')}</span>
            </div>
          )}
          {removedPhases.length > 0 && (
            <div>
              <span className="font-medium text-red-700 dark:text-red-400">Removed phases: </span>
              <span className="text-muted-foreground">{removedPhases.map((p) => p.name).join(', ')}</span>
            </div>
          )}
          {addedIncluded.length > 0 && (
            <div>
              <span className="font-medium text-green-700 dark:text-green-400">Scope added: </span>
              <span className="text-muted-foreground">{addedIncluded.join(', ')}</span>
            </div>
          )}
          {removedIncluded.length > 0 && (
            <div>
              <span className="font-medium text-red-700 dark:text-red-400">Scope removed: </span>
              <span className="text-muted-foreground">{removedIncluded.join(', ')}</span>
            </div>
          )}
          {addedExcluded.length > 0 && (
            <div>
              <span className="font-medium text-amber-700 dark:text-amber-400">New exclusions: </span>
              <span className="text-muted-foreground">{addedExcluded.join(', ')}</span>
            </div>
          )}
          {removedExcluded.length > 0 && (
            <div>
              <span className="font-medium text-amber-700 dark:text-amber-400">Removed exclusions: </span>
              <span className="text-muted-foreground">{removedExcluded.join(', ')}</span>
            </div>
          )}
          {riskChanges.length > 0 && (
            <div>
              <span className="font-medium">Risk changes: </span>
              <span className="text-muted-foreground">
                {riskChanges.map((c) => `${c.name}: ${c.from} \u2192 ${c.to}`).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VersionMetadataFooter({ metadata }: { metadata: RoadmapVersionMetadata }) {
  const roleFlowDisplay = metadata.roleFlow
    .map((r) => ROLE_DISPLAY_NAMES[r] ?? r)
    .join(' \u2192 ');

  return (
    <div data-testid="roadmap-version-metadata" className="pt-2 border-t text-[10px] text-muted-foreground flex items-center gap-2">
      <span className="font-medium">v{metadata.version}{metadata.version > 1 ? ' (revised)' : ''}</span>
      <span className="text-muted-foreground/60">|</span>
      <span>{roleFlowDisplay}</span>
    </div>
  );
}
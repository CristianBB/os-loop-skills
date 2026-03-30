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
    reportStep(label: string): void;
    requestInput(opts: {
      title: string;
      message: string;
      inputSchema: Record<string, unknown>;
    }): Promise<unknown>;
    checkpoint(): Promise<void>;
  };
  workspace?: {
    getState(): Promise<Record<string, unknown> | null>;
    setState(state: Record<string, unknown>): Promise<void>;
  };
  [key: string]: unknown;
}

/**
 * A flow skill that generates a personalized greeting through multiple steps,
 * pausing to request user input for personalization preferences.
 *
 * Flow:
 *   1. "greet"        — generate an initial greeting using the LLM
 *   2. (pause)        — request user input for a follow-up preference
 *   3. "personalize"  — refine the greeting with the user's preference
 *   4. return result
 */
export async function execute(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const name = args.name as string;
  const occasion = (args.occasion as string) ?? 'general';
  const completedSteps: string[] = [];

  // ── Step 1: Generate an initial greeting ──────────────────────────────

  host.run.reportStep('greet');
  completedSteps.push('greet');
  host.events.emitProgress(0.2, 'Generating initial greeting');

  const initialResult = await host.llm.complete({
    purposeId: 'greeting-generation',
    systemPrompt:
      'You are a friendly greeting writer. Generate a warm, genuine greeting for the given person and occasion. Output only the greeting text, nothing else.',
    messages: [
      {
        role: 'user',
        content: `Write a greeting for ${name}. Occasion: ${occasion}.`,
      },
    ],
    temperature: 0.7,
    maxTokens: 200,
  });

  const initialGreeting = initialResult.text.trim();
  host.log.info('Initial greeting generated', { name, occasion, length: initialGreeting.length });

  // Checkpoint after the first LLM call so we don't lose the result on resume
  await host.run.checkpoint();
  host.events.emitProgress(0.4, 'Initial greeting ready');

  // ── Pause: Request user input for personalization preference ──────────

  const userResponse = await host.run.requestInput({
    title: 'Personalization Preference',
    message: `Here is the initial greeting for ${name}:\n\n"${initialGreeting}"\n\nHow would you like to personalize it? (e.g., "make it more formal", "add a joke", "mention their love of cooking", "shorter and punchier")`,
    inputSchema: {
      type: 'object',
      properties: {
        preference: {
          type: 'string',
          description: 'How to personalize the greeting',
        },
      },
      required: ['preference'],
    },
  });

  const preference = (userResponse as { preference: string }).preference ?? 'keep it as is';
  host.log.info('User preference received', { preference });
  host.events.emitProgress(0.6, 'Personalizing greeting');

  // ── Step 2: Personalize the greeting using the user's preference ──────

  host.run.reportStep('personalize');
  completedSteps.push('personalize');

  const personalizedResult = await host.llm.complete({
    purposeId: 'greeting-generation',
    systemPrompt:
      'You are a friendly greeting writer. You will receive an existing greeting and a personalization request. Rewrite the greeting to incorporate the requested change. Output only the final greeting text, nothing else.',
    messages: [
      {
        role: 'user',
        content: `Original greeting:\n"${initialGreeting}"\n\nPersonalization request: ${preference}`,
      },
    ],
    temperature: 0.7,
    maxTokens: 300,
  });

  const finalGreeting = personalizedResult.text.trim();
  host.log.info('Greeting personalized', { name, preference, length: finalGreeting.length });

  // Save to workspace if available, so the greeting can be revisited later
  if (host.workspace) {
    const existingState = (await host.workspace.getState()) ?? {};
    const history = (existingState.greetingHistory as Array<Record<string, unknown>>) ?? [];
    history.push({
      name,
      occasion,
      preference,
      greeting: finalGreeting,
      createdAt: new Date().toISOString(),
    });
    await host.workspace.setState({ ...existingState, greetingHistory: history });
  }

  await host.run.checkpoint();
  host.events.emitProgress(1.0, 'Done');

  return {
    greeting: finalGreeting,
    steps: completedSteps,
  };
}

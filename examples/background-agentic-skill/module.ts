interface SkillHostCapabilities {
  events: { emitProgress(progress: number, message: string): void };
  log: {
    debug(msg: string, data?: Record<string, unknown>): void;
    info(msg: string, data?: Record<string, unknown>): void;
    warn(msg: string, data?: Record<string, unknown>): void;
    error(msg: string, data?: Record<string, unknown>): void;
  };
  run: {
    reportStep(label: string): void;
    getStepCount(): number;
    getStepBudget(): number | null;
    checkpoint(): Promise<void>;
  };
  workspace: {
    getState(): Promise<BatchState | null>;
    setState(state: BatchState): Promise<void>;
    createArtifact(artifact: {
      type: string;
      title: string;
      content: Record<string, unknown>;
    }): Promise<{ id: string }>;
  };
  [key: string]: unknown;
}

interface BatchItem {
  id: string;
  payload: string;
  status: 'pending' | 'processed' | 'error';
  result: string | null;
  errorMessage: string | null;
  processedAt: string | null;
}

interface BatchState {
  items: BatchItem[];
  cursorIndex: number;
  startedAt: string;
  lastCheckpointAt: string | null;
  completedAt: string | null;
}

/**
 * Processes a single batch item. In a real skill this would perform meaningful
 * work (API calls, data transformation, etc.). This example skill computes a
 * deterministic transformation of the payload: character frequency analysis.
 */
function processItem(item: BatchItem): { result: string; error: string | null } {
  const payload = item.payload;

  if (typeof payload !== 'string' || payload.trim().length === 0) {
    return { result: '', error: 'Empty or invalid payload' };
  }

  // Character frequency analysis
  const freq: Record<string, number> = {};
  for (const char of payload.toLowerCase()) {
    if (char.trim().length === 0) continue;
    freq[char] = (freq[char] ?? 0) + 1;
  }

  // Sort by frequency descending, then alphabetically
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10);

  const analysis = sorted.map(([ch, count]) => `${ch}:${count}`).join(' ');
  const wordCount = payload.split(/\s+/).filter((w) => w.length > 0).length;
  const charCount = payload.length;

  return {
    result: `words=${wordCount} chars=${charCount} top_freq=[${analysis}]`,
    error: null,
  };
}

/**
 * Background-capable batch processor.
 *
 * Expects workspace state to contain an `items` array of BatchItem objects
 * (populated before the skill is invoked, e.g., by a prior skill or the runtime).
 * If no items exist, seeds demo items to illustrate the pattern.
 *
 * Processing loop:
 *   1. Load state (which includes the cursor position for resume)
 *   2. Process items one at a time from the cursor
 *   3. After every `batchSize` items, checkpoint
 *   4. On completion, create a summary artifact
 *
 * Resume behavior:
 *   On restart after interruption, the skill loads state, finds cursorIndex,
 *   and continues from where it left off. Already-processed items are skipped.
 */
export async function execute(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const batchSize = (args.batchSize as number) ?? 5;

  // ── Load or initialize state ──────────────────────────────────────────

  let state = await host.workspace.getState();

  if (!state || !state.items || state.items.length === 0) {
    // Seed demo items when no items are present
    const demoPayloads = [
      'The quick brown fox jumps over the lazy dog',
      'Pack my box with five dozen liquor jugs',
      'How vexingly quick daft zebras jump',
      'The five boxing wizards jump quickly',
      'Bright vixens jump; dozy fowl quack',
      'Sphinx of black quartz, judge my vow',
      'Two driven jocks help fax my big quiz',
      'The jay, pig, fox, zebra and my wolves quack',
      'Crazy Frederick bought many very exquisite opal jewels',
      'We promptly judged antique ivory buckles for the next prize',
      'A mad boxer shot a quick, gloved jab to the jaw of his dizzy opponent',
      'Jackdaws love my big sphinx of quartz',
    ];

    state = {
      items: demoPayloads.map((payload, i) => ({
        id: `item-${String(i).padStart(3, '0')}`,
        payload,
        status: 'pending' as const,
        result: null,
        errorMessage: null,
        processedAt: null,
      })),
      cursorIndex: 0,
      startedAt: new Date().toISOString(),
      lastCheckpointAt: null,
      completedAt: null,
    };

    await host.workspace.setState(state);
    await host.run.checkpoint();
    host.log.info('Seeded demo items', { count: state.items.length });
  }

  const totalItems = state.items.length;
  host.log.info('Batch processing started', {
    totalItems,
    cursorIndex: state.cursorIndex,
    alreadyProcessed: state.items.filter((i) => i.status !== 'pending').length,
  });

  // ── Processing loop ───────────────────────────────────────────────────

  let itemsSinceCheckpoint = 0;

  while (state.cursorIndex < totalItems) {
    const item = state.items[state.cursorIndex];

    // Skip items already processed (from a previous run before interruption)
    if (item.status !== 'pending') {
      state.cursorIndex++;
      continue;
    }

    // Check step budget: reserve 1 step for the summary
    const budget = host.run.getStepBudget();
    if (budget !== null && host.run.getStepCount() + 1 >= budget) {
      host.log.warn('Step budget exhausted, stopping early', {
        processed: state.cursorIndex,
        remaining: totalItems - state.cursorIndex,
      });
      break;
    }

    // Process the item
    host.run.reportStep(`process-${item.id}`);

    const { result, error } = processItem(item);

    if (error) {
      item.status = 'error';
      item.errorMessage = error;
      host.log.warn('Item processing error', { itemId: item.id, error });
    } else {
      item.status = 'processed';
      item.result = result;
    }
    item.processedAt = new Date().toISOString();

    state.cursorIndex++;
    itemsSinceCheckpoint++;

    // Progress reporting
    const progress = state.cursorIndex / totalItems;
    host.events.emitProgress(
      Math.min(progress * 0.95, 0.95), // Reserve last 5% for summary
      `Processed ${state.cursorIndex}/${totalItems} items`,
    );

    // Checkpoint every batchSize items
    if (itemsSinceCheckpoint >= batchSize) {
      state.lastCheckpointAt = new Date().toISOString();
      await host.workspace.setState(state);
      await host.run.checkpoint();
      itemsSinceCheckpoint = 0;
      host.log.debug('Checkpoint created', { cursorIndex: state.cursorIndex });
    }
  }

  // Final state save (in case items remain since last checkpoint)
  if (itemsSinceCheckpoint > 0) {
    state.lastCheckpointAt = new Date().toISOString();
    await host.workspace.setState(state);
    await host.run.checkpoint();
  }

  // ── Summary ───────────────────────────────────────────────────────────

  const processed = state.items.filter((i) => i.status === 'processed');
  const errors = state.items.filter((i) => i.status === 'error');
  const pending = state.items.filter((i) => i.status === 'pending');

  state.completedAt = new Date().toISOString();
  await host.workspace.setState(state);

  host.run.reportStep('create-summary');
  host.events.emitProgress(0.98, 'Creating summary');

  const summaryBody = [
    `# Batch Processing Summary`,
    ``,
    `**Started:** ${state.startedAt}`,
    `**Completed:** ${state.completedAt}`,
    `**Total items:** ${totalItems}`,
    `**Processed:** ${processed.length}`,
    `**Errors:** ${errors.length}`,
    `**Remaining (budget exhausted):** ${pending.length}`,
    ``,
    `## Results`,
    ``,
    ...processed.map((i) => `- **${i.id}**: ${i.result}`),
    ...(errors.length > 0
      ? [
          ``,
          `## Errors`,
          ``,
          ...errors.map((i) => `- **${i.id}**: ${i.errorMessage}`),
        ]
      : []),
    ...(pending.length > 0
      ? [
          ``,
          `## Pending (not processed)`,
          ``,
          ...pending.map((i) => `- **${i.id}**: ${i.payload.slice(0, 60)}...`),
        ]
      : []),
  ].join('\n');

  const summaryArtifact = await host.workspace.createArtifact({
    type: 'summary',
    title: `Batch Summary — ${new Date().toLocaleDateString()}`,
    content: {
      body: summaryBody,
      stats: {
        total: totalItems,
        processed: processed.length,
        errors: errors.length,
        pending: pending.length,
      },
      completedAt: state.completedAt,
    },
  });

  host.log.info('Batch processing complete', {
    artifactId: summaryArtifact.id,
    processed: processed.length,
    errors: errors.length,
    pending: pending.length,
  });

  await host.run.checkpoint();
  host.events.emitProgress(1.0, 'Done');

  return {
    processedCount: processed.length,
    skippedCount: errors.length,
    summaryArtifactId: summaryArtifact.id,
    stepsUsed: host.run.getStepCount(),
  };
}

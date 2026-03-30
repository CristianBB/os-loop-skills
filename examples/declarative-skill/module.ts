interface SkillHostCapabilities {
  log: {
    debug(msg: string, data?: Record<string, unknown>): void;
    info(msg: string, data?: Record<string, unknown>): void;
    warn(msg: string, data?: Record<string, unknown>): void;
    error(msg: string, data?: Record<string, unknown>): void;
  };
  [key: string]: unknown;
}

/**
 * Reverses the characters of the input text.
 *
 * This is the simplest possible declarative skill: one input, one output,
 * no workspace, no LLM, no network, no bridge. It demonstrates the minimal
 * surface area a skill module needs to implement.
 */
export async function execute(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const text = args.text as string;

  if (typeof text !== 'string') {
    host.log.error('Invalid input', { received: typeof text });
    return { result: '', error: 'The "text" argument must be a string.' };
  }

  // Spread into an array of Unicode code points so surrogate pairs
  // (emoji, CJK supplementary, etc.) are reversed correctly.
  const reversed = [...text].reverse().join('');

  host.log.info('Text reversed', {
    inputLength: text.length,
    outputLength: reversed.length,
  });

  return { result: reversed };
}

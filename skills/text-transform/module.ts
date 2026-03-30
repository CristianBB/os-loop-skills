export async function execute(
  args: { text: string; mode: string },
  _host: unknown,
): Promise<{ result: string }> {
  const { text, mode } = args;

  switch (mode) {
    case 'uppercase':
      return { result: text.toUpperCase() };
    case 'lowercase':
      return { result: text.toLowerCase() };
    case 'title':
      return { result: text.replace(/\b\w/g, (c) => c.toUpperCase()) };
    case 'camel':
      return { result: text.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^./, (c) => c.toLowerCase()) };
    case 'snake':
      return { result: text.replace(/[\s-]+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase() };
    case 'kebab':
      return { result: text.replace(/[\s_]+/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() };
    default:
      throw new Error(`Unknown transform mode: ${mode}`);
  }
}

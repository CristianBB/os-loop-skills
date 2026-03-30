interface SkillHostCapabilities {
  llm: { complete(req: { purposeId: string; systemPrompt: string; messages: Array<{ role: 'user' | 'assistant'; content: string }>; temperature?: number; maxTokens?: number }): Promise<{ text: string; tokensUsed: { prompt: number; completion: number } }> };
  network: { fetch(url: string, init?: RequestInit): Promise<Response> };
  events: { emitProgress(progress: number, message: string): void };
  log: { debug(msg: string, data?: Record<string, unknown>): void; info(msg: string, data?: Record<string, unknown>): void; warn(msg: string, data?: Record<string, unknown>): void; error(msg: string, data?: Record<string, unknown>): void };
  [key: string]: unknown;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractTextContent(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '');

  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export async function execute(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<{ summary: string; title: string | null; fetchedAt: string }> {
  const url = args.url as string;
  const maxLength = (args.maxLength as number) ?? 500;

  host.log.info('Fetching URL', { url });
  host.events.emitProgress(0.1, 'Fetching web page');

  const response = await host.network.fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const title = extractTitle(html);
  const textContent = extractTextContent(html);
  const fetchedAt = new Date().toISOString();

  host.log.info('Page fetched', { title, contentLength: textContent.length });
  host.events.emitProgress(0.5, 'Generating summary');

  const truncatedContent = textContent.slice(0, 12_000);

  const result = await host.llm.complete({
    purposeId: 'summarize-page',
    systemPrompt: `You are a concise summarizer. Summarize the following web page content in ${maxLength} characters or fewer. Focus on the main topic, key points, and conclusions. Output only the summary text.`,
    messages: [
      { role: 'user', content: truncatedContent },
    ],
    temperature: 0.3,
    maxTokens: Math.ceil(maxLength / 2),
  });

  host.log.info('Summary generated', { tokensUsed: result.tokensUsed });
  host.events.emitProgress(1.0, 'Done');

  return {
    summary: result.text.slice(0, maxLength),
    title,
    fetchedAt,
  };
}

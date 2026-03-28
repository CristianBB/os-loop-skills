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
  workspace?: {
    getState(): Promise<NotebookState>;
    setState(state: NotebookState): Promise<void>;
    createArtifact(artifact: { type: string; title: string; content: Record<string, unknown> }): Promise<{ id: string }>;
  };
  [key: string]: unknown;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface NotebookState {
  notes: Note[];
}

function generateNoteId(): string {
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function getState(host: SkillHostCapabilities): { persistent: boolean; state: NotebookState } {
  return { persistent: !!host.workspace, state: { notes: [] } };
}

async function loadState(host: SkillHostCapabilities): Promise<{ persistent: boolean; state: NotebookState }> {
  if (host.workspace) {
    const state = await host.workspace.getState();
    return { persistent: true, state: state ?? { notes: [] } };
  }
  return getState(host);
}

async function saveState(host: SkillHostCapabilities, state: NotebookState): Promise<void> {
  if (host.workspace) {
    await host.workspace.setState(state);
  }
}

async function handleAdd(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const title = (args.title as string) ?? 'Untitled';
  const content = (args.content as string) ?? '';
  let tags = (args.tags as string[]) ?? [];

  if (tags.length === 0 && content.length > 0) {
    host.events.emitProgress(0.3, 'Auto-tagging note');
    const result = await host.llm.complete({
      purposeId: 'auto-tag',
      systemPrompt:
        'You are a note classifier. Given a note, output 1-3 lowercase single-word tags separated by commas. Output only the tags, nothing else.',
      messages: [{ role: 'user', content: `Title: ${title}\n\n${content}` }],
      temperature: 0.1,
      maxTokens: 50,
    });
    tags = result.text
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && t.length < 30);
  }

  const { persistent, state } = await loadState(host);

  const note: Note = {
    id: generateNoteId(),
    title,
    content,
    tags,
    createdAt: new Date().toISOString(),
  };

  state.notes.push(note);
  await saveState(host, state);

  host.log.info('Note added', { noteId: note.id, persistent });
  host.events.emitProgress(1.0, 'Done');

  const persistenceNote = persistent
    ? 'Note saved to workspace (persists across sessions).'
    : 'Note captured for this session only (no workspace active).';

  return {
    success: true,
    message: `Note "${title}" added with tags [${tags.join(', ')}]. ${persistenceNote}`,
    notes: [note],
  };
}

async function handleSearch(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const query = ((args.query as string) ?? '').toLowerCase();
  const filterTags = (args.tags as string[]) ?? [];
  const { state } = await loadState(host);

  const matches = state.notes.filter((note) => {
    const textMatch =
      !query ||
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query);
    const tagMatch =
      filterTags.length === 0 || filterTags.some((t) => note.tags.includes(t.toLowerCase()));
    return textMatch && tagMatch;
  });

  return {
    success: true,
    message: `Found ${matches.length} note(s).`,
    notes: matches,
  };
}

async function handleList(
  _args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const { state } = await loadState(host);
  return {
    success: true,
    message: `${state.notes.length} note(s) in notebook.`,
    notes: state.notes,
  };
}

async function handleTag(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const title = args.title as string;
  const newTags = (args.tags as string[]) ?? [];

  if (!title) return { success: false, message: 'title is required to tag a note.' };
  if (newTags.length === 0) return { success: false, message: 'tags array is required.' };

  const { state } = await loadState(host);
  const note = state.notes.find((n) => n.title === title);

  if (!note) return { success: false, message: `Note "${title}" not found.` };

  const addedTags = newTags.filter((t) => !note.tags.includes(t));
  note.tags = [...new Set([...note.tags, ...newTags])];
  await saveState(host, state);

  host.log.info('Note tagged', { noteId: note.id, addedTags });

  return {
    success: true,
    message: `Added ${addedTags.length} tag(s) to "${title}". Tags: [${note.tags.join(', ')}].`,
    notes: [note],
  };
}

async function handleExport(
  _args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const { persistent, state } = await loadState(host);

  if (!persistent || !host.workspace) {
    return {
      success: false,
      message: 'Export requires an active workspace to save the artifact.',
    };
  }

  const markdown = state.notes
    .map((n) => `## ${n.title}\n\n**Tags:** ${n.tags.join(', ') || 'none'}\n**Created:** ${n.createdAt}\n\n${n.content}`)
    .join('\n\n---\n\n');

  const artifact = await host.workspace.createArtifact({
    type: 'document',
    title: `Notebook Export — ${new Date().toLocaleDateString()}`,
    content: { body: markdown, noteCount: state.notes.length, exportedAt: new Date().toISOString() },
  });

  host.log.info('Notebook exported', { artifactId: artifact.id, noteCount: state.notes.length });

  return {
    success: true,
    message: `Exported ${state.notes.length} note(s) as artifact.`,
    artifact: { id: artifact.id, type: 'document' },
  };
}

export async function execute(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const action = args.action as string;

  switch (action) {
    case 'add':
      return handleAdd(args, host);
    case 'search':
      return handleSearch(args, host);
    case 'list':
      return handleList(args, host);
    case 'tag':
      return handleTag(args, host);
    case 'export':
      return handleExport(args, host);
    default:
      return { success: false, message: `Unknown action: ${action}. Use one of: add, search, list, tag, export.` };
  }
}

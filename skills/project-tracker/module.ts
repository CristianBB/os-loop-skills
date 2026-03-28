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
  workspace: {
    getState(): Promise<ProjectState>;
    setState(state: ProjectState): Promise<void>;
    createArtifact(artifact: { type: string; title: string; content: Record<string, unknown> }): Promise<{ id: string }>;
    setPhase(phase: string): Promise<void>;
  };
  [key: string]: unknown;
}

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'blocked' | 'done';
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projectName: string;
  tasks: Task[];
  createdAt: string;
}

const PHASES = ['planning', 'execution', 'review', 'complete'] as const;
type Phase = (typeof PHASES)[number];

function generateTaskId(): string {
  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function computeProgress(tasks: Task[]): { total: number; done: number; percent: number } {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

async function handleInit(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const projectName = (args.projectName as string) ?? 'Untitled Project';
  const now = new Date().toISOString();

  const state: ProjectState = {
    projectName,
    tasks: [],
    createdAt: now,
  };

  await host.workspace.setState(state);
  await host.workspace.setPhase('planning');

  host.log.info('Project initialized', { projectName });

  return {
    success: true,
    message: `Project "${projectName}" initialized in planning phase.`,
    projectState: { projectName, phase: 'planning', taskCount: 0 },
  };
}

async function handleAddTask(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const title = args.taskTitle as string;
  if (!title) {
    return { success: false, message: 'taskTitle is required to add a task.' };
  }

  const state = await host.workspace.getState();
  const now = new Date().toISOString();

  const task: Task = {
    id: generateTaskId(),
    title,
    status: 'todo',
    createdAt: now,
    updatedAt: now,
  };

  state.tasks.push(task);
  await host.workspace.setState(state);

  host.log.info('Task added', { taskId: task.id, title });

  return {
    success: true,
    message: `Task "${title}" added (${state.tasks.length} total).`,
    projectState: { taskCount: state.tasks.length, progress: computeProgress(state.tasks) },
  };
}

async function handleUpdateTask(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const title = args.taskTitle as string;
  const newStatus = args.taskStatus as Task['status'];

  if (!title || !newStatus) {
    return { success: false, message: 'taskTitle and taskStatus are required to update a task.' };
  }

  const state = await host.workspace.getState();
  const task = state.tasks.find((t) => t.title === title);

  if (!task) {
    return { success: false, message: `Task "${title}" not found.` };
  }

  task.status = newStatus;
  task.updatedAt = new Date().toISOString();
  await host.workspace.setState(state);

  host.log.info('Task updated', { taskId: task.id, title, status: newStatus });

  return {
    success: true,
    message: `Task "${title}" updated to ${newStatus}.`,
    projectState: { progress: computeProgress(state.tasks) },
  };
}

async function handleGenerateReport(
  _args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const state = await host.workspace.getState();
  const progress = computeProgress(state.tasks);

  host.events.emitProgress(0.3, 'Generating project report');

  const taskSummary = state.tasks
    .map((t) => `- [${t.status}] ${t.title}`)
    .join('\n');

  const result = await host.llm.complete({
    purposeId: 'generate-report',
    systemPrompt:
      'You are a project management assistant. Generate a concise status report for the project based on its current tasks. Include overall progress, blockers, and next steps. Output markdown.',
    messages: [
      {
        role: 'user',
        content: `Project: ${state.projectName}\nProgress: ${progress.done}/${progress.total} tasks done (${progress.percent}%)\n\nTasks:\n${taskSummary || '(no tasks)'}`,
      },
    ],
    temperature: 0.2,
    maxTokens: 1500,
  });

  host.events.emitProgress(0.8, 'Saving report artifact');

  const artifact = await host.workspace.createArtifact({
    type: 'report',
    title: `Status Report — ${new Date().toLocaleDateString()}`,
    content: {
      body: result.text,
      generatedAt: new Date().toISOString(),
      progress,
    },
  });

  host.events.emitProgress(1.0, 'Done');
  host.log.info('Report generated', { artifactId: artifact.id });

  return {
    success: true,
    message: `Status report generated and saved as artifact.`,
    artifact: { id: artifact.id, type: 'report' },
    projectState: { progress },
  };
}

async function handleAdvancePhase(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const targetPhase = args.targetPhase as Phase;

  if (!targetPhase || !PHASES.includes(targetPhase)) {
    return { success: false, message: `targetPhase must be one of: ${PHASES.join(', ')}` };
  }

  await host.workspace.setPhase(targetPhase);
  host.log.info('Phase advanced', { phase: targetPhase });

  return {
    success: true,
    message: `Project phase advanced to "${targetPhase}".`,
    projectState: { phase: targetPhase },
  };
}

export async function execute(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const action = args.action as string;

  switch (action) {
    case 'init':
      return handleInit(args, host);
    case 'add-task':
      return handleAddTask(args, host);
    case 'update-task':
      return handleUpdateTask(args, host);
    case 'generate-report':
      return handleGenerateReport(args, host);
    case 'advance-phase':
      return handleAdvancePhase(args, host);
    default:
      return { success: false, message: `Unknown action: ${action}. Use one of: init, add-task, update-task, generate-report, advance-phase.` };
  }
}

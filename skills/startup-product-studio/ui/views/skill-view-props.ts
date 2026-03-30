/**
 * Minimal interface matching Seoul's SkillViewProps / SkillUIRuntimeContext.
 * Skill UI components receive all data and actions through this context,
 * never via direct store imports.
 */
export interface SkillUIRuntimeContext {
  skillId: string;

  workspace: SkillWorkspaceRef | null;
  workspaces: SkillWorkspaceRef[];
  artifacts: SkillWorkspaceArtifactRef[];

  activeRun: WorkspaceRunRef | null;
  runs: WorkspaceRunRef[];
  inputRequests: UserInputRequestRef[];
  bridgeJobs: BridgeJobRefShape[];

  answerUserInput: (requestId: string, response: Record<string, unknown>) => Promise<void>;
  cancelUserInput: (requestId: string) => Promise<void>;
  pauseRun: (runId: string) => Promise<void>;
  cancelRun: (runId: string) => Promise<void>;
  continueRun: (runId: string) => Promise<void>;
  retryRun: (runId: string) => Promise<void>;

  bridgeConnected: boolean;

  loadWorkspaces: (skillId: string) => Promise<void>;
  createWorkspace: (params: CreateWorkspaceParams) => Promise<SkillWorkspaceRef>;

  navigateToWorkspace: (workspaceId: string) => void;
  navigateToList: () => void;
}

export interface SkillViewProps {
  context: SkillUIRuntimeContext;
  workspaceId?: string;
}

// --- Minimal shape interfaces for Seoul types ---

export interface SkillWorkspaceRef {
  id: string;
  skillId: string;
  name: string;
  description: string | null;
  status: string;
  metadata: Record<string, unknown>;
  state: Record<string, unknown>;
  currentPhase: string | null;
  currentRole: string | null;
  lockVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillWorkspaceArtifactRef {
  id: string;
  workspaceId: string;
  skillId: string;
  type: string;
  title: string;
  status: string;
  content: Record<string, unknown>;
  parentArtifactId: string | null;
  version: number;
  createdByRunId: string | null;
  createdByRole: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceRunRef {
  id: string;
  workspaceId: string;
  skillId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  currentPhase: string | null;
  currentRole: string | null;
  currentStep: string | null;
  progress: { percent: number | null; message: string | null };
  waitingFor: { kind: string; refId: string | null; prompt: string | null };
  stepCount?: number;
  stepBudget?: number | null;
}

export interface UserInputRequestRef {
  id: string;
  workspaceId: string;
  runId: string;
  skillId: string;
  title: string;
  message: string;
  inputSchema: Record<string, unknown>;
  status: string;
  answeredAt: string | null;
  response: Record<string, unknown> | null;
}

export interface BridgeJobRefShape {
  id: string;
  workspaceId: string | null;
  runId: string | null;
  skillId: string | null;
  bridgeRunId: string;
  kind: string;
  status: string;
  requestId: string;
  summary: { command: string; toolId: string | null };
}

export interface CreateWorkspaceParams {
  skillId: string;
  name: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

// --- Convenience aliases used by components ---

export type SkillWorkspace = SkillWorkspaceRef;
export type SkillWorkspaceArtifact = SkillWorkspaceArtifactRef;
export type WorkspaceRun = WorkspaceRunRef;
export type UserInputRequest = UserInputRequestRef;
export type BridgeJobRef = BridgeJobRefShape;

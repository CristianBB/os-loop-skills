'use client';

type UUIDv7 = string;
import type { WorkspaceRun, UserInputRequest, BridgeJobRef, SkillWorkspaceRef } from '../views/skill-view-props';
import { StudioInputPanel } from './studio-input-panel';
import { Spinner, PulsingDot } from './spinner';

const RUN_STATUS_STYLES: Record<string, string> = {
  queued: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  recovering: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  waiting_user_input: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  waiting_approval: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  waiting_bridge_job: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const RUN_STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  running: 'Processing...',
  paused: 'Paused',
  recovering: 'Recovering...',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  waiting_user_input: 'Awaiting your input',
  waiting_approval: 'Awaiting approval',
  waiting_bridge_job: 'Executing bridge command',
};

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled']);

const BRIDGE_JOB_STATUS_STYLES: Record<string, string> = {
  pending: 'text-muted-foreground',
  running: 'text-blue-600 dark:text-blue-400',
  completed: 'text-green-600 dark:text-green-400',
  failed: 'text-red-600 dark:text-red-400',
  terminated: 'text-gray-600 dark:text-gray-400',
};

function WorkspaceRunPanel({ run }: { run: WorkspaceRun }) {
  const isActive = run.status === 'running' || run.status === 'waiting_bridge_job';

  return (
    <div data-testid="workspace-run-panel" className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Active Run</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${RUN_STATUS_STYLES[run.status] ?? ''}`}>
          {isActive && <PulsingDot />}
          {RUN_STATUS_LABELS[run.status] ?? run.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Current step - what's happening right now */}
      {run.currentStep && (
        <div className="rounded bg-muted/50 px-2.5 py-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Current Step</p>
          <p className="text-xs font-medium mt-0.5">{run.currentStep}</p>
        </div>
      )}

      {/* Progress message - detailed activity */}
      {run.progress.message && (
        <div className="rounded bg-muted/50 px-2.5 py-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Activity</p>
          <p className="text-xs mt-0.5">{run.progress.message}</p>
        </div>
      )}

      {/* Phase and role context */}
      {(run.currentPhase || run.currentRole) && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {run.currentPhase && <span>Phase: {run.currentPhase.replace(/-/g, ' ')}</span>}
          {run.currentRole && <span>Role: {run.currentRole.replace(/-/g, ' ')}</span>}
        </div>
      )}

      {/* Progress bar */}
      {run.stepCount != null && run.stepBudget != null && run.stepBudget > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Steps</span>
            <span className="tabular-nums">{run.stepCount} / {run.stepBudget}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(100, (run.stepCount / run.stepBudget) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Waiting indicator */}
      {run.waitingFor?.kind && run.waitingFor.kind !== 'none' && (
        <div className="flex items-center gap-2 text-[10px]">
          <Spinner size="sm" className="text-muted-foreground" />
          <span className="text-muted-foreground">
            {run.waitingFor.kind === 'user_input' && 'Waiting for your input...'}
            {run.waitingFor.kind === 'bridge_job' && 'Waiting for bridge job...'}
            {run.waitingFor.kind !== 'user_input' && run.waitingFor.kind !== 'bridge_job' && `Waiting: ${run.waitingFor.kind}`}
          </span>
          {run.waitingFor.prompt && (
            <span className="text-muted-foreground truncate">{run.waitingFor.prompt}</span>
          )}
        </div>
      )}
    </div>
  );
}

function WorkspaceRunControls({ run, onPause, onCancel, onContinue, onRetry }: {
  run: WorkspaceRun;
  onPause: () => void;
  onCancel: () => void;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const status = run.status;
  const isTerminal = TERMINAL_STATUSES.has(status);
  const canRetry = status === 'failed' || status === 'cancelled';
  const canPause = status === 'running';
  const canContinue = status === 'paused' || status === 'recovering';

  if (isTerminal && !canRetry) return null;

  return (
    <div data-testid="workspace-run-controls" className="flex gap-2">
      {canContinue && (
        <button onClick={onContinue} className="cursor-pointer rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 active:bg-green-800 transition-colors">Continue</button>
      )}
      {canPause && (
        <button onClick={onPause} className="cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent active:bg-accent/80 transition-colors">Pause</button>
      )}
      {canRetry && (
        <button onClick={onRetry} className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors">Retry</button>
      )}
      {!isTerminal && (
        <button onClick={onCancel} className="cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-red-50 dark:hover:bg-red-950 active:bg-red-100 transition-colors">Cancel</button>
      )}
    </div>
  );
}

function WorkspaceBridgeJobs({ jobs }: { jobs: BridgeJobRef[] }) {
  if (jobs.length === 0) return null;
  return (
    <div data-testid="workspace-bridge-jobs" className="space-y-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground">Bridge Jobs</h4>
      {jobs.map((job) => {
        const isRunning = job.status === 'running' || job.status === 'pending';
        return (
          <div key={job.id} className="flex items-center gap-2 text-xs rounded-md border px-2.5 py-2">
            {isRunning && <Spinner size="sm" className="text-blue-500 shrink-0" />}
            <span className="truncate flex-1 font-mono text-[11px]">{job.summary.command}</span>
            <span className={`shrink-0 text-[10px] font-medium ${BRIDGE_JOB_STATUS_STYLES[job.status] ?? 'text-muted-foreground'}`}>
              {job.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface ActiveRunSidebarProps {
  activeRun: WorkspaceRun | null;
  inputRequests: UserInputRequest[];
  bridgeJobs: BridgeJobRef[];
  workspace?: SkillWorkspaceRef | null;
  onPause: () => void;
  onCancel: () => void;
  onContinue: () => void;
  onRetry: () => void;
  onAnswerInput: (id: UUIDv7, response: Record<string, unknown>) => void | Promise<void>;
  onCancelInput: (id: UUIDv7) => void | Promise<void>;
}

export function ActiveRunSidebar({
  activeRun,
  inputRequests,
  bridgeJobs,
  workspace,
  onPause,
  onCancel,
  onContinue,
  onRetry,
  onAnswerInput,
  onCancelInput,
}: ActiveRunSidebarProps) {
  if (!activeRun) return null;

  return (
    <div data-testid="active-run-sidebar" className="space-y-4">
      <WorkspaceRunPanel run={activeRun} />

      {activeRun.status === 'failed' && (
        <div data-testid="run-error-display" className="rounded-md border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/50 p-2.5 text-xs text-red-800 dark:text-red-200">
          <p className="font-medium">Run Failed</p>
          <p className="mt-0.5">
            {activeRun.progress.message ?? activeRun.currentStep ?? 'The run failed unexpectedly. You can retry or start a new run.'}
          </p>
        </div>
      )}

      <WorkspaceRunControls
        run={activeRun}
        onPause={onPause}
        onCancel={onCancel}
        onContinue={onContinue}
        onRetry={onRetry}
      />

      <StudioInputPanel
        requests={inputRequests}
        onAnswer={onAnswerInput}
        onCancel={onCancelInput}
        workspace={workspace}
      />

      {activeRun.status === 'waiting_bridge_job' && bridgeJobs.length > 0 && (
        <div data-testid="bridge-job-waiting-indicator" className="flex items-center gap-2.5 rounded-md border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950">
          <Spinner size="sm" className="text-purple-600 dark:text-purple-400" />
          <div>
            <p className="text-xs font-medium text-purple-900 dark:text-purple-100">
              Executing bridge command
            </p>
            <p className="text-[10px] text-purple-700 dark:text-purple-300">
              {bridgeJobs[bridgeJobs.length - 1]?.summary.command}
            </p>
          </div>
        </div>
      )}

      <WorkspaceBridgeJobs jobs={bridgeJobs} />
    </div>
  );
}

'use client';

type UUIDv7 = string;
import type { WorkspaceRun, UserInputRequest, BridgeJobRef } from '../views/skill-view-props';
import { StudioInputPanel } from './studio-input-panel';

const RUN_STATUS_STYLES: Record<string, string> = {
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  waiting_user_input: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  waiting_bridge_job: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

function WorkspaceRunPanel({ run }: { run: WorkspaceRun }) {
  return (
    <div data-testid="workspace-run-panel" className="rounded-md border p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Active Run</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${RUN_STATUS_STYLES[run.status] ?? ''}`}>
          {run.status.replace(/_/g, ' ')}
        </span>
      </div>
      {run.currentStep && <p className="text-xs text-muted-foreground">{run.currentStep}</p>}
      {run.progress.message && <p className="text-xs text-muted-foreground">{run.progress.message}</p>}
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
  const isRunning = run.status === 'running';
  const isPaused = run.status === 'paused';
  const isFailed = run.status === 'failed';

  return (
    <div data-testid="workspace-run-controls" className="flex gap-2">
      {isRunning && (
        <>
          <button onClick={onPause} className="rounded-md border px-2 py-1 text-xs hover:bg-accent">Pause</button>
          <button onClick={onCancel} className="rounded-md border px-2 py-1 text-xs text-destructive hover:bg-accent">Cancel</button>
        </>
      )}
      {isPaused && (
        <>
          <button onClick={onContinue} className="rounded-md border px-2 py-1 text-xs hover:bg-accent">Continue</button>
          <button onClick={onCancel} className="rounded-md border px-2 py-1 text-xs text-destructive hover:bg-accent">Cancel</button>
        </>
      )}
      {isFailed && (
        <button onClick={onRetry} className="rounded-md border px-2 py-1 text-xs hover:bg-accent">Retry</button>
      )}
    </div>
  );
}

function WorkspaceBridgeJobs({ jobs }: { jobs: BridgeJobRef[] }) {
  if (jobs.length === 0) return null;
  return (
    <div data-testid="workspace-bridge-jobs" className="space-y-1">
      <h4 className="text-xs font-medium text-muted-foreground">Bridge Jobs</h4>
      {jobs.map((job) => (
        <div key={job.id} className="flex items-center justify-between text-xs rounded-md border px-2 py-1.5">
          <span className="truncate">{job.summary.command}</span>
          <span className="shrink-0 text-muted-foreground">{job.status}</span>
        </div>
      ))}
    </div>
  );
}

interface ActiveRunSidebarProps {
  activeRun: WorkspaceRun | null;
  inputRequests: UserInputRequest[];
  bridgeJobs: BridgeJobRef[];
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

      {activeRun.stepCount != null && activeRun.stepBudget != null && (
        <p className="text-xs text-muted-foreground">
          Steps: {activeRun.stepCount} / {activeRun.stepBudget}
        </p>
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
      />

      {activeRun.status === 'waiting_bridge_job' && bridgeJobs.length > 0 && (
        <div data-testid="bridge-job-waiting-indicator" className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
            Waiting for bridge job to complete
          </p>
        </div>
      )}

      <WorkspaceBridgeJobs jobs={bridgeJobs} />
    </div>
  );
}
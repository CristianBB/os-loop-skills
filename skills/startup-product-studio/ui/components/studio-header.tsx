'use client';

import type { SkillWorkspace } from '../views/skill-view-props';
import type { StudioState, ProjectRecord, RoleId, PhaseId } from '../types';
import type { WorkspaceRun } from '../views/skill-view-props';
import { RoleBadge } from './role-badge';
import { PhaseBadge } from './phase-badge';
import { Spinner, PulsingDot } from './spinner';
import { ROLE_LABELS, PHASE_LABELS } from '../types';

const RUN_STATUS_BADGE_STYLES: Record<string, string> = {
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  waiting_user_input: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  waiting_bridge_job: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const RUN_STATUS_LABELS: Record<string, string> = {
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  waiting_user_input: 'Awaiting your input',
  waiting_bridge_job: 'Running bridge job',
};

function RunStatusBadge({ status }: { status: string }) {
  const isActive = status === 'running' || status === 'waiting_bridge_job';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${RUN_STATUS_BADGE_STYLES[status] ?? ''}`}>
      {isActive && <PulsingDot />}
      {RUN_STATUS_LABELS[status] ?? status.replace(/_/g, ' ')}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

interface StudioHeaderProps {
  workspace: SkillWorkspace;
  studioState: StudioState;
  activeProject: ProjectRecord | null;
  activeRun: WorkspaceRun | null;
}

export function StudioHeader({ workspace, studioState, activeProject, activeRun }: StudioHeaderProps) {
  const currentRole = workspace.currentRole as RoleId | null;
  const isKnownRole = currentRole && currentRole in ROLE_LABELS;
  const currentPhase = (workspace.currentPhase ?? activeProject?.currentPhase) as PhaseId | null;
  const isRunning = activeRun && (activeRun.status === 'running' || activeRun.status === 'waiting_bridge_job');

  return (
    <div data-testid="studio-header" className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-lg font-semibold">{studioState.studioName}</h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[workspace.status] ?? ''}`}
        >
          {workspace.status}
        </span>
        {isKnownRole && <RoleBadge role={currentRole} />}
        {activeRun && <RunStatusBadge status={activeRun.status} />}
      </div>

      {activeProject && (
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{activeProject.name}</p>
          <p className="text-xs text-muted-foreground">{activeProject.description}</p>
        </div>
      )}

      {/* Real-time activity strip */}
      {isRunning && (
        <div
          data-testid="activity-strip"
          className="flex items-center gap-2.5 rounded-md border-2 border-blue-700 bg-blue-800 px-3 py-2 dark:border-blue-500 dark:bg-blue-900"
        >
          <Spinner size="sm" className="text-blue-200" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              {currentPhase && PHASE_LABELS[currentPhase] && (
                <span>{PHASE_LABELS[currentPhase]}</span>
              )}
              {isKnownRole && (
                <span className="text-blue-200">
                  ({ROLE_LABELS[currentRole]})
                </span>
              )}
            </div>
            {activeRun.currentStep && (
              <p className="text-[11px] text-blue-100 truncate">
                {activeRun.currentStep}
              </p>
            )}
            {activeRun.progress.message && (
              <p className="text-[11px] text-blue-200 truncate">
                {activeRun.progress.message}
              </p>
            )}
          </div>
          {activeRun.stepCount != null && activeRun.stepBudget != null && (
            <span className="shrink-0 text-[10px] text-blue-200 tabular-nums">
              {activeRun.stepCount}/{activeRun.stepBudget}
            </span>
          )}
        </div>
      )}

      {activeRun?.status === 'waiting_user_input' && (
        <div
          data-testid="input-required-strip"
          className="flex items-center gap-2.5 rounded-md border-2 border-amber-400 bg-amber-100 px-3 py-2 dark:border-amber-500 dark:bg-amber-900"
        >
          <span className="text-amber-700 dark:text-amber-200 text-sm">⏳</span>
          <p className="text-xs font-semibold text-amber-950 dark:text-white">
            Your input is required to continue — see the panel below
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import type { SkillWorkspace } from '../views/skill-view-props';
import type { StudioState, ProjectRecord, RoleId } from '../types';
import type { WorkspaceRun } from '../views/skill-view-props';
import { RoleBadge } from './role-badge';
import { ROLE_LABELS } from '../types';

const RUN_STATUS_BADGE_STYLES: Record<string, string> = {
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  waiting_user_input: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  waiting_bridge_job: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

function RunStatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RUN_STATUS_BADGE_STYLES[status] ?? ''}`}>
      {status.replace(/_/g, ' ')}
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

  return (
    <div data-testid="studio-header" className="space-y-2">
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
    </div>
  );
}
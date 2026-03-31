'use client';

import type { SkillWorkspace } from '../views/skill-view-props';
import { parseStudioState, getActiveProject } from '../hooks/use-studio-state';
import { PHASE_LABELS } from '../types';
import type { PhaseId } from '../types';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

interface StudioWorkspaceCardProps {
  workspace: SkillWorkspace;
}

export function StudioWorkspaceCard({ workspace }: StudioWorkspaceCardProps) {
  const studio = parseStudioState(workspace.state);
  const activeProject = getActiveProject(studio);

  const projectCount = studio?.projects.length ?? 0;
  const projectLabel = projectCount === 1 ? '1 project' : `${projectCount} projects`;

  return (
    <div
      data-testid="studio-workspace-card"
      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 cursor-pointer hover:bg-accent hover:border-primary/30 active:bg-accent/80 transition-all"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium truncate">{workspace.name}</p>
        {activeProject && (
          <p className="text-xs text-muted-foreground truncate">
            <span>{activeProject.name}</span>
            {activeProject.currentPhase && (
              <span className="ml-2">{PHASE_LABELS[activeProject.currentPhase as PhaseId] ?? activeProject.currentPhase}</span>
            )}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{projectLabel}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[workspace.status] ?? ''}`}
      >
        {workspace.status}
      </span>
    </div>
  );
}

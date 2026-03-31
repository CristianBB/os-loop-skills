'use client';

import type { CodeProject, CodeProjectBootstrapStatus } from '../types';
import type { BridgeJobRef } from '../views/skill-view-props';
import { Spinner } from './spinner';

function WorkspaceBridgeJobs({ jobs }: { jobs: BridgeJobRef[] }) {
  if (jobs.length === 0) return null;
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-medium text-muted-foreground">Bridge Jobs</h4>
      {jobs.map((job) => {
        const isActive = job.status === 'running' || job.status === 'pending';
        return (
          <div key={job.id} className="flex items-center gap-2 text-xs rounded-md border px-2 py-1.5">
            {isActive && <Spinner size="sm" className="text-blue-500 shrink-0" />}
            <span className="truncate flex-1 font-mono text-[11px]">{job.summary.command}</span>
            <span className="shrink-0 text-muted-foreground">{job.status}</span>
          </div>
        );
      })}
    </div>
  );
}

const STATUS_LABELS: Record<CodeProjectBootstrapStatus, string> = {
  pending: 'Pending',
  git_initialized: 'Git Initialized',
  claude_configured: '.claude Configured',
  ready: 'Ready',
};

const STATUS_COLORS: Record<CodeProjectBootstrapStatus, string> = {
  pending: 'text-muted-foreground',
  git_initialized: 'text-blue-600 dark:text-blue-400',
  claude_configured: 'text-amber-600 dark:text-amber-400',
  ready: 'text-green-600 dark:text-green-400',
};

const STATUS_ICONS: Record<CodeProjectBootstrapStatus, string> = {
  pending: '○',
  git_initialized: '◐',
  claude_configured: '◑',
  ready: '●',
};

interface BootstrapProgressPanelProps {
  codeProjects: CodeProject[];
  bridgeJobs: BridgeJobRef[];
}

export function BootstrapProgressPanel({ codeProjects, bridgeJobs }: BootstrapProgressPanelProps) {
  const projectsWithBootstrap = codeProjects.filter((cp) => cp.bootstrapStatus != null);

  if (projectsWithBootstrap.length === 0) return null;

  // Find bridge jobs linked to bootstrap
  const bootstrapJobIds = new Set(
    projectsWithBootstrap
      .map((cp) => cp.bootstrapBridgeJobId)
      .filter((id): id is string => id != null),
  );
  const bootstrapJobs = bridgeJobs.filter((j) => bootstrapJobIds.has(j.bridgeRunId));

  const totalReady = projectsWithBootstrap.filter((cp) => cp.bootstrapStatus === 'ready').length;
  const allReady = totalReady === projectsWithBootstrap.length;

  return (
    <div data-testid="bootstrap-progress-panel" className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Repository Bootstrap</h4>
        {!allReady && (
          <span className="text-[10px] text-muted-foreground">
            {totalReady}/{projectsWithBootstrap.length} ready
          </span>
        )}
        {allReady && (
          <span className="text-[10px] text-green-600 font-medium">All ready</span>
        )}
      </div>

      <ul className="space-y-2">
        {projectsWithBootstrap.map((cp) => {
          const isActive = cp.bootstrapStatus === 'pending' || cp.bootstrapStatus === 'git_initialized' || cp.bootstrapStatus === 'claude_configured';
          return (
            <li key={cp.id} data-testid={`bootstrap-item-${cp.id}`} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                {isActive && cp.bootstrapStatus !== 'ready' ? (
                  <Spinner size="sm" className="text-blue-500 shrink-0" />
                ) : (
                  <span className={`text-xs shrink-0 ${STATUS_COLORS[cp.bootstrapStatus!]}`}>
                    {STATUS_ICONS[cp.bootstrapStatus!]}
                  </span>
                )}
                <span className="truncate">{cp.name}</span>
                {cp.repoPath && (
                  <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]" title={cp.repoPath}>
                    {cp.repoPath}
                  </span>
                )}
              </div>
              <span className={`shrink-0 text-xs ${STATUS_COLORS[cp.bootstrapStatus!]}`}>
                {STATUS_LABELS[cp.bootstrapStatus!]}
              </span>
            </li>
          );
        })}
      </ul>

      {bootstrapJobs.length > 0 && (
        <WorkspaceBridgeJobs jobs={bootstrapJobs} />
      )}
    </div>
  );
}

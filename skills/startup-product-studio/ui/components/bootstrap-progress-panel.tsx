'use client';

import type { CodeProject, CodeProjectBootstrapStatus } from '../types';
import type { BridgeJobRef } from '../views/skill-view-props';

function WorkspaceBridgeJobs({ jobs }: { jobs: BridgeJobRef[] }) {
  if (jobs.length === 0) return null;
  return (
    <div className="space-y-1">
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

  return (
    <div data-testid="bootstrap-progress-panel" className="space-y-3">
      <h4 className="text-sm font-medium">Repository Bootstrap</h4>

      <ul className="space-y-2">
        {projectsWithBootstrap.map((cp) => (
          <li key={cp.id} data-testid={`bootstrap-item-${cp.id}`} className="flex items-center justify-between text-sm">
            <span>{cp.name}</span>
            <span className={STATUS_COLORS[cp.bootstrapStatus!]}>
              {STATUS_LABELS[cp.bootstrapStatus!]}
            </span>
          </li>
        ))}
      </ul>

      {bootstrapJobs.length > 0 && (
        <WorkspaceBridgeJobs jobs={bootstrapJobs} />
      )}
    </div>
  );
}
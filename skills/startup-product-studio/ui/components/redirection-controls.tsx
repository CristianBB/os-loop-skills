'use client';

import type { UserRedirectionAction } from '../types';

interface RedirectionControlsProps {
  hasApprovedRoadmap: boolean;
  isImplementing: boolean;
  isPaused: boolean;
  onRedirect: (action: UserRedirectionAction) => void;
}

interface RedirectionOption {
  action: UserRedirectionAction;
  label: string;
  description: string;
  className: string;
  requiresRoadmap: boolean;
  requiresImplementing: boolean;
  requiresPaused: boolean;
}

const REDIRECTION_OPTIONS: RedirectionOption[] = [
  { action: 'continue', label: 'Continue', description: 'Resume from last checkpoint', className: 'text-green-600 hover:bg-green-50', requiresRoadmap: false, requiresImplementing: false, requiresPaused: true },
  { action: 'redefine-roadmap', label: 'Redefine Roadmap', description: 'Regenerate the roadmap with new direction', className: 'text-blue-600 hover:bg-blue-50', requiresRoadmap: true, requiresImplementing: false, requiresPaused: false },
  { action: 'reorder-phases', label: 'Reorder Phases', description: 'Change the execution order', className: 'text-blue-600 hover:bg-blue-50', requiresRoadmap: true, requiresImplementing: false, requiresPaused: false },
  { action: 'reduce-scope', label: 'Reduce Scope', description: 'Remove phases or deliverables', className: 'text-amber-600 hover:bg-amber-50', requiresRoadmap: true, requiresImplementing: false, requiresPaused: false },
  { action: 'expand-scope', label: 'Expand Scope', description: 'Add phases or deliverables', className: 'text-amber-600 hover:bg-amber-50', requiresRoadmap: true, requiresImplementing: false, requiresPaused: false },
  { action: 'change-priorities', label: 'Change Priorities', description: 'Reorder implementation sub-phases', className: 'text-indigo-600 hover:bg-indigo-50', requiresRoadmap: true, requiresImplementing: true, requiresPaused: false },
  { action: 'redefine-phase', label: 'Redefine Current Phase', description: 'Re-run the current phase with new direction', className: 'text-purple-600 hover:bg-purple-50', requiresRoadmap: false, requiresImplementing: false, requiresPaused: false },
  { action: 'pivot', label: 'Pivot', description: 'Restart from discovery with new direction', className: 'text-red-600 hover:bg-red-50', requiresRoadmap: false, requiresImplementing: false, requiresPaused: false },
  { action: 'pause', label: 'Pause', description: 'Pause and resume later', className: 'text-slate-600 hover:bg-slate-50', requiresRoadmap: false, requiresImplementing: false, requiresPaused: false },
  { action: 'stop', label: 'Stop', description: 'Cancel remaining phases', className: 'text-red-600 hover:bg-red-50', requiresRoadmap: false, requiresImplementing: false, requiresPaused: false },
];

export function RedirectionControls({ hasApprovedRoadmap, isImplementing, isPaused, onRedirect }: RedirectionControlsProps) {
  const availableOptions = REDIRECTION_OPTIONS.filter((opt) => {
    if (opt.requiresRoadmap && !hasApprovedRoadmap) return false;
    if (opt.requiresImplementing && !isImplementing) return false;
    if (opt.requiresPaused && !isPaused) return false;
    return true;
  });

  if (availableOptions.length === 0) return null;

  return (
    <div data-testid="redirection-controls" className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-medium">Project Direction</h3>
      <div className="flex flex-wrap gap-2">
        {availableOptions.map((opt) => (
          <button
            key={opt.action}
            data-testid={`redirect-${opt.action}`}
            onClick={() => onRedirect(opt.action)}
            title={opt.description}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${opt.className}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
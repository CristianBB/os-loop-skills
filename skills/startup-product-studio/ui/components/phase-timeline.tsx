'use client';

import {
  PHASE_ORDER,
  PHASE_LABELS,
  PHASE_ROLE_MAP,
} from '../types';
import type { ProjectRecord, PhaseId, RoadmapEntry, ValidationEntry } from '../types';
import { RoleBadge } from './role-badge';
import type { PhaseStatus } from './phase-badge';

// ---------------------------------------------------------------------------
// Decision label helpers
// ---------------------------------------------------------------------------

const DECISION_LABELS: Record<string, string> = {
  approve: 'approved',
  reject: 'rejected',
  revise: 'revised',
  pause: 'paused',
  cancel: 'cancelled',
};

const DECISION_STYLES: Record<string, string> = {
  approve: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  reject: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  revise: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  pause: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  cancel: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

// ---------------------------------------------------------------------------
// Phase status resolution
// ---------------------------------------------------------------------------

function getPhaseStatus(
  phase: PhaseId,
  completedPhases: PhaseId[],
  activePhase: PhaseId | null,
): PhaseStatus {
  if (completedPhases.includes(phase)) return 'completed';
  if (phase === activePhase) return 'active';
  return 'upcoming';
}

// ---------------------------------------------------------------------------
// Indicator styles
// ---------------------------------------------------------------------------

const INDICATOR_BASE = 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold';

const INDICATOR_STYLES: Record<PhaseStatus, string> = {
  completed: `${INDICATOR_BASE} bg-green-500 text-white`,
  active: `${INDICATOR_BASE} bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-800`,
  upcoming: `${INDICATOR_BASE} bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400`,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PhaseTimelineProps {
  project: ProjectRecord;
  activePhase: PhaseId | null;
}

export function PhaseTimeline({ project, activePhase }: PhaseTimelineProps) {
  const roadmapMap = new Map<PhaseId, RoadmapEntry>();
  if (project.roadmap) {
    for (const entry of project.roadmap) {
      roadmapMap.set(entry.phase, entry);
    }
  }

  const validationMap = new Map<PhaseId, ValidationEntry>();
  for (const entry of project.validationHistory) {
    validationMap.set(entry.phase, entry);
  }

  return (
    <div data-testid="phase-timeline" className="space-y-0">
      {PHASE_ORDER.map((phase, idx) => {
        const status = getPhaseStatus(phase, project.completedPhases, activePhase);
        const roadmap = roadmapMap.get(phase);
        const validation = validationMap.get(phase);
        const isLast = idx === PHASE_ORDER.length - 1;

        return (
          <div key={phase} data-testid={`phase-node-${phase}`} className="relative flex gap-4">
            {/* Vertical connector line */}
            <div className="flex flex-col items-center">
              <div
                data-testid={`phase-indicator-${phase}`}
                data-status={status}
                className={INDICATOR_STYLES[status]}
              >
                {status === 'completed' ? (
                  <CheckIcon />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              {!isLast && (
                <div className="w-px flex-1 min-h-4 bg-gray-200 dark:bg-gray-700" />
              )}
            </div>

            {/* Phase content */}
            <div className={`pb-6 min-w-0 flex-1 ${status === 'upcoming' ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{PHASE_LABELS[phase]}</span>
                <RoleBadge role={PHASE_ROLE_MAP[phase]} />
                {validation && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DECISION_STYLES[validation.decision] ?? ''}`}
                  >
                    {DECISION_LABELS[validation.decision] ?? validation.decision}
                  </span>
                )}
              </div>

              {/* Roadmap details */}
              {roadmap && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {roadmap.milestones.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5">
                      {roadmap.milestones.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  )}
                  {roadmap.estimatedDuration && (
                    <p>{roadmap.estimatedDuration}</p>
                  )}
                </div>
              )}

              {/* Validation feedback */}
              {validation?.feedback && (
                <p className="mt-1 text-xs text-muted-foreground italic">
                  {validation.feedback}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
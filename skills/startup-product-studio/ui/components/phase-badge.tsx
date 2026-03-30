'use client';

import { PHASE_LABELS } from '../types';
import type { PhaseId } from '../types';

export type PhaseStatus = 'completed' | 'active' | 'upcoming';

const STATUS_STYLES: Record<PhaseStatus, string> = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  upcoming: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

interface PhaseBadgeProps {
  phase: PhaseId;
  status: PhaseStatus;
}

export function PhaseBadge({ phase, status }: PhaseBadgeProps) {
  return (
    <span
      data-testid={`phase-badge-${phase}`}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {PHASE_LABELS[phase]}
    </span>
  );
}
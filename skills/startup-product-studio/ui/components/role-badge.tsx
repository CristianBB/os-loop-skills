'use client';

import { ROLE_LABELS } from '../types';
import type { RoleId } from '../types';

const ROLE_COLORS: Record<RoleId, string> = {
  'ceo': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'product-manager': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'ux-ui': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'software-architect': 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  'developer': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'qa': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

interface RoleBadgeProps {
  role: RoleId;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      data-testid={`role-badge-${role}`}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
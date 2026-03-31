'use client';

import { PHASE_LABELS } from '../types';
import type { ProjectRecord, PhaseId } from '../types';

interface ProjectSelectorProps {
  projects: ProjectRecord[];
  activeProjectId: string | null;
  onSelect: (projectId: string) => void;
}

export function ProjectSelector({ projects, activeProjectId, onSelect }: ProjectSelectorProps) {
  if (projects.length <= 1) return null;

  return (
    <select
      data-testid="project-selector"
      value={activeProjectId ?? ''}
      onChange={(e) => onSelect(e.target.value)}
      className="cursor-pointer rounded-md border bg-background px-2 py-1 text-sm"
    >
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} — {PHASE_LABELS[p.currentPhase as PhaseId] ?? p.currentPhase}
        </option>
      ))}
    </select>
  );
}
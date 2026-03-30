import { useMemo } from 'react';
import type { SkillWorkspace } from '../views/skill-view-props';
import type { StudioState, ProjectRecord, CodeProject, ImplementationStatus } from '../types';

// ---------------------------------------------------------------------------
// Pure parsing (exported for direct use and testing)
// ---------------------------------------------------------------------------

/**
 * Safely parse a SkillWorkspace.state Record into a typed StudioState.
 * Returns null if the input is missing or structurally invalid.
 */
export function parseStudioState(
  raw: Record<string, unknown> | null | undefined,
): StudioState | null {
  if (!raw || typeof raw !== 'object') return null;

  const { studioName, projects, activeProjectId, createdAt } = raw as Record<string, unknown>;

  if (typeof studioName !== 'string') return null;
  if (!Array.isArray(projects)) return null;

  return {
    studioName,
    projects: (projects as ProjectRecord[]).map(normalizeProjectRecord),
    activeProjectId: typeof activeProjectId === 'string' ? activeProjectId : null,
    createdAt: typeof createdAt === 'string' ? createdAt : '',
  };
}

function normalizeCodeProject(cp: Record<string, unknown>): CodeProject {
  return {
    id: cp.id as string,
    name: cp.name as string,
    type: cp.type as CodeProject['type'],
    techStack: (cp.techStack as string) ?? '',
    repoPath: (cp.repoPath as string | null) ?? null,
    bootstrapStatus: (cp.bootstrapStatus as CodeProject['bootstrapStatus']) ?? null,
    bootstrapBridgeJobId: (cp.bootstrapBridgeJobId as string | null) ?? null,
  };
}

function normalizeImplementationStatus(raw: Record<string, unknown> | null): ImplementationStatus | null {
  if (!raw) return null;
  return {
    totalTasks: (raw.totalTasks as number) ?? 0,
    completedTasks: (raw.completedTasks as number) ?? 0,
    currentIteration: (raw.currentIteration as number) ?? 1,
    totalIterationsPlanned: (raw.totalIterationsPlanned as number) ?? 1,
    blockers: Array.isArray(raw.blockers) ? raw.blockers as string[] : [],
    executionPhases: Array.isArray(raw.executionPhases) ? raw.executionPhases as ImplementationStatus['executionPhases'] : [],
    activeExecutionPhaseIndex: (raw.activeExecutionPhaseIndex as number | null) ?? null,
    roadmapPhaseRecords: Array.isArray(raw.roadmapPhaseRecords)
      ? (raw.roadmapPhaseRecords as Record<string, unknown>[])
          .filter((r) => typeof r.id === 'string' && typeof r.label === 'string' && typeof r.status === 'string')
          .map((r) => ({
            ...r,
            goals: Array.isArray(r.goals) ? r.goals : [],
            deliverables: Array.isArray(r.deliverables) ? r.deliverables : [],
            validationCriteria: Array.isArray(r.validationCriteria) ? r.validationCriteria : [],
            involvedProjectIds: Array.isArray(r.involvedProjectIds) ? r.involvedProjectIds : [],
            roadmapEntryPhase: typeof r.roadmapEntryPhase === 'string' ? r.roadmapEntryPhase : 'implementation-phase',
            architectureSlices: Array.isArray(r.architectureSlices) ? r.architectureSlices : [],
            technicalDependencies: Array.isArray(r.technicalDependencies) ? r.technicalDependencies : [],
            implementationPlanVersions: Array.isArray(r.implementationPlanVersions) ? r.implementationPlanVersions : [],
            taskGroupProgress: Array.isArray(r.taskGroupProgress) ? r.taskGroupProgress : [],
            currentTaskGroupIndex: typeof r.currentTaskGroupIndex === 'number' ? r.currentTaskGroupIndex : null,
            bridgeJobIds: Array.isArray(r.bridgeJobIds) ? r.bridgeJobIds : [],
          })) as ImplementationStatus['roadmapPhaseRecords']
      : [],
    activeRoadmapPhaseIndex: (raw.activeRoadmapPhaseIndex as number | null) ?? null,
  };
}

function normalizeProjectRecord(project: ProjectRecord): ProjectRecord {
  return {
    ...project,
    codeProjects: Array.isArray(project.codeProjects)
      ? project.codeProjects.map((cp) => normalizeCodeProject(cp as unknown as Record<string, unknown>))
      : [],
    implementationStatus: project.implementationStatus
      ? normalizeImplementationStatus(project.implementationStatus as unknown as Record<string, unknown>)
      : null,
    roadmapVersions: Array.isArray(project.roadmapVersions) ? project.roadmapVersions : [],
    architecturePlanVersions: Array.isArray(project.architecturePlanVersions) ? project.architecturePlanVersions : [],
    approvedArchitecturePlan: project.approvedArchitecturePlan ?? null,
  };
}

/**
 * Find the active project within a StudioState.
 * Returns null when studio is null or no matching project exists.
 */
export function getActiveProject(studio: StudioState | null): ProjectRecord | null {
  if (!studio || !studio.activeProjectId) return null;
  return studio.projects.find((p) => p.id === studio.activeProjectId) ?? null;
}

// ---------------------------------------------------------------------------
// React hooks
// ---------------------------------------------------------------------------

/** Parse and memoize StudioState from a SkillWorkspace. */
export function useStudioState(workspace: SkillWorkspace | null): StudioState | null {
  return useMemo(
    () => (workspace ? parseStudioState(workspace.state) : null),
    [workspace],
  );
}

/** Find and memoize the active project from a StudioState. */
export function useActiveProject(studio: StudioState | null): ProjectRecord | null {
  return useMemo(() => getActiveProject(studio), [studio]);
}

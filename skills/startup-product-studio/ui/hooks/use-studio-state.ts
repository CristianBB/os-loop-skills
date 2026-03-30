     1→import { useMemo } from 'react';
     2→import type { SkillWorkspace } from '../views/skill-view-props';
     3→import type { StudioState, ProjectRecord, CodeProject, ImplementationStatus } from '../types';
     4→
     5→// ---------------------------------------------------------------------------
     6→// Pure parsing (exported for direct use and testing)
     7→// ---------------------------------------------------------------------------
     8→
     9→/**
    10→ * Safely parse a SkillWorkspace.state Record into a typed StudioState.
    11→ * Returns null if the input is missing or structurally invalid.
    12→ */
    13→export function parseStudioState(
    14→  raw: Record<string, unknown> | null | undefined,
    15→): StudioState | null {
    16→  if (!raw || typeof raw !== 'object') return null;
    17→
    18→  const { studioName, projects, activeProjectId, createdAt } = raw as Record<string, unknown>;
    19→
    20→  if (typeof studioName !== 'string') return null;
    21→  if (!Array.isArray(projects)) return null;
    22→
    23→  return {
    24→    studioName,
    25→    projects: (projects as ProjectRecord[]).map(normalizeProjectRecord),
    26→    activeProjectId: typeof activeProjectId === 'string' ? activeProjectId : null,
    27→    createdAt: typeof createdAt === 'string' ? createdAt : '',
    28→  };
    29→}
    30→
    31→function normalizeCodeProject(cp: Record<string, unknown>): CodeProject {
    32→  return {
    33→    id: cp.id as string,
    34→    name: cp.name as string,
    35→    type: cp.type as CodeProject['type'],
    36→    techStack: (cp.techStack as string) ?? '',
    37→    repoPath: (cp.repoPath as string | null) ?? null,
    38→    bootstrapStatus: (cp.bootstrapStatus as CodeProject['bootstrapStatus']) ?? null,
    39→    bootstrapBridgeJobId: (cp.bootstrapBridgeJobId as string | null) ?? null,
    40→  };
    41→}
    42→
    43→function normalizeImplementationStatus(raw: Record<string, unknown> | null): ImplementationStatus | null {
    44→  if (!raw) return null;
    45→  return {
    46→    totalTasks: (raw.totalTasks as number) ?? 0,
    47→    completedTasks: (raw.completedTasks as number) ?? 0,
    48→    currentIteration: (raw.currentIteration as number) ?? 1,
    49→    totalIterationsPlanned: (raw.totalIterationsPlanned as number) ?? 1,
    50→    blockers: Array.isArray(raw.blockers) ? raw.blockers as string[] : [],
    51→    executionPhases: Array.isArray(raw.executionPhases) ? raw.executionPhases as ImplementationStatus['executionPhases'] : [],
    52→    activeExecutionPhaseIndex: (raw.activeExecutionPhaseIndex as number | null) ?? null,
    53→    roadmapPhaseRecords: Array.isArray(raw.roadmapPhaseRecords)
    54→      ? (raw.roadmapPhaseRecords as Record<string, unknown>[])
    55→          .filter((r) => typeof r.id === 'string' && typeof r.label === 'string' && typeof r.status === 'string')
    56→          .map((r) => ({
    57→            ...r,
    58→            goals: Array.isArray(r.goals) ? r.goals : [],
    59→            deliverables: Array.isArray(r.deliverables) ? r.deliverables : [],
    60→            validationCriteria: Array.isArray(r.validationCriteria) ? r.validationCriteria : [],
    61→            involvedProjectIds: Array.isArray(r.involvedProjectIds) ? r.involvedProjectIds : [],
    62→            roadmapEntryPhase: typeof r.roadmapEntryPhase === 'string' ? r.roadmapEntryPhase : 'implementation-phase',
    63→            architectureSlices: Array.isArray(r.architectureSlices) ? r.architectureSlices : [],
    64→            technicalDependencies: Array.isArray(r.technicalDependencies) ? r.technicalDependencies : [],
    65→            implementationPlanVersions: Array.isArray(r.implementationPlanVersions) ? r.implementationPlanVersions : [],
    66→            taskGroupProgress: Array.isArray(r.taskGroupProgress) ? r.taskGroupProgress : [],
    67→            currentTaskGroupIndex: typeof r.currentTaskGroupIndex === 'number' ? r.currentTaskGroupIndex : null,
    68→            bridgeJobIds: Array.isArray(r.bridgeJobIds) ? r.bridgeJobIds : [],
    69→          })) as ImplementationStatus['roadmapPhaseRecords']
    70→      : [],
    71→    activeRoadmapPhaseIndex: (raw.activeRoadmapPhaseIndex as number | null) ?? null,
    72→  };
    73→}
    74→
    75→function normalizeProjectRecord(project: ProjectRecord): ProjectRecord {
    76→  return {
    77→    ...project,
    78→    codeProjects: Array.isArray(project.codeProjects)
    79→      ? project.codeProjects.map((cp) => normalizeCodeProject(cp as unknown as Record<string, unknown>))
    80→      : [],
    81→    implementationStatus: project.implementationStatus
    82→      ? normalizeImplementationStatus(project.implementationStatus as unknown as Record<string, unknown>)
    83→      : null,
    84→    roadmapVersions: Array.isArray(project.roadmapVersions) ? project.roadmapVersions : [],
    85→    architecturePlanVersions: Array.isArray(project.architecturePlanVersions) ? project.architecturePlanVersions : [],
    86→    approvedArchitecturePlan: project.approvedArchitecturePlan ?? null,
    87→  };
    88→}
    89→
    90→/**
    91→ * Find the active project within a StudioState.
    92→ * Returns null when studio is null or no matching project exists.
    93→ */
    94→export function getActiveProject(studio: StudioState | null): ProjectRecord | null {
    95→  if (!studio || !studio.activeProjectId) return null;
    96→  return studio.projects.find((p) => p.id === studio.activeProjectId) ?? null;
    97→}
    98→
    99→// ---------------------------------------------------------------------------
   100→// React hooks
   101→// ---------------------------------------------------------------------------
   102→
   103→/** Parse and memoize StudioState from a SkillWorkspace. */
   104→export function useStudioState(workspace: SkillWorkspace | null): StudioState | null {
   105→  return useMemo(
   106→    () => (workspace ? parseStudioState(workspace.state) : null),
   107→    [workspace],
   108→  );
   109→}
   110→
   111→/** Find and memoize the active project from a StudioState. */
   112→export function useActiveProject(studio: StudioState | null): ProjectRecord | null {
   113→  return useMemo(() => getActiveProject(studio), [studio]);
   114→}
   115→
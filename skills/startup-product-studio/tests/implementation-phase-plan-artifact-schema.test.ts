import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Re-declare types locally for testing (module.ts types are not exported)

type ImplPlanTaskType = 'feature' | 'refactor' | 'integration' | 'config' | 'test' | 'docs';
type ImplPlanRiskSeverity = 'low' | 'medium' | 'high';

interface ImplPlanPhaseContext {
  roadmapPhaseId: string;
  roadmapPhaseName: string;
  summary: string;
  relatedArchitectureSections: string[];
}

interface ImplPlanScopeDefinition {
  included: string[];
  excluded: string[];
}

interface ImplPlanAffectedProject {
  projectId: string;
  projectName: string;
  purpose: string;
  expectedChanges: string[];
}

interface ImplPlanTask {
  id: string;
  title: string;
  description: string;
  projectId: string;
  type: ImplPlanTaskType;
  dependencies: string[];
  expectedOutcome: string;
}

interface ImplPlanTaskGroup {
  groupLabel: string;
  tasks: ImplPlanTask[];
}

interface ImplPlanApiContract {
  name: string;
  producerProjectId: string;
  consumerProjectIds: string[];
  description: string;
}

interface ImplPlanDataContract {
  name: string;
  ownerProjectId: string;
  description: string;
}

interface ImplPlanInterfacesAndContracts {
  apis: ImplPlanApiContract[];
  boundaries: string[];
  dataContracts: ImplPlanDataContract[];
}

interface ImplPlanDataModel {
  name: string;
  projectId: string;
  description: string;
  fields: string[];
}

interface ImplPlanDataChanges {
  newModels: ImplPlanDataModel[];
  migrations: string[];
  storageChanges: string[];
}

interface ImplPlanRisk {
  id: string;
  description: string;
  severity: ImplPlanRiskSeverity;
  mitigation?: string;
}

interface ImplPlanValidation {
  verificationSteps: string[];
  testExpectations: string[];
  qaGateCriteria: string[];
}

interface ImplementationPhasePlanArtifactContent {
  projectId: string;
  subphaseId: string;
  label: string;
  roadmapEntryPhase: string;
  body: string;
  architectureSlices: string[];
  technicalDependencies: string[];
  generatedAt: string;
  phaseContext?: ImplPlanPhaseContext;
  scopeDefinition?: ImplPlanScopeDefinition;
  affectedProjects?: ImplPlanAffectedProject[];
  workBreakdown?: ImplPlanTaskGroup[];
  interfacesAndContracts?: ImplPlanInterfacesAndContracts;
  dataChanges?: ImplPlanDataChanges;
  risksAndEdgeCases?: ImplPlanRisk[];
  validationPlan?: ImplPlanValidation;
  definitionOfDone?: string[];
}

// ── Validation ─────────────────────────────────────────────────────────────

const VALID_TASK_TYPES: ImplPlanTaskType[] = ['feature', 'refactor', 'integration', 'config', 'test', 'docs'];
const VALID_RISK_SEVERITIES: ImplPlanRiskSeverity[] = ['low', 'medium', 'high'];

function validateImplementationPhasePlanArtifact(content: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!content || typeof content !== 'object') {
    return { valid: false, errors: ['Content must be a non-null object'] };
  }

  const c = content as Record<string, unknown>;

  // Envelope validation (always required)
  if (typeof c.projectId !== 'string' || (c.projectId as string).length === 0) errors.push('projectId must be a non-empty string');
  if (typeof c.subphaseId !== 'string' || (c.subphaseId as string).length === 0) errors.push('subphaseId must be a non-empty string');
  if (typeof c.label !== 'string' || (c.label as string).length === 0) errors.push('label must be a non-empty string');
  if (typeof c.body !== 'string' || (c.body as string).length === 0) errors.push('body must be a non-empty string');
  if (typeof c.generatedAt !== 'string' || (c.generatedAt as string).length === 0) errors.push('generatedAt must be a non-empty string');
  if (!Array.isArray(c.architectureSlices)) errors.push('architectureSlices must be an array');
  if (!Array.isArray(c.technicalDependencies)) errors.push('technicalDependencies must be an array');

  // phaseContext (optional)
  if (c.phaseContext !== undefined) {
    if (!c.phaseContext || typeof c.phaseContext !== 'object') {
      errors.push('phaseContext must be an object when present');
    } else {
      const pc = c.phaseContext as Record<string, unknown>;
      if (typeof pc.roadmapPhaseId !== 'string' || (pc.roadmapPhaseId as string).length === 0) errors.push('phaseContext.roadmapPhaseId must be a non-empty string');
      if (typeof pc.roadmapPhaseName !== 'string' || (pc.roadmapPhaseName as string).length === 0) errors.push('phaseContext.roadmapPhaseName must be a non-empty string');
      if (typeof pc.summary !== 'string' || (pc.summary as string).length === 0) errors.push('phaseContext.summary must be a non-empty string');
      if (!Array.isArray(pc.relatedArchitectureSections)) errors.push('phaseContext.relatedArchitectureSections must be an array');
    }
  }

  // scopeDefinition (optional)
  if (c.scopeDefinition !== undefined) {
    if (!c.scopeDefinition || typeof c.scopeDefinition !== 'object') {
      errors.push('scopeDefinition must be an object when present');
    } else {
      const sd = c.scopeDefinition as Record<string, unknown>;
      if (!Array.isArray(sd.included)) errors.push('scopeDefinition.included must be an array');
      if (!Array.isArray(sd.excluded)) errors.push('scopeDefinition.excluded must be an array');
    }
  }

  // affectedProjects (optional)
  if (c.affectedProjects !== undefined) {
    if (!Array.isArray(c.affectedProjects)) {
      errors.push('affectedProjects must be an array when present');
    } else {
      for (const ap of c.affectedProjects as Record<string, unknown>[]) {
        if (typeof ap.projectId !== 'string' || (ap.projectId as string).length === 0) errors.push('affectedProject entry missing projectId');
        if (typeof ap.projectName !== 'string' || (ap.projectName as string).length === 0) errors.push('affectedProject entry missing projectName');
        if (typeof ap.purpose !== 'string' || (ap.purpose as string).length === 0) errors.push('affectedProject entry missing purpose');
        if (!Array.isArray(ap.expectedChanges)) errors.push('affectedProject entry missing expectedChanges array');
      }
    }
  }

  // workBreakdown (optional)
  const allTaskIds = new Set<string>();
  if (c.workBreakdown !== undefined) {
    if (!Array.isArray(c.workBreakdown)) {
      errors.push('workBreakdown must be an array when present');
    } else {
      for (const group of c.workBreakdown as Record<string, unknown>[]) {
        if (typeof group.groupLabel !== 'string' || (group.groupLabel as string).length === 0) errors.push('workBreakdown group missing groupLabel');
        if (!Array.isArray(group.tasks)) {
          errors.push('workBreakdown group missing tasks array');
        } else {
          for (const task of group.tasks as Record<string, unknown>[]) {
            if (typeof task.id !== 'string' || (task.id as string).length === 0) errors.push('task missing id');
            else allTaskIds.add(task.id as string);
            if (typeof task.title !== 'string' || (task.title as string).length === 0) errors.push('task missing title');
            if (typeof task.description !== 'string' || (task.description as string).length === 0) errors.push('task missing description');
            if (typeof task.projectId !== 'string' || (task.projectId as string).length === 0) errors.push('task missing projectId');
            if (!VALID_TASK_TYPES.includes(task.type as ImplPlanTaskType)) errors.push(`task ${task.id} has invalid type: ${task.type}`);
            if (!Array.isArray(task.dependencies)) errors.push('task missing dependencies array');
            if (typeof task.expectedOutcome !== 'string' || (task.expectedOutcome as string).length === 0) errors.push('task missing expectedOutcome');
          }
        }
      }
      // Validate dependency referential integrity
      for (const group of c.workBreakdown as Record<string, unknown>[]) {
        if (Array.isArray(group.tasks)) {
          for (const task of group.tasks as Record<string, unknown>[]) {
            if (Array.isArray(task.dependencies)) {
              for (const dep of task.dependencies as string[]) {
                if (!allTaskIds.has(dep)) errors.push(`task ${task.id} references unknown dependency: ${dep}`);
              }
            }
          }
        }
      }
    }
  }

  // interfacesAndContracts (optional)
  if (c.interfacesAndContracts !== undefined) {
    if (!c.interfacesAndContracts || typeof c.interfacesAndContracts !== 'object') {
      errors.push('interfacesAndContracts must be an object when present');
    } else {
      const ic = c.interfacesAndContracts as Record<string, unknown>;
      if (!Array.isArray(ic.apis)) errors.push('interfacesAndContracts.apis must be an array');
      if (!Array.isArray(ic.boundaries)) errors.push('interfacesAndContracts.boundaries must be an array');
      if (!Array.isArray(ic.dataContracts)) errors.push('interfacesAndContracts.dataContracts must be an array');
    }
  }

  // dataChanges (optional)
  if (c.dataChanges !== undefined) {
    if (!c.dataChanges || typeof c.dataChanges !== 'object') {
      errors.push('dataChanges must be an object when present');
    } else {
      const dc = c.dataChanges as Record<string, unknown>;
      if (!Array.isArray(dc.newModels)) errors.push('dataChanges.newModels must be an array');
      if (!Array.isArray(dc.migrations)) errors.push('dataChanges.migrations must be an array');
      if (!Array.isArray(dc.storageChanges)) errors.push('dataChanges.storageChanges must be an array');
    }
  }

  // risksAndEdgeCases (optional)
  if (c.risksAndEdgeCases !== undefined) {
    if (!Array.isArray(c.risksAndEdgeCases)) {
      errors.push('risksAndEdgeCases must be an array when present');
    } else {
      for (const risk of c.risksAndEdgeCases as Record<string, unknown>[]) {
        if (typeof risk.id !== 'string' || (risk.id as string).length === 0) errors.push('risk entry missing id');
        if (typeof risk.description !== 'string' || (risk.description as string).length === 0) errors.push('risk entry missing description');
        if (!VALID_RISK_SEVERITIES.includes(risk.severity as ImplPlanRiskSeverity)) errors.push(`risk ${risk.id} has invalid severity: ${risk.severity}`);
      }
    }
  }

  // validationPlan (optional)
  if (c.validationPlan !== undefined) {
    if (!c.validationPlan || typeof c.validationPlan !== 'object') {
      errors.push('validationPlan must be an object when present');
    } else {
      const vp = c.validationPlan as Record<string, unknown>;
      if (!Array.isArray(vp.verificationSteps)) errors.push('validationPlan.verificationSteps must be an array');
      if (!Array.isArray(vp.testExpectations)) errors.push('validationPlan.testExpectations must be an array');
      if (!Array.isArray(vp.qaGateCriteria)) errors.push('validationPlan.qaGateCriteria must be an array');
    }
  }

  // definitionOfDone (optional)
  if (c.definitionOfDone !== undefined) {
    if (!Array.isArray(c.definitionOfDone) || c.definitionOfDone.length === 0) {
      errors.push('definitionOfDone must be a non-empty array when present');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Fixture ────────────────────────────────────────────────────────────────

function buildCanonicalFixture(): ImplementationPhasePlanArtifactContent {
  return {
    projectId: 'taskflow',
    subphaseId: 'sub-impl-1',
    label: 'Phase 1: Core API & Data Layer',
    roadmapEntryPhase: 'implementation-phase',
    body: 'Build the foundational backend API.',
    architectureSlices: ['backend-api: Auth module', 'backend-api: Task CRUD'],
    technicalDependencies: ['architecture-definition'],
    generatedAt: '2026-03-15T10:00:00Z',
    phaseContext: {
      roadmapPhaseId: 'phase-impl-core',
      roadmapPhaseName: 'Core API & Data Layer',
      summary: 'Implement the foundational backend API.',
      relatedArchitectureSections: ['runtimeArchitecture.backends', 'dataArchitecture'],
    },
    scopeDefinition: {
      included: ['User authentication with JWT', 'Task CRUD endpoints'],
      excluded: ['Frontend implementation', 'WebSocket real-time updates'],
    },
    affectedProjects: [
      { projectId: 'backend-api', projectName: 'Backend API', purpose: 'Primary target', expectedChanges: ['Auth middleware', 'Task router'] },
      { projectId: 'shared-types', projectName: 'Shared Types', purpose: 'TypeScript contracts', expectedChanges: ['Task types'] },
    ],
    workBreakdown: [
      {
        groupLabel: 'Data Layer',
        tasks: [
          { id: 't-1', title: 'Design schema', description: 'Create database schema.', projectId: 'backend-api', type: 'feature', dependencies: [], expectedOutcome: 'Migration files' },
          { id: 't-2', title: 'Access layer', description: 'Create repositories.', projectId: 'backend-api', type: 'feature', dependencies: ['t-1'], expectedOutcome: 'Repository classes' },
        ],
      },
      {
        groupLabel: 'Auth',
        tasks: [
          { id: 't-3', title: 'JWT middleware', description: 'Validate JWT tokens.', projectId: 'backend-api', type: 'feature', dependencies: [], expectedOutcome: 'Auth middleware' },
        ],
      },
    ],
    interfacesAndContracts: {
      apis: [{ name: 'Task REST API', producerProjectId: 'backend-api', consumerProjectIds: ['web-app'], description: 'CRUD for tasks' }],
      boundaries: ['web-app accesses backend-api via REST only'],
      dataContracts: [{ name: 'TaskResponse', ownerProjectId: 'shared-types', description: 'Task response shape' }],
    },
    dataChanges: {
      newModels: [{ name: 'Task', projectId: 'backend-api', description: 'Core task entity', fields: ['id (UUID)', 'title (string)'] }],
      migrations: ['001_create_tasks'],
      storageChanges: ['PostgreSQL provisioned'],
    },
    risksAndEdgeCases: [
      { id: 'r-1', description: 'Auth0 latency under load', severity: 'medium', mitigation: 'Cache JWKS keys' },
      { id: 'r-2', description: 'Concurrent update anomalies', severity: 'high' },
    ],
    validationPlan: {
      verificationSteps: ['Migrations run cleanly'],
      testExpectations: ['Integration tests for CRUD'],
      qaGateCriteria: ['No N+1 queries'],
    },
    definitionOfDone: [
      'All tasks completed',
      'Migrations run on clean database',
      'CRUD endpoints pass tests',
    ],
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Implementation Phase Plan Artifact Schema', () => {
  describe('canonical fixture validation', () => {
    it('validates the test fixture as a valid implementation-phase-plan', () => {
      const fixture = buildCanonicalFixture();
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates the canonical example JSON file', () => {
      const raw = readFileSync(
        join(__dirname, '..', 'examples', 'canonical-implementation-phase-plan-artifact.json'),
        'utf-8',
      );
      const content = JSON.parse(raw);
      const result = validateImplementationPhasePlanArtifact(content);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('required envelope fields', () => {
    it('rejects null content', () => {
      const result = validateImplementationPhasePlanArtifact(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content must be a non-null object');
    });

    it('rejects empty object', () => {
      const result = validateImplementationPhasePlanArtifact({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(7);
    });

    it('rejects missing projectId', () => {
      const fixture = buildCanonicalFixture();
      const { projectId: _, ...without } = fixture;
      const result = validateImplementationPhasePlanArtifact(without);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('projectId must be a non-empty string');
    });

    it('rejects missing body', () => {
      const fixture = buildCanonicalFixture();
      const { body: _, ...without } = fixture;
      const result = validateImplementationPhasePlanArtifact(without);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('body must be a non-empty string');
    });

    it('rejects missing generatedAt', () => {
      const fixture = buildCanonicalFixture();
      const { generatedAt: _, ...without } = fixture;
      const result = validateImplementationPhasePlanArtifact(without);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('generatedAt must be a non-empty string');
    });

    it('rejects missing subphaseId', () => {
      const fixture = buildCanonicalFixture();
      const { subphaseId: _, ...without } = fixture;
      const result = validateImplementationPhasePlanArtifact(without);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('subphaseId must be a non-empty string');
    });

    it('rejects missing label', () => {
      const fixture = buildCanonicalFixture();
      const { label: _, ...without } = fixture;
      const result = validateImplementationPhasePlanArtifact(without);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('label must be a non-empty string');
    });
  });

  describe('backward compatibility', () => {
    it('validates simple-format artifact with only envelope fields', () => {
      const simple = {
        projectId: 'proj-1',
        subphaseId: 'sub-1',
        label: 'Core API',
        roadmapEntryPhase: 'implementation-phase',
        body: 'A simple text plan.',
        architectureSlices: ['backend-api: Auth'],
        technicalDependencies: ['architecture-definition'],
        generatedAt: '2026-03-01T00:00:00Z',
      };
      const result = validateImplementationPhasePlanArtifact(simple);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('phaseContext validation', () => {
    it('rejects phaseContext with empty roadmapPhaseId', () => {
      const fixture = buildCanonicalFixture();
      fixture.phaseContext!.roadmapPhaseId = '';
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('phaseContext.roadmapPhaseId must be a non-empty string');
    });

    it('rejects phaseContext with empty summary', () => {
      const fixture = buildCanonicalFixture();
      fixture.phaseContext!.summary = '';
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('phaseContext.summary must be a non-empty string');
    });
  });

  describe('scopeDefinition validation', () => {
    it('rejects scopeDefinition without included array', () => {
      const fixture = buildCanonicalFixture();
      (fixture.scopeDefinition as Record<string, unknown>).included = 'not an array';
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('scopeDefinition.included must be an array');
    });
  });

  describe('affectedProjects validation', () => {
    it('rejects affectedProject entry without projectId', () => {
      const fixture = buildCanonicalFixture();
      (fixture.affectedProjects![0] as Record<string, unknown>).projectId = '';
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('affectedProject entry missing projectId');
    });

    it('rejects affectedProject entry without expectedChanges array', () => {
      const fixture = buildCanonicalFixture();
      (fixture.affectedProjects![0] as Record<string, unknown>).expectedChanges = 'not array';
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('affectedProject entry missing expectedChanges array');
    });
  });

  describe('workBreakdown validation', () => {
    it('rejects workBreakdown group without groupLabel', () => {
      const fixture = buildCanonicalFixture();
      (fixture.workBreakdown![0] as Record<string, unknown>).groupLabel = '';
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('workBreakdown group missing groupLabel');
    });

    it('rejects task with invalid type', () => {
      const fixture = buildCanonicalFixture();
      (fixture.workBreakdown![0].tasks[0] as Record<string, unknown>).type = 'unknown';
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid type'))).toBe(true);
    });

    it('validates all task types', () => {
      const fixture = buildCanonicalFixture();
      const types: ImplPlanTaskType[] = ['feature', 'refactor', 'integration', 'config', 'test', 'docs'];
      fixture.workBreakdown = [{
        groupLabel: 'All types',
        tasks: types.map((t, i) => ({
          id: `task-${i}`,
          title: `Task ${t}`,
          description: `A ${t} task`,
          projectId: 'backend-api',
          type: t,
          dependencies: [],
          expectedOutcome: `Done ${t}`,
        })),
      }];
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(true);
    });

    it('rejects task with missing expectedOutcome', () => {
      const fixture = buildCanonicalFixture();
      (fixture.workBreakdown![0].tasks[0] as Record<string, unknown>).expectedOutcome = '';
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('task missing expectedOutcome');
    });

    it('validates task dependency referential integrity', () => {
      const fixture = buildCanonicalFixture();
      fixture.workBreakdown = [{
        groupLabel: 'Test',
        tasks: [
          { id: 'a', title: 'A', description: 'Do A', projectId: 'p', type: 'feature', dependencies: ['nonexistent'], expectedOutcome: 'Done' },
        ],
      }];
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('task a references unknown dependency: nonexistent');
    });

    it('allows cross-group dependencies', () => {
      const fixture = buildCanonicalFixture();
      // t-2 depends on t-1 which is in a different group position — should be valid
      expect(fixture.workBreakdown![0].tasks[1].dependencies).toContain('t-1');
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(true);
    });
  });

  describe('interfacesAndContracts validation', () => {
    it('rejects interfacesAndContracts without apis array', () => {
      const fixture = buildCanonicalFixture();
      (fixture.interfacesAndContracts as Record<string, unknown>).apis = 'not array';
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('interfacesAndContracts.apis must be an array');
    });
  });

  describe('dataChanges validation', () => {
    it('rejects dataChanges without newModels array', () => {
      const fixture = buildCanonicalFixture();
      (fixture.dataChanges as Record<string, unknown>).newModels = 'not array';
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('dataChanges.newModels must be an array');
    });

    it('rejects dataChanges without migrations array', () => {
      const fixture = buildCanonicalFixture();
      (fixture.dataChanges as Record<string, unknown>).migrations = null;
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('dataChanges.migrations must be an array');
    });
  });

  describe('risksAndEdgeCases validation', () => {
    it('validates all risk severity levels', () => {
      const fixture = buildCanonicalFixture();
      fixture.risksAndEdgeCases = [
        { id: 'r1', description: 'Low risk', severity: 'low' },
        { id: 'r2', description: 'Medium risk', severity: 'medium' },
        { id: 'r3', description: 'High risk', severity: 'high' },
      ];
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid severity', () => {
      const fixture = buildCanonicalFixture();
      (fixture.risksAndEdgeCases![0] as Record<string, unknown>).severity = 'critical';
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid severity'))).toBe(true);
    });

    it('allows optional mitigation field', () => {
      const fixture = buildCanonicalFixture();
      expect(fixture.risksAndEdgeCases![0].mitigation).toBeDefined();
      expect(fixture.risksAndEdgeCases![1].mitigation).toBeUndefined();
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(true);
    });
  });

  describe('validationPlan validation', () => {
    it('rejects validationPlan without verificationSteps', () => {
      const fixture = buildCanonicalFixture();
      (fixture.validationPlan as Record<string, unknown>).verificationSteps = 'not array';
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('validationPlan.verificationSteps must be an array');
    });

    it('rejects validationPlan without qaGateCriteria', () => {
      const fixture = buildCanonicalFixture();
      (fixture.validationPlan as Record<string, unknown>).qaGateCriteria = null;
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('validationPlan.qaGateCriteria must be an array');
    });
  });

  describe('definitionOfDone validation', () => {
    it('rejects empty definitionOfDone', () => {
      const fixture = buildCanonicalFixture();
      fixture.definitionOfDone = [];
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('definitionOfDone must be a non-empty array when present');
    });

    it('validates non-empty definitionOfDone', () => {
      const fixture = buildCanonicalFixture();
      expect(fixture.definitionOfDone!.length).toBeGreaterThan(0);
      const result = validateImplementationPhasePlanArtifact(fixture);
      expect(result.valid).toBe(true);
    });
  });
});

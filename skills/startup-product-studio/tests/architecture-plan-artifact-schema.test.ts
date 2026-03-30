import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Re-declare the types locally for testing (module.ts types are not exported)
// These mirror the canonical types defined in module.ts

type ArchitectureRiskSeverity = 'low' | 'medium' | 'high' | 'critical';

type ArchitectureProjectType = 'web-app' | 'backend-api' | 'mobile-app' | 'worker' | 'infra' | 'shared-package' | 'docs';

interface ArchitectureSystemOverview {
  description: string;
  productRelationship: string;
  technicalConstraints: string[];
}

interface ArchitectureProjectEntry {
  id: string;
  name: string;
  purpose: string;
  ownership: string;
  type: ArchitectureProjectType;
  dependencies: string[];
}

interface ArchitectureRuntimeComponent {
  name: string;
  projectId: string;
  description: string;
  responsibilities: string[];
}

interface ArchitectureRuntimeArchitecture {
  frontends: ArchitectureRuntimeComponent[];
  backends: ArchitectureRuntimeComponent[];
  backgroundProcessing: ArchitectureRuntimeComponent[];
  externalIntegrations: { name: string; purpose: string; protocol: string }[];
}

interface ArchitectureDataDomain {
  name: string;
  description: string;
  ownerProjectId: string;
  entities: string[];
}

interface ArchitectureDataArchitecture {
  dataDomains: ArchitectureDataDomain[];
  persistenceStrategy: { projectId: string; technology: string; rationale: string }[];
  boundaries: string[];
  stateOwnership: { domain: string; ownerProjectId: string; accessPattern: string }[];
}

interface ArchitectureIntegrationArchitecture {
  apiBoundaries: { name: string; producerProjectId: string; consumerProjectIds: string[]; protocol: string }[];
  internalIntegrationPoints: { description: string; projectIds: string[] }[];
  externalServices: { name: string; purpose: string; integrationMethod: string }[];
}

interface ArchitectureSecurityAndTrustModel {
  authAssumptions: string[];
  secretHandling: string[];
  trustBoundaries: string[];
  riskySurfaces: string[];
}

interface ArchitectureDeploymentModel {
  environmentModel: { name: string; purpose: string; characteristics: string[] }[];
  deploymentUnits: { projectId: string; strategy: string; notes: string }[];
}

interface ArchitectureQualityAttributes {
  maintainability: string;
  scalability: string;
  testability: string;
  reliability: string;
  performance: string;
  developerExperience: string;
}

interface ArchitecturePhaseMapping {
  phaseId: string;
  phaseName: string;
  architectureSlices: string[];
  technicalDependencies: string[];
}

interface ArchitectureImplementationGuidelines {
  rules: string[];
  boundariesToPreserve: string[];
  antiPatterns: string[];
  codingExpectations: string[];
}

interface ArchitectureRisk {
  id: string;
  description: string;
  severity: ArchitectureRiskSeverity;
  mitigation?: string;
}

interface ArchitectureQuestion {
  id: string;
  question: string;
  context?: string;
}

interface ArchitecturePlanVersionMetadata {
  version: number;
  roleFlow: string[];
}

interface ArchitecturePlanArtifactContent {
  systemOverview: ArchitectureSystemOverview;
  projectTopology: ArchitectureProjectEntry[];
  runtimeArchitecture: ArchitectureRuntimeArchitecture;
  dataArchitecture: ArchitectureDataArchitecture;
  integrationArchitecture: ArchitectureIntegrationArchitecture;
  securityAndTrustModel: ArchitectureSecurityAndTrustModel;
  deploymentAndEnvironmentModel: ArchitectureDeploymentModel;
  qualityAttributes: ArchitectureQualityAttributes;
  phaseMapping: ArchitecturePhaseMapping[];
  implementationGuidelines: ArchitectureImplementationGuidelines;
  openRisks: ArchitectureRisk[];
  openQuestions: ArchitectureQuestion[];
  versionMetadata?: ArchitecturePlanVersionMetadata;
}

// ── Validation ─────────────────────────────────────────────────────────────

const VALID_PROJECT_TYPES: ArchitectureProjectType[] = [
  'web-app', 'backend-api', 'mobile-app', 'worker', 'infra', 'shared-package', 'docs',
];

const VALID_RISK_SEVERITIES: ArchitectureRiskSeverity[] = ['low', 'medium', 'high', 'critical'];

const VALID_PHASE_IDS = [
  'discovery', 'roadmap-definition', 'product-definition', 'ux-definition',
  'architecture-definition', 'implementation-phase', 'qa-validation', 'release-readiness',
] as const;

function validateArchitecturePlanArtifact(content: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!content || typeof content !== 'object') {
    return { valid: false, errors: ['Content must be a non-null object'] };
  }

  const c = content as Record<string, unknown>;

  // systemOverview
  if (!c.systemOverview || typeof c.systemOverview !== 'object') {
    errors.push('Missing or invalid systemOverview');
  } else {
    const so = c.systemOverview as Record<string, unknown>;
    if (typeof so.description !== 'string' || so.description.length === 0) errors.push('systemOverview.description must be a non-empty string');
    if (typeof so.productRelationship !== 'string' || so.productRelationship.length === 0) errors.push('systemOverview.productRelationship must be a non-empty string');
    if (!Array.isArray(so.technicalConstraints)) errors.push('systemOverview.technicalConstraints must be an array');
  }

  // projectTopology
  const topologyIds = new Set<string>();
  if (!Array.isArray(c.projectTopology) || c.projectTopology.length === 0) {
    errors.push('projectTopology must be a non-empty array');
  } else {
    for (const entry of c.projectTopology as Record<string, unknown>[]) {
      if (typeof entry.id !== 'string' || entry.id.length === 0) errors.push('projectTopology entry missing id');
      else topologyIds.add(entry.id);
      if (typeof entry.name !== 'string' || entry.name.length === 0) errors.push('projectTopology entry missing name');
      if (typeof entry.purpose !== 'string' || entry.purpose.length === 0) errors.push('projectTopology entry missing purpose');
      if (typeof entry.ownership !== 'string') errors.push('projectTopology entry missing ownership');
      if (!VALID_PROJECT_TYPES.includes(entry.type as ArchitectureProjectType)) {
        errors.push(`projectTopology entry has invalid type: ${entry.type}`);
      }
      if (!Array.isArray(entry.dependencies)) errors.push('projectTopology entry missing dependencies array');
      else {
        for (const dep of entry.dependencies as string[]) {
          if (typeof dep !== 'string') errors.push('projectTopology dependency must be a string');
        }
      }
    }
  }

  // runtimeArchitecture
  if (!c.runtimeArchitecture || typeof c.runtimeArchitecture !== 'object') {
    errors.push('Missing or invalid runtimeArchitecture');
  } else {
    const ra = c.runtimeArchitecture as Record<string, unknown>;
    if (!Array.isArray(ra.frontends)) errors.push('runtimeArchitecture.frontends must be an array');
    if (!Array.isArray(ra.backends)) errors.push('runtimeArchitecture.backends must be an array');
    if (!Array.isArray(ra.backgroundProcessing)) errors.push('runtimeArchitecture.backgroundProcessing must be an array');
    if (!Array.isArray(ra.externalIntegrations)) errors.push('runtimeArchitecture.externalIntegrations must be an array');
  }

  // dataArchitecture
  if (!c.dataArchitecture || typeof c.dataArchitecture !== 'object') {
    errors.push('Missing or invalid dataArchitecture');
  } else {
    const da = c.dataArchitecture as Record<string, unknown>;
    if (!Array.isArray(da.dataDomains)) errors.push('dataArchitecture.dataDomains must be an array');
    if (!Array.isArray(da.persistenceStrategy)) errors.push('dataArchitecture.persistenceStrategy must be an array');
    if (!Array.isArray(da.boundaries)) errors.push('dataArchitecture.boundaries must be an array');
    if (!Array.isArray(da.stateOwnership)) errors.push('dataArchitecture.stateOwnership must be an array');
  }

  // integrationArchitecture
  if (!c.integrationArchitecture || typeof c.integrationArchitecture !== 'object') {
    errors.push('Missing or invalid integrationArchitecture');
  } else {
    const ia = c.integrationArchitecture as Record<string, unknown>;
    if (!Array.isArray(ia.apiBoundaries)) errors.push('integrationArchitecture.apiBoundaries must be an array');
    if (!Array.isArray(ia.internalIntegrationPoints)) errors.push('integrationArchitecture.internalIntegrationPoints must be an array');
    if (!Array.isArray(ia.externalServices)) errors.push('integrationArchitecture.externalServices must be an array');
  }

  // securityAndTrustModel
  if (!c.securityAndTrustModel || typeof c.securityAndTrustModel !== 'object') {
    errors.push('Missing or invalid securityAndTrustModel');
  } else {
    const sm = c.securityAndTrustModel as Record<string, unknown>;
    if (!Array.isArray(sm.authAssumptions)) errors.push('securityAndTrustModel.authAssumptions must be an array');
    if (!Array.isArray(sm.secretHandling)) errors.push('securityAndTrustModel.secretHandling must be an array');
    if (!Array.isArray(sm.trustBoundaries)) errors.push('securityAndTrustModel.trustBoundaries must be an array');
    if (!Array.isArray(sm.riskySurfaces)) errors.push('securityAndTrustModel.riskySurfaces must be an array');
  }

  // deploymentAndEnvironmentModel
  if (!c.deploymentAndEnvironmentModel || typeof c.deploymentAndEnvironmentModel !== 'object') {
    errors.push('Missing or invalid deploymentAndEnvironmentModel');
  } else {
    const dm = c.deploymentAndEnvironmentModel as Record<string, unknown>;
    if (!Array.isArray(dm.environmentModel)) errors.push('deploymentAndEnvironmentModel.environmentModel must be an array');
    if (!Array.isArray(dm.deploymentUnits)) errors.push('deploymentAndEnvironmentModel.deploymentUnits must be an array');
  }

  // qualityAttributes
  if (!c.qualityAttributes || typeof c.qualityAttributes !== 'object') {
    errors.push('Missing or invalid qualityAttributes');
  } else {
    const qa = c.qualityAttributes as Record<string, unknown>;
    const requiredFields = ['maintainability', 'scalability', 'testability', 'reliability', 'performance', 'developerExperience'];
    for (const field of requiredFields) {
      if (typeof qa[field] !== 'string' || (qa[field] as string).length === 0) {
        errors.push(`qualityAttributes.${field} must be a non-empty string`);
      }
    }
  }

  // phaseMapping
  if (!Array.isArray(c.phaseMapping) || c.phaseMapping.length === 0) {
    errors.push('phaseMapping must be a non-empty array');
  } else {
    for (const pm of c.phaseMapping as Record<string, unknown>[]) {
      if (typeof pm.phaseId !== 'string' || pm.phaseId.length === 0) errors.push('phaseMapping entry missing phaseId');
      if (typeof pm.phaseName !== 'string' || pm.phaseName.length === 0) errors.push('phaseMapping entry missing phaseName');
      if (!Array.isArray(pm.architectureSlices)) errors.push('phaseMapping entry missing architectureSlices array');
      if (!Array.isArray(pm.technicalDependencies)) errors.push('phaseMapping entry missing technicalDependencies array');
    }
  }

  // implementationGuidelines
  if (!c.implementationGuidelines || typeof c.implementationGuidelines !== 'object') {
    errors.push('Missing or invalid implementationGuidelines');
  } else {
    const ig = c.implementationGuidelines as Record<string, unknown>;
    if (!Array.isArray(ig.rules)) errors.push('implementationGuidelines.rules must be an array');
    if (!Array.isArray(ig.boundariesToPreserve)) errors.push('implementationGuidelines.boundariesToPreserve must be an array');
    if (!Array.isArray(ig.antiPatterns)) errors.push('implementationGuidelines.antiPatterns must be an array');
    if (!Array.isArray(ig.codingExpectations)) errors.push('implementationGuidelines.codingExpectations must be an array');
  }

  // openRisks
  if (!Array.isArray(c.openRisks)) {
    errors.push('openRisks must be an array');
  } else {
    for (const risk of c.openRisks as Record<string, unknown>[]) {
      if (typeof risk.id !== 'string' || risk.id.length === 0) errors.push('openRisk entry missing id');
      if (typeof risk.description !== 'string' || risk.description.length === 0) errors.push('openRisk entry missing description');
      if (!VALID_RISK_SEVERITIES.includes(risk.severity as ArchitectureRiskSeverity)) {
        errors.push(`openRisk ${risk.id} has invalid severity: ${risk.severity}`);
      }
    }
  }

  // openQuestions
  if (!Array.isArray(c.openQuestions)) {
    errors.push('openQuestions must be an array');
  } else {
    for (const q of c.openQuestions as Record<string, unknown>[]) {
      if (typeof q.id !== 'string' || q.id.length === 0) errors.push('openQuestion entry missing id');
      if (typeof q.question !== 'string' || q.question.length === 0) errors.push('openQuestion entry missing question');
    }
  }

  // versionMetadata (optional)
  if (c.versionMetadata !== undefined) {
    if (!c.versionMetadata || typeof c.versionMetadata !== 'object') {
      errors.push('versionMetadata must be an object when present');
    } else {
      const vm = c.versionMetadata as Record<string, unknown>;
      if (typeof vm.version !== 'number' || vm.version < 1) {
        errors.push('versionMetadata.version must be a positive number');
      }
      if (!Array.isArray(vm.roleFlow) || vm.roleFlow.length === 0) {
        errors.push('versionMetadata.roleFlow must be a non-empty array');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Fixture ────────────────────────────────────────────────────────────────

function buildCanonicalArchitecturePlanFixture(): ArchitecturePlanArtifactContent {
  return {
    systemOverview: {
      description: 'TaskFlow is a multi-tier web application for engineering task management',
      productRelationship: 'Implements the product vision of reducing context-switching by 40%',
      technicalConstraints: ['Must support 1000 concurrent users', 'Real-time updates within 500ms'],
    },
    projectTopology: [
      {
        id: 'web-app',
        name: 'Web Application',
        purpose: 'Primary user interface for task management',
        ownership: 'Frontend team',
        type: 'web-app',
        dependencies: ['shared-types'],
      },
      {
        id: 'backend-api',
        name: 'Backend API',
        purpose: 'RESTful API handling business logic',
        ownership: 'Backend team',
        type: 'backend-api',
        dependencies: ['shared-types'],
      },
      {
        id: 'shared-types',
        name: 'Shared Types',
        purpose: 'TypeScript type definitions shared across projects',
        ownership: 'Backend team',
        type: 'shared-package',
        dependencies: [],
      },
    ],
    runtimeArchitecture: {
      frontends: [{ name: 'TaskFlow Web', projectId: 'web-app', description: 'React SPA', responsibilities: ['Render task boards'] }],
      backends: [{ name: 'TaskFlow API', projectId: 'backend-api', description: 'Express REST API', responsibilities: ['Auth', 'CRUD'] }],
      backgroundProcessing: [{ name: 'Webhook Processor', projectId: 'backend-api', description: 'Bull queue worker', responsibilities: ['Process webhooks'] }],
      externalIntegrations: [{ name: 'GitHub API', purpose: 'PR tracking', protocol: 'REST + Webhooks' }],
    },
    dataArchitecture: {
      dataDomains: [{ name: 'Task Management', description: 'Tasks, boards, columns', ownerProjectId: 'backend-api', entities: ['Task', 'Board'] }],
      persistenceStrategy: [{ projectId: 'backend-api', technology: 'PostgreSQL 15', rationale: 'Strong relational model' }],
      boundaries: ['All data access through backend-api'],
      stateOwnership: [{ domain: 'Task Management', ownerProjectId: 'backend-api', accessPattern: 'CRUD via REST' }],
    },
    integrationArchitecture: {
      apiBoundaries: [{ name: 'TaskFlow REST API', producerProjectId: 'backend-api', consumerProjectIds: ['web-app'], protocol: 'REST over HTTPS' }],
      internalIntegrationPoints: [{ description: 'Shared types for API contracts', projectIds: ['web-app', 'backend-api', 'shared-types'] }],
      externalServices: [{ name: 'GitHub API v4', purpose: 'PR details', integrationMethod: 'GraphQL client' }],
    },
    securityAndTrustModel: {
      authAssumptions: ['Auth0 handles identity'],
      secretHandling: ['Secrets in environment variables'],
      trustBoundaries: ['Web app to backend: JWT-authenticated HTTPS'],
      riskySurfaces: ['Webhook endpoint publicly accessible'],
    },
    deploymentAndEnvironmentModel: {
      environmentModel: [{ name: 'local', purpose: 'Dev machines', characteristics: ['Hot reload'] }],
      deploymentUnits: [{ projectId: 'web-app', strategy: 'CDN deploy', notes: 'Vercel' }],
    },
    qualityAttributes: {
      maintainability: 'Strict TypeScript with shared types',
      scalability: 'Stateless API servers behind load balancer',
      testability: 'Contract testing via shared types',
      reliability: 'Database transactions for consistency',
      performance: 'P95 API latency under 200ms',
      developerExperience: 'Docker Compose for one-command setup',
    },
    phaseMapping: [
      { phaseId: 'discovery', phaseName: 'Discovery', architectureSlices: [], technicalDependencies: [] },
      { phaseId: 'architecture-definition', phaseName: 'Architecture', architectureSlices: ['Full system overview', 'API contracts'], technicalDependencies: ['ux-definition'] },
      { phaseId: 'implementation-phase', phaseName: 'Implementation', architectureSlices: ['backend-api: Auth, CRUD', 'web-app: Board views'], technicalDependencies: ['architecture-definition'] },
    ],
    implementationGuidelines: {
      rules: ['Validate input with Zod schemas'],
      boundariesToPreserve: ['web-app must not import from backend-api'],
      antiPatterns: ['Do not store session state in process'],
      codingExpectations: ['TypeScript strict mode enabled'],
    },
    openRisks: [
      { id: 'risk-1', description: 'WebSocket scaling beyond 1000 users', severity: 'medium', mitigation: 'Pluggable adapter pattern' },
      { id: 'risk-2', description: 'Multi-tenancy data isolation failure', severity: 'critical' },
    ],
    openQuestions: [
      { id: 'q-1', question: 'Should GitLab integration be in MVP?', context: 'Doubles integration surface area' },
      { id: 'q-2', question: 'Is SSO required for beta?' },
    ],
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Architecture Plan Artifact Schema', () => {
  describe('canonical fixture validation', () => {
    it('validates the test fixture as a valid architecture-plan', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates the canonical example JSON file', () => {
      const raw = readFileSync(
        join(__dirname, '..', 'examples', 'canonical-architecture-plan-artifact.json'),
        'utf-8',
      );
      const content = JSON.parse(raw);
      const result = validateArchitecturePlanArtifact(content);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('required sections', () => {
    it('rejects null content', () => {
      const result = validateArchitecturePlanArtifact(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content must be a non-null object');
    });

    it('rejects empty object missing all sections', () => {
      const result = validateArchitecturePlanArtifact({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(12);
    });

    it('rejects missing systemOverview', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      const { systemOverview: _, ...without } = fixture;
      const result = validateArchitecturePlanArtifact(without);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid systemOverview');
    });

    it('rejects missing projectTopology', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      const { projectTopology: _, ...without } = fixture;
      const result = validateArchitecturePlanArtifact(without);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('projectTopology must be a non-empty array');
    });

    it('rejects missing runtimeArchitecture', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      const { runtimeArchitecture: _, ...without } = fixture;
      const result = validateArchitecturePlanArtifact(without);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid runtimeArchitecture');
    });

    it('rejects missing qualityAttributes', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      const { qualityAttributes: _, ...without } = fixture;
      const result = validateArchitecturePlanArtifact(without);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid qualityAttributes');
    });

    it('rejects missing implementationGuidelines', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      const { implementationGuidelines: _, ...without } = fixture;
      const result = validateArchitecturePlanArtifact(without);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid implementationGuidelines');
    });
  });

  describe('systemOverview validation', () => {
    it('rejects empty description', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      fixture.systemOverview.description = '';
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('systemOverview.description must be a non-empty string');
    });

    it('rejects missing productRelationship', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      fixture.systemOverview.productRelationship = '';
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('systemOverview.productRelationship must be a non-empty string');
    });
  });

  describe('projectTopology validation', () => {
    it('rejects empty topology', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      fixture.projectTopology = [];
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('projectTopology must be a non-empty array');
    });

    it('rejects invalid project type', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      (fixture.projectTopology[0] as Record<string, unknown>).type = 'unknown-type';
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid type'))).toBe(true);
    });

    it('supports multi-project topology', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      expect(fixture.projectTopology.length).toBe(3);
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(true);
    });
  });

  describe('openRisks validation', () => {
    it('validates all risk severity levels', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      fixture.openRisks = [
        { id: 'r1', description: 'Low risk', severity: 'low' },
        { id: 'r2', description: 'Medium risk', severity: 'medium' },
        { id: 'r3', description: 'High risk', severity: 'high' },
        { id: 'r4', description: 'Critical risk', severity: 'critical' },
      ];
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid severity', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      (fixture.openRisks[0] as Record<string, unknown>).severity = 'extreme';
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid severity'))).toBe(true);
    });

    it('allows optional mitigation field', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      expect(fixture.openRisks[0].mitigation).toBeDefined();
      expect(fixture.openRisks[1].mitigation).toBeUndefined();
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(true);
    });
  });

  describe('openQuestions validation', () => {
    it('rejects question without id', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      (fixture.openQuestions[0] as Record<string, unknown>).id = '';
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('openQuestion entry missing id');
    });

    it('allows optional context field', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      expect(fixture.openQuestions[0].context).toBeDefined();
      expect(fixture.openQuestions[1].context).toBeUndefined();
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(true);
    });
  });

  describe('phaseMapping validation', () => {
    it('rejects empty phaseMapping', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      fixture.phaseMapping = [];
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('phaseMapping must be a non-empty array');
    });

    it('rejects phaseMapping entry without phaseId', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      (fixture.phaseMapping[0] as Record<string, unknown>).phaseId = '';
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('phaseMapping entry missing phaseId');
    });
  });

  describe('qualityAttributes validation', () => {
    it('rejects missing quality attribute fields', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      (fixture.qualityAttributes as Record<string, unknown>).maintainability = '';
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('qualityAttributes.maintainability must be a non-empty string');
    });

    it('requires all 6 quality attribute fields', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      const qa = fixture.qualityAttributes;
      expect(qa.maintainability).toBeTruthy();
      expect(qa.scalability).toBeTruthy();
      expect(qa.testability).toBeTruthy();
      expect(qa.reliability).toBeTruthy();
      expect(qa.performance).toBeTruthy();
      expect(qa.developerExperience).toBeTruthy();
    });
  });

  describe('ArchitecturePlanVersion shape', () => {
    it('validates a well-formed ArchitecturePlanVersion', () => {
      const version = {
        id: 'apv-1',
        version: 1,
        artifactId: 'art-arch-1',
        createdAt: '2026-01-05T00:00:00Z',
        decision: null,
      };
      expect(typeof version.id).toBe('string');
      expect(typeof version.version).toBe('number');
      expect(version.version).toBeGreaterThanOrEqual(1);
      expect(typeof version.artifactId).toBe('string');
      expect(typeof version.createdAt).toBe('string');
      expect(version.decision).toBeNull();
    });

    it('accepts valid decision values', () => {
      const validDecisions = ['approve', 'reject', 'revise', 'approve-with-changes', 'pause', 'cancel', null];
      for (const decision of validDecisions) {
        const version = {
          id: 'apv-1',
          version: 1,
          artifactId: 'art-1',
          createdAt: '2026-01-05T00:00:00Z',
          decision,
        };
        expect([...validDecisions]).toContain(version.decision);
      }
    });

    it('tracks version increment across revisions', () => {
      const versions = [
        { id: 'apv-1', version: 1, artifactId: 'art-1', createdAt: '2026-01-05T00:00:00Z', decision: 'reject' },
        { id: 'apv-2', version: 2, artifactId: 'art-2', createdAt: '2026-01-05T01:00:00Z', decision: 'approve' },
      ];
      expect(versions[1].version).toBe(versions[0].version + 1);
      expect(versions[0].artifactId).not.toBe(versions[1].artifactId);
    });
  });

  describe('versionMetadata (optional)', () => {
    it('accepts content without versionMetadata', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      expect(fixture.versionMetadata).toBeUndefined();
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(true);
    });

    it('validates versionMetadata when present', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      fixture.versionMetadata = { version: 1, roleFlow: ['software-architect'] };
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid versionMetadata.version', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      fixture.versionMetadata = { version: 0, roleFlow: ['software-architect'] };
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('versionMetadata.version must be a positive number');
    });

    it('rejects empty roleFlow', () => {
      const fixture = buildCanonicalArchitecturePlanFixture();
      fixture.versionMetadata = { version: 1, roleFlow: [] };
      const result = validateArchitecturePlanArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('versionMetadata.roleFlow must be a non-empty array');
    });
  });
});

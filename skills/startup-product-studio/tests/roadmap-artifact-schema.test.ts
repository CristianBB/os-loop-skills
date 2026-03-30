import { describe, it, expect } from 'vitest';

// Re-declare the types locally for testing (module.ts types are not exported)
// These mirror the canonical types defined in module.ts

type RoadmapPhaseRiskLevel = 'low' | 'medium' | 'high';
type RoadmapPhaseComplexity = 'low' | 'medium' | 'high';

interface RoadmapProductSummary {
  description: string;
  targetUsers: string[];
  coreValueProposition: string;
}

interface RoadmapProductScope {
  included: string[];
  excluded: string[];
}

interface RoadmapProjectTopologyEntry {
  projectId: string;
  name: string;
  purpose: string;
  techConsiderations: string[];
}

interface RoadmapPhase {
  id: string;
  name: string;
  description: string;
  goals: string[];
  deliverables: string[];
  involvedProjects: string[];
  dependencies: string[];
  riskLevel: RoadmapPhaseRiskLevel;
  estimatedComplexity: RoadmapPhaseComplexity;
  validationCriteria: string[];
}

interface RoadmapMilestone {
  id: string;
  name: string;
  description: string;
  phaseIds: string[];
  successCriteria: string[];
}

type CeoStrategicValidationCoherence = 'aligned' | 'minor-concerns' | 'misaligned';

interface CeoStrategicValidation {
  coherenceScore: CeoStrategicValidationCoherence;
  flaggedIssues: string[];
  suggestedAdjustments: string[];
}

interface RoadmapVersionMetadata {
  generationRunId: string;
  version: number;
  roleFlow: string[];
}

interface RoadmapArtifactContent {
  productSummary: RoadmapProductSummary;
  productScope: RoadmapProductScope;
  projectTopology: RoadmapProjectTopologyEntry[];
  phases: RoadmapPhase[];
  milestones: RoadmapMilestone[];
  assumptions: string[];
  openQuestions: string[];
  strategicValidation?: CeoStrategicValidation;
  versionMetadata?: RoadmapVersionMetadata;
}

interface RoadmapEntry {
  phase: string;
  milestones: string[];
  deliverables: string[];
  estimatedDuration: string;
  dependencies: string[];
}

const VALID_PHASE_IDS = [
  'discovery', 'roadmap-definition', 'product-definition', 'ux-definition',
  'architecture-definition', 'implementation-phase', 'qa-validation', 'release-readiness',
] as const;

const VALID_RISK_LEVELS: RoadmapPhaseRiskLevel[] = ['low', 'medium', 'high'];
const VALID_COMPLEXITIES: RoadmapPhaseComplexity[] = ['low', 'medium', 'high'];

const COMPLEXITY_DURATION_MAP: Record<RoadmapPhaseComplexity, string> = {
  low: '1-2 weeks',
  medium: '2-4 weeks',
  high: '4-8 weeks',
};

function deriveRoadmapEntries(phases: RoadmapPhase[]): RoadmapEntry[] {
  return phases
    .filter((p) => (VALID_PHASE_IDS as readonly string[]).includes(p.id))
    .map((p) => ({
      phase: p.id,
      milestones: p.goals.length > 0 ? p.goals : [p.name],
      deliverables: p.deliverables,
      estimatedDuration: COMPLEXITY_DURATION_MAP[p.estimatedComplexity],
      dependencies: p.dependencies,
    }));
}

function validateRoadmapArtifact(content: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!content || typeof content !== 'object') {
    return { valid: false, errors: ['Content must be a non-null object'] };
  }

  const c = content as Record<string, unknown>;

  // productSummary
  if (!c.productSummary || typeof c.productSummary !== 'object') {
    errors.push('Missing or invalid productSummary');
  } else {
    const ps = c.productSummary as Record<string, unknown>;
    if (typeof ps.description !== 'string' || ps.description.length === 0) errors.push('productSummary.description must be a non-empty string');
    if (!Array.isArray(ps.targetUsers) || ps.targetUsers.length === 0) errors.push('productSummary.targetUsers must be a non-empty array');
    if (typeof ps.coreValueProposition !== 'string' || ps.coreValueProposition.length === 0) errors.push('productSummary.coreValueProposition must be a non-empty string');
  }

  // productScope
  if (!c.productScope || typeof c.productScope !== 'object') {
    errors.push('Missing or invalid productScope');
  } else {
    const ps = c.productScope as Record<string, unknown>;
    if (!Array.isArray(ps.included) || ps.included.length === 0) errors.push('productScope.included must be a non-empty array');
    if (!Array.isArray(ps.excluded) || ps.excluded.length === 0) errors.push('productScope.excluded must be a non-empty array');
  }

  // projectTopology
  if (!Array.isArray(c.projectTopology) || c.projectTopology.length === 0) {
    errors.push('projectTopology must be a non-empty array');
  } else {
    const topologyIds = new Set<string>();
    for (const entry of c.projectTopology as Record<string, unknown>[]) {
      if (typeof entry.projectId !== 'string') errors.push('projectTopology entry missing projectId');
      else topologyIds.add(entry.projectId);
      if (typeof entry.name !== 'string') errors.push('projectTopology entry missing name');
      if (typeof entry.purpose !== 'string') errors.push('projectTopology entry missing purpose');
      if (!Array.isArray(entry.techConsiderations)) errors.push('projectTopology entry missing techConsiderations array');
    }

    // phases
    if (!Array.isArray(c.phases) || c.phases.length === 0) {
      errors.push('phases must be a non-empty array');
    } else {
      const phaseIds = new Set<string>();
      for (const phase of c.phases as Record<string, unknown>[]) {
        if (typeof phase.id !== 'string') errors.push('Phase missing id');
        else phaseIds.add(phase.id);
        if (typeof phase.name !== 'string') errors.push('Phase missing name');
        if (typeof phase.description !== 'string') errors.push('Phase missing description');
        if (!Array.isArray(phase.goals) || phase.goals.length === 0) errors.push(`Phase ${phase.id} must have at least one goal`);
        if (!Array.isArray(phase.deliverables) || phase.deliverables.length === 0) errors.push(`Phase ${phase.id} must have at least one deliverable`);
        if (!Array.isArray(phase.involvedProjects)) errors.push(`Phase ${phase.id} missing involvedProjects`);
        else {
          for (const projId of phase.involvedProjects as string[]) {
            if (!topologyIds.has(projId)) errors.push(`Phase ${phase.id} references unknown project ${projId}`);
          }
        }
        if (!Array.isArray(phase.dependencies)) errors.push(`Phase ${phase.id} missing dependencies`);
        if (!VALID_RISK_LEVELS.includes(phase.riskLevel as RoadmapPhaseRiskLevel)) errors.push(`Phase ${phase.id} has invalid riskLevel: ${phase.riskLevel}`);
        if (!VALID_COMPLEXITIES.includes(phase.estimatedComplexity as RoadmapPhaseComplexity)) errors.push(`Phase ${phase.id} has invalid estimatedComplexity: ${phase.estimatedComplexity}`);
        if (!Array.isArray(phase.validationCriteria) || phase.validationCriteria.length === 0) errors.push(`Phase ${phase.id} must have at least one validationCriterion`);
      }

      // milestones
      if (Array.isArray(c.milestones)) {
        for (const ms of c.milestones as Record<string, unknown>[]) {
          if (typeof ms.id !== 'string') errors.push('Milestone missing id');
          if (typeof ms.name !== 'string') errors.push('Milestone missing name');
          if (typeof ms.description !== 'string') errors.push('Milestone missing description');
          if (!Array.isArray(ms.phaseIds)) errors.push('Milestone missing phaseIds');
          else {
            for (const pid of ms.phaseIds as string[]) {
              if (!phaseIds.has(pid)) errors.push(`Milestone ${ms.id} references unknown phase ${pid}`);
            }
          }
          if (!Array.isArray(ms.successCriteria) || ms.successCriteria.length === 0) errors.push(`Milestone ${ms.id} must have at least one successCriterion`);
        }
      }
    }
  }

  // assumptions and openQuestions
  if (!Array.isArray(c.assumptions)) errors.push('assumptions must be an array');
  if (!Array.isArray(c.openQuestions)) errors.push('openQuestions must be an array');

  // strategicValidation (optional)
  const VALID_COHERENCE_SCORES: CeoStrategicValidationCoherence[] = ['aligned', 'minor-concerns', 'misaligned'];
  if (c.strategicValidation !== undefined) {
    if (!c.strategicValidation || typeof c.strategicValidation !== 'object') {
      errors.push('strategicValidation must be an object when present');
    } else {
      const sv = c.strategicValidation as Record<string, unknown>;
      if (!VALID_COHERENCE_SCORES.includes(sv.coherenceScore as CeoStrategicValidationCoherence)) {
        errors.push(`strategicValidation.coherenceScore must be one of: ${VALID_COHERENCE_SCORES.join(', ')}`);
      }
      if (!Array.isArray(sv.flaggedIssues)) errors.push('strategicValidation.flaggedIssues must be an array');
      if (!Array.isArray(sv.suggestedAdjustments)) errors.push('strategicValidation.suggestedAdjustments must be an array');
    }
  }

  // versionMetadata (optional)
  if (c.versionMetadata !== undefined) {
    if (!c.versionMetadata || typeof c.versionMetadata !== 'object') {
      errors.push('versionMetadata must be an object when present');
    } else {
      const vm = c.versionMetadata as Record<string, unknown>;
      if (typeof vm.generationRunId !== 'string' || vm.generationRunId.length === 0) {
        errors.push('versionMetadata.generationRunId must be a non-empty string');
      }
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

function buildCanonicalRoadmapFixture(): RoadmapArtifactContent {
  return {
    productSummary: {
      description: 'TaskFlow is a collaborative task management platform for distributed engineering teams',
      targetUsers: ['Engineering managers', 'Software developers', 'DevOps engineers'],
      coreValueProposition: 'Reduce context-switching overhead by 40% through unified task, code review, and deployment tracking',
    },
    productScope: {
      included: [
        'Task board with kanban and sprint views',
        'GitHub/GitLab integration for PR tracking',
        'Real-time collaboration on task comments',
        'Sprint planning and retrospective tools',
        'Team velocity and burndown dashboards',
      ],
      excluded: [
        'Full CI/CD pipeline management',
        'Code hosting or version control',
        'HR or payroll features',
        'Customer-facing support ticketing',
      ],
    },
    projectTopology: [
      {
        projectId: 'web-app',
        name: 'Web Application',
        purpose: 'Primary user interface for task management, dashboards, and team collaboration',
        techConsiderations: ['React SPA with real-time WebSocket updates', 'Optimistic UI for responsive feel'],
      },
      {
        projectId: 'backend-api',
        name: 'Backend API',
        purpose: 'RESTful API handling business logic, auth, integrations, and data persistence',
        techConsiderations: ['Node.js with PostgreSQL', 'Redis for real-time pub/sub', 'OAuth2 for third-party integrations'],
      },
      {
        projectId: 'shared-types',
        name: 'Shared Types Package',
        purpose: 'TypeScript type definitions shared between web-app and backend-api',
        techConsiderations: ['Mono-repo package', 'Generated from API schema'],
      },
    ],
    phases: [
      {
        id: 'discovery',
        name: 'Discovery & Market Validation',
        description: 'Validate product-market fit through competitive analysis, user interviews, and opportunity assessment for the engineering task management space',
        goals: [
          'Identify top 5 pain points of distributed engineering teams in task management',
          'Map competitive landscape against Jira, Linear, and Asana',
          'Validate willingness-to-pay for integration-first task management',
        ],
        deliverables: [
          'Competitive analysis report with feature matrix',
          'User interview summary from 10+ engineering managers',
          'Business context document with TAM/SAM/SOM estimates',
          'Opportunity assessment with go/no-go recommendation',
        ],
        involvedProjects: [],
        dependencies: [],
        riskLevel: 'low',
        estimatedComplexity: 'medium',
        validationCriteria: [
          'At least 10 user interviews completed and synthesized',
          'Clear differentiation from top 3 competitors identified',
          'Business viability assessment scores above minimum threshold',
        ],
      },
      {
        id: 'product-definition',
        name: 'Product Vision & MVP Scope',
        description: 'Define product vision, user personas, and MVP scope based on discovery findings',
        goals: [
          'Establish clear product vision and positioning',
          'Define 3-4 primary user personas with validated pain points',
          'Scope MVP to deliver core value in under 3 months of development',
        ],
        deliverables: [
          'Product vision document with success metrics',
          'User persona profiles with jobs-to-be-done',
          'MVP feature matrix with MoSCoW prioritization',
        ],
        involvedProjects: ['web-app', 'backend-api'],
        dependencies: ['discovery'],
        riskLevel: 'medium',
        estimatedComplexity: 'medium',
        validationCriteria: [
          'MVP scope covers at least 3 of the top 5 identified pain points',
          'Each persona maps to at least 2 MVP features',
          'Estimated development effort fits within 3-month timeline',
        ],
      },
      {
        id: 'ux-definition',
        name: 'UX/UI Design',
        description: 'Design user flows, wireframes, and design system for the task management interface',
        goals: [
          'Design intuitive task board interactions with drag-and-drop',
          'Create design system tokens for consistent visual language',
          'Validate key workflows with usability testing',
        ],
        deliverables: [
          'User flow diagrams for core task lifecycle',
          'Wireframes for task board, sprint planning, and dashboard views',
          'Design system with component specifications',
          'Interactive prototype for usability validation',
        ],
        involvedProjects: ['web-app'],
        dependencies: ['product-definition'],
        riskLevel: 'medium',
        estimatedComplexity: 'medium',
        validationCriteria: [
          'Usability test with 5 users achieves 80%+ task completion rate',
          'Design system covers all MVP components',
          'Accessibility audit passes WCAG 2.1 AA requirements',
        ],
      },
      {
        id: 'architecture-definition',
        name: 'System Architecture',
        description: 'Define system architecture, API contracts, and data models for the multi-project product',
        goals: [
          'Design scalable API supporting real-time collaboration',
          'Define data model for tasks, sprints, teams, and integrations',
          'Establish deployment architecture with CI/CD pipeline specs',
        ],
        deliverables: [
          'Architecture decision records for key technology choices',
          'OpenAPI specification for backend-api',
          'Database schema with migration strategy',
          'Infrastructure plan with cost estimates',
        ],
        involvedProjects: ['backend-api', 'web-app', 'shared-types'],
        dependencies: ['ux-definition'],
        riskLevel: 'high',
        estimatedComplexity: 'high',
        validationCriteria: [
          'API design supports all MVP features without breaking changes path',
          'Data model handles multi-tenancy correctly',
          'Architecture supports 1000 concurrent users at launch',
        ],
      },
      {
        id: 'implementation-phase',
        name: 'Implementation',
        description: 'Build the MVP across all code projects following the architecture plan',
        goals: [
          'Implement core task CRUD and board views',
          'Build GitHub integration for PR tracking',
          'Implement real-time collaboration via WebSocket',
          'Deploy staging environment with full CI/CD',
        ],
        deliverables: [
          'Functional web-app with task board and sprint views',
          'Backend API with authentication, task management, and GitHub integration',
          'Shared types package published to internal registry',
          'Staging deployment with automated testing',
        ],
        involvedProjects: ['web-app', 'backend-api', 'shared-types'],
        dependencies: ['architecture-definition'],
        riskLevel: 'high',
        estimatedComplexity: 'high',
        validationCriteria: [
          'All MVP features functional in staging environment',
          'Test coverage above 80% for business logic',
          'GitHub integration creates and updates tasks from PR events',
          'Real-time updates propagate within 500ms',
        ],
      },
      {
        id: 'qa-validation',
        name: 'QA & Validation',
        description: 'Comprehensive quality assurance including functional, performance, and security testing',
        goals: [
          'Validate all MVP features against acceptance criteria',
          'Performance test under expected load conditions',
          'Security audit for authentication and data handling',
        ],
        deliverables: [
          'QA test report with pass/fail per feature',
          'Performance benchmark results against SLOs',
          'Security audit findings and remediation status',
        ],
        involvedProjects: ['web-app', 'backend-api'],
        dependencies: ['implementation-phase'],
        riskLevel: 'medium',
        estimatedComplexity: 'medium',
        validationCriteria: [
          'Zero critical or high-severity bugs remaining',
          'P95 latency under 200ms for core API endpoints',
          'No OWASP Top 10 vulnerabilities in security scan',
        ],
      },
      {
        id: 'release-readiness',
        name: 'Release Readiness',
        description: 'Final release preparation including launch checklist, monitoring, and go-to-market strategy',
        goals: [
          'Complete launch readiness checklist',
          'Set up production monitoring and alerting',
          'Prepare go-to-market materials for beta launch',
        ],
        deliverables: [
          'Release readiness report',
          'Production monitoring dashboards and alert rules',
          'Go-to-market brief with beta launch timeline',
          'Launch checklist with ownership assignments',
        ],
        involvedProjects: ['web-app', 'backend-api'],
        dependencies: ['qa-validation'],
        riskLevel: 'low',
        estimatedComplexity: 'low',
        validationCriteria: [
          'All launch checklist items marked complete',
          'Monitoring covers uptime, latency, error rate, and key business metrics',
          'Rollback procedure documented and tested',
        ],
      },
    ],
    milestones: [
      {
        id: 'market-validated',
        name: 'Market Validated',
        description: 'Product concept validated through research and user feedback',
        phaseIds: ['discovery', 'product-definition'],
        successCriteria: [
          'Go/no-go decision made with supporting data',
          'MVP scope defined and approved',
        ],
      },
      {
        id: 'design-complete',
        name: 'Design Complete',
        description: 'UX/UI design and architecture finalized and ready for implementation',
        phaseIds: ['ux-definition', 'architecture-definition'],
        successCriteria: [
          'Design system and wireframes approved',
          'API contracts and data models reviewed',
        ],
      },
      {
        id: 'mvp-functional',
        name: 'MVP Functional',
        description: 'Core product features built and deployed to staging',
        phaseIds: ['implementation-phase'],
        successCriteria: [
          'All MVP features working in staging',
          'CI/CD pipeline operational',
        ],
      },
      {
        id: 'launch-ready',
        name: 'Launch Ready',
        description: 'Product validated, monitored, and ready for beta users',
        phaseIds: ['qa-validation', 'release-readiness'],
        successCriteria: [
          'QA sign-off obtained',
          'Production monitoring active',
          'Beta launch timeline confirmed',
        ],
      },
    ],
    assumptions: [
      'Team has access to GitHub API for integration development',
      'PostgreSQL and Redis are acceptable infrastructure choices',
      'Beta launch targets a single timezone initially',
      'OAuth2 provider (Auth0 or similar) will be used rather than building custom auth',
    ],
    openQuestions: [
      'Should mobile app be part of MVP or deferred to v2?',
      'Which specific GitHub events should trigger task updates?',
      'Is SSO required for beta launch or can it be added later?',
      'What is the expected team size per organization at launch?',
    ],
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('roadmap artifact schema', () => {
  describe('canonical structure validation', () => {
    it('validates a complete canonical roadmap artifact', () => {
      const fixture = buildCanonicalRoadmapFixture();
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('requires all 7 top-level sections', () => {
      const fixture = buildCanonicalRoadmapFixture();
      const requiredKeys: (keyof RoadmapArtifactContent)[] = [
        'productSummary', 'productScope', 'projectTopology',
        'phases', 'milestones', 'assumptions', 'openQuestions',
      ];
      for (const key of requiredKeys) {
        expect(fixture).toHaveProperty(key);
      }
    });

    it('rejects null content', () => {
      const result = validateRoadmapArtifact(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content must be a non-null object');
    });

    it('rejects content missing productSummary', () => {
      const fixture = buildCanonicalRoadmapFixture();
      const { productSummary: _, ...rest } = fixture;
      const result = validateRoadmapArtifact(rest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid productSummary');
    });

    it('rejects content missing productScope', () => {
      const fixture = buildCanonicalRoadmapFixture();
      const { productScope: _, ...rest } = fixture;
      const result = validateRoadmapArtifact(rest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid productScope');
    });

    it('rejects content with empty phases', () => {
      const fixture = buildCanonicalRoadmapFixture();
      fixture.phases = [];
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('phases must be a non-empty array');
    });
  });

  describe('phase field completeness', () => {
    it('every phase has all required fields', () => {
      const fixture = buildCanonicalRoadmapFixture();
      for (const phase of fixture.phases) {
        expect(typeof phase.id).toBe('string');
        expect(typeof phase.name).toBe('string');
        expect(typeof phase.description).toBe('string');
        expect(Array.isArray(phase.goals)).toBe(true);
        expect(phase.goals.length).toBeGreaterThan(0);
        expect(Array.isArray(phase.deliverables)).toBe(true);
        expect(phase.deliverables.length).toBeGreaterThan(0);
        expect(Array.isArray(phase.involvedProjects)).toBe(true);
        expect(Array.isArray(phase.dependencies)).toBe(true);
        expect(VALID_RISK_LEVELS).toContain(phase.riskLevel);
        expect(VALID_COMPLEXITIES).toContain(phase.estimatedComplexity);
        expect(Array.isArray(phase.validationCriteria)).toBe(true);
        expect(phase.validationCriteria.length).toBeGreaterThan(0);
      }
    });

    it('rejects invalid riskLevel values', () => {
      const fixture = buildCanonicalRoadmapFixture();
      (fixture.phases[0] as Record<string, unknown>).riskLevel = 'extreme';
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid riskLevel'))).toBe(true);
    });

    it('rejects invalid estimatedComplexity values', () => {
      const fixture = buildCanonicalRoadmapFixture();
      (fixture.phases[0] as Record<string, unknown>).estimatedComplexity = 'extreme';
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid estimatedComplexity'))).toBe(true);
    });
  });

  describe('milestone phase references', () => {
    it('all milestone phaseIds reference existing phases', () => {
      const fixture = buildCanonicalRoadmapFixture();
      const phaseIds = new Set(fixture.phases.map((p) => p.id));
      for (const milestone of fixture.milestones) {
        for (const pid of milestone.phaseIds) {
          expect(phaseIds.has(pid)).toBe(true);
        }
      }
    });

    it('rejects milestones referencing non-existent phases', () => {
      const fixture = buildCanonicalRoadmapFixture();
      fixture.milestones.push({
        id: 'bad-milestone',
        name: 'Bad',
        description: 'References non-existent phase',
        phaseIds: ['non-existent-phase'],
        successCriteria: ['Never'],
      });
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('unknown phase non-existent-phase'))).toBe(true);
    });
  });

  describe('multi-project support', () => {
    it('projectTopology contains multiple projects', () => {
      const fixture = buildCanonicalRoadmapFixture();
      expect(fixture.projectTopology.length).toBeGreaterThan(1);
    });

    it('phases reference projectTopology entries via involvedProjects', () => {
      const fixture = buildCanonicalRoadmapFixture();
      const topologyIds = new Set(fixture.projectTopology.map((p) => p.projectId));
      const phasesWithProjects = fixture.phases.filter((p) => p.involvedProjects.length > 0);
      expect(phasesWithProjects.length).toBeGreaterThan(0);
      for (const phase of phasesWithProjects) {
        for (const projId of phase.involvedProjects) {
          expect(topologyIds.has(projId)).toBe(true);
        }
      }
    });

    it('rejects phases referencing unknown projects', () => {
      const fixture = buildCanonicalRoadmapFixture();
      fixture.phases[1].involvedProjects.push('unknown-project');
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('unknown project unknown-project'))).toBe(true);
    });
  });

  describe('deriveRoadmapEntries backward compatibility', () => {
    it('converts canonical phases to legacy RoadmapEntry format', () => {
      const fixture = buildCanonicalRoadmapFixture();
      const entries = deriveRoadmapEntries(fixture.phases);

      expect(entries.length).toBeGreaterThan(0);
      for (const entry of entries) {
        expect(typeof entry.phase).toBe('string');
        expect(VALID_PHASE_IDS).toContain(entry.phase);
        expect(Array.isArray(entry.milestones)).toBe(true);
        expect(entry.milestones.length).toBeGreaterThan(0);
        expect(Array.isArray(entry.deliverables)).toBe(true);
        expect(typeof entry.estimatedDuration).toBe('string');
        expect(Array.isArray(entry.dependencies)).toBe(true);
      }
    });

    it('maps phase goals to milestones', () => {
      const fixture = buildCanonicalRoadmapFixture();
      const entries = deriveRoadmapEntries(fixture.phases);

      // First phase has goals, those should become milestones
      const discoveryPhase = fixture.phases.find((p) => p.id === 'discovery')!;
      const discoveryEntry = entries.find((e) => e.phase === 'discovery')!;
      expect(discoveryEntry.milestones).toEqual(discoveryPhase.goals);
    });

    it('maps estimatedComplexity to estimatedDuration', () => {
      const fixture = buildCanonicalRoadmapFixture();
      const entries = deriveRoadmapEntries(fixture.phases);

      for (const entry of entries) {
        const phase = fixture.phases.find((p) => p.id === entry.phase)!;
        expect(entry.estimatedDuration).toBe(COMPLEXITY_DURATION_MAP[phase.estimatedComplexity]);
      }
    });

    it('filters out phases with non-PhaseId ids', () => {
      const fixture = buildCanonicalRoadmapFixture();
      fixture.phases.push({
        id: 'custom-phase',
        name: 'Custom',
        description: 'Not a standard phase',
        goals: ['Goal'],
        deliverables: ['Deliverable'],
        involvedProjects: [],
        dependencies: [],
        riskLevel: 'low',
        estimatedComplexity: 'low',
        validationCriteria: ['Criterion'],
      });
      const entries = deriveRoadmapEntries(fixture.phases);
      expect(entries.find((e) => e.phase === 'custom-phase')).toBeUndefined();
    });
  });

  describe('example fixture quality', () => {
    it('fixture validates against the schema', () => {
      const fixture = buildCanonicalRoadmapFixture();
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(true);
    });

    it('fixture has no vague single-word deliverables', () => {
      const fixture = buildCanonicalRoadmapFixture();
      for (const phase of fixture.phases) {
        for (const deliverable of phase.deliverables) {
          expect(deliverable.split(' ').length).toBeGreaterThan(2);
        }
      }
    });

    it('fixture has specific validation criteria (not just "done" or "complete")', () => {
      const fixture = buildCanonicalRoadmapFixture();
      for (const phase of fixture.phases) {
        for (const criterion of phase.validationCriteria) {
          expect(criterion.length).toBeGreaterThan(20);
        }
      }
    });
  });

  describe('strategic validation and version metadata', () => {
    it('validates artifact with strategicValidation present (minor-concerns)', () => {
      const fixture = buildCanonicalRoadmapFixture();
      (fixture as Record<string, unknown>).strategicValidation = {
        coherenceScore: 'minor-concerns',
        flaggedIssues: ['Phase ordering may not reflect market urgency'],
        suggestedAdjustments: ['Consider prioritizing competitive analysis earlier'],
      };
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates artifact with strategicValidation aligned and empty arrays', () => {
      const fixture = buildCanonicalRoadmapFixture();
      (fixture as Record<string, unknown>).strategicValidation = {
        coherenceScore: 'aligned',
        flaggedIssues: [],
        suggestedAdjustments: [],
      };
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(true);
    });

    it('validates artifact without strategicValidation (backward compatible)', () => {
      const fixture = buildCanonicalRoadmapFixture();
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid coherenceScore value', () => {
      const fixture = buildCanonicalRoadmapFixture();
      (fixture as Record<string, unknown>).strategicValidation = {
        coherenceScore: 'terrible',
        flaggedIssues: [],
        suggestedAdjustments: [],
      };
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('coherenceScore'))).toBe(true);
    });

    it('rejects strategicValidation with missing flaggedIssues', () => {
      const fixture = buildCanonicalRoadmapFixture();
      (fixture as Record<string, unknown>).strategicValidation = {
        coherenceScore: 'aligned',
        suggestedAdjustments: [],
      };
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('flaggedIssues'))).toBe(true);
    });

    it('validates artifact with versionMetadata present', () => {
      const fixture = buildCanonicalRoadmapFixture();
      (fixture as Record<string, unknown>).versionMetadata = {
        generationRunId: 'run-abc-123',
        version: 1,
        roleFlow: ['ceo', 'product-manager', 'ceo'],
      };
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates artifact without versionMetadata (backward compatible)', () => {
      const fixture = buildCanonicalRoadmapFixture();
      expect(fixture.versionMetadata).toBeUndefined();
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(true);
    });

    it('rejects versionMetadata with empty generationRunId', () => {
      const fixture = buildCanonicalRoadmapFixture();
      (fixture as Record<string, unknown>).versionMetadata = {
        generationRunId: '',
        version: 1,
        roleFlow: ['ceo', 'product-manager'],
      };
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('generationRunId'))).toBe(true);
    });

    it('rejects versionMetadata with zero version', () => {
      const fixture = buildCanonicalRoadmapFixture();
      (fixture as Record<string, unknown>).versionMetadata = {
        generationRunId: 'run-123',
        version: 0,
        roleFlow: ['ceo', 'product-manager'],
      };
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('version must be a positive'))).toBe(true);
    });

    it('rejects versionMetadata with empty roleFlow', () => {
      const fixture = buildCanonicalRoadmapFixture();
      (fixture as Record<string, unknown>).versionMetadata = {
        generationRunId: 'run-123',
        version: 1,
        roleFlow: [],
      };
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('roleFlow must be a non-empty'))).toBe(true);
    });

    it('validates artifact with both strategicValidation and versionMetadata', () => {
      const fixture = buildCanonicalRoadmapFixture();
      (fixture as Record<string, unknown>).strategicValidation = {
        coherenceScore: 'misaligned',
        flaggedIssues: ['Scope too broad for stated timeline'],
        suggestedAdjustments: ['Reduce MVP scope to 3 core features'],
      };
      (fixture as Record<string, unknown>).versionMetadata = {
        generationRunId: 'run-xyz-456',
        version: 2,
        roleFlow: ['ceo', 'product-manager', 'ceo'],
      };
      const result = validateRoadmapArtifact(fixture);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});

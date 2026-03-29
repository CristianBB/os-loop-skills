// ─────────────────────────────────────────────────────────────────────────────
// Startup Product Studio — Agentic Skill Module
// ─────────────────────────────────────────────────────────────────────────────
// End-to-end product creation skill with role-based execution, phased roadmaps,
// multi-project workspaces, user approvals, and Claude Code integration path.
// ─────────────────────────────────────────────────────────────────────────────

// ── Host Capabilities Interface ─────────────────────────────────────────────

interface BridgeCommandResult {
  accepted: true; bridgeRunId: string; requestId: string;
} | {
  accepted: false; code: string; message: string;
}

interface BridgeInstallResult {
  accepted: true; bridgeRunId: string;
} | {
  accepted: false; code: string; message: string;
}

interface BridgeJobOutcome {
  status: 'completed'; exitCode: number; stdout: string; stderr: string;
} | {
  status: 'failed'; reason: string;
} | {
  status: 'terminated';
}

interface SkillHostBridge {
  isAvailable(): boolean;
  executeCommand(opts: {
    command: string;
    args: string[];
    workingDirectory: string | null;
    env?: Record<string, string>;
    reason: string;
    timeoutMs?: number;
  }): Promise<BridgeCommandResult>;
  installTool(opts: {
    toolId: string;
    reason: string;
  }): Promise<BridgeInstallResult>;
  locateTools(toolNames: string[]): Promise<{
    tools: Array<{ id: string; status: string; version: string | null; path: string | null }>;
  }>;
  waitForJob(bridgeRunId: string): Promise<BridgeJobOutcome>;
}

interface SkillHostCapabilities {
  llm: {
    complete(req: {
      purposeId: string;
      systemPrompt: string;
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      temperature?: number;
      maxTokens?: number;
    }): Promise<{ text: string; tokensUsed: { prompt: number; completion: number } }>;
  };
  events: { emitProgress(progress: number, message: string): void };
  log: {
    debug(msg: string, data?: Record<string, unknown>): void;
    info(msg: string, data?: Record<string, unknown>): void;
    warn(msg: string, data?: Record<string, unknown>): void;
    error(msg: string, data?: Record<string, unknown>): void;
  };
  run: {
    reportStep(label: string, role?: string): void;
    getStepCount(): number;
    getStepBudget(): number | null;
    requestInput(opts: {
      title: string;
      message: string;
      inputSchema: Record<string, unknown>;
    }): Promise<unknown>;
    checkpoint(): Promise<void>;
  };
  workspace: {
    getState(): Promise<StudioState | null>;
    setState(state: StudioState): Promise<void>;
    createArtifact(artifact: {
      type: string;
      title: string;
      content: Record<string, unknown>;
      createdByRole?: string;
      parentArtifactId?: string;
    }): Promise<{ id: string }>;
    updateArtifact(
      artifactId: string,
      update: { title?: string; status?: string; content?: Record<string, unknown> },
    ): Promise<void>;
    listArtifacts(): Promise<Array<{ id: string; type: string; title: string; status: string; version: number }>>;
    setPhase(phase: string): Promise<void>;
    setRole(role: string): Promise<void>;
  };
  bridge?: SkillHostBridge;
  [key: string]: unknown;
}

// ── Domain Types ────────────────────────────────────────────────────────────

type PhaseId = 'discovery' | 'roadmap-definition' | 'product-definition' | 'ux-definition' | 'architecture-definition' | 'implementation-phase' | 'qa-validation' | 'release-readiness';
type RoleId = 'ceo' | 'product-manager' | 'ux-ui' | 'software-architect' | 'developer' | 'qa';

type CodeProjectBootstrapStatus = 'pending' | 'git_initialized' | 'claude_configured' | 'ready';

interface CodeProject {
  id: string;
  name: string;
  type: 'web' | 'mobile' | 'backend' | 'worker' | 'infra' | 'shared' | 'docs';
  techStack: string;
  repoPath: string | null;
  bootstrapStatus: CodeProjectBootstrapStatus | null;
  bootstrapBridgeJobId: string | null;
}

interface RoadmapEntry {
  phase: PhaseId;
  milestones: string[];
  deliverables: string[];
  estimatedDuration: string;
  dependencies: string[];
}

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

type RoadmapPhaseRiskLevel = 'low' | 'medium' | 'high';
type RoadmapPhaseComplexity = 'low' | 'medium' | 'high';

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

interface RoadmapArtifactContent {
  productSummary: RoadmapProductSummary;
  productScope: RoadmapProductScope;
  projectTopology: RoadmapProjectTopologyEntry[];
  phases: RoadmapPhase[];
  milestones: RoadmapMilestone[];
  assumptions: string[];
  openQuestions: string[];
}

interface BusinessContext {
  industry: string;
  marketSegment: string;
  revenueModel: string;
  competitiveAdvantage: string;
}

interface UserPersona {
  persona: string;
  description: string;
  painPoints: string[];
}

interface Constraints {
  timeline: string | null;
  budget: string | null;
  technical: string[];
  regulatory: string[];
}

interface ImplementationExecutionPhase {
  id: string;
  label: string;
  goals: string[];
  targetCodeProjectIds: string[];
  status: 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed';
  bridgeJobIds: string[];
}

interface ImplementationStatus {
  currentIteration: number;
  totalIterationsPlanned: number;
  completedTasks: number;
  totalTasks: number;
  blockers: string[];
  executionPhases: ImplementationExecutionPhase[];
  activeExecutionPhaseIndex: number | null;
  roadmapPhaseRecords: ImplementationPhaseRecord[];
  activeRoadmapPhaseIndex: number | null;
}

interface ValidationEntry {
  phase: PhaseId;
  decision: 'approve' | 'reject' | 'revise' | 'pause' | 'cancel';
  feedback: string | null;
  timestamp: string;
}

interface RoadmapVersion {
  id: string;
  version: number;
  entries: RoadmapEntry[];
  createdAt: string;
  decision: ValidationEntry['decision'] | null;
}

type RoadmapPhaseStatus =
  | 'not_started'
  | 'planning'
  | 'plan_approved'
  | 'implementing'
  | 'qa_validating'
  | 'pm_reviewing'
  | 'user_reviewing'
  | 'completed'
  | 'failed';

interface ImplementationPhaseRecord {
  id: string;
  roadmapEntryPhase: PhaseId;
  label: string;
  status: RoadmapPhaseStatus;
  planArtifactId: string | null;
  implementationReportArtifactId: string | null;
  qaReportArtifactId: string | null;
  pmAlignmentDecision: ValidationEntry['decision'] | null;
  userDecision: ValidationEntry['decision'] | null;
  bridgeJobIds: string[];
}

type UserRedirectionAction =
  | 'redefine-roadmap'
  | 'redefine-phase'
  | 'reorder-phases'
  | 'reduce-scope'
  | 'expand-scope'
  | 'pivot'
  | 'change-priorities'
  | 'pause'
  | 'continue'
  | 'stop';

interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  currentPhase: PhaseId;
  completedPhases: PhaseId[];
  roadmap: RoadmapEntry[] | null;
  codeProjects: CodeProject[];
  artifactIds: string[];
  businessContext: BusinessContext | null;
  targetUsers: UserPersona[];
  constraints: Constraints;
  implementationStatus: ImplementationStatus | null;
  validationHistory: ValidationEntry[];
  roadmapVersions: RoadmapVersion[];
  createdAt: string;
  updatedAt: string;
}

interface StudioState {
  studioName: string;
  projects: ProjectRecord[];
  activeProjectId: string | null;
  createdAt: string;
}

// ── Phase Configuration ─────────────────────────────────────────────────────

interface PhaseStep {
  id: string;
  role: RoleId;
  purposeId: string;
  artifactType: string;
  description: string;
}

interface PhaseConfig {
  primaryRole: RoleId;
  steps: PhaseStep[];
  nextPhase: PhaseId | null;
}

const PHASE_ORDER: PhaseId[] = ['discovery', 'roadmap-definition', 'product-definition', 'ux-definition', 'architecture-definition', 'implementation-phase', 'qa-validation', 'release-readiness'];

const PHASE_CONFIGS: Record<PhaseId, PhaseConfig> = {
  discovery: {
    primaryRole: 'ceo',
    steps: [
      { id: 'market-analysis', role: 'ceo', purposeId: 'discovery-analysis', artifactType: 'market-analysis', description: 'Analyze target market size, trends, and opportunity' },
      { id: 'user-needs', role: 'ceo', purposeId: 'discovery-analysis', artifactType: 'user-needs-analysis', description: 'Identify target users, pain points, and needs' },
      { id: 'competitive-landscape', role: 'ceo', purposeId: 'discovery-analysis', artifactType: 'competitive-analysis', description: 'Map competitive landscape and differentiation opportunities' },
      { id: 'opportunity-assessment', role: 'ceo', purposeId: 'discovery-analysis', artifactType: 'opportunity-assessment', description: 'Assess business viability and strategic fit' },
      { id: 'business-context', role: 'ceo', purposeId: 'discovery-analysis', artifactType: 'business-context', description: 'Define business context: industry, market segment, revenue model, and competitive advantage' },
    ],
    nextPhase: 'roadmap-definition',
  },
  'roadmap-definition': {
    primaryRole: 'product-manager',
    steps: [
      { id: 'feature-prioritization', role: 'product-manager', purposeId: 'roadmap-generation', artifactType: 'feature-prioritization', description: 'Prioritize features using MoSCoW or weighted scoring' },
      { id: 'roadmap-generation', role: 'product-manager', purposeId: 'roadmap-generation', artifactType: 'roadmap', description: 'Generate phased product roadmap with milestones' },
      { id: 'milestone-definition', role: 'product-manager', purposeId: 'roadmap-generation', artifactType: 'milestone-definitions', description: 'Define concrete milestones and success criteria per phase' },
      { id: 'resource-planning', role: 'product-manager', purposeId: 'roadmap-generation', artifactType: 'resource-plan', description: 'Plan resource allocation across code projects' },
    ],
    nextPhase: 'product-definition',
  },
  'product-definition': {
    primaryRole: 'product-manager',
    steps: [
      { id: 'product-vision', role: 'product-manager', purposeId: 'product-definition', artifactType: 'product-vision', description: 'Define product vision, value proposition, and target market positioning' },
      { id: 'mvp-definition', role: 'product-manager', purposeId: 'product-definition', artifactType: 'mvp-definition', description: 'Define MVP scope, core features, and success criteria' },
      { id: 'user-personas', role: 'product-manager', purposeId: 'product-definition', artifactType: 'user-personas', description: 'Define detailed user personas with goals, behaviors, and pain points' },
    ],
    nextPhase: 'ux-definition',
  },
  'ux-definition': {
    primaryRole: 'ux-ui',
    steps: [
      { id: 'user-flow-design', role: 'ux-ui', purposeId: 'design-spec', artifactType: 'user-flows', description: 'Design primary user journeys and interaction flows' },
      { id: 'wireframe-spec', role: 'ux-ui', purposeId: 'design-spec', artifactType: 'wireframe-spec', description: 'Specify wireframes for key screens and components' },
      { id: 'design-system', role: 'ux-ui', purposeId: 'design-spec', artifactType: 'design-system', description: 'Define design tokens, typography, color palette, and component library' },
      { id: 'prototype-brief', role: 'ux-ui', purposeId: 'design-spec', artifactType: 'prototype-brief', description: 'Create prototype brief with interaction specifications' },
      { id: 'ux-ui-spec', role: 'ux-ui', purposeId: 'design-spec', artifactType: 'ux-ui-spec', description: 'Consolidate UX/UI specification with design decisions and component inventory' },
    ],
    nextPhase: 'architecture-definition',
  },
  'architecture-definition': {
    primaryRole: 'software-architect',
    steps: [
      { id: 'architecture-plan', role: 'software-architect', purposeId: 'architecture-design', artifactType: 'architecture-plan', description: 'Design high-level system architecture and component boundaries' },
      { id: 'api-contracts', role: 'software-architect', purposeId: 'architecture-design', artifactType: 'api-contracts', description: 'Define API contracts, endpoints, and data transfer objects' },
      { id: 'data-model', role: 'software-architect', purposeId: 'architecture-design', artifactType: 'data-model', description: 'Design data models, schemas, and storage strategy' },
      { id: 'infrastructure-plan', role: 'software-architect', purposeId: 'architecture-design', artifactType: 'infrastructure-plan', description: 'Plan infrastructure topology, deployment strategy, and environments' },
      { id: 'tech-stack-decision', role: 'software-architect', purposeId: 'architecture-design', artifactType: 'tech-stack-decision', description: 'Document technology stack decisions with rationale' },
    ],
    nextPhase: 'implementation-phase',
  },
  'implementation-phase': {
    primaryRole: 'developer',
    steps: [
      { id: 'task-breakdown', role: 'developer', purposeId: 'development-plan', artifactType: 'task-breakdown', description: 'Break down implementation into concrete tasks per code project' },
      { id: 'implementation-phase-plan', role: 'developer', purposeId: 'development-plan', artifactType: 'implementation-phase-plan', description: 'Create implementation plan with task ordering and dependencies' },
      { id: 'codebase-structure', role: 'developer', purposeId: 'development-plan', artifactType: 'codebase-structure', description: 'Define codebase structure, module boundaries, and conventions' },
      { id: 'integration-points', role: 'developer', purposeId: 'development-plan', artifactType: 'integration-points', description: 'Map integration points between code projects and external services' },
      { id: 'implementation-report', role: 'developer', purposeId: 'development-plan', artifactType: 'implementation-report', description: 'Generate implementation progress report with completed tasks and remaining work' },
    ],
    nextPhase: 'qa-validation',
  },
  'qa-validation': {
    primaryRole: 'qa',
    steps: [
      { id: 'test-strategy', role: 'qa', purposeId: 'qa-strategy', artifactType: 'test-strategy', description: 'Define overall test strategy (unit, integration, e2e, performance)' },
      { id: 'acceptance-criteria', role: 'qa', purposeId: 'qa-strategy', artifactType: 'acceptance-criteria', description: 'Derive acceptance criteria from product requirements' },
      { id: 'quality-gates', role: 'qa', purposeId: 'qa-strategy', artifactType: 'quality-gates', description: 'Define quality gates per phase and release criteria' },
      { id: 'test-plan', role: 'qa', purposeId: 'qa-strategy', artifactType: 'test-plan', description: 'Create detailed test plan with coverage targets per code project' },
      { id: 'qa-report', role: 'qa', purposeId: 'qa-strategy', artifactType: 'qa-report', description: 'Generate QA validation report with test results and quality assessment' },
    ],
    nextPhase: 'release-readiness',
  },
  'release-readiness': {
    primaryRole: 'product-manager',
    steps: [
      { id: 'release-readiness-report', role: 'product-manager', purposeId: 'status-report', artifactType: 'release-readiness-report', description: 'Assess release readiness across all code projects and quality gates' },
      { id: 'launch-checklist', role: 'product-manager', purposeId: 'roadmap-generation', artifactType: 'launch-checklist', description: 'Create comprehensive launch checklist across all code projects' },
      { id: 'go-to-market-brief', role: 'ceo', purposeId: 'discovery-analysis', artifactType: 'go-to-market-brief', description: 'Define go-to-market strategy and launch positioning' },
      { id: 'monitoring-plan', role: 'software-architect', purposeId: 'architecture-design', artifactType: 'monitoring-plan', description: 'Plan observability, alerting, and post-launch monitoring' },
    ],
    nextPhase: null,
  },
};

// ── Role System Prompts ─────────────────────────────────────────────────────

const ROLE_PROMPTS: Record<RoleId, string> = {
  ceo: `You are the CEO of a startup product studio. Your focus is on strategic vision, market opportunity, and business viability.

When analyzing a product opportunity:
- Assess the total addressable market (TAM), serviceable addressable market (SAM), and serviceable obtainable market (SOM) with concrete reasoning.
- Identify the primary target audience segments with demographic and psychographic characteristics.
- Map the competitive landscape: direct competitors, indirect competitors, and potential market entrants. For each, note their strengths, weaknesses, and positioning.
- Evaluate the product-market fit hypothesis: what unique value does this product deliver that existing solutions do not?
- Assess revenue model viability: pricing strategy, unit economics assumptions, and path to sustainability.
- Identify the top 3-5 strategic risks and mitigation strategies.
- Prioritize ruthlessly: what is the minimum viable scope that validates the core hypothesis?

Output structured, actionable analysis. Avoid generic advice. Ground every recommendation in the specific product context provided. Use concrete examples and data-driven reasoning where possible. When making assumptions, state them explicitly.`,

  'product-manager': `You are the Product Manager of a startup product studio. Your focus is on translating product vision into actionable plans with clear priorities and milestones.

When creating product plans:
- Start from user problems, not solutions. Frame every feature as a response to a validated user need.
- Prioritize features using a structured framework (MoSCoW, RICE, or weighted scoring). Show the scoring rationale for each feature.
- Define clear milestones with measurable success criteria. Each milestone must have: scope, acceptance criteria, dependencies, and estimated effort.
- Map dependencies between features, code projects, and external integrations. Flag critical-path items.
- Plan for multi-project coordination: if the product spans web, mobile, backend, etc., define the integration timeline and shared milestones.
- Create phased delivery plans that enable incremental validation. Each phase should deliver user-facing value.
- Define clear go/no-go decision points between phases with the metrics that inform the decision.
- Account for technical debt budget: allocate explicit capacity for infrastructure, testing, and refactoring.

Output well-structured plans with tables, timelines, and clear ownership assignments. Be specific about what is in scope and what is explicitly deferred.`,

  'ux-ui': `You are the UX/UI Designer of a startup product studio. Your focus is on user experience, interaction design, and visual design systems.

When creating design specifications:
- Start with user journey maps: identify the primary user flows, entry points, decision points, and exit points.
- Define information architecture: content hierarchy, navigation structure, and page/screen inventory.
- Specify wireframes using structured text descriptions: for each screen, describe the layout grid, component placement, content zones, and interactive elements. Use a consistent notation.
- Define the design system foundation: color palette (with accessibility contrast ratios), typography scale, spacing scale, border radius tokens, shadow tokens, and breakpoint definitions.
- Specify component library: for each component, define variants, states (default, hover, active, disabled, error, loading), and responsive behavior.
- Address accessibility requirements: WCAG 2.1 AA compliance, keyboard navigation, screen reader support, and color-blind safe palettes.
- Define interaction patterns: transitions, animations, loading states, empty states, error states, and feedback mechanisms.
- For multi-platform products, specify platform-specific adaptations while maintaining design consistency.

Output detailed, implementable specifications. Avoid vague descriptions. Every design decision should be concrete enough for a developer to implement without ambiguity.`,

  'software-architect': `You are the Software Architect of a startup product studio. Your focus is on system design, technical decisions, and scalable architecture.

When designing system architecture:
- Define the high-level system topology: components, services, data stores, and communication patterns. Use clear component diagrams described in structured text.
- For each code project in the product, specify: runtime environment, framework, language, build tooling, and deployment target.
- Design API contracts with precise endpoint definitions: HTTP method, path, request/response schemas (JSON Schema), authentication requirements, rate limiting, and error response format.
- Define the data model with entity-relationship descriptions: entities, attributes, relationships, indexes, and constraints. Specify the storage technology rationale for each data store.
- Plan infrastructure topology: compute resources, networking (VPC, load balancers, CDN), storage, caching layers, message queues, and observability stack.
- Document technology stack decisions with explicit rationale: why this technology over alternatives, what trade-offs were accepted, and what the migration path looks like if the choice proves wrong.
- Define cross-cutting concerns: authentication/authorization model, logging strategy, error handling conventions, configuration management, and secret management.
- Address scalability considerations: identify potential bottlenecks, define scaling strategy (horizontal vs vertical), and specify performance targets.

Output architecture decision records (ADRs) with context, decision, rationale, and consequences. Be concrete about interfaces and contracts.`,

  developer: `You are the Lead Developer of a startup product studio. Your focus is on implementation planning, code organization, and development workflow.

When planning implementation:
- Break down each code project into implementable modules with clear boundaries. For each module, define: responsibility, public interface, dependencies, and estimated complexity.
- Create a task breakdown with concrete items. Each task should be completable in 1-3 days and have: description, acceptance criteria, dependencies, and the code project it belongs to.
- Define the implementation order: identify the critical path and parallelize where possible across code projects.
- Specify the codebase structure for each code project: directory layout, naming conventions, module organization pattern (feature-based, layer-based, or hybrid).
- Map integration points between code projects: shared types/contracts, API boundaries, event contracts, and data synchronization points.
- Define the development workflow: branching strategy, PR conventions, CI pipeline stages, and deployment process.
- Specify code quality standards: linting rules, formatting conventions, test coverage targets, and documentation requirements.
- For each code project, identify the initial scaffolding tasks: project initialization, dependency installation, CI configuration, and base architecture setup.

Output task lists organized by code project with clear dependencies and ordering. Every task must be actionable and unambiguous.`,

  qa: `You are the QA Lead of a startup product studio. Your focus is on quality assurance strategy, test planning, and release criteria.

When creating QA strategies:
- Define the test pyramid for each code project: unit test targets (coverage percentage), integration test scope, and end-to-end test scenarios.
- Derive acceptance criteria from product requirements: for each feature, define testable conditions with expected inputs and outputs.
- Specify test environments: what environments are needed (dev, staging, production), what data fixtures are required, and how environments are provisioned.
- Define quality gates per development phase:
  - Pre-merge: lint, type-check, unit tests, integration tests
  - Pre-deploy: e2e tests, performance benchmarks, security scans
  - Post-deploy: smoke tests, synthetic monitoring, error rate thresholds
- Create a test plan per code project: test categories, tools, frameworks, and coverage targets. Specify the testing framework and assertion library for each project.
- Address cross-project testing: integration test scenarios that span multiple code projects, contract testing between services, and data consistency validation.
- Define regression test strategy: which tests run on every PR, which run nightly, and which run before releases.
- Specify release criteria: the concrete checklist of conditions that must be met before a release is approved.
- Plan for non-functional testing: performance (load, stress, soak), security (OWASP top 10, dependency scanning), and accessibility (automated + manual).

Output structured test plans with specific test case categories, tools, and measurable targets. Avoid generic quality platitudes.`,
};

// ── Utility Functions ───────────────────────────────────────────────────────

function hasBudgetFor(host: SkillHostCapabilities, needed: number): boolean {
  const budget = host.run.getStepBudget();
  if (budget === null) return true;
  return host.run.getStepCount() + needed <= budget;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getActiveProject(state: StudioState): ProjectRecord {
  const project = state.projects.find((p) => p.id === state.activeProjectId);
  if (!project) {
    throw new Error(`No active project found. Use create-project first.`);
  }
  return project;
}

function buildProjectContext(project: ProjectRecord): string {
  const codeProjectsDesc = project.codeProjects.length > 0
    ? project.codeProjects.map((cp) => `  - ${cp.name} (${cp.type}): ${cp.techStack || 'tech stack TBD'}`).join('\n')
    : '  (no code projects defined yet)';

  let context = `Product: ${project.name}
Description: ${project.description}
Current Phase: ${project.currentPhase}
Completed Phases: ${project.completedPhases.join(', ') || 'none'}
Code Projects:
${codeProjectsDesc}`;

  if (project.businessContext) {
    context += `\n\nBusiness Context:
  Industry: ${project.businessContext.industry}
  Market Segment: ${project.businessContext.marketSegment}
  Revenue Model: ${project.businessContext.revenueModel}
  Competitive Advantage: ${project.businessContext.competitiveAdvantage}`;
  }

  if (project.targetUsers.length > 0) {
    context += `\n\nTarget Users:`;
    for (const user of project.targetUsers) {
      context += `\n  - ${user.persona}: ${user.description}`;
      if (user.painPoints.length > 0) {
        context += `\n    Pain points: ${user.painPoints.join('; ')}`;
      }
    }
  }

  if (project.constraints.timeline || project.constraints.budget || project.constraints.technical.length > 0 || project.constraints.regulatory.length > 0) {
    context += `\n\nConstraints:`;
    if (project.constraints.timeline) context += `\n  Timeline: ${project.constraints.timeline}`;
    if (project.constraints.budget) context += `\n  Budget: ${project.constraints.budget}`;
    if (project.constraints.technical.length > 0) context += `\n  Technical: ${project.constraints.technical.join(', ')}`;
    if (project.constraints.regulatory.length > 0) context += `\n  Regulatory: ${project.constraints.regulatory.join(', ')}`;
  }

  return context;
}

const COMPLEXITY_DURATION_MAP: Record<RoadmapPhaseComplexity, string> = {
  low: '1-2 weeks',
  medium: '2-4 weeks',
  high: '4-8 weeks',
};

function deriveRoadmapEntries(phases: RoadmapPhase[]): RoadmapEntry[] {
  return phases
    .filter((p) => PHASE_ORDER.includes(p.id as PhaseId))
    .map((p) => ({
      phase: p.id as PhaseId,
      milestones: p.goals.length > 0 ? p.goals : [p.name],
      deliverables: p.deliverables,
      estimatedDuration: COMPLEXITY_DURATION_MAP[p.estimatedComplexity],
      dependencies: p.dependencies,
    }));
}

function findArtifactByTypeForStep(
  artifacts: Array<{ id: string; type: string; title: string; status: string }>,
  artifactType: string,
): { id: string; type: string; title: string; status: string } | undefined {
  return artifacts.find((a) => a.type === artifactType);
}

// ── Action Handlers ─────────────────────────────────────────────────────────

async function handleInitStudio(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const studioName = args.studioName as string;
  if (!studioName) {
    return { success: false, message: 'studioName is required for init-studio' };
  }

  const state: StudioState = {
    studioName,
    projects: [],
    activeProjectId: null,
    createdAt: new Date().toISOString(),
  };

  await host.workspace.setState(state);
  await host.workspace.setPhase('initialized');

  host.run.reportStep('init-studio', 'ceo');

  const artifact = await host.workspace.createArtifact({
    type: 'studio-config',
    title: `Studio: ${studioName}`,
    content: {
      studioName,
      createdAt: state.createdAt,
      projectCount: 0,
    },
    createdByRole: 'ceo',
  });

  host.log.info('Studio initialized', { studioName, artifactId: artifact.id });
  host.events.emitProgress(1.0, `Studio "${studioName}" initialized`);
  await host.run.checkpoint();

  return {
    success: true,
    message: `Studio "${studioName}" initialized successfully`,
    studioState: state,
    artifactIds: [artifact.id],
    stepsUsed: host.run.getStepCount(),
    phasesCompleted: [],
  };
}

async function handleCreateProject(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
  state: StudioState,
): Promise<Record<string, unknown>> {
  const projectName = args.projectName as string;
  const projectDescription = args.projectDescription as string;
  if (!projectName || !projectDescription) {
    return { success: false, message: 'projectName and projectDescription are required for create-project' };
  }

  const rawCodeProjects = (args.codeProjects as Array<{ name: string; type: string; techStack?: string }>) ?? [];

  const codeProjects: CodeProject[] = rawCodeProjects.map((cp) => ({
    id: generateId(),
    name: cp.name,
    type: cp.type as CodeProject['type'],
    techStack: cp.techStack ?? '',
    repoPath: null,
    bootstrapStatus: null,
    bootstrapBridgeJobId: null,
  }));

  const project: ProjectRecord = {
    id: generateId(),
    name: projectName,
    description: projectDescription,
    currentPhase: 'discovery',
    completedPhases: [],
    roadmap: null,
    codeProjects,
    artifactIds: [],
    businessContext: null,
    targetUsers: [],
    constraints: { timeline: null, budget: null, technical: [], regulatory: [] },
    implementationStatus: null,
    validationHistory: [],
    roadmapVersions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.projects.push(project);
  state.activeProjectId = project.id;
  await host.workspace.setState(state);
  await host.workspace.setPhase('discovery');

  host.run.reportStep('create-project', 'product-manager');

  const artifact = await host.workspace.createArtifact({
    type: 'project-brief',
    title: `Project Brief: ${projectName}`,
    content: {
      projectId: project.id,
      name: projectName,
      description: projectDescription,
      codeProjects: codeProjects.map((cp) => ({ name: cp.name, type: cp.type, techStack: cp.techStack })),
      createdAt: project.createdAt,
    },
    createdByRole: 'product-manager',
  });

  project.artifactIds.push(artifact.id);
  await host.workspace.setState(state);
  await host.run.checkpoint();

  host.log.info('Project created', { projectId: project.id, projectName, codeProjectCount: codeProjects.length });
  host.events.emitProgress(1.0, `Project "${projectName}" created`);

  return {
    success: true,
    message: `Project "${projectName}" created with ${codeProjects.length} code project(s). Current phase: discovery.`,
    studioState: state,
    artifactIds: [artifact.id],
    stepsUsed: host.run.getStepCount(),
    phasesCompleted: [],
  };
}

async function handleGenerateRoadmap(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
  state: StudioState,
): Promise<Record<string, unknown>> {
  const project = getActiveProject(state);

  await host.workspace.setRole('ceo');
  host.run.reportStep('generate-roadmap', 'ceo');
  host.events.emitProgress(0.1, 'Generating product roadmap');

  const projectContext = buildProjectContext(project);

  const result = await host.llm.complete({
    purposeId: 'roadmap-generation',
    systemPrompt: `${ROLE_PROMPTS['ceo']}

You are generating a canonical product roadmap. Output ONLY valid JSON matching this exact schema (no markdown fences, no explanation):

{
  "productSummary": {
    "description": "string - concise product description",
    "targetUsers": ["string - specific user segments"],
    "coreValueProposition": "string - primary value delivered"
  },
  "productScope": {
    "included": ["string - features/capabilities in scope"],
    "excluded": ["string - explicitly out of scope items"]
  },
  "projectTopology": [
    {
      "projectId": "string - kebab-case identifier matching code project names",
      "name": "string - display name",
      "purpose": "string - what this project does",
      "techConsiderations": ["string - high-level tech notes"]
    }
  ],
  "phases": [
    {
      "id": "string - must be one of: discovery, roadmap-definition, product-definition, ux-definition, architecture-definition, implementation-phase, qa-validation, release-readiness",
      "name": "string - human-readable phase name",
      "description": "string - what happens in this phase and why",
      "goals": ["string - specific measurable goals"],
      "deliverables": ["string - concrete outputs"],
      "involvedProjects": ["string - projectId references from projectTopology"],
      "dependencies": ["string - phase id references this phase depends on"],
      "riskLevel": "low | medium | high",
      "estimatedComplexity": "low | medium | high",
      "validationCriteria": ["string - what must be true for phase to be considered successful"]
    }
  ],
  "milestones": [
    {
      "id": "string - kebab-case identifier",
      "name": "string - milestone name",
      "description": "string - what this milestone represents",
      "phaseIds": ["string - phase ids this milestone spans"],
      "successCriteria": ["string - measurable success conditions"]
    }
  ],
  "assumptions": ["string - explicit assumptions made"],
  "openQuestions": ["string - things needing clarification from the user"]
}

Quality requirements:
- Avoid vague descriptions. Every goal, deliverable, and validation criterion must be specific.
- Include only phases relevant to this product that are not yet completed.
- Phase ids must be from the allowed set listed above.
- involvedProjects must reference projectTopology projectIds.
- Include genuine risk assessment per phase.
- Include real validation criteria that would let someone verify phase success.
- milestones should represent meaningful checkpoints, not just phase boundaries.
- assumptions should capture decisions you made without user confirmation.
- openQuestions should flag genuine unknowns that could affect the roadmap.`,
    messages: [{
      role: 'user',
      content: `Generate a canonical product roadmap for this product:\n\n${projectContext}`,
    }],
    temperature: 0.2,
    maxTokens: 8000,
  });

  let canonical: RoadmapArtifactContent;
  try {
    canonical = JSON.parse(result.text.trim());
  } catch {
    throw new Error('Roadmap generation failed: LLM returned invalid JSON. Checkpoint and retry the run.');
  }

  const roadmap = deriveRoadmapEntries(canonical.phases);

  project.roadmap = roadmap;
  const roadmapVersion: RoadmapVersion = {
    id: generateId(),
    version: (project.roadmapVersions?.length ?? 0) + 1,
    entries: roadmap,
    createdAt: new Date().toISOString(),
    decision: null,
  };
  if (!project.roadmapVersions) project.roadmapVersions = [];
  project.roadmapVersions.push(roadmapVersion);
  project.updatedAt = new Date().toISOString();
  await host.workspace.setState(state);

  const artifact = await host.workspace.createArtifact({
    type: 'roadmap',
    title: `Roadmap: ${project.name}`,
    content: {
      projectId: project.id,
      projectName: project.name,
      ...canonical,
      generatedAt: new Date().toISOString(),
    },
    createdByRole: 'ceo',
  });

  project.artifactIds.push(artifact.id);
  await host.workspace.setState(state);

  host.events.emitProgress(0.8, 'Roadmap generated, requesting approval');

  host.run.reportStep('roadmap-approval', 'ceo');
  const gateResponse = (await host.run.requestInput({
    title: 'Review Product Roadmap',
    message: `A phased roadmap has been generated for "${project.name}" with ${roadmap.length} phases. Please review the roadmap artifact and decide how to proceed.`,
    inputSchema: {
      type: 'object',
      properties: {
        decision: {
          type: 'string',
          enum: ['approve', 'reject', 'revise', 'pause', 'cancel'],
          description: 'Decision for this gate',
        },
        feedback: { type: 'string', description: 'Feedback or revision requests' },
      },
      required: ['decision'],
    },
  })) as { decision: string; feedback?: string };

  const decision = gateResponse.decision ?? 'approve';

  // Record in validation history
  project.validationHistory.push({
    phase: project.currentPhase,
    decision: decision as ValidationEntry['decision'],
    feedback: gateResponse.feedback ?? null,
    timestamp: new Date().toISOString(),
  });

  if (decision === 'pause') {
    await host.workspace.setState(state);
    await host.run.checkpoint();
    return {
      success: true,
      message: `Roadmap review paused for "${project.name}". Resume when ready.`,
      studioState: state,
      artifactIds: [artifact.id],
      stepsUsed: host.run.getStepCount(),
      phasesCompleted: [],
    };
  }

  if (decision === 'cancel') {
    await host.workspace.setState(state);
    await host.run.checkpoint();
    return {
      success: true,
      message: `Roadmap generation cancelled for "${project.name}".`,
      studioState: state,
      artifactIds: [artifact.id],
      stepsUsed: host.run.getStepCount(),
      phasesCompleted: [],
    };
  }

  if (decision === 'approve') {
    await host.workspace.updateArtifact(artifact.id, { status: 'approved' });
    host.log.info('Roadmap approved', { artifactId: artifact.id });
  } else {
    await host.workspace.updateArtifact(artifact.id, {
      status: 'rejected',
      content: {
        projectId: project.id,
        projectName: project.name,
        ...canonical,
        generatedAt: new Date().toISOString(),
        userFeedback: gateResponse.feedback ?? '',
      },
    });
    host.log.info('Roadmap rejected with feedback', { feedback: gateResponse.feedback });
  }

  roadmapVersion.decision = decision as RoadmapVersion['decision'];

  await host.workspace.setState(state);
  await host.run.checkpoint();
  host.events.emitProgress(1.0, 'Roadmap review complete');

  return {
    success: true,
    message: decision === 'approve'
      ? `Roadmap for "${project.name}" approved with ${roadmap.length} phases`
      : `Roadmap for "${project.name}" ${decision}ed. Feedback: ${gateResponse.feedback ?? 'none'}`,
    studioState: state,
    artifactIds: [artifact.id],
    stepsUsed: host.run.getStepCount(),
    phasesCompleted: [],
  };
}

// ── Bridge-Backed Implementation Helpers ──────────────────────────────────

function isBridgeAvailable(host: SkillHostCapabilities): boolean {
  return host.bridge?.isAvailable() === true;
}

const GITIGNORE_TEMPLATES: Record<string, string[]> = {
  web: ['node_modules/', '.next/', '.env*.local', 'dist/', '.turbo/', 'coverage/'],
  mobile: ['node_modules/', '.expo/', 'android/app/build/', 'ios/Pods/', '.env*.local', 'coverage/'],
  backend: ['node_modules/', 'dist/', '.env*.local', 'coverage/', '__pycache__/', 'venv/', '*.pyc'],
  worker: ['node_modules/', 'dist/', '.env*.local', 'coverage/'],
  infra: ['.terraform/', '*.tfstate*', '.env*.local', 'node_modules/'],
  shared: ['node_modules/', 'dist/', 'coverage/'],
  docs: ['node_modules/', '.next/', '_site/', '.env*.local'],
};

function buildGitignoreContent(projectType: string, techStack: string): string {
  const base = GITIGNORE_TEMPLATES[projectType] ?? GITIGNORE_TEMPLATES.web;
  const lines = [
    '# OS files',
    '.DS_Store',
    'Thumbs.db',
    '',
    '# IDE',
    '.vscode/',
    '.idea/',
    '*.swp',
    '*.swo',
    '',
    '# Dependencies & build',
    ...base,
    '',
    '# Environment',
    '.env',
    '.env.local',
    '.env.*.local',
    '',
    '# Logs',
    '*.log',
    'npm-debug.log*',
  ];

  if (techStack.toLowerCase().includes('python') || techStack.toLowerCase().includes('django') || techStack.toLowerCase().includes('flask')) {
    lines.push('', '# Python', '__pycache__/', '*.pyc', 'venv/', '.venv/');
  }
  if (techStack.toLowerCase().includes('rust') || techStack.toLowerCase().includes('cargo')) {
    lines.push('', '# Rust', 'target/', 'Cargo.lock');
  }

  return lines.join('\n') + '\n';
}

async function executeAndWaitBridgeCommand(
  host: SkillHostCapabilities,
  opts: {
    command: string;
    args: string[];
    workingDirectory: string | null;
    reason: string;
    timeoutMs?: number;
  },
): Promise<BridgeJobOutcome & { bridgeRunId?: string }> {
  const bridge = host.bridge!;
  const result = await bridge.executeCommand(opts);

  if (!result.accepted) {
    host.log.warn('Bridge command rejected', { command: opts.command, code: result.code, message: result.message });
    return { status: 'failed', reason: `Command rejected: ${result.message}` };
  }

  const outcome = await bridge.waitForJob(result.bridgeRunId);
  return { ...outcome, bridgeRunId: result.bridgeRunId };
}

async function bootstrapRepository(
  host: SkillHostCapabilities,
  state: StudioState,
  project: ProjectRecord,
  codeProject: CodeProject,
): Promise<{ artifactId: string; success: boolean }> {
  host.log.info('Bootstrapping repository', { codeProject: codeProject.name, type: codeProject.type });
  host.run.reportStep(`bootstrap-${codeProject.name}`, 'developer');
  host.events.emitProgress(0, `Bootstrapping ${codeProject.name} repository`);

  // Determine repo path — use provided path or derive from project
  const repoPath = codeProject.repoPath ?? `/tmp/osloop-studio/${project.id}/${codeProject.name}`;
  codeProject.repoPath = repoPath;
  codeProject.bootstrapStatus = 'pending';

  // Create directory
  const mkdirResult = await executeAndWaitBridgeCommand(host, {
    command: 'mkdir',
    args: ['-p', repoPath],
    workingDirectory: null,
    reason: `Create directory for ${codeProject.name}`,
  });
  if (mkdirResult.status !== 'completed') {
    return { artifactId: '', success: false };
  }

  // Git init
  const gitInitResult = await executeAndWaitBridgeCommand(host, {
    command: 'git',
    args: ['init'],
    workingDirectory: repoPath,
    reason: `Initialize git repository for ${codeProject.name}`,
  });
  if (gitInitResult.status !== 'completed') {
    return { artifactId: '', success: false };
  }

  // Write .gitignore
  const gitignoreContent = buildGitignoreContent(codeProject.type, codeProject.techStack);
  const writeGitignoreResult = await executeAndWaitBridgeCommand(host, {
    command: 'sh',
    args: ['-c', `cat > "${repoPath}/.gitignore" << 'GITIGNORE_EOF'\n${gitignoreContent}GITIGNORE_EOF`],
    workingDirectory: repoPath,
    reason: `Create .gitignore for ${codeProject.name}`,
  });
  if (writeGitignoreResult.status !== 'completed') {
    return { artifactId: '', success: false };
  }

  // Write initial README
  const readmeContent = `# ${codeProject.name}\n\n${project.description}\n\n## Tech Stack\n\n${codeProject.techStack}\n\n## Project Type\n\n${codeProject.type}\n`;
  const writeReadmeResult = await executeAndWaitBridgeCommand(host, {
    command: 'sh',
    args: ['-c', `cat > "${repoPath}/README.md" << 'README_EOF'\n${readmeContent}README_EOF`],
    workingDirectory: repoPath,
    reason: `Create README.md for ${codeProject.name}`,
  });
  if (writeReadmeResult.status !== 'completed') {
    return { artifactId: '', success: false };
  }

  // Initial commit
  const commitResult = await executeAndWaitBridgeCommand(host, {
    command: 'sh',
    args: ['-c', 'git add -A && git commit -m "Initial bootstrap commit"'],
    workingDirectory: repoPath,
    reason: `Initial commit for ${codeProject.name}`,
  });
  if (commitResult.status !== 'completed') {
    return { artifactId: '', success: false };
  }

  codeProject.bootstrapStatus = 'git_initialized';
  codeProject.bootstrapBridgeJobId = commitResult.bridgeRunId ?? null;
  await host.workspace.setState(state);

  const artifact = await host.workspace.createArtifact({
    type: 'repository-bootstrap-report',
    title: `Repository Bootstrap: ${codeProject.name}`,
    content: {
      projectId: project.id,
      codeProjectId: codeProject.id,
      codeProjectName: codeProject.name,
      repoPath,
      bootstrapStatus: 'git_initialized',
      gitignoreGenerated: true,
      readmeGenerated: true,
      initialCommitCreated: true,
      generatedAt: new Date().toISOString(),
    },
    createdByRole: 'developer',
  });

  project.artifactIds.push(artifact.id);
  host.log.info('Repository bootstrapped', { codeProject: codeProject.name, repoPath });
  return { artifactId: artifact.id, success: true };
}

async function configureClaudeStructure(
  host: SkillHostCapabilities,
  state: StudioState,
  project: ProjectRecord,
  codeProject: CodeProject,
): Promise<{ artifactId: string; success: boolean }> {
  host.log.info('Configuring .claude structure', { codeProject: codeProject.name });
  host.run.reportStep(`claude-config-${codeProject.name}`, 'developer');
  host.events.emitProgress(0, `Configuring .claude for ${codeProject.name}`);

  const repoPath = codeProject.repoPath!;

  // Generate .claude content via LLM
  const projectContext = buildProjectContext(project);
  const llmResult = await host.llm.complete({
    purposeId: 'development-plan',
    systemPrompt: `You are generating configuration files for a .claude directory that will guide Claude Code when working on this repository.

Generate high-quality, specific content for the following files. Each file should be genuinely useful for developers and Claude Code agents working on this specific project.

Output a JSON object with these keys, each containing the markdown content for that file:
- "coding-standards": Language and framework-specific coding conventions for ${codeProject.techStack}
- "architecture-context": Architecture overview and key decisions for this code project
- "testing-expectations": Test strategy, frameworks, and coverage expectations
- "tdd-guidance": TDD workflow rules specific to this project's tech stack
- "quality-gates": Quality gates, CI requirements, and merge criteria
- "repository-conventions": Git workflow, branching strategy, PR conventions, and commit message format
- "error-handling-guidelines": Error handling patterns, error boundaries, and failure recovery strategies specific to ${codeProject.techStack}
- "project-brief": Project description, business context, and goals
- "active-project-topology": Multi-project structure overview, integration points, and service boundaries
- "developer-agent": Agent role prompt for a developer working on implementation
- "reviewer-agent": Agent role prompt for a code reviewer
- "architecture-review-agent": Agent role prompt for reviewing architecture decisions, patterns, and structural concerns
- "test-quality-agent": Agent role prompt for reviewing test design, coverage gaps, and test maintainability
- "bugfix-investigation-agent": Agent role prompt for systematic bug investigation with root cause analysis
- "implement-task-command": Command template for implementing a single task
- "run-tests-command": Command template for running project tests
- "run-quality-pass-command": Command template for running a combined lint, type-check, and test pass
- "review-diff-command": Command template for reviewing staged changes before commit

Output ONLY valid JSON, no markdown fences.`,
    messages: [{
      role: 'user',
      content: `Generate .claude configuration for this code project:\n\nProject: ${codeProject.name}\nType: ${codeProject.type}\nTech Stack: ${codeProject.techStack}\n\n${projectContext}`,
    }],
    temperature: 0.2,
    maxTokens: 10000,
  });

  let claudeFiles: Record<string, string>;
  try {
    claudeFiles = JSON.parse(llmResult.text.trim());
  } catch {
    host.log.warn('Failed to parse .claude config JSON on first attempt, retrying with stricter instruction');
    const retryResult = await host.llm.complete({
      purposeId: 'development-plan',
      systemPrompt: 'You MUST respond with ONLY a valid JSON object. No explanation, no markdown fences, no text before or after the JSON. The JSON must parse with JSON.parse().',
      messages: [{
        role: 'user',
        content: `Convert the following text into a valid JSON object where each key is a filename and each value is the markdown content for that file. Required keys: coding-standards, architecture-context, testing-expectations, tdd-guidance, quality-gates, repository-conventions, error-handling-guidelines, project-brief, active-project-topology, developer-agent, reviewer-agent, architecture-review-agent, test-quality-agent, bugfix-investigation-agent, implement-task-command, run-tests-command, run-quality-pass-command, review-diff-command.\n\nOriginal output:\n${llmResult.text}`,
      }],
      temperature: 0,
      maxTokens: 10000,
    });
    try {
      claudeFiles = JSON.parse(retryResult.text.trim());
    } catch {
      throw new Error('.claude configuration generation failed: LLM returned invalid JSON after retry. Checkpoint and retry the run.');
    }
  }

  // Create directory structure
  const mkdirResult = await executeAndWaitBridgeCommand(host, {
    command: 'mkdir',
    args: ['-p', `${repoPath}/.claude/agents`, `${repoPath}/.claude/commands`, `${repoPath}/.claude/docs`, `${repoPath}/.claude/context`],
    workingDirectory: repoPath,
    reason: `Create .claude directory structure for ${codeProject.name}`,
  });
  if (mkdirResult.status !== 'completed') {
    return { artifactId: '', success: false };
  }

  // Write files
  const fileMap: Record<string, string> = {
    '.claude/docs/coding-standards.md': claudeFiles['coding-standards'] ?? '',
    '.claude/docs/architecture-context.md': claudeFiles['architecture-context'] ?? '',
    '.claude/docs/testing-expectations.md': claudeFiles['testing-expectations'] ?? '',
    '.claude/docs/tdd-guidance.md': claudeFiles['tdd-guidance'] ?? '',
    '.claude/docs/quality-gates.md': claudeFiles['quality-gates'] ?? '',
    '.claude/docs/repository-conventions.md': claudeFiles['repository-conventions'] ?? '',
    '.claude/docs/error-handling-guidelines.md': claudeFiles['error-handling-guidelines'] ?? '',
    '.claude/context/project-brief.md': claudeFiles['project-brief'] ?? '',
    '.claude/context/active-project-topology.md': claudeFiles['active-project-topology'] ?? '',
    '.claude/agents/developer.md': claudeFiles['developer-agent'] ?? '',
    '.claude/agents/reviewer.md': claudeFiles['reviewer-agent'] ?? '',
    '.claude/agents/architecture-review.md': claudeFiles['architecture-review-agent'] ?? '',
    '.claude/agents/test-quality.md': claudeFiles['test-quality-agent'] ?? '',
    '.claude/agents/bugfix-investigation.md': claudeFiles['bugfix-investigation-agent'] ?? '',
    '.claude/commands/implement-task.md': claudeFiles['implement-task-command'] ?? '',
    '.claude/commands/run-tests.md': claudeFiles['run-tests-command'] ?? '',
    '.claude/commands/run-quality-pass.md': claudeFiles['run-quality-pass-command'] ?? '',
    '.claude/commands/review-diff.md': claudeFiles['review-diff-command'] ?? '',
  };

  for (const [filePath, content] of Object.entries(fileMap)) {
    if (!content) continue;
    const escapedContent = content.replace(/'/g, "'\\''");
    const writeResult = await executeAndWaitBridgeCommand(host, {
      command: 'sh',
      args: ['-c', `printf '%s' '${escapedContent}' > "${repoPath}/${filePath}"`],
      workingDirectory: repoPath,
      reason: `Write ${filePath} for ${codeProject.name}`,
    });
    if (writeResult.status !== 'completed') {
      host.log.warn('Failed to write .claude file', { filePath });
    }
  }

  // Commit .claude structure
  const commitResult = await executeAndWaitBridgeCommand(host, {
    command: 'sh',
    args: ['-c', 'git add -A && git commit -m "Add .claude configuration structure"'],
    workingDirectory: repoPath,
    reason: `Commit .claude structure for ${codeProject.name}`,
  });

  codeProject.bootstrapStatus = commitResult.status === 'completed' ? 'claude_configured' : codeProject.bootstrapStatus;
  await host.workspace.setState(state);

  const artifact = await host.workspace.createArtifact({
    type: 'claude-config-manifest',
    title: `.claude Configuration: ${codeProject.name}`,
    content: {
      projectId: project.id,
      codeProjectId: codeProject.id,
      codeProjectName: codeProject.name,
      repoPath,
      files: Object.keys(fileMap),
      bootstrapStatus: codeProject.bootstrapStatus,
      generatedAt: new Date().toISOString(),
    },
    createdByRole: 'developer',
  });

  project.artifactIds.push(artifact.id);
  host.log.info('.claude structure configured', { codeProject: codeProject.name, fileCount: Object.keys(fileMap).length });
  return { artifactId: artifact.id, success: true };
}

async function executeImplementationPhases(
  host: SkillHostCapabilities,
  state: StudioState,
  project: ProjectRecord,
): Promise<string[]> {
  const artifactIds: string[] = [];

  if (!project.implementationStatus || project.implementationStatus.executionPhases.length === 0) {
    host.log.info('No execution phases defined, skipping code execution');
    return artifactIds;
  }

  // Ensure Claude Code is installed
  const bridge = host.bridge!;
  const locateResult = await bridge.locateTools(['claude-code']);
  const claudeCodeTool = locateResult.tools.find((t) => t.id === 'claude-code');

  if (!claudeCodeTool || claudeCodeTool.status !== 'installed') {
    host.log.info('Claude Code not found, attempting installation');
    const installResult = await bridge.installTool({
      toolId: 'claude-code',
      reason: 'Install Claude Code for implementation phase code execution',
    });
    if (!installResult.accepted) {
      host.log.warn('Claude Code installation rejected', { code: (installResult as { code: string }).code });
      return artifactIds;
    }
    await bridge.waitForJob(installResult.bridgeRunId);
  }

  for (let i = 0; i < project.implementationStatus.executionPhases.length; i++) {
    const execPhase = project.implementationStatus.executionPhases[i];
    if (execPhase.status === 'completed') continue;

    project.implementationStatus.activeExecutionPhaseIndex = i;
    execPhase.status = 'running';
    await host.workspace.setState(state);

    host.run.reportStep(`exec-phase-${execPhase.id}`, 'developer');
    host.events.emitProgress(i / project.implementationStatus.executionPhases.length, `Executing: ${execPhase.label}`);

    const goalPrompt = `Implementation Phase: ${execPhase.label}\n\nGoals:\n${execPhase.goals.map((g) => `- ${g}`).join('\n')}\n\nFollow the project's .claude configuration for coding standards, testing expectations, and TDD guidance.`;

    const targetProjects = project.codeProjects.filter((cp) =>
      execPhase.targetCodeProjectIds.includes(cp.id),
    );

    const phaseResults: Array<{ codeProject: string; outcome: BridgeJobOutcome; bridgeRunId?: string }> = [];

    for (const cp of targetProjects) {
      if (!cp.repoPath) continue;

      const cmdResult = await executeAndWaitBridgeCommand(host, {
        command: 'claude',
        args: ['--print', goalPrompt],
        workingDirectory: cp.repoPath,
        reason: `Implementation phase: ${execPhase.label} — ${cp.name}`,
        timeoutMs: 600_000,
      });

      phaseResults.push({
        codeProject: cp.name,
        outcome: cmdResult,
        bridgeRunId: cmdResult.bridgeRunId,
      });

      if (cmdResult.bridgeRunId) {
        execPhase.bridgeJobIds.push(cmdResult.bridgeRunId);
      }
    }

    await host.workspace.setState(state);

    // Request user approval
    execPhase.status = 'waiting_approval';
    await host.workspace.setState(state);
    await host.run.checkpoint();

    host.run.reportStep(`exec-phase-${execPhase.id}-approval`, 'developer');
    const approval = (await host.run.requestInput({
      title: `Review Implementation Phase: ${execPhase.label}`,
      message: `Code execution for "${execPhase.label}" is complete across ${targetProjects.length} code project(s). Review the changes and decide how to proceed.`,
      inputSchema: {
        type: 'object',
        properties: {
          decision: {
            type: 'string',
            enum: ['approve', 'reject', 'revise', 'pause', 'cancel'],
            description: 'Decision for this execution phase',
          },
          feedback: { type: 'string', description: 'Feedback or revision requests' },
        },
        required: ['decision'],
      },
    })) as { decision: string; feedback?: string };

    if (approval.decision === 'approve') {
      execPhase.status = 'completed';
    } else {
      execPhase.status = 'failed';
    }
    await host.workspace.setState(state);

    // Create execution report artifact
    const artifact = await host.workspace.createArtifact({
      type: 'code-execution-report',
      title: `Code Execution: ${execPhase.label}`,
      content: {
        projectId: project.id,
        executionPhaseId: execPhase.id,
        label: execPhase.label,
        goals: execPhase.goals,
        targetCodeProjects: targetProjects.map((cp) => cp.name),
        results: phaseResults.map((r) => ({
          codeProject: r.codeProject,
          status: r.outcome.status,
          bridgeRunId: r.bridgeRunId ?? null,
        })),
        decision: approval.decision,
        feedback: approval.feedback ?? null,
        generatedAt: new Date().toISOString(),
      },
      createdByRole: 'developer',
    });

    artifactIds.push(artifact.id);
    project.artifactIds.push(artifact.id);

    if (approval.decision !== 'approve') {
      break;
    }
  }

  project.implementationStatus.activeExecutionPhaseIndex = null;
  await host.workspace.setState(state);
  return artifactIds;
}

async function buildExecutionPhasesFromTaskBreakdown(
  host: SkillHostCapabilities,
  project: ProjectRecord,
): Promise<ImplementationExecutionPhase[]> {
  // Find the task-breakdown artifact
  const artifacts = await host.workspace.listArtifacts();
  const taskBreakdownArtifact = artifacts.find((a) => a.type === 'task-breakdown');

  if (!taskBreakdownArtifact) {
    host.log.warn('No task-breakdown artifact found, creating single execution phase');
    return [{
      id: generateId(),
      label: 'Full Implementation',
      goals: [`Implement all features for ${project.name}`],
      targetCodeProjectIds: project.codeProjects.map((cp) => cp.id),
      status: 'pending',
      bridgeJobIds: [],
    }];
  }

  // Generate execution phases via LLM from the task breakdown
  const llmResult = await host.llm.complete({
    purposeId: 'development-plan',
    systemPrompt: `You are breaking an implementation plan into execution phases for Claude Code.
Each phase should be a coherent unit of work that can be executed and validated independently.

Output a JSON array of phases:
[
  {
    "label": "Phase description",
    "goals": ["Goal 1", "Goal 2"],
    "targetCodeProjectNames": ["project-name-1"]
  }
]

Output ONLY valid JSON, no markdown fences. Create 2-5 phases max.`,
    messages: [{
      role: 'user',
      content: `Create execution phases for this project:\n\n${buildProjectContext(project)}\n\nCode projects: ${project.codeProjects.map((cp) => cp.name).join(', ')}`,
    }],
    temperature: 0.2,
    maxTokens: 2000,
  });

  try {
    const parsed = JSON.parse(llmResult.text.trim()) as Array<{
      label: string;
      goals: string[];
      targetCodeProjectNames: string[];
    }>;

    return parsed.map((p) => ({
      id: generateId(),
      label: p.label,
      goals: p.goals,
      targetCodeProjectIds: p.targetCodeProjectNames
        .map((name) => project.codeProjects.find((cp) => cp.name === name)?.id)
        .filter((id): id is string => id != null),
      status: 'pending' as const,
      bridgeJobIds: [],
    }));
  } catch {
    host.log.warn('Failed to parse execution phases JSON on first attempt, retrying with stricter instruction');
    const retryResult = await host.llm.complete({
      purposeId: 'development-plan',
      systemPrompt: 'You MUST respond with ONLY a valid JSON array. No explanation, no markdown fences, no text before or after the JSON. The JSON must parse with JSON.parse().',
      messages: [{
        role: 'user',
        content: `Convert the following text into a valid JSON array of execution phases. Each entry must have: label (string), goals (string[]), targetCodeProjectNames (string[]).\n\nOriginal output:\n${llmResult.text}`,
      }],
      temperature: 0,
      maxTokens: 2000,
    });
    try {
      const parsed = JSON.parse(retryResult.text.trim()) as Array<{
        label: string;
        goals: string[];
        targetCodeProjectNames: string[];
      }>;
      return parsed.map((p) => ({
        id: generateId(),
        label: p.label,
        goals: p.goals,
        targetCodeProjectIds: p.targetCodeProjectNames
          .map((name) => project.codeProjects.find((cp) => cp.name === name)?.id)
          .filter((id): id is string => id != null),
        status: 'pending' as const,
        bridgeJobIds: [],
      }));
    } catch {
      throw new Error('Execution phase generation failed: LLM returned invalid JSON after retry. Checkpoint and retry the run.');
    }
  }
}

async function handleRunImplementationSubphase(
  host: SkillHostCapabilities,
  state: StudioState,
  project: ProjectRecord,
  phaseIndex: number,
): Promise<{ artifactIds: string[]; success: boolean }> {
  const artifactIds: string[] = [];

  if (!project.implementationStatus) {
    return { artifactIds, success: false };
  }

  const record = project.implementationStatus.roadmapPhaseRecords[phaseIndex];
  if (!record) {
    host.log.warn('No implementation phase record at index', { phaseIndex });
    return { artifactIds, success: false };
  }

  project.implementationStatus.activeRoadmapPhaseIndex = phaseIndex;

  // 1. Planning
  record.status = 'planning';
  await host.workspace.setState(state);
  host.run.reportStep(`subphase-plan-${record.id}`, 'developer');
  host.events.emitProgress(0, `Planning: ${record.label}`);

  const projectContext = buildProjectContext(project);
  const planResult = await host.llm.complete({
    purposeId: 'development-plan',
    systemPrompt: ROLE_PROMPTS.developer,
    messages: [{
      role: 'user',
      content: `${projectContext}\n\nCreate a detailed implementation plan for this sub-phase:\nPhase: ${record.label}\nRoadmap Phase: ${record.roadmapEntryPhase}\n\nInclude specific tasks, ordering, dependencies, and acceptance criteria. Reference the relevant code projects.`,
    }],
    temperature: 0.2,
    maxTokens: 2000,
  });

  const planArtifact = await host.workspace.createArtifact({
    type: 'implementation-phase-plan',
    title: `Implementation Plan: ${record.label}`,
    content: {
      projectId: project.id,
      subphaseId: record.id,
      label: record.label,
      roadmapEntryPhase: record.roadmapEntryPhase,
      body: planResult.text.trim(),
      generatedAt: new Date().toISOString(),
    },
    createdByRole: 'developer',
  });
  record.planArtifactId = planArtifact.id;
  artifactIds.push(planArtifact.id);
  project.artifactIds.push(planArtifact.id);
  await host.workspace.setState(state);
  await host.run.checkpoint();

  // 2. User approval of plan
  host.run.reportStep(`subphase-plan-approval-${record.id}`, 'developer');
  const planApproval = (await host.run.requestInput({
    title: `Approve Implementation Plan: ${record.label}`,
    message: `An implementation plan has been generated for "${record.label}". Review and decide how to proceed.`,
    inputSchema: {
      type: 'object',
      properties: {
        decision: { type: 'string', enum: ['approve', 'reject', 'revise', 'pause', 'cancel'], description: 'Decision for this plan' },
        feedback: { type: 'string', description: 'Feedback or revision requests' },
      },
      required: ['decision'],
    },
  })) as { decision: string; feedback?: string };

  if (planApproval.decision !== 'approve') {
    record.status = planApproval.decision === 'pause' ? 'not_started' : 'failed';
    record.userDecision = planApproval.decision as ImplementationPhaseRecord['userDecision'];
    project.validationHistory.push({
      phase: 'implementation-phase',
      decision: planApproval.decision as ValidationEntry['decision'],
      feedback: planApproval.feedback ?? null,
      timestamp: new Date().toISOString(),
    });
    await host.workspace.setState(state);
    await host.run.checkpoint();
    return { artifactIds, success: false };
  }

  // 3. Implementing
  record.status = 'plan_approved';
  await host.workspace.setState(state);

  record.status = 'implementing';
  await host.workspace.setState(state);
  host.run.reportStep(`subphase-implement-${record.id}`, 'developer');
  host.events.emitProgress(0.3, `Implementing: ${record.label}`);

  if (isBridgeAvailable(host) && project.codeProjects.length > 0) {
    const bridge = host.bridge!;
    for (const cp of project.codeProjects) {
      if (!cp.repoPath) continue;
      const goalPrompt = `Implementation Sub-Phase: ${record.label}\n\nFollow the project's .claude configuration for coding standards, testing expectations, and TDD guidance.\n\nPlan:\n${planResult.text.trim()}`;

      const cmdResult = await executeAndWaitBridgeCommand(host, {
        command: 'claude',
        args: ['--print', goalPrompt],
        workingDirectory: cp.repoPath,
        reason: `Implementation sub-phase: ${record.label} — ${cp.name}`,
        timeoutMs: 600_000,
      });

      if (cmdResult.bridgeRunId) {
        record.bridgeJobIds.push(cmdResult.bridgeRunId);
      }
    }
  }

  // Generate implementation report
  const reportResult = await host.llm.complete({
    purposeId: 'development-plan',
    systemPrompt: ROLE_PROMPTS.developer,
    messages: [{
      role: 'user',
      content: `${projectContext}\n\nGenerate an implementation report for the sub-phase: ${record.label}\n\nSummarize what was implemented, any issues encountered, and the current state of the codebase.`,
    }],
    temperature: 0.2,
    maxTokens: 1500,
  });

  const reportArtifact = await host.workspace.createArtifact({
    type: 'implementation-report',
    title: `Implementation Report: ${record.label}`,
    content: {
      projectId: project.id,
      subphaseId: record.id,
      label: record.label,
      body: reportResult.text.trim(),
      bridgeJobIds: record.bridgeJobIds,
      generatedAt: new Date().toISOString(),
    },
    createdByRole: 'developer',
  });
  record.implementationReportArtifactId = reportArtifact.id;
  artifactIds.push(reportArtifact.id);
  project.artifactIds.push(reportArtifact.id);
  await host.workspace.setState(state);

  // 4. QA Validation
  record.status = 'qa_validating';
  await host.workspace.setState(state);
  host.run.reportStep(`subphase-qa-${record.id}`, 'qa');
  host.events.emitProgress(0.6, `QA Validating: ${record.label}`);

  const qaResult = await host.llm.complete({
    purposeId: 'qa-strategy',
    systemPrompt: ROLE_PROMPTS.qa,
    messages: [{
      role: 'user',
      content: `${projectContext}\n\nPerform QA validation for the implementation sub-phase: ${record.label}\n\nReview the implementation report and assess:\n- Does the implementation meet the plan's acceptance criteria?\n- Are there quality concerns?\n- Are tests adequate?\n- What issues need attention before proceeding?\n\nImplementation report:\n${reportResult.text.trim()}`,
    }],
    temperature: 0.2,
    maxTokens: 1500,
  });

  const qaArtifact = await host.workspace.createArtifact({
    type: 'qa-report',
    title: `QA Report: ${record.label}`,
    content: {
      projectId: project.id,
      subphaseId: record.id,
      label: record.label,
      body: qaResult.text.trim(),
      generatedAt: new Date().toISOString(),
    },
    createdByRole: 'qa',
  });
  record.qaReportArtifactId = qaArtifact.id;
  artifactIds.push(qaArtifact.id);
  project.artifactIds.push(qaArtifact.id);
  await host.workspace.setState(state);

  // 5. PM Alignment Check
  record.status = 'pm_reviewing';
  await host.workspace.setState(state);
  host.run.reportStep(`subphase-pm-${record.id}`, 'product-manager');
  host.events.emitProgress(0.8, `PM Review: ${record.label}`);

  const pmResult = await host.llm.complete({
    purposeId: 'status-report',
    systemPrompt: ROLE_PROMPTS['product-manager'],
    messages: [{
      role: 'user',
      content: `${projectContext}\n\nCheck alignment of implementation sub-phase "${record.label}" with product intent.\n\nDoes this implementation deliver the intended value? Is it aligned with the roadmap and product vision?\n\nQA Report:\n${qaResult.text.trim()}\n\nImplementation Report:\n${reportResult.text.trim()}`,
    }],
    temperature: 0.2,
    maxTokens: 1000,
  });

  const pmArtifact = await host.workspace.createArtifact({
    type: 'phase-summary',
    title: `PM Alignment: ${record.label}`,
    content: {
      projectId: project.id,
      subphaseId: record.id,
      label: record.label,
      body: pmResult.text.trim(),
      role: 'product-manager',
      generatedAt: new Date().toISOString(),
    },
    createdByRole: 'product-manager',
  });
  artifactIds.push(pmArtifact.id);
  project.artifactIds.push(pmArtifact.id);
  await host.workspace.setState(state);
  await host.run.checkpoint();

  // 6. User final gate
  record.status = 'user_reviewing';
  await host.workspace.setState(state);
  host.run.reportStep(`subphase-user-gate-${record.id}`, 'product-manager');
  host.events.emitProgress(0.9, `Awaiting review: ${record.label}`);

  const finalApproval = (await host.run.requestInput({
    title: `Review Implementation: ${record.label}`,
    message: `Implementation, QA validation, and PM alignment check are complete for "${record.label}". Review all reports and decide how to proceed.`,
    inputSchema: {
      type: 'object',
      properties: {
        decision: { type: 'string', enum: ['approve', 'reject', 'revise', 'pause', 'cancel'], description: 'Decision for this implementation sub-phase' },
        feedback: { type: 'string', description: 'Feedback or revision requests' },
      },
      required: ['decision'],
    },
  })) as { decision: string; feedback?: string };

  record.userDecision = finalApproval.decision as ImplementationPhaseRecord['userDecision'];
  record.status = finalApproval.decision === 'approve' ? 'completed' : 'failed';
  project.validationHistory.push({
    phase: 'implementation-phase',
    decision: finalApproval.decision as ValidationEntry['decision'],
    feedback: finalApproval.feedback ?? null,
    timestamp: new Date().toISOString(),
  });
  await host.workspace.setState(state);
  await host.run.checkpoint();

  return { artifactIds, success: finalApproval.decision === 'approve' };
}

async function handleRunPhase(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
  state: StudioState,
): Promise<Record<string, unknown>> {
  const project = getActiveProject(state);
  const targetPhase = (args.targetPhase as PhaseId) ?? project.currentPhase;
  const roleOverride = args.role as RoleId | undefined;

  const config = PHASE_CONFIGS[targetPhase];
  if (!config) {
    return { success: false, message: `Unknown phase: ${targetPhase}` };
  }

  await host.workspace.setPhase(targetPhase);
  const projectContext = buildProjectContext(project);
  const existingArtifacts = await host.workspace.listArtifacts();
  const createdArtifactIds: string[] = [];
  const totalSteps = config.steps.length;

  host.log.info('Starting phase execution', { phase: targetPhase, steps: totalSteps });

  for (let i = 0; i < config.steps.length; i++) {
    const step = config.steps[i];
    const stepRole = roleOverride ?? step.role;

    // Check if artifact already exists (idempotency for resume)
    const existingArtifact = findArtifactByTypeForStep(existingArtifacts, step.artifactType);
    if (existingArtifact && existingArtifact.status !== 'rejected') {
      host.log.info('Skipping step with existing artifact', { step: step.id, artifactId: existingArtifact.id });
      continue;
    }

    // Budget check: need enough for remaining steps + 1 for phase summary + 1 for approval
    const remainingSteps = config.steps.length - i;
    if (!hasBudgetFor(host, remainingSteps + 2)) {
      host.log.warn('Step budget nearly exhausted, wrapping up phase early', {
        stepsRemaining: remainingSteps,
        currentStep: host.run.getStepCount(),
        budget: host.run.getStepBudget(),
      });
      break;
    }

    await host.workspace.setRole(stepRole);
    host.run.reportStep(step.id, stepRole);
    host.events.emitProgress(
      (i + 1) / (totalSteps + 2),
      `${targetPhase}: ${step.description}`,
    );

    const systemPrompt = ROLE_PROMPTS[stepRole];
    const llmResult = await host.llm.complete({
      purposeId: step.purposeId,
      systemPrompt,
      messages: [{
        role: 'user',
        content: `${projectContext}\n\nPhase: ${targetPhase}\nTask: ${step.description}\n\nProduce a detailed, actionable ${step.artifactType} deliverable for this product. Be specific and thorough. Reference the code projects where applicable.`,
      }],
      temperature: 0.2,
      maxTokens: 2000,
    });

    const artifact = await host.workspace.createArtifact({
      type: step.artifactType,
      title: `${step.artifactType}: ${project.name}`,
      content: {
        projectId: project.id,
        phase: targetPhase,
        step: step.id,
        role: stepRole,
        body: llmResult.text.trim(),
        codeProjects: project.codeProjects.map((cp) => cp.name),
        generatedAt: new Date().toISOString(),
      },
      createdByRole: stepRole,
    });

    createdArtifactIds.push(artifact.id);
    project.artifactIds.push(artifact.id);

    // Populate enriched project fields from discovery phase artifacts
    if (step.artifactType === 'business-context') {
      try {
        const parsed = JSON.parse(llmResult.text.trim());
        project.businessContext = {
          industry: parsed.industry ?? '',
          marketSegment: parsed.marketSegment ?? '',
          revenueModel: parsed.revenueModel ?? '',
          competitiveAdvantage: parsed.competitiveAdvantage ?? '',
        };
      } catch {
        host.log.warn('Could not parse business-context into structured fields');
      }
    }

    if (step.artifactType === 'user-personas') {
      try {
        const parsed = JSON.parse(llmResult.text.trim());
        if (Array.isArray(parsed)) {
          project.targetUsers = parsed.map((p: Record<string, unknown>) => ({
            persona: (p.persona as string) ?? '',
            description: (p.description as string) ?? '',
            painPoints: Array.isArray(p.painPoints) ? p.painPoints as string[] : [],
          }));
        }
      } catch {
        host.log.warn('Could not parse user-personas into structured fields');
      }
    }

    // Initialize implementation status when entering implementation phase
    if (targetPhase === 'implementation-phase' && step.id === 'task-breakdown') {
      project.implementationStatus = {
        currentIteration: 1,
        totalIterationsPlanned: 1,
        completedTasks: 0,
        totalTasks: config.steps.length,
        blockers: [],
        executionPhases: [],
        activeExecutionPhaseIndex: null,
        roadmapPhaseRecords: [],
        activeRoadmapPhaseIndex: null,
      };
    }

    await host.workspace.setState(state);
    await host.run.checkpoint();

    host.log.info('Step completed', { step: step.id, role: stepRole, artifactId: artifact.id });
  }

  // Phase summary artifact
  host.run.reportStep(`${targetPhase}-summary`, config.primaryRole);
  host.events.emitProgress(
    (totalSteps + 1) / (totalSteps + 2),
    `${targetPhase}: Generating phase summary`,
  );

  const summaryResult = await host.llm.complete({
    purposeId: 'status-report',
    systemPrompt: ROLE_PROMPTS[config.primaryRole],
    messages: [{
      role: 'user',
      content: `${projectContext}\n\nSummarize the deliverables produced during the "${targetPhase}" phase. List key decisions made, artifacts created (${createdArtifactIds.length} total), and any open questions or risks that need user attention before proceeding to the next phase.`,
    }],
    temperature: 0.2,
    maxTokens: 1500,
  });

  const summaryArtifact = await host.workspace.createArtifact({
    type: 'phase-summary',
    title: `Phase Summary: ${targetPhase} — ${project.name}`,
    content: {
      projectId: project.id,
      phase: targetPhase,
      body: summaryResult.text.trim(),
      artifactCount: createdArtifactIds.length,
      nextPhase: config.nextPhase,
      generatedAt: new Date().toISOString(),
    },
    createdByRole: config.primaryRole,
  });
  createdArtifactIds.push(summaryArtifact.id);
  project.artifactIds.push(summaryArtifact.id);
  await host.workspace.setState(state);

  // Bridge-backed code execution for implementation phase
  if (targetPhase === 'implementation-phase' && isBridgeAvailable(host)) {
    host.log.info('Bridge available, starting bridge-backed implementation');

    // Verify entry conditions
    const hasApprovedRoadmap = project.validationHistory.some(
      (v) => v.phase === 'roadmap-definition' && v.decision === 'approve',
    );
    const hasCompletedArchitecture = project.completedPhases.includes('architecture-definition');

    if (!hasApprovedRoadmap || !hasCompletedArchitecture) {
      host.log.warn('Implementation entry conditions not fully met', {
        hasApprovedRoadmap,
        hasCompletedArchitecture,
      });
    }

    if (project.codeProjects.length === 0) {
      host.log.warn('No code projects defined, skipping bridge-backed execution');
    } else {
      // Bootstrap each code project
      for (const cp of project.codeProjects) {
        if (!cp.bootstrapStatus || cp.bootstrapStatus === 'pending') {
          const bootstrapResult = await bootstrapRepository(host, state, project, cp);
          if (bootstrapResult.success) {
            createdArtifactIds.push(bootstrapResult.artifactId);
          }
        }

        if (cp.bootstrapStatus === 'git_initialized') {
          const claudeResult = await configureClaudeStructure(host, state, project, cp);
          if (claudeResult.success) {
            createdArtifactIds.push(claudeResult.artifactId);
          }
        }

        if (cp.bootstrapStatus === 'claude_configured') {
          cp.bootstrapStatus = 'ready';
          await host.workspace.setState(state);
        }
      }

      // Build execution phases from task breakdown
      if (!project.implementationStatus) {
        project.implementationStatus = {
          currentIteration: 1,
          totalIterationsPlanned: 1,
          completedTasks: 0,
          totalTasks: 0,
          blockers: [],
          executionPhases: [],
          activeExecutionPhaseIndex: null,
          roadmapPhaseRecords: [],
          activeRoadmapPhaseIndex: null,
        };
      }

      if (project.implementationStatus.executionPhases.length === 0) {
        project.implementationStatus.executionPhases = await buildExecutionPhasesFromTaskBreakdown(host, project);
        await host.workspace.setState(state);
      }

      // Build roadmap phase records for per-phase gated execution
      if (project.implementationStatus.roadmapPhaseRecords.length === 0 && project.roadmap) {
        project.implementationStatus.roadmapPhaseRecords = project.roadmap
          .filter((entry) => !project.completedPhases.includes(entry.phase))
          .map((entry) => ({
            id: generateId(),
            roadmapEntryPhase: entry.phase,
            label: `${entry.phase}: ${entry.milestones[0] ?? entry.deliverables[0] ?? entry.phase}`,
            status: 'not_started' as const,
            planArtifactId: null,
            implementationReportArtifactId: null,
            qaReportArtifactId: null,
            pmAlignmentDecision: null,
            userDecision: null,
            bridgeJobIds: [],
          }));
        await host.workspace.setState(state);
      }

      // Execute per-roadmap-phase implementation loop
      for (let ri = 0; ri < project.implementationStatus.roadmapPhaseRecords.length; ri++) {
        const record = project.implementationStatus.roadmapPhaseRecords[ri];
        if (record.status === 'completed' || record.status === 'failed') continue;

        if (!hasBudgetFor(host, 8)) {
          host.log.warn('Budget insufficient for next implementation sub-phase', { ri });
          break;
        }

        const subResult = await handleRunImplementationSubphase(host, state, project, ri);
        createdArtifactIds.push(...subResult.artifactIds);
        if (!subResult.success) break;
      }

      project.implementationStatus.activeRoadmapPhaseIndex = null;

      // Execute implementation phases
      const execArtifactIds = await executeImplementationPhases(host, state, project);
      createdArtifactIds.push(...execArtifactIds);
    }
  } else if (targetPhase === 'implementation-phase' && !isBridgeAvailable(host)) {
    host.log.info('Bridge not available, implementation phase produced planning-only artifacts');
  }

  // Architecture gate: request additional approval for controversial tech stack decisions
  if (targetPhase === 'architecture-definition') {
    const techStackArtifact = findArtifactByTypeForStep(
      await host.workspace.listArtifacts(),
      'tech-stack-decision',
    );
    if (techStackArtifact) {
      host.run.reportStep('architecture-decision-gate', 'software-architect');
      const archGate = (await host.run.requestInput({
        title: 'Review Architecture Decisions',
        message: `Architecture and technology stack decisions have been made for "${project.name}". Review the tech-stack-decision and architecture-plan artifacts. Approve to proceed, or request revisions if any decisions are controversial.`,
        inputSchema: {
          type: 'object',
          properties: {
            decision: {
              type: 'string',
              enum: ['approve', 'reject', 'revise', 'pause', 'cancel'],
              description: 'Decision for architecture review',
            },
            feedback: { type: 'string', description: 'Feedback on architecture decisions' },
          },
          required: ['decision'],
        },
      })) as { decision: string; feedback?: string };

      project.validationHistory.push({
        phase: targetPhase,
        decision: archGate.decision as ValidationEntry['decision'],
        feedback: archGate.feedback ?? null,
        timestamp: new Date().toISOString(),
      });

      if (archGate.decision === 'pause' || archGate.decision === 'cancel') {
        await host.workspace.setState(state);
        await host.run.checkpoint();
        return {
          success: true,
          message: `Architecture review ${archGate.decision}led for "${project.name}".`,
          studioState: state,
          artifactIds: createdArtifactIds,
          stepsUsed: host.run.getStepCount(),
          phasesCompleted: [],
        };
      }

      if (archGate.decision === 'reject' || archGate.decision === 'revise') {
        await host.workspace.updateArtifact(techStackArtifact.id, { status: 'rejected' });
        await host.workspace.setState(state);
        await host.run.checkpoint();
        return {
          success: true,
          message: `Architecture decisions ${archGate.decision}ed. Feedback: ${archGate.feedback ?? 'none'}`,
          studioState: state,
          artifactIds: createdArtifactIds,
          stepsUsed: host.run.getStepCount(),
          phasesCompleted: [],
        };
      }
    }
  }

  // Request user approval before phase completion
  host.run.reportStep(`${targetPhase}-approval`, config.primaryRole);
  host.events.emitProgress(
    (totalSteps + 1.5) / (totalSteps + 2),
    `${targetPhase}: Requesting approval`,
  );

  const approval = (await host.run.requestInput({
    title: `Approve ${targetPhase} Phase`,
    message: `The "${targetPhase}" phase for "${project.name}" is complete with ${createdArtifactIds.length} artifact(s). Review the phase summary and artifacts, then decide how to proceed.`,
    inputSchema: {
      type: 'object',
      properties: {
        decision: {
          type: 'string',
          enum: ['approve', 'reject', 'revise', 'pause', 'cancel'],
          description: 'Decision for this phase gate',
        },
        feedback: { type: 'string', description: 'Feedback or revision requests' },
      },
      required: ['decision'],
    },
  })) as { decision: string; feedback?: string };

  const phaseDecision = approval.decision ?? 'approve';

  // Record in validation history
  project.validationHistory.push({
    phase: targetPhase,
    decision: phaseDecision as ValidationEntry['decision'],
    feedback: approval.feedback ?? null,
    timestamp: new Date().toISOString(),
  });

  if (phaseDecision === 'pause') {
    await host.workspace.setState(state);
    await host.run.checkpoint();
    return {
      success: true,
      message: `Phase "${targetPhase}" paused for "${project.name}". Resume when ready.`,
      studioState: state,
      artifactIds: createdArtifactIds,
      stepsUsed: host.run.getStepCount(),
      phasesCompleted: [],
    };
  }

  if (phaseDecision === 'cancel') {
    await host.workspace.setState(state);
    await host.run.checkpoint();
    return {
      success: true,
      message: `Phase "${targetPhase}" cancelled for "${project.name}".`,
      studioState: state,
      artifactIds: createdArtifactIds,
      stepsUsed: host.run.getStepCount(),
      phasesCompleted: [],
    };
  }

  if (phaseDecision === 'approve') {
    await host.workspace.updateArtifact(summaryArtifact.id, { status: 'approved' });
    project.completedPhases.push(targetPhase);
    if (config.nextPhase) {
      project.currentPhase = config.nextPhase;
    }
    project.updatedAt = new Date().toISOString();
    await host.workspace.setState(state);
    host.log.info('Phase approved', { phase: targetPhase, nextPhase: config.nextPhase });
  } else {
    await host.workspace.updateArtifact(summaryArtifact.id, {
      status: 'rejected',
      content: {
        projectId: project.id,
        phase: targetPhase,
        body: summaryResult.text.trim(),
        artifactCount: createdArtifactIds.length,
        nextPhase: config.nextPhase,
        userFeedback: approval.feedback ?? '',
        generatedAt: new Date().toISOString(),
      },
    });
    host.log.info('Phase rejected', { phase: targetPhase, feedback: approval.feedback });
  }

  await host.workspace.setState(state);
  await host.run.checkpoint();
  host.events.emitProgress(1.0, `${targetPhase} phase ${phaseDecision === 'approve' ? 'approved' : 'needs revision'}`);

  // Roadmap-first: auto-trigger roadmap generation after discovery approval
  if (targetPhase === 'discovery' && phaseDecision === 'approve' && hasBudgetFor(host, 4)) {
    host.log.info('Auto-triggering roadmap generation after discovery approval');
    const roadmapResult = await handleGenerateRoadmap({}, host, state);
    if (roadmapResult.success) {
      const roadmapArtifactIds = (roadmapResult.artifactIds as string[]) ?? [];
      createdArtifactIds.push(...roadmapArtifactIds);

      // If roadmap was approved, mark roadmap-definition as completed too
      const roadmapProject = getActiveProject(state);
      const roadmapApproved = roadmapProject.validationHistory.some(
        (v) => v.phase === roadmapProject.currentPhase && v.decision === 'approve',
      );
      if (roadmapApproved) {
        return {
          success: true,
          message: `Discovery approved and roadmap approved. Next phase: ${roadmapProject.currentPhase}`,
          studioState: state,
          artifactIds: createdArtifactIds,
          stepsUsed: host.run.getStepCount(),
          phasesCompleted: [targetPhase, 'roadmap-definition'],
        };
      }
    }
  }

  return {
    success: true,
    message: phaseDecision === 'approve'
      ? `Phase "${targetPhase}" approved. ${config.nextPhase ? `Next phase: ${config.nextPhase}` : 'All phases complete.'}`
      : `Phase "${targetPhase}" ${phaseDecision}ed. Feedback: ${approval.feedback ?? 'none'}`,
    studioState: state,
    artifactIds: createdArtifactIds,
    stepsUsed: host.run.getStepCount(),
    phasesCompleted: phaseDecision === 'approve' ? [targetPhase] : [],
  };
}

async function handleAdvancePhase(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
  state: StudioState,
): Promise<Record<string, unknown>> {
  const project = getActiveProject(state);
  const targetPhase = args.targetPhase as PhaseId;

  if (!targetPhase) {
    return { success: false, message: 'targetPhase is required for advance-phase' };
  }

  const currentIndex = PHASE_ORDER.indexOf(project.currentPhase);
  const targetIndex = PHASE_ORDER.indexOf(targetPhase);

  if (targetIndex < 0) {
    return { success: false, message: `Unknown phase: ${targetPhase}` };
  }

  if (targetIndex <= currentIndex && project.completedPhases.includes(project.currentPhase)) {
    return { success: false, message: `Cannot move backward to phase "${targetPhase}". Current phase: ${project.currentPhase}` };
  }

  if (targetIndex > currentIndex + 1) {
    const skippedPhases = PHASE_ORDER.slice(currentIndex + 1, targetIndex);
    host.log.warn('Skipping phases', { skipped: skippedPhases });
  }

  project.currentPhase = targetPhase;
  project.updatedAt = new Date().toISOString();
  await host.workspace.setState(state);
  await host.workspace.setPhase(targetPhase);

  host.run.reportStep('advance-phase', 'product-manager');
  host.events.emitProgress(1.0, `Advanced to phase: ${targetPhase}`);
  await host.run.checkpoint();

  host.log.info('Phase advanced', { from: PHASE_ORDER[currentIndex], to: targetPhase });

  return {
    success: true,
    message: `Advanced to phase "${targetPhase}" for project "${project.name}"`,
    studioState: state,
    artifactIds: [],
    stepsUsed: host.run.getStepCount(),
    phasesCompleted: [],
  };
}

async function handleSwitchProject(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
  state: StudioState,
): Promise<Record<string, unknown>> {
  const projectName = args.projectName as string;
  if (!projectName) {
    return { success: false, message: 'projectName is required for switch-project' };
  }

  const project = state.projects.find((p) => p.name === projectName);
  if (!project) {
    const available = state.projects.map((p) => p.name).join(', ');
    return { success: false, message: `Project "${projectName}" not found. Available: ${available}` };
  }

  state.activeProjectId = project.id;
  await host.workspace.setState(state);
  await host.workspace.setPhase(project.currentPhase);

  host.run.reportStep('switch-project', 'product-manager');
  host.events.emitProgress(1.0, `Switched to project: ${projectName}`);
  await host.run.checkpoint();

  host.log.info('Project switched', { projectId: project.id, projectName });

  return {
    success: true,
    message: `Switched to project "${projectName}" (phase: ${project.currentPhase})`,
    studioState: state,
    artifactIds: [],
    stepsUsed: host.run.getStepCount(),
    phasesCompleted: [],
  };
}

async function handleReviewArtifact(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
  state: StudioState,
): Promise<Record<string, unknown>> {
  const artifactId = args.artifactId as string;
  const decision = args.decision as 'approve' | 'reject' | 'revise';
  const feedback = args.feedback as string | undefined;

  if (!artifactId || !decision) {
    return { success: false, message: 'artifactId and decision are required for review-artifact' };
  }

  const artifacts = await host.workspace.listArtifacts();
  const artifact = artifacts.find((a) => a.id === artifactId);
  if (!artifact) {
    return { success: false, message: `Artifact "${artifactId}" not found` };
  }

  host.run.reportStep('review-artifact', 'product-manager');

  if (decision === 'approve') {
    await host.workspace.updateArtifact(artifactId, { status: 'approved' });
    host.log.info('Artifact approved', { artifactId });
  } else if (decision === 'reject') {
    await host.workspace.updateArtifact(artifactId, {
      status: 'rejected',
      content: { userFeedback: feedback ?? '', decision: 'rejected' },
    });
    host.log.info('Artifact rejected', { artifactId, feedback });
  } else if (decision === 'revise') {
    // Create a new version linked to the original
    const project = getActiveProject(state);
    const revisedArtifact = await host.workspace.createArtifact({
      type: artifact.type,
      title: `${artifact.title} (revised)`,
      content: {
        projectId: project.id,
        revisionOf: artifactId,
        revisionFeedback: feedback ?? '',
        status: 'pending-revision',
        generatedAt: new Date().toISOString(),
      },
      createdByRole: 'product-manager',
      parentArtifactId: artifactId,
    });

    await host.workspace.updateArtifact(artifactId, { status: 'superseded' });
    project.artifactIds.push(revisedArtifact.id);
    await host.workspace.setState(state);

    host.log.info('Artifact revision created', {
      originalId: artifactId,
      revisedId: revisedArtifact.id,
      feedback,
    });

    host.events.emitProgress(1.0, 'Artifact revision created');
    await host.run.checkpoint();

    return {
      success: true,
      message: `Revision created for artifact "${artifactId}". New artifact: ${revisedArtifact.id}`,
      studioState: state,
      artifactIds: [revisedArtifact.id],
      stepsUsed: host.run.getStepCount(),
      phasesCompleted: [],
    };
  }

  host.events.emitProgress(1.0, `Artifact ${decision}ed`);
  await host.run.checkpoint();

  return {
    success: true,
    message: `Artifact "${artifactId}" ${decision}ed${feedback ? `. Feedback: ${feedback}` : ''}`,
    studioState: state,
    artifactIds: [],
    stepsUsed: host.run.getStepCount(),
    phasesCompleted: [],
  };
}

async function handleStatusReport(
  host: SkillHostCapabilities,
  state: StudioState,
): Promise<Record<string, unknown>> {
  await host.workspace.setRole('product-manager');
  host.run.reportStep('status-report', 'product-manager');
  host.events.emitProgress(0.2, 'Generating status report');

  const projectSummaries = state.projects.map((p) => {
    const codeProjectList = p.codeProjects.map((cp) => `${cp.name} (${cp.type})`).join(', ');
    return `Project: ${p.name}
  Phase: ${p.currentPhase}
  Completed: ${p.completedPhases.join(', ') || 'none'}
  Code Projects: ${codeProjectList || 'none'}
  Artifacts: ${p.artifactIds.length}`;
  }).join('\n\n');

  const result = await host.llm.complete({
    purposeId: 'status-report',
    systemPrompt: ROLE_PROMPTS['product-manager'],
    messages: [{
      role: 'user',
      content: `Generate a concise status report for the "${state.studioName}" studio.\n\nStudio has ${state.projects.length} project(s):\n\n${projectSummaries}\n\nSummarize overall progress, highlight blockers or risks, and recommend next actions.`,
    }],
    temperature: 0.2,
    maxTokens: 1500,
  });

  const artifact = await host.workspace.createArtifact({
    type: 'status-report',
    title: `Status Report: ${state.studioName}`,
    content: {
      studioName: state.studioName,
      projectCount: state.projects.length,
      body: result.text.trim(),
      generatedAt: new Date().toISOString(),
    },
    createdByRole: 'product-manager',
  });

  host.events.emitProgress(1.0, 'Status report generated');
  await host.run.checkpoint();
  host.log.info('Status report generated', { artifactId: artifact.id });

  return {
    success: true,
    message: `Status report generated for "${state.studioName}"`,
    studioState: state,
    artifactIds: [artifact.id],
    stepsUsed: host.run.getStepCount(),
    phasesCompleted: [],
  };
}

async function handleRedirect(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
  state: StudioState,
): Promise<Record<string, unknown>> {
  const project = getActiveProject(state);
  const redirectionAction = args.redirectionAction as UserRedirectionAction;

  if (!redirectionAction) {
    return { success: false, message: 'redirectionAction is required for redirect' };
  }

  host.run.reportStep(`redirect-${redirectionAction}`, 'product-manager');
  await host.run.checkpoint();

  switch (redirectionAction) {
    case 'redefine-roadmap': {
      const feedback = args.feedback as string | undefined;
      host.log.info('Redefining roadmap', { feedback });
      return handleGenerateRoadmap({ feedback }, host, state);
    }

    case 'redefine-phase': {
      const feedback = args.feedback as string | undefined;
      host.log.info('Redefining current phase', { phase: project.currentPhase, feedback });
      // Clear completed flag for current phase to allow re-run
      project.completedPhases = project.completedPhases.filter((p) => p !== project.currentPhase);
      project.updatedAt = new Date().toISOString();
      await host.workspace.setState(state);
      return handleRunPhase({ targetPhase: project.currentPhase, feedback }, host, state);
    }

    case 'reorder-phases': {
      const userInput = (await host.run.requestInput({
        title: 'Reorder Roadmap Phases',
        message: 'Provide the new phase ordering as a comma-separated list of phase IDs.',
        inputSchema: {
          type: 'object',
          properties: {
            newOrder: { type: 'string', description: 'Comma-separated phase IDs in new order' },
          },
          required: ['newOrder'],
        },
      })) as { newOrder: string };

      const newOrder = userInput.newOrder.split(',').map((s) => s.trim()) as PhaseId[];
      if (project.roadmap) {
        const reordered: RoadmapEntry[] = [];
        for (const phaseId of newOrder) {
          const entry = project.roadmap.find((r) => r.phase === phaseId);
          if (entry) reordered.push(entry);
        }
        // Keep any entries not mentioned in the new order at the end
        for (const entry of project.roadmap) {
          if (!reordered.includes(entry)) reordered.push(entry);
        }
        project.roadmap = reordered;

        const newVersion: RoadmapVersion = {
          id: generateId(),
          version: (project.roadmapVersions?.length ?? 0) + 1,
          entries: reordered,
          createdAt: new Date().toISOString(),
          decision: null,
        };
        if (!project.roadmapVersions) project.roadmapVersions = [];
        project.roadmapVersions.push(newVersion);
      }
      project.updatedAt = new Date().toISOString();
      await host.workspace.setState(state);
      await host.run.checkpoint();

      return {
        success: true,
        message: `Roadmap phases reordered for "${project.name}"`,
        studioState: state,
        artifactIds: [],
        stepsUsed: host.run.getStepCount(),
        phasesCompleted: [],
      };
    }

    case 'reduce-scope':
    case 'expand-scope': {
      const scopeInput = (await host.run.requestInput({
        title: redirectionAction === 'reduce-scope' ? 'Reduce Scope' : 'Expand Scope',
        message: redirectionAction === 'reduce-scope'
          ? 'Describe what to remove or simplify in the roadmap.'
          : 'Describe what to add or expand in the roadmap.',
        inputSchema: {
          type: 'object',
          properties: {
            scopeChanges: { type: 'string', description: 'Scope change description' },
          },
          required: ['scopeChanges'],
        },
      })) as { scopeChanges: string };

      // Re-generate roadmap with scope change context
      return handleGenerateRoadmap({ feedback: `Scope change (${redirectionAction}): ${scopeInput.scopeChanges}` }, host, state);
    }

    case 'pivot': {
      host.log.info('Pivoting — resetting to discovery with context preservation');
      const pivotContext = buildProjectContext(project);
      project.currentPhase = 'discovery';
      project.completedPhases = [];
      project.updatedAt = new Date().toISOString();
      await host.workspace.setState(state);
      await host.workspace.setPhase('discovery');

      // Create pivot artifact preserving context
      const pivotArtifact = await host.workspace.createArtifact({
        type: 'phase-summary',
        title: `Pivot Context: ${project.name}`,
        content: {
          projectId: project.id,
          pivotReason: (args.feedback as string) ?? 'User-initiated pivot',
          previousContext: pivotContext,
          previousPhase: project.currentPhase,
          generatedAt: new Date().toISOString(),
        },
        createdByRole: 'ceo',
      });
      project.artifactIds.push(pivotArtifact.id);
      await host.workspace.setState(state);
      await host.run.checkpoint();

      return {
        success: true,
        message: `Project "${project.name}" pivoted. Restarting from discovery.`,
        studioState: state,
        artifactIds: [pivotArtifact.id],
        stepsUsed: host.run.getStepCount(),
        phasesCompleted: [],
      };
    }

    case 'change-priorities': {
      if (!project.implementationStatus) {
        return { success: false, message: 'No implementation status to reorder' };
      }

      const priorityInput = (await host.run.requestInput({
        title: 'Change Implementation Priorities',
        message: `Current sub-phases:\n${project.implementationStatus.roadmapPhaseRecords.map((r, i) => `${i}: ${r.label} (${r.status})`).join('\n')}\n\nProvide the new order as comma-separated indices.`,
        inputSchema: {
          type: 'object',
          properties: {
            newOrder: { type: 'string', description: 'Comma-separated indices in new order' },
          },
          required: ['newOrder'],
        },
      })) as { newOrder: string };

      const indices = priorityInput.newOrder.split(',').map((s) => parseInt(s.trim(), 10));
      const reordered: ImplementationPhaseRecord[] = [];
      for (const idx of indices) {
        if (project.implementationStatus.roadmapPhaseRecords[idx]) {
          reordered.push(project.implementationStatus.roadmapPhaseRecords[idx]);
        }
      }
      // Append any not mentioned
      for (const r of project.implementationStatus.roadmapPhaseRecords) {
        if (!reordered.includes(r)) reordered.push(r);
      }
      project.implementationStatus.roadmapPhaseRecords = reordered;
      project.updatedAt = new Date().toISOString();
      await host.workspace.setState(state);
      await host.run.checkpoint();

      return {
        success: true,
        message: `Implementation priorities reordered for "${project.name}"`,
        studioState: state,
        artifactIds: [],
        stepsUsed: host.run.getStepCount(),
        phasesCompleted: [],
      };
    }

    case 'pause': {
      await host.workspace.setState(state);
      await host.run.checkpoint();
      // pause() throws SkillPausedSignal — execution stops here, the return is never reached
      await host.run.pause('User-initiated pause');
      // Unreachable: pause() throws a signal caught by the agentic engine
      throw new Error('Unreachable: host.run.pause() should have thrown SkillPausedSignal');
    }

    case 'continue': {
      return {
        success: true,
        message: `Project "${project.name}" continuing from phase "${project.currentPhase}"`,
        studioState: state,
        artifactIds: [],
        stepsUsed: host.run.getStepCount(),
        phasesCompleted: [],
      };
    }

    case 'stop': {
      host.log.info('Stopping remaining phases');
      if (project.implementationStatus) {
        for (const record of project.implementationStatus.roadmapPhaseRecords) {
          if (record.status === 'not_started' || record.status === 'planning') {
            record.status = 'failed';
            record.userDecision = 'cancel';
          }
        }
      }
      project.updatedAt = new Date().toISOString();
      await host.workspace.setState(state);
      await host.run.checkpoint();

      return {
        success: true,
        message: `Remaining phases cancelled for "${project.name}"`,
        studioState: state,
        artifactIds: [],
        stepsUsed: host.run.getStepCount(),
        phasesCompleted: [],
      };
    }

    default:
      return { success: false, message: `Unknown redirection action: ${redirectionAction}` };
  }
}

// ── Main Execute Entry Point ────────────────────────────────────────────────

export async function execute(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const action = args.action as string;

  if (!action) {
    return { success: false, message: 'action is required' };
  }

  // Load existing state (resume support)
  const state: StudioState | null = await host.workspace.getState();

  // init-studio does not require existing state
  if (action === 'init-studio') {
    return handleInitStudio(args, host);
  }

  // All other actions require an initialized studio
  if (!state) {
    return { success: false, message: 'Studio not initialized. Run init-studio first.' };
  }

  switch (action) {
    case 'create-project':
      return handleCreateProject(args, host, state);

    case 'generate-roadmap':
      return handleGenerateRoadmap(args, host, state);

    case 'run-phase':
      return handleRunPhase(args, host, state);

    case 'advance-phase':
      return handleAdvancePhase(args, host, state);

    case 'switch-project':
      return handleSwitchProject(args, host, state);

    case 'review-artifact':
      return handleReviewArtifact(args, host, state);

    case 'status-report':
      return handleStatusReport(host, state);

    case 'run-implementation-subphase': {
      if (!state) return { success: false, message: 'Studio not initialized.' };
      const project = getActiveProject(state);
      const phaseIndex = args.roadmapPhaseIndex as number;
      if (phaseIndex == null) return { success: false, message: 'roadmapPhaseIndex is required' };
      const result = await handleRunImplementationSubphase(host, state, project, phaseIndex);
      return {
        success: result.success,
        message: result.success
          ? `Implementation sub-phase ${phaseIndex} completed`
          : `Implementation sub-phase ${phaseIndex} did not complete`,
        studioState: state,
        artifactIds: result.artifactIds,
        stepsUsed: host.run.getStepCount(),
        phasesCompleted: [],
      };
    }

    case 'redirect':
      return handleRedirect(args, host, state);

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Startup Product Studio — Agentic Skill Module
// ─────────────────────────────────────────────────────────────────────────────
// End-to-end product creation skill with role-based execution, phased roadmaps,
// multi-project workspaces, user approvals, and Claude Code integration path.
// ─────────────────────────────────────────────────────────────────────────────

// ── Host Capabilities Interface ─────────────────────────────────────────────

type BridgeCommandResult = {
  accepted: true; bridgeRunId: string; requestId: string;
} | {
  accepted: false; code: string; message: string;
};

type BridgeInstallResult = {
  accepted: true; bridgeRunId: string;
} | {
  accepted: false; code: string; message: string;
};

type BridgeJobOutcome = {
  status: 'completed'; exitCode: number; stdout: string; stderr: string;
} | {
  status: 'failed'; reason: string;
} | {
  status: 'terminated';
};

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
    pause(reason: string): Promise<never>;
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

interface CeoStrategicBrief {
  visionStatement: string;
  strategicConstraints: string[];
  targetMarketFocus: string;
  competitivePositioning: string;
  riskThresholds: {
    maxHighRiskPhases: number;
    criticalDependencies: string[];
  };
  scopeGuidance: {
    mustInclude: string[];
    mustExclude: string[];
    deferToV2: string[];
  };
}

interface CeoStrategicValidation {
  coherenceScore: 'aligned' | 'minor-concerns' | 'misaligned';
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

// ── Architecture Plan Artifact Types ────────────────────────────────────────

interface ArchitectureSystemOverview {
  description: string;
  productRelationship: string;
  technicalConstraints: string[];
}

type ArchitectureProjectType = 'web-app' | 'backend-api' | 'mobile-app' | 'worker' | 'infra' | 'shared-package' | 'docs';

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

type ArchitectureRiskSeverity = 'low' | 'medium' | 'high' | 'critical';

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

// ── Implementation Phase Plan Artifact Types ────────────────────────────────

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
  roadmapEntryPhase: PhaseId;
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
  decision: 'approve' | 'reject' | 'revise' | 'approve-with-changes' | 'pause' | 'cancel';
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

interface ArchitecturePlanVersion {
  id: string;
  version: number;
  artifactId: string;
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
  roadmapPhaseId: string | null;
  label: string;
  status: RoadmapPhaseStatus;
  goals: string[];
  deliverables: string[];
  validationCriteria: string[];
  involvedProjectIds: string[];
  architectureSlices: string[];
  technicalDependencies: string[];
  planArtifactId: string | null;
  implementationReportArtifactId: string | null;
  qaReportArtifactId: string | null;
  pmAlignmentDecision: ValidationEntry['decision'] | null;
  userDecision: ValidationEntry['decision'] | null;
  bridgeJobIds: string[];
  implementationPlanVersions: ImplementationPlanVersion[];
  taskGroupProgress: TaskGroupProgress[];
  currentTaskGroupIndex: number | null;
}

interface ImplementationPlanVersion {
  id: string;
  version: number;
  artifactId: string;
  phaseRecordId: string;
  createdAt: string;
  decision: ValidationEntry['decision'] | null;
}

interface TaskGroupProgress {
  groupLabel: string;
  taskIds: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  bridgeJobIds: string[];
  startedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
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
  approvedRoadmapPhases: RoadmapPhase[] | null;
  approvedRoadmapTopology: RoadmapProjectTopologyEntry[] | null;
  architecturePlanVersions: ArchitecturePlanVersion[];
  approvedArchitecturePlan: ArchitecturePlanArtifactContent | null;
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

function buildEditContext(
  phaseEdits?: Array<{ phaseId: string; action: string; details: string }>,
  scopeChanges?: { addToIncluded?: string[]; removeFromIncluded?: string[]; addToExcluded?: string[]; removeFromExcluded?: string[] },
): string {
  const parts: string[] = [];
  if (phaseEdits && phaseEdits.length > 0) {
    parts.push('Phase edits requested by the user:');
    for (const edit of phaseEdits) {
      parts.push(`- Phase "${edit.phaseId}": ${edit.action}${edit.details ? ` — ${edit.details}` : ''}`);
    }
  }
  if (scopeChanges) {
    const entries: string[] = [];
    if (scopeChanges.addToIncluded?.length) entries.push(`Add to included scope: ${scopeChanges.addToIncluded.join(', ')}`);
    if (scopeChanges.removeFromIncluded?.length) entries.push(`Remove from included scope: ${scopeChanges.removeFromIncluded.join(', ')}`);
    if (scopeChanges.addToExcluded?.length) entries.push(`Add to excluded scope: ${scopeChanges.addToExcluded.join(', ')}`);
    if (scopeChanges.removeFromExcluded?.length) entries.push(`Remove from excluded scope: ${scopeChanges.removeFromExcluded.join(', ')}`);
    if (entries.length > 0) {
      parts.push('Scope changes requested by the user:');
      parts.push(...entries.map((e) => `- ${e}`));
    }
  }
  return parts.length > 0 ? parts.join('\n') : '';
}

type ArchitectureSectionEditAction =
  | 'simplify'
  | 'add-detail'
  | 'replace'
  | 'remove-component'
  | 'add-component'
  | 'change-technology'
  | 'restructure';

type ArchitectureGateResponse = {
  decision: string;
  feedback?: string;
  sectionEdits?: Array<{ sectionId: string; action: ArchitectureSectionEditAction; details: string }>;
  topologyChanges?: { addProjects?: string[]; removeProjects?: string[]; changeTypes?: string[] };
};

const ARCHITECTURE_SECTION_EDIT_ACTIONS: ArchitectureSectionEditAction[] = [
  'simplify', 'add-detail', 'replace', 'remove-component', 'add-component', 'change-technology', 'restructure',
];

const ARCHITECTURE_SECTION_IDS = [
  'systemOverview', 'projectTopology', 'runtimeArchitecture', 'dataArchitecture',
  'integrationArchitecture', 'securityAndTrustModel', 'deploymentAndEnvironmentModel',
  'qualityAttributes', 'phaseMapping', 'implementationGuidelines', 'openRisks', 'openQuestions',
] as const;

function buildArchitectureGateSchema(allowRevise: boolean) {
  const decisions = allowRevise
    ? ['approve', 'reject', 'revise', 'approve-with-changes', 'pause', 'cancel']
    : ['approve', 'approve-with-changes', 'pause', 'cancel'];
  return {
    type: 'object',
    properties: {
      decision: {
        type: 'string',
        enum: decisions,
        description: 'Decision for architecture review',
      },
      feedback: { type: 'string', description: 'Feedback on architecture decisions' },
      sectionEdits: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sectionId: { type: 'string', enum: [...ARCHITECTURE_SECTION_IDS] },
            action: { type: 'string', enum: [...ARCHITECTURE_SECTION_EDIT_ACTIONS] },
            details: { type: 'string' },
          },
        },
        description: 'Structured section-level edits to the architecture plan',
      },
      topologyChanges: {
        type: 'object',
        properties: {
          addProjects: { type: 'array', items: { type: 'string' } },
          removeProjects: { type: 'array', items: { type: 'string' } },
          changeTypes: { type: 'array', items: { type: 'string' } },
        },
        description: 'Changes to project topology (add/remove projects, change project types)',
      },
    },
    required: ['decision'],
  };
}

function buildArchitectureEditContext(
  sectionEdits?: ArchitectureGateResponse['sectionEdits'],
  topologyChanges?: ArchitectureGateResponse['topologyChanges'],
): string {
  const parts: string[] = [];
  if (sectionEdits && sectionEdits.length > 0) {
    parts.push('Section edits requested by the user:');
    for (const edit of sectionEdits) {
      parts.push(`- Section "${edit.sectionId}": ${edit.action}${edit.details ? ` — ${edit.details}` : ''}`);
    }
  }
  if (topologyChanges) {
    const entries: string[] = [];
    if (topologyChanges.addProjects?.length) entries.push(`Add projects: ${topologyChanges.addProjects.join(', ')}`);
    if (topologyChanges.removeProjects?.length) entries.push(`Remove projects: ${topologyChanges.removeProjects.join(', ')}`);
    if (topologyChanges.changeTypes?.length) entries.push(`Change project types: ${topologyChanges.changeTypes.join(', ')}`);
    if (entries.length > 0) {
      parts.push('Topology changes requested by the user:');
      parts.push(...entries.map((e) => `- ${e}`));
    }
  }
  return parts.length > 0 ? parts.join('\n') : '';
}

// ---------------------------------------------------------------------------
// Implementation Phase Plan Gate
// ---------------------------------------------------------------------------

type ImplPlanTaskEditAction = 'remove' | 'reprioritize' | 'change-scope' | 'change-type' | 'add';
type ImplPlanRiskEditAction = 'remove' | 'change-severity' | 'add';

type ImplPlanGateResponse = {
  decision: string;
  feedback?: string;
  taskEdits?: Array<{ taskId: string; action: ImplPlanTaskEditAction; details: string; newType?: string }>;
  scopeChanges?: { addToIncluded?: string[]; removeFromIncluded?: string[]; addToExcluded?: string[]; removeFromExcluded?: string[] };
  riskEdits?: Array<{ riskId: string; action: ImplPlanRiskEditAction; details: string; newSeverity?: string }>;
  dependencyChanges?: { reorderGroups?: string; changeDependencies?: string };
};

function buildImplPlanGateSchema(allowRevise: boolean) {
  const decisions = allowRevise
    ? ['approve', 'reject', 'revise', 'approve-with-changes', 'pause', 'cancel']
    : ['approve', 'approve-with-changes', 'pause', 'cancel'];
  return {
    type: 'object',
    properties: {
      decision: {
        type: 'string',
        enum: decisions,
        description: 'Decision for this implementation plan',
      },
      feedback: { type: 'string', description: 'Feedback or revision requests' },
      taskEdits: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            action: { type: 'string', enum: ['remove', 'reprioritize', 'change-scope', 'change-type', 'add'] },
            details: { type: 'string' },
            newType: { type: 'string', enum: ['feature', 'refactor', 'integration', 'config', 'test', 'docs'] },
          },
        },
        description: 'Structured task-level edits',
      },
      scopeChanges: {
        type: 'object',
        properties: {
          addToIncluded: { type: 'array', items: { type: 'string' } },
          removeFromIncluded: { type: 'array', items: { type: 'string' } },
          addToExcluded: { type: 'array', items: { type: 'string' } },
          removeFromExcluded: { type: 'array', items: { type: 'string' } },
        },
        description: 'Structured scope changes',
      },
      riskEdits: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            riskId: { type: 'string' },
            action: { type: 'string', enum: ['remove', 'change-severity', 'add'] },
            details: { type: 'string' },
            newSeverity: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
        },
        description: 'Structured risk edits',
      },
      dependencyChanges: {
        type: 'object',
        properties: {
          reorderGroups: { type: 'string' },
          changeDependencies: { type: 'string' },
        },
        description: 'Dependency and ordering changes',
      },
    },
    required: ['decision'],
  };
}

function buildImplPlanEditContext(
  taskEdits?: ImplPlanGateResponse['taskEdits'],
  scopeChanges?: ImplPlanGateResponse['scopeChanges'],
  riskEdits?: ImplPlanGateResponse['riskEdits'],
  dependencyChanges?: ImplPlanGateResponse['dependencyChanges'],
): string {
  const parts: string[] = [];
  if (taskEdits && taskEdits.length > 0) {
    parts.push('Task edits requested by the user:');
    for (const edit of taskEdits) {
      const typeInfo = edit.action === 'change-type' && edit.newType ? ` (new type: ${edit.newType})` : '';
      parts.push(`- Task "${edit.taskId}": ${edit.action}${typeInfo}${edit.details ? ` — ${edit.details}` : ''}`);
    }
  }
  if (scopeChanges) {
    const entries: string[] = [];
    if (scopeChanges.addToIncluded?.length) entries.push(`Add to included scope: ${scopeChanges.addToIncluded.join(', ')}`);
    if (scopeChanges.removeFromIncluded?.length) entries.push(`Remove from included scope: ${scopeChanges.removeFromIncluded.join(', ')}`);
    if (scopeChanges.addToExcluded?.length) entries.push(`Add to excluded scope: ${scopeChanges.addToExcluded.join(', ')}`);
    if (scopeChanges.removeFromExcluded?.length) entries.push(`Remove from excluded scope: ${scopeChanges.removeFromExcluded.join(', ')}`);
    if (entries.length > 0) {
      parts.push('Scope changes requested by the user:');
      parts.push(...entries.map((e) => `- ${e}`));
    }
  }
  if (riskEdits && riskEdits.length > 0) {
    parts.push('Risk edits requested by the user:');
    for (const edit of riskEdits) {
      const severityInfo = edit.action === 'change-severity' && edit.newSeverity ? ` (new severity: ${edit.newSeverity})` : '';
      parts.push(`- Risk "${edit.riskId}": ${edit.action}${severityInfo}${edit.details ? ` — ${edit.details}` : ''}`);
    }
  }
  if (dependencyChanges) {
    const entries: string[] = [];
    if (dependencyChanges.reorderGroups) entries.push(`Reorder groups: ${dependencyChanges.reorderGroups}`);
    if (dependencyChanges.changeDependencies) entries.push(`Change dependencies: ${dependencyChanges.changeDependencies}`);
    if (entries.length > 0) {
      parts.push('Dependency changes requested by the user:');
      parts.push(...entries.map((e) => `- ${e}`));
    }
  }
  return parts.length > 0 ? parts.join('\n') : '';
}

function hasBudgetFor(host: SkillHostCapabilities, needed: number): boolean {
  const budget = host.run.getStepBudget();
  if (budget === null) return true;
  return host.run.getStepCount() + needed <= budget;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

  if (project.approvedArchitecturePlan) {
    context += `\n\nApproved Architecture: ${project.approvedArchitecturePlan.systemOverview.description}`;
    context += `\nArchitecture Topology: ${project.approvedArchitecturePlan.projectTopology.map((p) => p.name).join(', ')}`;
  }

  return context;
}

function buildArchitectureContextForPhase(
  project: ProjectRecord,
  record: ImplementationPhaseRecord,
): string {
  const plan = project.approvedArchitecturePlan;
  if (!plan) return '';

  const sections: string[] = [];

  if (record.architectureSlices.length > 0) {
    sections.push(`Architecture Slices for this phase:\n${record.architectureSlices.map((s) => `- ${s}`).join('\n')}`);
  }

  if (record.technicalDependencies.length > 0) {
    sections.push(`Technical Dependencies:\n${record.technicalDependencies.map((d) => `- ${d}`).join('\n')}`);
  }

  const guidelines = plan.implementationGuidelines;
  const guidelineParts: string[] = [];
  if (guidelines.rules.length > 0) {
    guidelineParts.push(`Rules:\n${guidelines.rules.map((r) => `- ${r}`).join('\n')}`);
  }
  if (guidelines.boundariesToPreserve.length > 0) {
    guidelineParts.push(`Boundaries to Preserve:\n${guidelines.boundariesToPreserve.map((b) => `- ${b}`).join('\n')}`);
  }
  if (guidelines.antiPatterns.length > 0) {
    guidelineParts.push(`Anti-Patterns to Avoid:\n${guidelines.antiPatterns.map((a) => `- ${a}`).join('\n')}`);
  }
  if (guidelines.codingExpectations.length > 0) {
    guidelineParts.push(`Coding Expectations:\n${guidelines.codingExpectations.map((c) => `- ${c}`).join('\n')}`);
  }
  if (guidelineParts.length > 0) {
    sections.push(`Implementation Guidelines:\n${guidelineParts.join('\n')}`);
  }

  if (record.involvedProjectIds.length > 0) {
    const relevantTopology = plan.projectTopology.filter((p) =>
      record.involvedProjectIds.some((id) => p.id === id || p.name === id),
    );
    if (relevantTopology.length > 0) {
      sections.push(`Relevant Project Topology:\n${relevantTopology.map((p) => `- ${p.name} (${p.type}): ${p.purpose}${p.dependencies.length > 0 ? ` [depends: ${p.dependencies.join(', ')}]` : ''}`).join('\n')}`);
    }
  }

  const qa = plan.qualityAttributes;
  sections.push(`Quality Attributes:\n- Maintainability: ${qa.maintainability}\n- Scalability: ${qa.scalability}\n- Testability: ${qa.testability}\n- Reliability: ${qa.reliability}\n- Performance: ${qa.performance}\n- Developer Experience: ${qa.developerExperience}`);

  if (plan.openRisks.length > 0) {
    const involvedNames = record.involvedProjectIds.length > 0
      ? record.involvedProjectIds.flatMap((id) => {
          const topo = plan.projectTopology.find((p) => p.id === id || p.name === id);
          return topo ? [topo.name, topo.id] : [id];
        })
      : [];
    const relevantRisks = involvedNames.length > 0
      ? plan.openRisks.filter((r) => involvedNames.some((n) => r.description.toLowerCase().includes(n.toLowerCase())))
      : plan.openRisks;
    if (relevantRisks.length > 0) {
      sections.push(`Relevant Risks:\n${relevantRisks.map((r) => `- [${r.severity}] ${r.description}`).join('\n')}`);
    }
  }

  return sections.join('\n\n');
}

function buildClaudeCodeArchitectureGuidance(
  project: ProjectRecord,
  record: ImplementationPhaseRecord,
): string {
  const plan = project.approvedArchitecturePlan;
  if (!plan) return '';

  const sections: string[] = [];
  const gl = plan.implementationGuidelines;

  if (gl.boundariesToPreserve.length > 0) {
    sections.push(`ARCHITECTURE BOUNDARIES (do not violate):\n${gl.boundariesToPreserve.map((b) => `- ${b}`).join('\n')}`);
  }
  if (gl.antiPatterns.length > 0) {
    sections.push(`ANTI-PATTERNS (avoid):\n${gl.antiPatterns.map((a) => `- ${a}`).join('\n')}`);
  }
  if (gl.codingExpectations.length > 0) {
    sections.push(`CODING EXPECTATIONS:\n${gl.codingExpectations.map((c) => `- ${c}`).join('\n')}`);
  }
  if (record.architectureSlices.length > 0) {
    sections.push(`ARCHITECTURE SLICES for this phase:\n${record.architectureSlices.map((s) => `- ${s}`).join('\n')}`);
  }

  if (record.involvedProjectIds.length > 0) {
    const relevantTopology = plan.projectTopology.filter((p) =>
      record.involvedProjectIds.some((id) => p.id === id || p.name === id),
    );
    if (relevantTopology.length > 0) {
      sections.push(`PROJECT TOPOLOGY:\n${relevantTopology.map((p) => `- ${p.name}: ${p.purpose}${p.dependencies.length > 0 ? ` [depends: ${p.dependencies.join(', ')}]` : ''}`).join('\n')}`);
    }
  }

  if (sections.length === 0) return '';
  return `\n\n--- ARCHITECTURE GUIDANCE ---\n${sections.join('\n\n')}\n--- END ARCHITECTURE GUIDANCE ---`;
}

function buildTaskGroupExecutionPrompt(
  project: ProjectRecord,
  record: ImplementationPhaseRecord,
  planContent: ImplementationPhasePlanArtifactContent,
  taskGroup: ImplPlanTaskGroup,
  groupIndex: number,
  totalGroups: number,
  targetProjectId: string,
): string {
  const sections: string[] = [];

  // Phase header
  sections.push(`Implementation Sub-Phase: ${record.label}`);
  if (record.goals.length > 0) {
    sections.push(`Goals:\n${record.goals.map((g) => `- ${g}`).join('\n')}`);
  }
  if (record.deliverables.length > 0) {
    sections.push(`Deliverables:\n${record.deliverables.map((d) => `- ${d}`).join('\n')}`);
  }

  // Architecture guidance
  const archGuidance = buildClaudeCodeArchitectureGuidance(project, record);
  if (archGuidance) sections.push(archGuidance);

  // Task group context
  sections.push(`\n--- TASK GROUP ${groupIndex + 1} of ${totalGroups}: ${taskGroup.groupLabel} ---`);

  // Tasks filtered to target project
  const projectTasks = taskGroup.tasks.filter((t) => t.projectId === targetProjectId);
  if (projectTasks.length > 0) {
    const taskLines = projectTasks.map((t) =>
      `[${t.id}] ${t.title} (${t.type})\n  Description: ${t.description}\n  Expected Outcome: ${t.expectedOutcome}${t.dependencies.length > 0 ? `\n  Depends on: ${t.dependencies.join(', ')}` : ''}`,
    );
    sections.push(`Tasks for this project:\n${taskLines.join('\n\n')}`);
  } else {
    // Include all tasks if none specifically target this project (cross-cutting group)
    const taskLines = taskGroup.tasks.map((t) =>
      `[${t.id}] ${t.title} (${t.type}) [project: ${t.projectId}]\n  Description: ${t.description}\n  Expected Outcome: ${t.expectedOutcome}${t.dependencies.length > 0 ? `\n  Depends on: ${t.dependencies.join(', ')}` : ''}`,
    );
    sections.push(`Tasks:\n${taskLines.join('\n\n')}`);
  }

  // Relevant interfaces/contracts
  if (planContent.interfacesAndContracts) {
    const ic = planContent.interfacesAndContracts;
    const relevantApis = ic.apis.filter(
      (a) => a.producerProjectId === targetProjectId || a.consumerProjectIds.includes(targetProjectId),
    );
    if (relevantApis.length > 0) {
      sections.push(`Relevant API Contracts:\n${relevantApis.map((a) => `- ${a.name}: ${a.description} (producer: ${a.producerProjectId}, consumers: ${a.consumerProjectIds.join(', ')})`).join('\n')}`);
    }
    if (ic.boundaries.length > 0) {
      sections.push(`Boundaries:\n${ic.boundaries.map((b) => `- ${b}`).join('\n')}`);
    }
  }

  // Relevant data models
  if (planContent.dataChanges?.newModels) {
    const relevantModels = planContent.dataChanges.newModels.filter((m) => m.projectId === targetProjectId);
    if (relevantModels.length > 0) {
      sections.push(`New Data Models:\n${relevantModels.map((m) => `- ${m.name}: ${m.description} [fields: ${m.fields.join(', ')}]`).join('\n')}`);
    }
  }

  // Definition of done
  if (planContent.definitionOfDone && planContent.definitionOfDone.length > 0) {
    sections.push(`Definition of Done:\n${planContent.definitionOfDone.map((d) => `- ${d}`).join('\n')}`);
  }

  sections.push('--- END TASK GROUP ---');
  sections.push("Follow the project's .claude configuration for coding standards, testing expectations, and TDD guidance.");

  return sections.join('\n\n');
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

const VALID_RISK_LEVELS = ['low', 'medium', 'high'];
const VALID_COMPLEXITY_LEVELS = ['low', 'medium', 'high'];

function validateRoadmapCanonical(canonical: RoadmapArtifactContent): void {
  const errors: string[] = [];

  if (!canonical.productSummary?.description) errors.push('productSummary.description is required');
  if (!Array.isArray(canonical.productSummary?.targetUsers) || canonical.productSummary.targetUsers.length === 0) {
    errors.push('productSummary.targetUsers must be a non-empty array');
  }
  if (!canonical.productSummary?.coreValueProposition) errors.push('productSummary.coreValueProposition is required');

  if (!Array.isArray(canonical.productScope?.included)) errors.push('productScope.included must be an array');
  if (!Array.isArray(canonical.productScope?.excluded)) errors.push('productScope.excluded must be an array');

  if (!Array.isArray(canonical.phases) || canonical.phases.length === 0) {
    errors.push('phases must be a non-empty array');
  } else {
    for (let i = 0; i < canonical.phases.length; i++) {
      const p = canonical.phases[i];
      if (!p.id) errors.push(`phases[${i}].id is required`);
      if (!p.name) errors.push(`phases[${i}].name is required`);
      if (!Array.isArray(p.goals) || p.goals.length === 0) errors.push(`phases[${i}].goals must be non-empty`);
      if (!Array.isArray(p.deliverables) || p.deliverables.length === 0) errors.push(`phases[${i}].deliverables must be non-empty`);
      if (!Array.isArray(p.validationCriteria) || p.validationCriteria.length === 0) {
        errors.push(`phases[${i}].validationCriteria must be non-empty`);
      }
      if (!VALID_RISK_LEVELS.includes(p.riskLevel)) errors.push(`phases[${i}].riskLevel must be low|medium|high`);
      if (!VALID_COMPLEXITY_LEVELS.includes(p.estimatedComplexity)) errors.push(`phases[${i}].estimatedComplexity must be low|medium|high`);
    }
  }

  if (!Array.isArray(canonical.milestones)) errors.push('milestones must be an array');
  if (!Array.isArray(canonical.assumptions)) errors.push('assumptions must be an array');
  if (!Array.isArray(canonical.openQuestions)) errors.push('openQuestions must be an array');

  if (errors.length > 0) {
    throw new Error(`Roadmap validation failed:\n- ${errors.join('\n- ')}`);
  }
}

function validateStrategicBrief(brief: CeoStrategicBrief): void {
  const errors: string[] = [];

  if (!brief.visionStatement) errors.push('visionStatement is required');
  if (!brief.scopeGuidance) errors.push('scopeGuidance is required');
  else {
    if (!Array.isArray(brief.scopeGuidance.mustInclude)) errors.push('scopeGuidance.mustInclude must be an array');
    if (!Array.isArray(brief.scopeGuidance.mustExclude)) errors.push('scopeGuidance.mustExclude must be an array');
    if (!Array.isArray(brief.scopeGuidance.deferToV2)) errors.push('scopeGuidance.deferToV2 must be an array');
  }
  if (!brief.riskThresholds) errors.push('riskThresholds is required');
  else if (typeof brief.riskThresholds.maxHighRiskPhases !== 'number') {
    errors.push('riskThresholds.maxHighRiskPhases must be a number');
  }

  if (errors.length > 0) {
    throw new Error(`Strategic brief validation failed:\n- ${errors.join('\n- ')}`);
  }
}

const VALID_ARCHITECTURE_PROJECT_TYPES: ArchitectureProjectType[] = [
  'web-app', 'backend-api', 'mobile-app', 'worker', 'infra', 'shared-package', 'docs',
];

const VALID_RISK_SEVERITIES: ArchitectureRiskSeverity[] = ['low', 'medium', 'high', 'critical'];

function validateArchitecturePlanCanonical(canonical: ArchitecturePlanArtifactContent): void {
  const errors: string[] = [];

  // systemOverview
  if (!canonical.systemOverview) {
    errors.push('systemOverview is required');
  } else {
    if (!canonical.systemOverview.description) errors.push('systemOverview.description is required');
    if (!canonical.systemOverview.productRelationship) errors.push('systemOverview.productRelationship is required');
    if (!Array.isArray(canonical.systemOverview.technicalConstraints)) errors.push('systemOverview.technicalConstraints must be an array');
  }

  // projectTopology
  if (!Array.isArray(canonical.projectTopology) || canonical.projectTopology.length === 0) {
    errors.push('projectTopology must be a non-empty array');
  } else {
    for (const entry of canonical.projectTopology) {
      if (!entry.id) errors.push('projectTopology entry missing id');
      if (!entry.name) errors.push('projectTopology entry missing name');
      if (!entry.purpose) errors.push('projectTopology entry missing purpose');
      if (!VALID_ARCHITECTURE_PROJECT_TYPES.includes(entry.type)) {
        errors.push(`projectTopology entry has invalid type: ${entry.type}`);
      }
      if (!Array.isArray(entry.dependencies)) errors.push('projectTopology entry missing dependencies array');
    }
  }

  // runtimeArchitecture
  if (!canonical.runtimeArchitecture) {
    errors.push('runtimeArchitecture is required');
  } else {
    if (!Array.isArray(canonical.runtimeArchitecture.frontends)) errors.push('runtimeArchitecture.frontends must be an array');
    if (!Array.isArray(canonical.runtimeArchitecture.backends)) errors.push('runtimeArchitecture.backends must be an array');
    if (!Array.isArray(canonical.runtimeArchitecture.backgroundProcessing)) errors.push('runtimeArchitecture.backgroundProcessing must be an array');
    if (!Array.isArray(canonical.runtimeArchitecture.externalIntegrations)) errors.push('runtimeArchitecture.externalIntegrations must be an array');
  }

  // dataArchitecture
  if (!canonical.dataArchitecture) {
    errors.push('dataArchitecture is required');
  } else {
    if (!Array.isArray(canonical.dataArchitecture.dataDomains)) errors.push('dataArchitecture.dataDomains must be an array');
    if (!Array.isArray(canonical.dataArchitecture.persistenceStrategy)) errors.push('dataArchitecture.persistenceStrategy must be an array');
    if (!Array.isArray(canonical.dataArchitecture.boundaries)) errors.push('dataArchitecture.boundaries must be an array');
    if (!Array.isArray(canonical.dataArchitecture.stateOwnership)) errors.push('dataArchitecture.stateOwnership must be an array');
  }

  // integrationArchitecture
  if (!canonical.integrationArchitecture) {
    errors.push('integrationArchitecture is required');
  } else {
    if (!Array.isArray(canonical.integrationArchitecture.apiBoundaries)) errors.push('integrationArchitecture.apiBoundaries must be an array');
    if (!Array.isArray(canonical.integrationArchitecture.internalIntegrationPoints)) errors.push('integrationArchitecture.internalIntegrationPoints must be an array');
    if (!Array.isArray(canonical.integrationArchitecture.externalServices)) errors.push('integrationArchitecture.externalServices must be an array');
  }

  // securityAndTrustModel
  if (!canonical.securityAndTrustModel) {
    errors.push('securityAndTrustModel is required');
  } else {
    if (!Array.isArray(canonical.securityAndTrustModel.authAssumptions)) errors.push('securityAndTrustModel.authAssumptions must be an array');
    if (!Array.isArray(canonical.securityAndTrustModel.secretHandling)) errors.push('securityAndTrustModel.secretHandling must be an array');
    if (!Array.isArray(canonical.securityAndTrustModel.trustBoundaries)) errors.push('securityAndTrustModel.trustBoundaries must be an array');
    if (!Array.isArray(canonical.securityAndTrustModel.riskySurfaces)) errors.push('securityAndTrustModel.riskySurfaces must be an array');
  }

  // deploymentAndEnvironmentModel
  if (!canonical.deploymentAndEnvironmentModel) {
    errors.push('deploymentAndEnvironmentModel is required');
  } else {
    if (!Array.isArray(canonical.deploymentAndEnvironmentModel.environmentModel)) errors.push('deploymentAndEnvironmentModel.environmentModel must be an array');
    if (!Array.isArray(canonical.deploymentAndEnvironmentModel.deploymentUnits)) errors.push('deploymentAndEnvironmentModel.deploymentUnits must be an array');
  }

  // qualityAttributes
  if (!canonical.qualityAttributes) {
    errors.push('qualityAttributes is required');
  } else {
    if (!canonical.qualityAttributes.maintainability) errors.push('qualityAttributes.maintainability is required');
    if (!canonical.qualityAttributes.scalability) errors.push('qualityAttributes.scalability is required');
    if (!canonical.qualityAttributes.testability) errors.push('qualityAttributes.testability is required');
    if (!canonical.qualityAttributes.reliability) errors.push('qualityAttributes.reliability is required');
    if (!canonical.qualityAttributes.performance) errors.push('qualityAttributes.performance is required');
    if (!canonical.qualityAttributes.developerExperience) errors.push('qualityAttributes.developerExperience is required');
  }

  // phaseMapping
  if (!Array.isArray(canonical.phaseMapping) || canonical.phaseMapping.length === 0) {
    errors.push('phaseMapping must be a non-empty array');
  } else {
    const phasesRequiringSlices = new Set(['architecture-definition', 'implementation-phase', 'qa-validation', 'release-readiness']);
    for (const pm of canonical.phaseMapping) {
      if (!pm.phaseId) { errors.push('phaseMapping entry missing phaseId'); continue; }
      if (!pm.phaseName) errors.push(`phaseMapping ${pm.phaseId} missing phaseName`);
      if (!Array.isArray(pm.architectureSlices)) {
        errors.push(`phaseMapping ${pm.phaseId} missing architectureSlices array`);
      } else if (phasesRequiringSlices.has(pm.phaseId) && pm.architectureSlices.length === 0) {
        errors.push(`phaseMapping ${pm.phaseId} must have at least one architectureSlice`);
      }
      if (!Array.isArray(pm.technicalDependencies)) {
        errors.push(`phaseMapping ${pm.phaseId} missing technicalDependencies array`);
      }
    }
  }

  // implementationGuidelines
  if (!canonical.implementationGuidelines) {
    errors.push('implementationGuidelines is required');
  } else {
    if (!Array.isArray(canonical.implementationGuidelines.rules) || canonical.implementationGuidelines.rules.length === 0) {
      errors.push('implementationGuidelines.rules must be a non-empty array');
    }
    if (!Array.isArray(canonical.implementationGuidelines.boundariesToPreserve) || canonical.implementationGuidelines.boundariesToPreserve.length === 0) {
      errors.push('implementationGuidelines.boundariesToPreserve must be a non-empty array');
    }
    if (!Array.isArray(canonical.implementationGuidelines.antiPatterns)) errors.push('implementationGuidelines.antiPatterns must be an array');
    if (!Array.isArray(canonical.implementationGuidelines.codingExpectations)) errors.push('implementationGuidelines.codingExpectations must be an array');
  }

  // openRisks
  if (!Array.isArray(canonical.openRisks)) {
    errors.push('openRisks must be an array');
  } else {
    for (const risk of canonical.openRisks) {
      if (!risk.id) errors.push('openRisk entry missing id');
      if (!risk.description) errors.push('openRisk entry missing description');
      if (!VALID_RISK_SEVERITIES.includes(risk.severity)) {
        errors.push(`openRisk ${risk.id} has invalid severity: ${risk.severity}`);
      }
    }
  }

  // openQuestions
  if (!Array.isArray(canonical.openQuestions)) {
    errors.push('openQuestions must be an array');
  } else {
    for (const q of canonical.openQuestions) {
      if (!q.id) errors.push('openQuestion entry missing id');
      if (!q.question) errors.push('openQuestion entry missing question');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Architecture plan validation failed:\n- ${errors.join('\n- ')}`);
  }
}

function resolveCodeProjectId(
  projectRef: string,
  codeProjects: CodeProject[],
  topology?: RoadmapProjectTopologyEntry[],
): string | undefined {
  // 1. Direct name match
  const byName = codeProjects.find((cp) => cp.name === projectRef);
  if (byName) return byName.id;

  // 2. Resolve through topology: projectRef is a topology projectId → get display name → match
  if (topology) {
    const topoEntry = topology.find((t) => t.projectId === projectRef);
    if (topoEntry) {
      const byTopoName = codeProjects.find((cp) => cp.name === topoEntry.name);
      if (byTopoName) return byTopoName.id;
    }
  }

  // 3. Slugified comparison: slugify both the code project name and the reference
  const refSlug = slugify(projectRef);
  const bySlug = codeProjects.find((cp) => slugify(cp.name) === refSlug);
  if (bySlug) return bySlug.id;

  return undefined;
}

function buildRoadmapPhaseRecordsFromArtifact(
  project: ProjectRecord,
  topology?: RoadmapProjectTopologyEntry[],
  architecturePlan?: ArchitecturePlanArtifactContent | null,
): ImplementationPhaseRecord[] {
  if (!project.approvedRoadmapPhases) return [];
  return project.approvedRoadmapPhases
    .filter((phase) => !project.completedPhases.includes(phase.id as PhaseId))
    .map((phase) => {
      const archMapping = architecturePlan?.phaseMapping?.find(
        (m) => m.phaseId === phase.id,
      );
      return {
        id: generateId(),
        roadmapEntryPhase: phase.id as PhaseId,
        roadmapPhaseId: phase.id,
        label: phase.name,
        status: 'not_started' as const,
        goals: phase.goals,
        deliverables: phase.deliverables,
        validationCriteria: phase.validationCriteria,
        involvedProjectIds: phase.involvedProjects
          .map((ref) => resolveCodeProjectId(ref, project.codeProjects, topology))
          .filter((id): id is string => id != null),
        architectureSlices: archMapping?.architectureSlices ?? [],
        technicalDependencies: archMapping?.technicalDependencies ?? [],
        planArtifactId: null,
        implementationReportArtifactId: null,
        qaReportArtifactId: null,
        pmAlignmentDecision: null,
        userDecision: null,
        bridgeJobIds: [],
        implementationPlanVersions: [],
        taskGroupProgress: [],
        currentTaskGroupIndex: null,
      };
    });
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
    approvedRoadmapPhases: null,
    approvedRoadmapTopology: null,
    architecturePlanVersions: [],
    approvedArchitecturePlan: null,
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
  const generationRunId = generateId();
  const roleFlow: string[] = [];
  const feedback = args.feedback as string | undefined;
  const previousCanonical = args.previousCanonical as Record<string, unknown> | undefined;

  // Need at minimum 3 steps: CEO frame + PM generate + approval gate
  if (!hasBudgetFor(host, 3)) {
    return {
      success: false,
      message: 'Insufficient step budget for roadmap generation (need at least 3 steps).',
      studioState: state,
      artifactIds: [],
      stepsUsed: host.run.getStepCount(),
      phasesCompleted: [],
    };
  }

  const projectContext = buildProjectContext(project);

  // ── Step 1: CEO Strategic Framing ──────────────────────────────────────────
  await host.workspace.setRole('ceo');
  host.run.reportStep('ceo-strategic-framing', 'ceo');
  host.events.emitProgress(0.05, 'CEO: Framing strategic vision and constraints');

  const framingResult = await host.llm.complete({
    purposeId: 'roadmap-generation',
    systemPrompt: `${ROLE_PROMPTS['ceo']}

You are producing a strategic brief to guide the Product Manager's roadmap generation. Output ONLY valid JSON matching this exact schema (no markdown fences, no explanation):

{
  "visionStatement": "string - concise strategic vision for this product",
  "strategicConstraints": ["string - business/market constraints the roadmap must respect"],
  "targetMarketFocus": "string - the specific market segment and positioning to optimize for",
  "competitivePositioning": "string - how this product should differentiate in the market",
  "riskThresholds": {
    "maxHighRiskPhases": number,
    "criticalDependencies": ["string - external dependencies that could block delivery"]
  },
  "scopeGuidance": {
    "mustInclude": ["string - capabilities that are non-negotiable for the initial product"],
    "mustExclude": ["string - things explicitly out of scope"],
    "deferToV2": ["string - valuable but deferrable capabilities"]
  }
}

Ground every field in the specific product context. No generic advice. Be concrete about market positioning, risks, and scope boundaries.`,
    messages: [{
      role: 'user',
      content: `Produce a strategic brief for roadmap generation for this product:\n\n${projectContext}${feedback ? `\n\nUser feedback on the previous roadmap version:\n${feedback}` : ''}${previousCanonical ? `\n\nPrevious roadmap for reference:\n${JSON.stringify(previousCanonical, null, 2)}` : ''}`,
    }],
    temperature: 0.2,
    maxTokens: 3000,
  });

  let strategicBrief: CeoStrategicBrief;
  try {
    strategicBrief = JSON.parse(framingResult.text.trim());
  } catch {
    throw new Error('CEO strategic framing failed: LLM returned invalid JSON. Checkpoint and retry the run.');
  }
  validateStrategicBrief(strategicBrief);
  roleFlow.push('ceo');

  // ── Step 2: Product Manager Roadmap Generation ────────────────────────────
  await host.workspace.setRole('product-manager');
  host.run.reportStep('pm-roadmap-generation', 'product-manager');
  host.events.emitProgress(0.3, 'Product Manager: Generating phased roadmap');

  const roadmapResult = await host.llm.complete({
    purposeId: 'roadmap-generation',
    systemPrompt: `${ROLE_PROMPTS['product-manager']}

You are generating a canonical product roadmap informed by a CEO strategic brief. Output ONLY valid JSON matching this exact schema (no markdown fences, no explanation):

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
- openQuestions should flag genuine unknowns that could affect the roadmap.
- Respect the CEO's strategic constraints and scope guidance.
- Phase risk levels should not exceed the CEO's stated thresholds without explicit justification in assumptions.
- Competitive positioning should be reflected in the product scope and phase priorities.
- Avoid splitting everything into trivial micro-phases or collapsing into 1-2 giant phases.
- Define project structure (projectTopology) early and reference it consistently across phases.`,
    messages: [{
      role: 'user',
      content: `Generate a canonical product roadmap for this product:\n\n${projectContext}\n\nCEO Strategic Brief:\n${JSON.stringify(strategicBrief, null, 2)}${feedback ? `\n\nUser feedback on the previous roadmap version:\n${feedback}` : ''}${previousCanonical ? `\n\nPrevious roadmap for reference:\n${JSON.stringify(previousCanonical, null, 2)}` : ''}`,
    }],
    temperature: 0.2,
    maxTokens: 8000,
  });

  let canonical: RoadmapArtifactContent;
  try {
    canonical = JSON.parse(roadmapResult.text.trim());
  } catch {
    throw new Error('Roadmap generation failed: LLM returned invalid JSON. Checkpoint and retry the run.');
  }
  validateRoadmapCanonical(canonical);
  roleFlow.push('product-manager');

  // ── Step 3: CEO Strategic Validation (optional) ───────────────────────────
  let strategicValidation: CeoStrategicValidation | undefined;

  if (hasBudgetFor(host, 2)) { // 1 for validation + 1 for approval gate
    await host.workspace.setRole('ceo');
    host.run.reportStep('ceo-strategic-validation', 'ceo');
    host.events.emitProgress(0.6, 'CEO: Validating strategic coherence');

    const validationResult = await host.llm.complete({
      purposeId: 'roadmap-generation',
      systemPrompt: `${ROLE_PROMPTS['ceo']}

You are validating a Product Manager's roadmap against your strategic brief. Assess strategic coherence. Output ONLY valid JSON (no markdown fences, no explanation):

{
  "coherenceScore": "aligned | minor-concerns | misaligned",
  "flaggedIssues": ["string - specific strategic misalignments or concerns"],
  "suggestedAdjustments": ["string - concrete suggestions to improve strategic alignment"]
}

Be specific. If the roadmap is well-aligned, return "aligned" with empty arrays for flaggedIssues and suggestedAdjustments. Do not flag stylistic preferences — only flag genuine strategic misalignments.`,
      messages: [{
        role: 'user',
        content: `Validate this roadmap against the strategic brief.\n\nStrategic Brief:\n${JSON.stringify(strategicBrief, null, 2)}\n\nGenerated Roadmap:\n${JSON.stringify(canonical, null, 2)}`,
      }],
      temperature: 0.1,
      maxTokens: 2000,
    });

    try {
      const validation = JSON.parse(validationResult.text.trim()) as CeoStrategicValidation;
      if (validation.flaggedIssues.length > 0 || validation.coherenceScore !== 'aligned') {
        strategicValidation = validation;
      }
    } catch {
      host.log.warn('CEO validation returned invalid JSON, skipping validation step');
    }
    roleFlow.push('ceo');
  }

  // ── Artifact creation ─────────────────────────────────────────────────────
  const versionNumber = (project.roadmapVersions?.length ?? 0) + 1;

  if (strategicValidation) {
    canonical.strategicValidation = strategicValidation;
  }
  canonical.versionMetadata = {
    generationRunId,
    version: versionNumber,
    roleFlow,
  };

  const roadmap = deriveRoadmapEntries(canonical.phases);

  project.roadmap = roadmap;
  const roadmapVersion: RoadmapVersion = {
    id: generateId(),
    version: versionNumber,
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
    createdByRole: 'product-manager',
  });

  project.artifactIds.push(artifact.id);
  await host.workspace.setState(state);

  host.events.emitProgress(0.8, 'Roadmap generated, requesting approval');

  // ── Roadmap Approval Loop ─────────────────────────────────────────────────
  const MAX_REVISIONS = 3;
  let revisionCount = 0;
  let currentCanonical = canonical;
  let currentArtifact = artifact;
  let currentRoadmapVersion = roadmapVersion;

  type RoadmapGateResponse = {
    decision: string;
    feedback?: string;
    phaseEdits?: Array<{ phaseId: string; action: string; details: string }>;
    scopeChanges?: { addToIncluded?: string[]; removeFromIncluded?: string[]; addToExcluded?: string[]; removeFromExcluded?: string[] };
  };

  function buildRoadmapGateSchema(allowRevise: boolean) {
    const decisions = allowRevise
      ? ['approve', 'reject', 'revise', 'approve-with-changes', 'pause', 'cancel']
      : ['approve', 'approve-with-changes', 'pause', 'cancel'];
    return {
      type: 'object',
      properties: {
        decision: {
          type: 'string',
          enum: decisions,
          description: 'Decision for this gate',
        },
        feedback: { type: 'string', description: 'Feedback or revision requests' },
        phaseEdits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phaseId: { type: 'string' },
              action: { type: 'string', enum: ['remove', 'reprioritize', 'edit-scope', 'merge', 'split'] },
              details: { type: 'string' },
            },
          },
          description: 'Structured phase-level edits',
        },
        scopeChanges: {
          type: 'object',
          properties: {
            addToIncluded: { type: 'array', items: { type: 'string' } },
            removeFromIncluded: { type: 'array', items: { type: 'string' } },
            addToExcluded: { type: 'array', items: { type: 'string' } },
            removeFromExcluded: { type: 'array', items: { type: 'string' } },
          },
          description: 'Structured scope changes',
        },
      },
      required: ['decision'],
    };
  }

  await host.run.checkpoint();
  host.run.reportStep('roadmap-approval', 'product-manager');
  let gateResponse = (await host.run.requestInput({
    title: 'Review Product Roadmap',
    message: `A phased roadmap has been generated for "${project.name}" with ${roadmap.length} phases. Please review the roadmap artifact and decide how to proceed.`,
    inputSchema: buildRoadmapGateSchema(true),
  })) as RoadmapGateResponse;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const currentDecision = gateResponse.decision ?? 'approve';
    const currentFeedback = gateResponse.feedback;
    const currentPhaseEdits = gateResponse.phaseEdits;
    const currentScopeChanges = gateResponse.scopeChanges;

    // Record in validation history
    project.validationHistory.push({
      phase: project.currentPhase,
      decision: currentDecision as ValidationEntry['decision'],
      feedback: currentFeedback ?? null,
      timestamp: new Date().toISOString(),
    });

    // ── pause / cancel ──────────────────────────────────────────────────
    if (currentDecision === 'pause') {
      await host.workspace.setState(state);
      await host.run.checkpoint();
      return {
        success: true,
        message: `Roadmap review paused for "${project.name}". Resume when ready.`,
        studioState: state,
        artifactIds: [currentArtifact.id],
        stepsUsed: host.run.getStepCount(),
        phasesCompleted: [],
      };
    }

    if (currentDecision === 'cancel') {
      await host.workspace.setState(state);
      await host.run.checkpoint();
      return {
        success: true,
        message: `Roadmap generation cancelled for "${project.name}".`,
        studioState: state,
        artifactIds: [currentArtifact.id],
        stepsUsed: host.run.getStepCount(),
        phasesCompleted: [],
      };
    }

    // ── approve ─────────────────────────────────────────────────────────
    if (currentDecision === 'approve') {
      await host.workspace.updateArtifact(currentArtifact.id, { status: 'approved' });
      currentRoadmapVersion.decision = 'approve' as RoadmapVersion['decision'];
      project.approvedRoadmapPhases = currentCanonical.phases;
      project.approvedRoadmapTopology = currentCanonical.projectTopology ?? null;
      host.log.info('Roadmap approved', { artifactId: currentArtifact.id });
      await host.workspace.setState(state);
      await host.run.checkpoint();
      host.events.emitProgress(1.0, 'Roadmap approved');
      return {
        success: true,
        message: `Roadmap for "${project.name}" approved with ${project.roadmap!.length} phases`,
        studioState: state,
        artifactIds: [currentArtifact.id],
        stepsUsed: host.run.getStepCount(),
        phasesCompleted: [],
      };
    }

    // ── approve-with-changes ────────────────────────────────────────────
    if (currentDecision === 'approve-with-changes') {
      if (!hasBudgetFor(host, 1)) {
        await host.workspace.updateArtifact(currentArtifact.id, { status: 'approved' });
        currentRoadmapVersion.decision = 'approve' as RoadmapVersion['decision'];
        project.approvedRoadmapPhases = currentCanonical.phases;
      project.approvedRoadmapTopology = currentCanonical.projectTopology ?? null;
        host.log.warn('No budget for approve-with-changes, approving as-is');
        await host.workspace.setState(state);
        await host.run.checkpoint();
        return {
          success: true,
          message: `Roadmap for "${project.name}" approved (no budget for requested changes)`,
          studioState: state,
          artifactIds: [currentArtifact.id],
          stepsUsed: host.run.getStepCount(),
          phasesCompleted: [],
        };
      }

      const editContext = buildEditContext(currentPhaseEdits, currentScopeChanges);
      const changeInstructions = [
        currentFeedback ? `User feedback: ${currentFeedback}` : '',
        editContext,
      ].filter(Boolean).join('\n\n');

      await host.workspace.setRole('product-manager');
      host.run.reportStep('pm-apply-changes', 'product-manager');
      host.events.emitProgress(0.9, 'Product Manager: Applying requested changes');

      const changeResult = await host.llm.complete({
        purposeId: 'roadmap-generation',
        systemPrompt: `${ROLE_PROMPTS['product-manager']}

You are applying targeted changes to an approved roadmap. Do NOT redesign the roadmap. Only incorporate the specific adjustments requested. Output the COMPLETE updated roadmap as valid JSON matching the same schema as the input (no markdown fences, no explanation).`,
        messages: [{
          role: 'user',
          content: `Apply these changes to the roadmap:\n\n${changeInstructions}\n\nCurrent roadmap:\n${JSON.stringify(currentCanonical, null, 2)}`,
        }],
        temperature: 0.1,
        maxTokens: 8000,
      });

      let updatedCanonical: RoadmapArtifactContent;
      try {
        updatedCanonical = JSON.parse(changeResult.text.trim());
      } catch {
        host.log.warn('Failed to parse approve-with-changes result, approving original');
        await host.workspace.updateArtifact(currentArtifact.id, { status: 'approved' });
        currentRoadmapVersion.decision = 'approve' as RoadmapVersion['decision'];
        project.approvedRoadmapPhases = currentCanonical.phases;
      project.approvedRoadmapTopology = currentCanonical.projectTopology ?? null;
        await host.workspace.setState(state);
        await host.run.checkpoint();
        return {
          success: true,
          message: `Roadmap for "${project.name}" approved (change application failed, original preserved)`,
          studioState: state,
          artifactIds: [currentArtifact.id],
          stepsUsed: host.run.getStepCount(),
          phasesCompleted: [],
        };
      }

      await host.workspace.updateArtifact(currentArtifact.id, { status: 'superseded' });
      const newVersionNumber = (project.roadmapVersions?.length ?? 0) + 1;
      updatedCanonical.versionMetadata = {
        generationRunId,
        version: newVersionNumber,
        roleFlow: [...roleFlow, 'product-manager'],
      };

      const updatedRoadmap = deriveRoadmapEntries(updatedCanonical.phases);
      project.roadmap = updatedRoadmap;
      project.approvedRoadmapPhases = updatedCanonical.phases;
      project.approvedRoadmapTopology = updatedCanonical.projectTopology ?? null;

      const newVersion: RoadmapVersion = {
        id: generateId(),
        version: newVersionNumber,
        entries: updatedRoadmap,
        createdAt: new Date().toISOString(),
        decision: 'approve' as RoadmapVersion['decision'],
      };
      project.roadmapVersions.push(newVersion);

      const newArtifact = await host.workspace.createArtifact({
        type: 'roadmap',
        title: `Roadmap: ${project.name}`,
        content: {
          projectId: project.id,
          projectName: project.name,
          ...updatedCanonical,
          generatedAt: new Date().toISOString(),
        },
        createdByRole: 'product-manager',
        parentArtifactId: currentArtifact.id,
      });
      await host.workspace.updateArtifact(newArtifact.id, { status: 'approved' });
      project.artifactIds.push(newArtifact.id);
      project.updatedAt = new Date().toISOString();
      await host.workspace.setState(state);
      await host.run.checkpoint();
      host.events.emitProgress(1.0, 'Roadmap approved with changes applied');
      host.log.info('Roadmap approved with changes', { originalId: currentArtifact.id, newId: newArtifact.id });

      return {
        success: true,
        message: `Roadmap for "${project.name}" approved with changes applied`,
        studioState: state,
        artifactIds: [newArtifact.id],
        stepsUsed: host.run.getStepCount(),
        phasesCompleted: [],
      };
    }

    // ── revise / reject — regenerate with feedback ──────────────────────
    if (currentDecision === 'revise' || currentDecision === 'reject') {
      revisionCount++;
      await host.workspace.updateArtifact(currentArtifact.id, {
        status: 'superseded',
        content: {
          projectId: project.id,
          projectName: project.name,
          ...currentCanonical,
          generatedAt: new Date().toISOString(),
          userFeedback: currentFeedback ?? '',
        },
      });
      currentRoadmapVersion.decision = currentDecision as RoadmapVersion['decision'];
      host.log.info(`Roadmap ${currentDecision}ed, regenerating`, { feedback: currentFeedback, revision: revisionCount });

      if (!hasBudgetFor(host, 3) || revisionCount > MAX_REVISIONS) {
        await host.workspace.setState(state);
        await host.run.checkpoint();
        const reason = revisionCount > MAX_REVISIONS
          ? `Maximum revision limit (${MAX_REVISIONS}) reached`
          : 'Insufficient step budget for regeneration';
        return {
          success: false,
          message: `${reason} for "${project.name}". Last roadmap version preserved for manual redirect.`,
          studioState: state,
          artifactIds: [currentArtifact.id],
          stepsUsed: host.run.getStepCount(),
          phasesCompleted: [],
        };
      }

      const editContext = buildEditContext(currentPhaseEdits, currentScopeChanges);
      const combinedFeedback = [
        currentFeedback ?? '',
        editContext,
      ].filter(Boolean).join('\n\n');

      // Re-generate: CEO re-frame + PM re-generate
      await host.workspace.setRole('ceo');
      host.run.reportStep(`ceo-strategic-reframing-v${revisionCount + 1}`, 'ceo');
      host.events.emitProgress(0.05, `CEO: Re-framing strategic vision (revision ${revisionCount})`);

      const reframingResult = await host.llm.complete({
        purposeId: 'roadmap-generation',
        systemPrompt: `${ROLE_PROMPTS['ceo']}

You are producing a strategic brief to guide the Product Manager's roadmap REVISION. The user was not satisfied with the previous version. Address their feedback directly. Output ONLY valid JSON matching the strategic brief schema (no markdown fences, no explanation):

{
  "visionStatement": "string",
  "strategicConstraints": ["string"],
  "targetMarketFocus": "string",
  "competitivePositioning": "string",
  "riskThresholds": { "maxHighRiskPhases": "number", "criticalDependencies": ["string"] },
  "scopeGuidance": { "mustInclude": ["string"], "mustExclude": ["string"], "deferToV2": ["string"] }
}`,
        messages: [{
          role: 'user',
          content: `Produce a revised strategic brief for roadmap generation:\n\n${projectContext}\n\nUser feedback on previous version:\n${combinedFeedback}\n\nPrevious roadmap:\n${JSON.stringify(currentCanonical, null, 2)}`,
        }],
        temperature: 0.2,
        maxTokens: 3000,
      });

      let revisedBrief: CeoStrategicBrief;
      try {
        revisedBrief = JSON.parse(reframingResult.text.trim());
      } catch {
        throw new Error('CEO strategic re-framing failed: LLM returned invalid JSON. Checkpoint and retry.');
      }

      await host.workspace.setRole('product-manager');
      host.run.reportStep(`pm-roadmap-revision-v${revisionCount + 1}`, 'product-manager');
      host.events.emitProgress(0.3, `Product Manager: Regenerating roadmap (revision ${revisionCount})`);

      const revisionResult = await host.llm.complete({
        purposeId: 'roadmap-generation',
        systemPrompt: `${ROLE_PROMPTS['product-manager']}

You are REVISING a product roadmap based on user feedback. The user explicitly ${currentDecision}ed the previous version. Address their feedback directly. Output ONLY valid JSON matching the canonical roadmap schema (no markdown fences, no explanation).

Quality requirements:
- Address every point in the user's feedback
- Maintain structural integrity (valid phase IDs, proper references)
- Do not introduce new issues while fixing requested changes
- If the user asked to remove phases, remove them
- If the user asked to reprioritize, change the ordering
- If the user asked for scope changes, reflect them in productScope AND phase deliverables`,
        messages: [{
          role: 'user',
          content: `Revise this roadmap based on user feedback:\n\n${projectContext}\n\nCEO Strategic Brief:\n${JSON.stringify(revisedBrief, null, 2)}\n\nUser feedback:\n${combinedFeedback}\n\nPrevious roadmap to revise:\n${JSON.stringify(currentCanonical, null, 2)}`,
        }],
        temperature: 0.2,
        maxTokens: 8000,
      });

      let revisedCanonical: RoadmapArtifactContent;
      try {
        revisedCanonical = JSON.parse(revisionResult.text.trim());
      } catch {
        throw new Error('Roadmap revision failed: LLM returned invalid JSON. Checkpoint and retry.');
      }
      validateRoadmapCanonical(revisedCanonical);

      const newVersionNumber = (project.roadmapVersions?.length ?? 0) + 1;
      revisedCanonical.versionMetadata = {
        generationRunId,
        version: newVersionNumber,
        roleFlow: [...roleFlow, 'ceo', 'product-manager'],
      };

      const revisedRoadmap = deriveRoadmapEntries(revisedCanonical.phases);
      project.roadmap = revisedRoadmap;

      const newRoadmapVersion: RoadmapVersion = {
        id: generateId(),
        version: newVersionNumber,
        entries: revisedRoadmap,
        createdAt: new Date().toISOString(),
        decision: null,
      };
      project.roadmapVersions.push(newRoadmapVersion);
      project.updatedAt = new Date().toISOString();
      await host.workspace.setState(state);

      const newArtifact = await host.workspace.createArtifact({
        type: 'roadmap',
        title: `Roadmap: ${project.name}`,
        content: {
          projectId: project.id,
          projectName: project.name,
          ...revisedCanonical,
          generatedAt: new Date().toISOString(),
        },
        createdByRole: 'product-manager',
        parentArtifactId: currentArtifact.id,
      });
      project.artifactIds.push(newArtifact.id);
      await host.workspace.setState(state);

      host.events.emitProgress(0.8, `Roadmap revised (v${newVersionNumber}), requesting approval`);

      currentCanonical = revisedCanonical;
      currentArtifact = newArtifact;
      currentRoadmapVersion = newRoadmapVersion;

      await host.run.checkpoint();
      host.run.reportStep(`roadmap-approval-v${newVersionNumber}`, 'product-manager');
      gateResponse = (await host.run.requestInput({
        title: 'Review Revised Roadmap',
        message: `Roadmap v${newVersionNumber} has been generated for "${project.name}" with ${revisedRoadmap.length} phases (revision ${revisionCount} of ${MAX_REVISIONS}). Please review and decide.`,
        inputSchema: buildRoadmapGateSchema(revisionCount < MAX_REVISIONS),
      })) as RoadmapGateResponse;

      continue;
    }

    // Unknown decision — treat as approve
    host.log.warn('Unknown roadmap gate decision, treating as approve', { decision: currentDecision });
    await host.workspace.updateArtifact(currentArtifact.id, { status: 'approved' });
    currentRoadmapVersion.decision = 'approve' as RoadmapVersion['decision'];
    await host.workspace.setState(state);
    await host.run.checkpoint();
    host.events.emitProgress(1.0, 'Roadmap review complete');
    return {
      success: true,
      message: `Roadmap for "${project.name}" approved`,
      studioState: state,
      artifactIds: [currentArtifact.id],
      stepsUsed: host.run.getStepCount(),
      phasesCompleted: [],
    };
  }
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

async function executePlanTaskGroups(
  host: SkillHostCapabilities,
  state: StudioState,
  project: ProjectRecord,
  record: ImplementationPhaseRecord,
  planContent: ImplementationPhasePlanArtifactContent,
): Promise<{ success: boolean }> {
  const bridge = host.bridge!;

  const targetProjects = record.involvedProjectIds.length > 0
    ? project.codeProjects.filter((cp) => record.involvedProjectIds.includes(cp.id))
    : project.codeProjects;

  // Fallback: no structured work breakdown — single call per project
  if (!planContent.workBreakdown || planContent.workBreakdown.length === 0) {
    host.log.info('No structured workBreakdown, executing single call per project');
    const archGuidance = buildClaudeCodeArchitectureGuidance(project, record);
    const goalPrompt = `Implementation Sub-Phase: ${record.label}${record.goals.length > 0 ? `\n\nGoals:\n${record.goals.map((g) => `- ${g}`).join('\n')}` : ''}${record.deliverables.length > 0 ? `\n\nDeliverables:\n${record.deliverables.map((d) => `- ${d}`).join('\n')}` : ''}${archGuidance}\n\nFollow the project's .claude configuration for coding standards, testing expectations, and TDD guidance.\n\nPlan:\n${planContent.body}`;
    for (const cp of targetProjects) {
      if (!cp.repoPath) continue;
      const cmdResult = await executeAndWaitBridgeCommand(host, {
        command: 'claude',
        args: ['--print', goalPrompt],
        workingDirectory: cp.repoPath,
        reason: `Implementation sub-phase: ${record.label} — ${cp.name}`,
        timeoutMs: 600_000,
      });
      if (cmdResult.bridgeRunId) record.bridgeJobIds.push(cmdResult.bridgeRunId);
    }
    await host.workspace.setState(state);
    return { success: true };
  }

  // Initialize task group progress
  const groups = planContent.workBreakdown;
  record.taskGroupProgress = groups.map((g) => ({
    groupLabel: g.groupLabel,
    taskIds: g.tasks.map((t) => t.id),
    status: 'pending' as const,
    bridgeJobIds: [],
    startedAt: null,
    completedAt: null,
    failureReason: null,
  }));
  record.currentTaskGroupIndex = 0;
  await host.workspace.setState(state);

  for (let gi = 0; gi < groups.length; gi++) {
    const taskGroup = groups[gi];
    const groupProgress = record.taskGroupProgress[gi];
    record.currentTaskGroupIndex = gi;
    groupProgress.status = 'running';
    groupProgress.startedAt = new Date().toISOString();
    await host.workspace.setState(state);
    host.events.emitProgress(0.3 + (gi / groups.length) * 0.5, `Task group ${gi + 1}/${groups.length}: ${taskGroup.groupLabel}`);

    // Determine target projects for this group
    const groupProjectIds = [...new Set(taskGroup.tasks.map((t) => t.projectId))];
    const groupTargetProjects = groupProjectIds
      .map((pid) => project.codeProjects.find((cp) => cp.id === pid || cp.name === pid))
      .filter((cp): cp is CodeProject => cp != null && cp.repoPath != null);

    // If no specific projects found, use the record's target projects
    const effectiveTargets = groupTargetProjects.length > 0 ? groupTargetProjects : targetProjects;

    let groupFailed = false;
    let failureReason = '';

    for (const cp of effectiveTargets) {
      if (!cp.repoPath) continue;
      const prompt = buildTaskGroupExecutionPrompt(project, record, planContent, taskGroup, gi, groups.length, cp.id);
      const cmdResult = await executeAndWaitBridgeCommand(host, {
        command: 'claude',
        args: ['--print', prompt],
        workingDirectory: cp.repoPath,
        reason: `Task group: ${taskGroup.groupLabel} — ${cp.name}`,
        timeoutMs: 600_000,
      });

      if (cmdResult.bridgeRunId) {
        groupProgress.bridgeJobIds.push(cmdResult.bridgeRunId);
        record.bridgeJobIds.push(cmdResult.bridgeRunId);
      }

      if (cmdResult.status === 'failed') {
        groupFailed = true;
        failureReason = 'reason' in cmdResult ? cmdResult.reason : 'Bridge command failed';
        break;
      }
      if (cmdResult.status === 'terminated') {
        groupFailed = true;
        failureReason = 'Command terminated (timeout or killed)';
        break;
      }
    }

    if (groupFailed) {
      groupProgress.status = 'failed';
      groupProgress.failureReason = failureReason;
      await host.workspace.setState(state);
      await host.run.checkpoint();

      host.log.warn('Task group failed', { groupLabel: taskGroup.groupLabel, reason: failureReason });
      host.run.reportStep(`task-group-failure-${record.id}-${gi}`, 'developer');

      const failureAction = (await host.run.requestInput({
        title: `Task Group Failed: ${taskGroup.groupLabel}`,
        message: `Task group "${taskGroup.groupLabel}" (${gi + 1} of ${groups.length}) failed.\n\nReason: ${failureReason}\n\nHow would you like to proceed?`,
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['retry', 'skip', 'redefine', 'cancel'],
              description: 'retry: re-run this group, skip: mark as skipped and continue, redefine: go back to planning, cancel: stop execution',
            },
            feedback: { type: 'string', description: 'Additional guidance' },
          },
          required: ['action'],
        },
      })) as { action: string; feedback?: string };

      if (failureAction.action === 'retry') {
        groupProgress.status = 'pending';
        groupProgress.bridgeJobIds = [];
        groupProgress.failureReason = null;
        groupProgress.startedAt = null;
        await host.workspace.setState(state);
        gi--; // Re-execute same group
        continue;
      }

      if (failureAction.action === 'skip') {
        groupProgress.status = 'completed';
        groupProgress.completedAt = new Date().toISOString();
        groupProgress.failureReason = 'Skipped by user';
        await host.workspace.setState(state);
        continue;
      }

      if (failureAction.action === 'redefine') {
        record.status = 'not_started';
        record.taskGroupProgress = [];
        record.currentTaskGroupIndex = null;
        await host.workspace.setState(state);
        return { success: false };
      }

      // cancel
      record.status = 'failed';
      record.currentTaskGroupIndex = null;
      await host.workspace.setState(state);
      return { success: false };
    }

    // Group succeeded
    groupProgress.status = 'completed';
    groupProgress.completedAt = new Date().toISOString();
    await host.workspace.setState(state);
    await host.run.checkpoint();
  }

  record.currentTaskGroupIndex = null;
  await host.workspace.setState(state);
  return { success: true };
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

interface QaArchitectureAssessment {
  alignmentStatus: 'aligned' | 'minor-drift' | 'significant-drift';
  driftFindings: string[];
  qualityAttributeNotes: string[];
  boundaryViolations: string[];
}

interface QaFunctionalityCheck {
  criterion: string;
  status: 'pass' | 'fail' | 'needs-work';
  notes: string;
}

interface QaDefinitionOfDoneCheck {
  item: string;
  status: 'pass' | 'fail';
  notes: string;
}

interface QaReportStructured {
  overallVerdict: 'pass' | 'fail' | 'needs-work';
  body: string;
  functionalityChecks: QaFunctionalityCheck[];
  definitionOfDoneChecks: QaDefinitionOfDoneCheck[];
  architectureAssessment?: QaArchitectureAssessment;
}

function extractFunctionalityCriteria(plan: ImplementationPhasePlanArtifactContent): string[] {
  const criteria: string[] = [];

  // From qaGateCriteria
  if (plan.validationPlan?.qaGateCriteria) {
    criteria.push(...plan.validationPlan.qaGateCriteria);
  }

  // From verificationSteps
  if (plan.validationPlan?.verificationSteps) {
    criteria.push(...plan.validationPlan.verificationSteps);
  }

  // From task expectedOutcome fields
  if (plan.workBreakdown) {
    for (const group of plan.workBreakdown) {
      for (const task of group.tasks) {
        if (task.expectedOutcome && task.expectedOutcome.trim() !== '') {
          criteria.push(`[${task.title}] ${task.expectedOutcome}`);
        }
      }
    }
  }

  return criteria;
}

function buildQaReportSchema(plan: ImplementationPhasePlanArtifactContent, hasArchContext: boolean): string {
  const functionalityCriteria = extractFunctionalityCriteria(plan);
  const dodItems = plan.definitionOfDone ?? [];

  const schema: Record<string, unknown> = {
    overallVerdict: '"pass" | "fail" | "needs-work" — overall assessment',
    body: 'string — narrative QA assessment (2-3 paragraphs)',
    functionalityChecks: functionalityCriteria.map((c) => ({
      criterion: c,
      status: '"pass" | "fail" | "needs-work"',
      notes: 'string — brief explanation of why this status was assigned',
    })),
    definitionOfDoneChecks: dodItems.map((item) => ({
      item,
      status: '"pass" | "fail"',
      notes: 'string — brief explanation',
    })),
  };

  if (hasArchContext) {
    schema.architectureAssessment = {
      alignmentStatus: '"aligned" | "minor-drift" | "significant-drift"',
      driftFindings: ['string — specific drift observations (empty array if aligned)'],
      qualityAttributeNotes: ['string — observations about quality attributes'],
      boundaryViolations: ['string — boundary violations found (empty array if none)'],
    };
  }

  return JSON.stringify(schema, null, 2);
}

function buildQaGateSchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      decision: {
        type: 'string',
        enum: ['approve', 'reject', 'revise', 'approve-with-changes', 'pause', 'cancel'],
        description: 'Decision for this QA validation',
      },
      feedback: { type: 'string', description: 'Feedback or revision requests' },
      checkOverrides: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            criterion: { type: 'string' },
            action: { type: 'string', enum: ['accept-as-is', 'must-fix'] },
            notes: { type: 'string' },
          },
        },
        description: 'Override decisions for specific QA checks',
      },
    },
    required: ['decision'],
  };
}

function parseQaReport(rawText: string): QaReportStructured {
  const parsed = JSON.parse(rawText.trim());
  const validVerdicts = ['pass', 'fail', 'needs-work'];
  const validDodStatuses = ['pass', 'fail'];

  return {
    overallVerdict: validVerdicts.includes(parsed.overallVerdict) ? parsed.overallVerdict : 'needs-work',
    body: typeof parsed.body === 'string' ? parsed.body : rawText.trim(),
    functionalityChecks: Array.isArray(parsed.functionalityChecks)
      ? parsed.functionalityChecks.map((c: Record<string, unknown>) => ({
          criterion: typeof c.criterion === 'string' ? c.criterion : '',
          status: validVerdicts.includes(c.status as string) ? c.status : 'needs-work',
          notes: typeof c.notes === 'string' ? c.notes : '',
        }))
      : [],
    definitionOfDoneChecks: Array.isArray(parsed.definitionOfDoneChecks)
      ? parsed.definitionOfDoneChecks.map((c: Record<string, unknown>) => ({
          item: typeof c.item === 'string' ? c.item : '',
          status: validDodStatuses.includes(c.status as string) ? c.status : 'fail',
          notes: typeof c.notes === 'string' ? c.notes : '',
        }))
      : [],
    architectureAssessment: parsed.architectureAssessment && typeof parsed.architectureAssessment === 'object'
      ? {
          alignmentStatus: ['aligned', 'minor-drift', 'significant-drift'].includes(parsed.architectureAssessment.alignmentStatus)
            ? parsed.architectureAssessment.alignmentStatus
            : 'minor-drift',
          driftFindings: Array.isArray(parsed.architectureAssessment.driftFindings)
            ? parsed.architectureAssessment.driftFindings.filter((s: unknown) => typeof s === 'string')
            : [],
          qualityAttributeNotes: Array.isArray(parsed.architectureAssessment.qualityAttributeNotes)
            ? parsed.architectureAssessment.qualityAttributeNotes.filter((s: unknown) => typeof s === 'string')
            : [],
          boundaryViolations: Array.isArray(parsed.architectureAssessment.boundaryViolations)
            ? parsed.architectureAssessment.boundaryViolations.filter((s: unknown) => typeof s === 'string')
            : [],
        }
      : undefined,
  };
}

function extractArchitectureAssessment(qaText: string): QaArchitectureAssessment | undefined {
  const lowerText = qaText.toLowerCase();

  // Detect explicit alignment status from QA text
  let alignmentStatus: QaArchitectureAssessment['alignmentStatus'] | null = null;
  if (lowerText.includes('significant-drift') || lowerText.includes('significant drift')) {
    alignmentStatus = 'significant-drift';
  } else if (lowerText.includes('minor-drift') || lowerText.includes('minor drift')) {
    alignmentStatus = 'minor-drift';
  } else if (lowerText.includes('alignmentstatus') || lowerText.includes('alignment status')) {
    // Check for explicit "aligned" keyword near alignment status context
    if (lowerText.includes('"aligned"') || lowerText.match(/alignment\s*status[:\s]*aligned/i)) {
      alignmentStatus = 'aligned';
    }
  }

  const driftFindings = extractListAfterHeading(qaText, 'driftFindings');
  const qualityAttributeNotes = extractListAfterHeading(qaText, 'qualityAttributeNotes');
  const boundaryViolations = extractListAfterHeading(qaText, 'boundaryViolations');

  // If no alignment status was explicitly detected and no structured data was found,
  // the assessment is inconclusive — return undefined rather than assuming "aligned"
  const hasStructuredData = driftFindings.length > 0 || qualityAttributeNotes.length > 0 || boundaryViolations.length > 0;
  if (alignmentStatus === null && !hasStructuredData) {
    return undefined;
  }

  // If we have structured data but no explicit status, infer from findings
  if (alignmentStatus === null) {
    if (boundaryViolations.length > 0) {
      alignmentStatus = 'significant-drift';
    } else if (driftFindings.length > 0) {
      alignmentStatus = 'minor-drift';
    } else {
      alignmentStatus = 'aligned';
    }
  }

  return { alignmentStatus, driftFindings, qualityAttributeNotes, boundaryViolations };
}

function extractListAfterHeading(text: string, heading: string): string[] {
  const patterns = [
    // Match heading followed by newline and content block (stop at next heading or end)
    new RegExp(`${heading}:\\s*\\n([\\s\\S]*?)(?=\\n[a-zA-Z]+[a-zA-Z ]*:|$)`, 'i'),
    // Match heading followed by JSON-style array
    new RegExp(`${heading}:\\s*\\[([^\\]]*)\\]`, 'i'),
    // Match heading followed by inline content on the same line
    new RegExp(`${heading}:\\s*(.+)$`, 'im'),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const block = match[1].trim();
      // Skip explicit empty markers
      if (/^(none|empty|n\/a|\[\]|\(\))$/i.test(block)) return [];
      // Try bullet list format (- or *)
      const bullets = block.match(/^[\s]*[-*]\s+(.+)$/gm);
      if (bullets && bullets.length > 0) {
        return bullets.map((b) => b.replace(/^[\s]*[-*]\s+/, '').trim()).filter(Boolean);
      }
      // Try numbered list format (1. 2. etc)
      const numbered = block.match(/^[\s]*\d+\.\s+(.+)$/gm);
      if (numbered && numbered.length > 0) {
        return numbered.map((b) => b.replace(/^[\s]*\d+\.\s+/, '').trim()).filter(Boolean);
      }
      // Try comma-separated in brackets
      const items = block.split(',').map((s) => s.replace(/["']/g, '').trim()).filter(Boolean);
      if (items.length > 0 && items[0] !== '') return items;
    }
  }
  return [];
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

  // 1. Planning — Two-step: software-architect skeleton → developer refinement
  record.status = 'planning';
  await host.workspace.setState(state);
  const generationRunId = generateId();
  const roleFlow: string[] = [];

  const projectContext = buildProjectContext(project);
  const architectureContext = buildArchitectureContextForPhase(project, record);

  const involvedProjects = project.codeProjects.filter((cp) => record.involvedProjectIds.includes(cp.id));
  const involvedProjectsContext = involvedProjects.length > 0
    ? `\n\nTarget Projects:\n${involvedProjects.map((cp) => `- ${cp.name} (${cp.id}, type: ${cp.type}, stack: ${cp.techStack})`).join('\n')}`
    : '';

  const implPlanSchema = JSON.stringify({
    projectId: project.id,
    subphaseId: record.id,
    label: record.label,
    roadmapEntryPhase: record.roadmapEntryPhase,
    body: 'string — plain-text summary of the full plan (2-4 paragraphs)',
    architectureSlices: record.architectureSlices,
    technicalDependencies: record.technicalDependencies,
    generatedAt: 'ISO 8601 timestamp',
    phaseContext: { roadmapPhaseId: 'string — roadmap phase id', roadmapPhaseName: 'string — human name', summary: 'string — 1-2 sentence goal summary', relatedArchitectureSections: ['string — architecture sections relevant to this phase'] },
    scopeDefinition: { included: ['string — what is explicitly in scope'], excluded: ['string — what is explicitly out of scope'] },
    affectedProjects: [{ projectId: 'string', projectName: 'string', purpose: 'string — why affected', expectedChanges: ['string — concrete changes'] }],
    workBreakdown: [{ groupLabel: 'string — logical group name', tasks: [{ id: 'string — unique task id (e.g. t-1)', title: 'string', description: 'string — what to do', projectId: 'string — target code project', type: 'feature|refactor|integration|config|test|docs', dependencies: ['string — task ids this depends on'], expectedOutcome: 'string — verifiable result' }] }],
    interfacesAndContracts: { apis: [{ name: 'string', producerProjectId: 'string', consumerProjectIds: ['string'], description: 'string' }], boundaries: ['string — boundary rules'], dataContracts: [{ name: 'string', ownerProjectId: 'string', description: 'string' }] },
    dataChanges: { newModels: [{ name: 'string', projectId: 'string', description: 'string', fields: ['string — field name and type'] }], migrations: ['string — migration descriptions'], storageChanges: ['string — storage infrastructure changes'] },
    risksAndEdgeCases: [{ id: 'string', description: 'string', severity: 'low|medium|high', mitigation: 'string (optional)' }],
    validationPlan: { verificationSteps: ['string — how to verify success'], testExpectations: ['string — tests to implement'], qaGateCriteria: ['string — QA acceptance criteria'] },
    definitionOfDone: ['string — concrete criteria for completion'],
  }, null, 2);

  const phaseContextBlock = `Phase: ${record.label}\nRoadmap Phase: ${record.roadmapEntryPhase}${record.goals.length > 0 ? `\n\nGoals:\n${record.goals.map((g) => `- ${g}`).join('\n')}` : ''}${record.deliverables.length > 0 ? `\n\nDeliverables:\n${record.deliverables.map((d) => `- ${d}`).join('\n')}` : ''}${record.validationCriteria.length > 0 ? `\n\nValidation Criteria:\n${record.validationCriteria.map((v) => `- ${v}`).join('\n')}` : ''}${involvedProjectsContext}`;

  const architectureBlock = architectureContext ? `\n\n--- ARCHITECTURE CONTEXT ---\n${architectureContext}\n--- END ARCHITECTURE CONTEXT ---\n\nYour plan MUST:\n- Reference the relevant architecture slices and explain how each will be addressed\n- Respect all implementation guidelines and boundaries\n- Note any technical dependencies that must be satisfied first\n- Flag any potential conflicts between the plan and architecture constraints` : '';

  // 1a. Software Architect — structural skeleton
  host.run.reportStep(`subphase-plan-arch-${record.id}`, 'software-architect');
  host.events.emitProgress(0, `Architect planning: ${record.label}`);

  const architectSkeletonResult = await host.llm.complete({
    purposeId: 'development-plan',
    systemPrompt: `${ROLE_PROMPTS['software-architect']}\n\nYou MUST respond with ONLY a valid JSON object matching this exact schema. No markdown, no explanation, no code fences — just the JSON object.\n\nYour focus: define the structural skeleton — scope boundaries, work breakdown groups with high-level tasks, interfaces and contracts, data changes, architecture slice alignment, and risks. Task descriptions should focus on WHAT needs to happen architecturally, not HOW to code it.\n\nSchema:\n${implPlanSchema}`,
    messages: [{
      role: 'user',
      content: `${projectContext}\n\nCreate a structural implementation plan skeleton for this sub-phase:\n${phaseContextBlock}${architectureBlock}\n\nRespond with ONLY a valid JSON object matching the schema provided in the system prompt. Tasks must be meaningful (not trivial micro-steps), grouped logically, and reference real code projects. Dependencies must reference task ids within this plan.`,
    }],
    temperature: 0.2,
    maxTokens: 5000,
  });

  const architectSkeleton = JSON.parse(architectSkeletonResult.text.trim());
  roleFlow.push('software-architect');

  // 1b. Developer — refinement of architect skeleton
  host.run.reportStep(`subphase-plan-dev-${record.id}`, 'developer');
  host.events.emitProgress(0.05, `Developer refining: ${record.label}`);

  const planResult = await host.llm.complete({
    purposeId: 'development-plan',
    systemPrompt: `${ROLE_PROMPTS.developer}\n\nYou MUST respond with ONLY a valid JSON object matching this exact schema. No markdown, no explanation, no code fences — just the JSON object.\n\nYou are refining an architect's structural skeleton into a practical, executable plan. Your focus: enrich task descriptions with actionable implementation details, adjust expected outcomes for feasibility, add missing tasks or dependencies, refine the body with developer-perspective narrative, and sharpen the definition of done and validation plan.\n\nSchema:\n${implPlanSchema}`,
    messages: [{
      role: 'user',
      content: `${projectContext}\n\nRefine this architect's structural skeleton into an executable implementation plan:\n\n--- ARCHITECT SKELETON ---\n${JSON.stringify(architectSkeleton, null, 2)}\n--- END ARCHITECT SKELETON ---\n\n${phaseContextBlock}${architectureBlock}\n\nRequirements:\n- Keep the architect's structural decisions (scope, groups, interfaces, data changes) unless they are clearly infeasible\n- Enrich every task with concrete implementation details, file/module references where appropriate, and realistic expected outcomes\n- Add any missing tasks the architect overlooked (testing tasks, config tasks, integration tasks)\n- Refine the body to be a developer-oriented summary of the execution strategy\n- Ensure dependencies between tasks form a valid DAG\n- Sharpen definition of done with verifiable, non-vague criteria\n\nRespond with ONLY a valid JSON object matching the schema provided in the system prompt.`,
    }],
    temperature: 0.2,
    maxTokens: 6000,
  });

  const planContent = JSON.parse(planResult.text.trim()) as ImplementationPhasePlanArtifactContent;
  roleFlow.push('developer');
  (planContent as unknown as Record<string, unknown>).versionMetadata = { generationRunId, roleFlow };

  const planArtifact = await host.workspace.createArtifact({
    type: 'implementation-phase-plan',
    title: `Implementation Plan: ${record.label}`,
    content: planContent as unknown as Record<string, unknown>,
    createdByRole: 'developer',
  });
  record.planArtifactId = planArtifact.id;
  artifactIds.push(planArtifact.id);
  project.artifactIds.push(planArtifact.id);

  // Record initial version
  const initialPlanVersion: ImplementationPlanVersion = {
    id: generateId(),
    version: 1,
    artifactId: planArtifact.id,
    phaseRecordId: record.id,
    createdAt: new Date().toISOString(),
    decision: null,
  };
  record.implementationPlanVersions = [initialPlanVersion];
  await host.workspace.setState(state);
  await host.run.checkpoint();

  // 2. User approval of plan — full approval loop
  const IMPL_PLAN_MAX_REVISIONS = 3;
  let implRevisionCount = 0;
  let currentPlanContent = planContent;
  let currentPlanArtifactId = planArtifact.id;
  let currentPlanVersion = initialPlanVersion;

  host.run.reportStep(`subphase-plan-approval-${record.id}`, 'developer');
  let planGateResponse = (await host.run.requestInput({
    title: `Approve Implementation Plan: ${record.label}`,
    message: `An implementation plan has been generated for "${record.label}". Review the plan artifact and decide how to proceed.`,
    inputSchema: buildImplPlanGateSchema(true),
  })) as ImplPlanGateResponse;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const planDecision = planGateResponse.decision ?? 'approve';
    const planFeedback = planGateResponse.feedback;
    const planTaskEdits = planGateResponse.taskEdits;
    const planScopeChanges = planGateResponse.scopeChanges;
    const planRiskEdits = planGateResponse.riskEdits;
    const planDependencyChanges = planGateResponse.dependencyChanges;

    project.validationHistory.push({
      phase: 'implementation-phase',
      decision: planDecision as ValidationEntry['decision'],
      feedback: planFeedback ?? null,
      timestamp: new Date().toISOString(),
    });

    // ── pause ──────────────────────────────────────────────────────────
    if (planDecision === 'pause') {
      record.status = 'not_started';
      record.userDecision = 'pause';
      await host.workspace.setState(state);
      await host.run.checkpoint();
      return { artifactIds, success: false };
    }

    // ── cancel ─────────────────────────────────────────────────────────
    if (planDecision === 'cancel') {
      record.status = 'failed';
      record.userDecision = 'cancel';
      await host.workspace.setState(state);
      await host.run.checkpoint();
      return { artifactIds, success: false };
    }

    // ── approve ────────────────────────────────────────────────────────
    if (planDecision === 'approve') {
      await host.workspace.updateArtifact(currentPlanArtifactId, { status: 'approved' });
      currentPlanVersion.decision = 'approve';
      record.userDecision = 'approve';
      host.log.info('Implementation plan approved', { artifactId: currentPlanArtifactId });
      await host.workspace.setState(state);
      await host.run.checkpoint();
      break;
    }

    // ── approve-with-changes ───────────────────────────────────────────
    if (planDecision === 'approve-with-changes') {
      if (!hasBudgetFor(host, 1)) {
        await host.workspace.updateArtifact(currentPlanArtifactId, { status: 'approved' });
        currentPlanVersion.decision = 'approve';
        record.userDecision = 'approve';
        host.log.warn('No budget for impl plan approve-with-changes, approving as-is');
        await host.workspace.setState(state);
        await host.run.checkpoint();
        break;
      }

      const editCtx = buildImplPlanEditContext(planTaskEdits, planScopeChanges, planRiskEdits, planDependencyChanges);
      const changeInstructions = [
        planFeedback ? `User feedback: ${planFeedback}` : '',
        editCtx,
      ].filter(Boolean).join('\n\n');

      host.run.reportStep(`subphase-plan-apply-changes-${record.id}`, 'developer');

      const changeResult = await host.llm.complete({
        purposeId: 'development-plan',
        systemPrompt: `${ROLE_PROMPTS.developer}

You are applying targeted changes to an implementation plan. Do NOT redesign the entire plan. Only incorporate the specific adjustments requested. Output the COMPLETE updated implementation plan as valid JSON matching the same schema as the input (no markdown fences, no explanation).

Schema:\n${implPlanSchema}`,
        messages: [{
          role: 'user',
          content: `Apply these changes to the implementation plan:\n\n${changeInstructions}\n\nCurrent implementation plan:\n${JSON.stringify(currentPlanContent, null, 2)}`,
        }],
        temperature: 0.1,
        maxTokens: 6000,
      });

      let updatedPlanContent: ImplementationPhasePlanArtifactContent;
      try {
        updatedPlanContent = JSON.parse(changeResult.text.trim());
      } catch {
        host.log.warn('Failed to parse impl plan approve-with-changes result, approving original');
        await host.workspace.updateArtifact(currentPlanArtifactId, { status: 'approved' });
        currentPlanVersion.decision = 'approve';
        record.userDecision = 'approve';
        await host.workspace.setState(state);
        await host.run.checkpoint();
        break;
      }

      await host.workspace.updateArtifact(currentPlanArtifactId, { status: 'superseded' });

      const newPlanVersionNumber = record.implementationPlanVersions.length + 1;
      (updatedPlanContent as unknown as Record<string, unknown>).versionMetadata = {
        generationRunId,
        roleFlow: [...roleFlow, 'developer'],
      };

      const newPlanArtifact = await host.workspace.createArtifact({
        type: 'implementation-phase-plan',
        title: `Implementation Plan: ${record.label}`,
        content: updatedPlanContent as unknown as Record<string, unknown>,
        createdByRole: 'developer',
        parentArtifactId: currentPlanArtifactId,
      });
      await host.workspace.updateArtifact(newPlanArtifact.id, { status: 'approved' });

      const newPlanVersion: ImplementationPlanVersion = {
        id: generateId(),
        version: newPlanVersionNumber,
        artifactId: newPlanArtifact.id,
        phaseRecordId: record.id,
        createdAt: new Date().toISOString(),
        decision: 'approve',
      };
      record.implementationPlanVersions.push(newPlanVersion);
      record.planArtifactId = newPlanArtifact.id;
      artifactIds.push(newPlanArtifact.id);
      project.artifactIds.push(newPlanArtifact.id);
      record.userDecision = 'approve';
      currentPlanContent = updatedPlanContent;
      await host.workspace.setState(state);
      await host.run.checkpoint();
      host.log.info('Implementation plan approved with changes', { originalId: currentPlanArtifactId, newId: newPlanArtifact.id });
      break;
    }

    // ── revise / reject — regenerate with feedback ─────────────────────
    if (planDecision === 'revise' || planDecision === 'reject') {
      implRevisionCount++;
      await host.workspace.updateArtifact(currentPlanArtifactId, { status: 'superseded' });
      currentPlanVersion.decision = planDecision as ValidationEntry['decision'];
      host.log.info(`Implementation plan ${planDecision}ed, regenerating`, { feedback: planFeedback, revision: implRevisionCount });

      if (!hasBudgetFor(host, 3) || implRevisionCount > IMPL_PLAN_MAX_REVISIONS) {
        record.status = 'failed';
        record.userDecision = planDecision as ImplementationPhaseRecord['userDecision'];
        await host.workspace.setState(state);
        await host.run.checkpoint();
        const reason = implRevisionCount > IMPL_PLAN_MAX_REVISIONS
          ? `Maximum implementation plan revision limit (${IMPL_PLAN_MAX_REVISIONS}) reached`
          : 'Insufficient step budget for implementation plan regeneration';
        host.log.warn(reason);
        return { artifactIds, success: false };
      }

      const editCtx = buildImplPlanEditContext(planTaskEdits, planScopeChanges, planRiskEdits, planDependencyChanges);
      const combinedFeedback = [
        planFeedback ?? '',
        editCtx,
      ].filter(Boolean).join('\n\n');

      // Re-run architect skeleton with feedback
      host.run.reportStep(`subphase-plan-arch-revision-${record.id}-v${implRevisionCount + 1}`, 'software-architect');
      host.events.emitProgress(0.05, `Architect revising plan: ${record.label} (revision ${implRevisionCount})`);

      const revisionArchResult = await host.llm.complete({
        purposeId: 'development-plan',
        systemPrompt: `${ROLE_PROMPTS['software-architect']}

You are REVISING an implementation plan based on user feedback. The user explicitly ${planDecision}ed the previous version. Address their feedback directly. Output ONLY valid JSON matching the schema (no markdown fences, no explanation).

Schema:\n${implPlanSchema}`,
        messages: [{
          role: 'user',
          content: `Revise this implementation plan based on user feedback:\n\n${projectContext}\n\n${phaseContextBlock}${architectureBlock}\n\nUser feedback:\n${combinedFeedback}\n\nPrevious implementation plan to revise:\n${JSON.stringify(currentPlanContent, null, 2)}`,
        }],
        temperature: 0.2,
        maxTokens: 5000,
      });

      const revisedSkeleton = JSON.parse(revisionArchResult.text.trim());

      // Developer refinement of revised skeleton
      host.run.reportStep(`subphase-plan-dev-revision-${record.id}-v${implRevisionCount + 1}`, 'developer');
      host.events.emitProgress(0.1, `Developer refining revision: ${record.label}`);

      const revisedPlanResult = await host.llm.complete({
        purposeId: 'development-plan',
        systemPrompt: `${ROLE_PROMPTS.developer}\n\nYou MUST respond with ONLY a valid JSON object matching this exact schema. No markdown, no explanation, no code fences — just the JSON object.\n\nYou are refining a revised architect skeleton. The user requested changes to the previous plan. Ensure all feedback is addressed.\n\nSchema:\n${implPlanSchema}`,
        messages: [{
          role: 'user',
          content: `${projectContext}\n\nRefine this revised architect skeleton:\n\n--- REVISED ARCHITECT SKELETON ---\n${JSON.stringify(revisedSkeleton, null, 2)}\n--- END REVISED ARCHITECT SKELETON ---\n\n${phaseContextBlock}${architectureBlock}\n\nUser feedback that prompted this revision:\n${combinedFeedback}\n\nRespond with ONLY a valid JSON object.`,
        }],
        temperature: 0.2,
        maxTokens: 6000,
      });

      let revisedPlanContent: ImplementationPhasePlanArtifactContent;
      try {
        revisedPlanContent = JSON.parse(revisedPlanResult.text.trim());
      } catch {
        throw new Error('Implementation plan revision failed: LLM returned invalid JSON. Checkpoint and retry.');
      }

      const newPlanVersionNumber = record.implementationPlanVersions.length + 1;
      (revisedPlanContent as unknown as Record<string, unknown>).versionMetadata = {
        generationRunId,
        roleFlow: [...roleFlow, 'software-architect', 'developer'],
      };

      const newPlanArtifact = await host.workspace.createArtifact({
        type: 'implementation-phase-plan',
        title: `Implementation Plan: ${record.label}`,
        content: revisedPlanContent as unknown as Record<string, unknown>,
        createdByRole: 'developer',
        parentArtifactId: currentPlanArtifactId,
      });

      const newPlanVersion: ImplementationPlanVersion = {
        id: generateId(),
        version: newPlanVersionNumber,
        artifactId: newPlanArtifact.id,
        phaseRecordId: record.id,
        createdAt: new Date().toISOString(),
        decision: null,
      };
      record.implementationPlanVersions.push(newPlanVersion);
      record.planArtifactId = newPlanArtifact.id;
      artifactIds.push(newPlanArtifact.id);
      project.artifactIds.push(newPlanArtifact.id);
      await host.workspace.setState(state);

      currentPlanContent = revisedPlanContent;
      currentPlanArtifactId = newPlanArtifact.id;
      currentPlanVersion = newPlanVersion;

      await host.run.checkpoint();
      host.run.reportStep(`subphase-plan-approval-${record.id}-v${newPlanVersionNumber}`, 'developer');
      planGateResponse = (await host.run.requestInput({
        title: `Review Revised Implementation Plan: ${record.label}`,
        message: `Implementation plan v${newPlanVersionNumber} has been generated for "${record.label}" (revision ${implRevisionCount} of ${IMPL_PLAN_MAX_REVISIONS}). Please review and decide.`,
        inputSchema: buildImplPlanGateSchema(implRevisionCount < IMPL_PLAN_MAX_REVISIONS),
      })) as ImplPlanGateResponse;

      continue;
    }

    // Unknown decision — treat as approve
    host.log.warn('Unknown impl plan gate decision, treating as approve', { decision: planDecision });
    await host.workspace.updateArtifact(currentPlanArtifactId, { status: 'approved' });
    currentPlanVersion.decision = 'approve';
    record.userDecision = 'approve';
    await host.workspace.setState(state);
    await host.run.checkpoint();
    break;
  }

  // 3. Implementing
  record.status = 'plan_approved';
  await host.workspace.setState(state);

  record.status = 'implementing';
  await host.workspace.setState(state);
  host.run.reportStep(`subphase-implement-${record.id}`, 'developer');
  host.events.emitProgress(0.3, `Implementing: ${record.label}`);

  if (isBridgeAvailable(host)) {
    const executionResult = await executePlanTaskGroups(host, state, project, record, currentPlanContent);
    if (!executionResult.success) {
      await host.workspace.setState(state);
      await host.run.checkpoint();
      return { artifactIds, success: false };
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

  // 4. QA Validation — structured JSON report
  record.status = 'qa_validating';
  await host.workspace.setState(state);
  host.run.reportStep(`subphase-qa-${record.id}`, 'qa');
  host.events.emitProgress(0.6, `QA Validating: ${record.label}`);

  const qaArchitectureContext = buildArchitectureContextForPhase(project, record);
  const qaReportSchema = buildQaReportSchema(currentPlanContent, !!qaArchitectureContext);

  const qaResult = await host.llm.complete({
    purposeId: 'qa-strategy',
    systemPrompt: `${ROLE_PROMPTS.qa}\n\nYou MUST respond with ONLY a valid JSON object matching this exact schema. No markdown, no explanation, no code fences — just the JSON object.\n\nSchema:\n${qaReportSchema}`,
    messages: [{
      role: 'user',
      content: `${projectContext}\n\nPerform QA validation for the implementation sub-phase: ${record.label}\n\n--- IMPLEMENTATION PLAN ---\n${JSON.stringify(currentPlanContent, null, 2)}\n--- END PLAN ---\n\n--- IMPLEMENTATION REPORT ---\n${reportResult.text.trim()}\n--- END REPORT ---${record.validationCriteria.length > 0 ? `\n\nValidation Criteria from Roadmap (evaluate each specifically):\n${record.validationCriteria.map((v) => `- ${v}`).join('\n')}` : ''}${qaArchitectureContext ? `\n\n--- ARCHITECTURE CONTEXT ---\n${qaArchitectureContext}\n--- END ARCHITECTURE CONTEXT ---` : ''}\n\nEvaluate EACH functionality criterion and definition-of-done item individually. Assign pass/fail/needs-work based on the implementation report evidence. Be rigorous — do not assume passing without evidence.\n\nRespond with ONLY valid JSON matching the schema.`,
    }],
    temperature: 0.2,
    maxTokens: 4000,
  });

  let qaReport: QaReportStructured;
  try {
    qaReport = parseQaReport(qaResult.text);
  } catch {
    // Fallback: if JSON parsing fails, create a basic report from the raw text
    const fallbackAssessment = qaArchitectureContext
      ? extractArchitectureAssessment(qaResult.text)
      : undefined;
    qaReport = {
      overallVerdict: 'needs-work',
      body: qaResult.text.trim(),
      functionalityChecks: [],
      definitionOfDoneChecks: [],
      architectureAssessment: fallbackAssessment,
    };
  }

  const qaArtifact = await host.workspace.createArtifact({
    type: 'qa-report',
    title: `QA Report: ${record.label}`,
    content: {
      projectId: project.id,
      subphaseId: record.id,
      label: record.label,
      body: qaReport.body,
      overallVerdict: qaReport.overallVerdict,
      functionalityChecks: qaReport.functionalityChecks,
      definitionOfDoneChecks: qaReport.definitionOfDoneChecks,
      ...(qaReport.architectureAssessment ? { architectureAssessment: qaReport.architectureAssessment } : {}),
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
      content: `${projectContext}\n\nCheck alignment of implementation sub-phase "${record.label}" with product intent.${record.goals.length > 0 ? `\n\nPhase Goals:\n${record.goals.map((g) => `- ${g}`).join('\n')}` : ''}${record.deliverables.length > 0 ? `\n\nExpected Deliverables:\n${record.deliverables.map((d) => `- ${d}`).join('\n')}` : ''}\n\nDoes this implementation deliver the intended value? Is it aligned with the roadmap and product vision?\n\nQA Report (verdict: ${qaReport.overallVerdict}):\n${qaReport.body}\n\nImplementation Report:\n${reportResult.text.trim()}`,
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
    message: `Implementation, QA validation (verdict: ${qaReport.overallVerdict}), and PM alignment check are complete for "${record.label}". Review all reports and decide how to proceed.`,
    inputSchema: buildQaGateSchema(),
  })) as { decision: string; feedback?: string; checkOverrides?: Array<{ criterion: string; action: string; notes: string }> };

  record.userDecision = finalApproval.decision as ImplementationPhaseRecord['userDecision'];
  const isApproved = finalApproval.decision === 'approve' || finalApproval.decision === 'approve-with-changes';
  record.status = isApproved ? 'completed' : 'failed';
  project.validationHistory.push({
    phase: 'implementation-phase',
    decision: finalApproval.decision as ValidationEntry['decision'],
    feedback: finalApproval.feedback ?? null,
    timestamp: new Date().toISOString(),
  });
  await host.workspace.setState(state);
  await host.run.checkpoint();

  if (record.status === 'failed') {
    host.run.reportStep(`subphase-failure-action-${record.id}`, 'developer');
    const mustFixItems = finalApproval.checkOverrides
      ?.filter((o) => o.action === 'must-fix')
      .map((o) => o.criterion) ?? [];
    const mustFixContext = mustFixItems.length > 0
      ? `\n\nItems flagged as must-fix:\n${mustFixItems.map((c) => `- ${c}`).join('\n')}`
      : '';
    const failureAction = (await host.run.requestInput({
      title: `Phase Failed: ${record.label}`,
      message: `This phase did not pass review. How would you like to proceed?${mustFixContext}`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['retry', 'redefine', 'skip'],
            description: 'retry: re-run same phase from scratch, redefine: update plan then re-run, skip: move to next phase',
          },
          feedback: { type: 'string', description: 'Additional guidance for retry or redefine' },
        },
        required: ['action'],
      },
    })) as { action: string; feedback?: string };

    if (failureAction.action === 'retry') {
      record.status = 'not_started';
      record.planArtifactId = null;
      record.implementationReportArtifactId = null;
      record.qaReportArtifactId = null;
      record.pmAlignmentDecision = null;
      record.userDecision = null;
      await host.workspace.setState(state);
      return { artifactIds, success: false };
    }

    if (failureAction.action === 'redefine') {
      record.status = 'not_started';
      record.planArtifactId = null;
      record.implementationReportArtifactId = null;
      record.qaReportArtifactId = null;
      record.pmAlignmentDecision = null;
      record.userDecision = null;
      await host.workspace.setState(state);
      return { artifactIds, success: false };
    }

    // 'skip' — leave as failed and move on
    return { artifactIds, success: false };
  }

  return { artifactIds, success: true };
}

async function generateArchitecturePlan(
  host: SkillHostCapabilities,
  state: StudioState,
  project: ProjectRecord,
  projectContext: string,
): Promise<{ id: string; canonical: ArchitecturePlanArtifactContent }> {
  const roadmapContext = project.approvedRoadmapPhases
    ? `\n\nApproved Roadmap Phases:\n${JSON.stringify(project.approvedRoadmapPhases, null, 2)}`
    : '';
  const topologyContext = project.approvedRoadmapTopology
    ? `\n\nApproved Project Topology:\n${JSON.stringify(project.approvedRoadmapTopology, null, 2)}`
    : '';

  const archResult = await host.llm.complete({
    purposeId: 'architecture-design',
    systemPrompt: `${ROLE_PROMPTS['software-architect']}

You are generating a canonical architecture plan for a product. Output ONLY valid JSON matching this exact schema (no markdown fences, no explanation):

{
  "systemOverview": {
    "description": "string - concise description of the whole technical system",
    "productRelationship": "string - how the architecture relates to the product vision and roadmap",
    "technicalConstraints": ["string - key technical constraints"]
  },
  "projectTopology": [
    {
      "id": "string - kebab-case identifier",
      "name": "string - display name",
      "purpose": "string - what this project does",
      "ownership": "string - team or person responsible",
      "type": "web-app | backend-api | mobile-app | worker | infra | shared-package | docs",
      "dependencies": ["string - ids of other projects this depends on"]
    }
  ],
  "runtimeArchitecture": {
    "frontends": [{ "name": "string", "projectId": "string", "description": "string", "responsibilities": ["string"] }],
    "backends": [{ "name": "string", "projectId": "string", "description": "string", "responsibilities": ["string"] }],
    "backgroundProcessing": [{ "name": "string", "projectId": "string", "description": "string", "responsibilities": ["string"] }],
    "externalIntegrations": [{ "name": "string", "purpose": "string", "protocol": "string" }]
  },
  "dataArchitecture": {
    "dataDomains": [{ "name": "string", "description": "string", "ownerProjectId": "string", "entities": ["string"] }],
    "persistenceStrategy": [{ "projectId": "string", "technology": "string", "rationale": "string" }],
    "boundaries": ["string - data boundary rules"],
    "stateOwnership": [{ "domain": "string", "ownerProjectId": "string", "accessPattern": "string" }]
  },
  "integrationArchitecture": {
    "apiBoundaries": [{ "name": "string", "producerProjectId": "string", "consumerProjectIds": ["string"], "protocol": "string" }],
    "internalIntegrationPoints": [{ "description": "string", "projectIds": ["string"] }],
    "externalServices": [{ "name": "string", "purpose": "string", "integrationMethod": "string" }]
  },
  "securityAndTrustModel": {
    "authAssumptions": ["string"],
    "secretHandling": ["string"],
    "trustBoundaries": ["string"],
    "riskySurfaces": ["string"]
  },
  "deploymentAndEnvironmentModel": {
    "environmentModel": [{ "name": "string", "purpose": "string", "characteristics": ["string"] }],
    "deploymentUnits": [{ "projectId": "string", "strategy": "string", "notes": "string" }]
  },
  "qualityAttributes": {
    "maintainability": "string",
    "scalability": "string",
    "testability": "string",
    "reliability": "string",
    "performance": "string",
    "developerExperience": "string"
  },
  "phaseMapping": [
    {
      "phaseId": "string - must be a valid phase id from the roadmap",
      "phaseName": "string",
      "architectureSlices": ["string - architecture components built in this phase"],
      "technicalDependencies": ["string - phase ids this depends on technically"]
    }
  ],
  "implementationGuidelines": {
    "rules": ["string - architectural rules developers must follow"],
    "boundariesToPreserve": ["string - boundaries that must not be violated"],
    "antiPatterns": ["string - practices to avoid"],
    "codingExpectations": ["string - quality expectations for code"]
  },
  "openRisks": [
    {
      "id": "string - kebab-case identifier",
      "description": "string - what the risk is",
      "severity": "low | medium | high | critical",
      "mitigation": "string (optional) - how to mitigate"
    }
  ],
  "openQuestions": [
    {
      "id": "string - kebab-case identifier",
      "question": "string - the question",
      "context": "string (optional) - why this matters"
    }
  ]
}

Quality requirements:
- Be concrete and specific to this product. No generic architecture advice.
- Define clear boundaries between projects.
- projectTopology ids must be consistent with roadmap topology when available.
- phaseMapping must reference phases from the approved roadmap.
- openRisks must have genuine severity assessments with real mitigations.
- openQuestions should flag genuine unknowns, not obvious decisions.
- securityAndTrustModel must address auth, secrets, and trust boundaries specifically.
- qualityAttributes must be specific to this system, not generic platitudes.
- Every project in projectTopology must appear in at least one runtimeArchitecture section.`,
    messages: [{
      role: 'user',
      content: `Generate a canonical architecture plan for this product:\n\n${projectContext}${roadmapContext}${topologyContext}`,
    }],
    temperature: 0.2,
    maxTokens: 8000,
  });

  let canonical: ArchitecturePlanArtifactContent;
  try {
    canonical = JSON.parse(archResult.text.trim());
  } catch {
    throw new Error('Architecture plan generation failed: LLM returned invalid JSON. Checkpoint and retry the run.');
  }
  validateArchitecturePlanCanonical(canonical);
  canonical.versionMetadata = { version: 1, roleFlow: ['software-architect'] };

  const artifact = await host.workspace.createArtifact({
    type: 'architecture-plan',
    title: `Architecture Plan: ${project.name}`,
    content: canonical as unknown as Record<string, unknown>,
    createdByRole: 'software-architect',
  });

  project.architecturePlanVersions.push({
    id: generateId(),
    version: 1,
    artifactId: artifact.id,
    createdAt: new Date().toISOString(),
    decision: null,
  });

  return { id: artifact.id, canonical };
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

    // Dedicated structured generation for architecture-plan artifacts
    if (step.artifactType === 'architecture-plan') {
      const archArtifact = await generateArchitecturePlan(host, state, project, projectContext);
      createdArtifactIds.push(archArtifact.id);
      project.artifactIds.push(archArtifact.id);
      await host.workspace.setState(state);
      continue;
    }

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
  if (targetPhase === 'implementation-phase') {
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
      if (project.implementationStatus.roadmapPhaseRecords.length === 0) {
        project.implementationStatus.roadmapPhaseRecords =
          buildRoadmapPhaseRecordsFromArtifact(project, project.approvedRoadmapTopology ?? undefined, project.approvedArchitecturePlan);

        // Fallback for projects created before approvedRoadmapPhases existed
        if (project.implementationStatus.roadmapPhaseRecords.length === 0 && project.roadmap) {
          project.implementationStatus.roadmapPhaseRecords = project.roadmap
            .filter((entry) => !project.completedPhases.includes(entry.phase))
            .map((entry) => ({
              id: generateId(),
              roadmapEntryPhase: entry.phase,
              roadmapPhaseId: null,
              label: `${entry.phase}: ${entry.milestones[0] ?? entry.deliverables[0] ?? entry.phase}`,
              status: 'not_started' as const,
              goals: [],
              deliverables: entry.deliverables,
              validationCriteria: [],
              involvedProjectIds: [],
              architectureSlices: [],
              technicalDependencies: [],
              planArtifactId: null,
              implementationReportArtifactId: null,
              qaReportArtifactId: null,
              pmAlignmentDecision: null,
              userDecision: null,
              bridgeJobIds: [],
              implementationPlanVersions: [],
              taskGroupProgress: [],
              currentTaskGroupIndex: null,
            }));
        }
        await host.workspace.setState(state);
      }

      // Execute per-roadmap-phase implementation loop with retry support
      let ri = 0;
      while (ri < project.implementationStatus.roadmapPhaseRecords.length) {
        const record = project.implementationStatus.roadmapPhaseRecords[ri];
        if (record.status === 'completed' || record.status === 'failed') { ri++; continue; }

        if (!hasBudgetFor(host, 8)) {
          host.log.warn('Budget insufficient for next implementation sub-phase', { ri });
          break;
        }

        const subResult = await handleRunImplementationSubphase(host, state, project, ri);
        createdArtifactIds.push(...subResult.artifactIds);

        if (!subResult.success) {
          // If record was reset to not_started (retry/redefine), re-process same index
          if (record.status === 'not_started') continue;
          break;
        }
        ri++;
      }

      project.implementationStatus.activeRoadmapPhaseIndex = null;

      // Execute implementation phases
      const execArtifactIds = await executeImplementationPhases(host, state, project);
      createdArtifactIds.push(...execArtifactIds);
    }
  }

  // Architecture approval loop: structured review with versioning and revision support
  if (targetPhase === 'architecture-definition') {
    const techStackArtifact = findArtifactByTypeForStep(
      await host.workspace.listArtifacts(),
      'tech-stack-decision',
    );
    const archPlanArtifactInitial = findArtifactByTypeForStep(
      await host.workspace.listArtifacts(),
      'architecture-plan',
    );
    if (techStackArtifact && archPlanArtifactInitial) {
      const ARCH_MAX_REVISIONS = 3;
      let archRevisionCount = 0;
      let currentArchCanonical: ArchitecturePlanArtifactContent =
        archPlanArtifactInitial.content as unknown as ArchitecturePlanArtifactContent;
      let currentArchArtifactId = archPlanArtifactInitial.id;
      let currentArchVersion = project.architecturePlanVersions[project.architecturePlanVersions.length - 1] ?? null;

      await host.run.checkpoint();
      host.run.reportStep('architecture-approval', 'software-architect');
      let archGateResponse = (await host.run.requestInput({
        title: 'Review Architecture Decisions',
        message: `Architecture and technology stack decisions have been made for "${project.name}". Review the architecture-plan and tech-stack-decision artifacts. You can approve, request targeted changes to specific sections, or request a full revision.`,
        inputSchema: buildArchitectureGateSchema(true),
      })) as ArchitectureGateResponse;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const archDecision = archGateResponse.decision ?? 'approve';
        const archFeedback = archGateResponse.feedback;
        const archSectionEdits = archGateResponse.sectionEdits;
        const archTopologyChanges = archGateResponse.topologyChanges;

        project.validationHistory.push({
          phase: targetPhase,
          decision: archDecision as ValidationEntry['decision'],
          feedback: archFeedback ?? null,
          timestamp: new Date().toISOString(),
        });

        // ── pause / cancel ──────────────────────────────────────────────
        if (archDecision === 'pause') {
          await host.workspace.setState(state);
          await host.run.checkpoint();
          return {
            success: true,
            message: `Architecture review paused for "${project.name}". Resume when ready.`,
            studioState: state,
            artifactIds: createdArtifactIds,
            stepsUsed: host.run.getStepCount(),
            phasesCompleted: [],
          };
        }

        if (archDecision === 'cancel') {
          await host.workspace.setState(state);
          await host.run.checkpoint();
          return {
            success: true,
            message: `Architecture review cancelled for "${project.name}".`,
            studioState: state,
            artifactIds: createdArtifactIds,
            stepsUsed: host.run.getStepCount(),
            phasesCompleted: [],
          };
        }

        // ── approve ─────────────────────────────────────────────────────
        if (archDecision === 'approve') {
          await host.workspace.updateArtifact(currentArchArtifactId, { status: 'approved' });
          await host.workspace.updateArtifact(techStackArtifact.id, { status: 'approved' });
          if (currentArchVersion) currentArchVersion.decision = 'approve';
          project.approvedArchitecturePlan = currentArchCanonical;
          host.log.info('Architecture plan approved', { artifactId: currentArchArtifactId });
          await host.workspace.setState(state);
          await host.run.checkpoint();
          break;
        }

        // ── approve-with-changes ────────────────────────────────────────
        if (archDecision === 'approve-with-changes') {
          if (!hasBudgetFor(host, 1)) {
            await host.workspace.updateArtifact(currentArchArtifactId, { status: 'approved' });
            await host.workspace.updateArtifact(techStackArtifact.id, { status: 'approved' });
            if (currentArchVersion) currentArchVersion.decision = 'approve';
            project.approvedArchitecturePlan = currentArchCanonical;
            host.log.warn('No budget for architecture approve-with-changes, approving as-is');
            await host.workspace.setState(state);
            await host.run.checkpoint();
            break;
          }

          const archEditCtx = buildArchitectureEditContext(archSectionEdits, archTopologyChanges);
          const archChangeInstructions = [
            archFeedback ? `User feedback: ${archFeedback}` : '',
            archEditCtx,
          ].filter(Boolean).join('\n\n');

          await host.workspace.setRole('software-architect');
          host.run.reportStep('architect-apply-changes', 'software-architect');

          const archChangeResult = await host.llm.complete({
            purposeId: 'architecture-design',
            systemPrompt: `${ROLE_PROMPTS['software-architect']}

You are applying targeted changes to an approved architecture plan. Do NOT redesign the architecture. Only incorporate the specific adjustments requested. Output the COMPLETE updated architecture plan as valid JSON matching the same schema as the input (no markdown fences, no explanation).`,
            messages: [{
              role: 'user',
              content: `Apply these changes to the architecture plan:\n\n${archChangeInstructions}\n\nCurrent architecture plan:\n${JSON.stringify(currentArchCanonical, null, 2)}`,
            }],
            temperature: 0.1,
            maxTokens: 8000,
          });

          let updatedArchCanonical: ArchitecturePlanArtifactContent;
          try {
            updatedArchCanonical = JSON.parse(archChangeResult.text.trim());
          } catch {
            host.log.warn('Failed to parse architecture approve-with-changes result, approving original');
            await host.workspace.updateArtifact(currentArchArtifactId, { status: 'approved' });
            await host.workspace.updateArtifact(techStackArtifact.id, { status: 'approved' });
            if (currentArchVersion) currentArchVersion.decision = 'approve';
            project.approvedArchitecturePlan = currentArchCanonical;
            await host.workspace.setState(state);
            await host.run.checkpoint();
            break;
          }

          validateArchitecturePlanCanonical(updatedArchCanonical);
          await host.workspace.updateArtifact(currentArchArtifactId, { status: 'superseded' });

          const newArchVersionNumber = (project.architecturePlanVersions?.length ?? 0) + 1;
          updatedArchCanonical.versionMetadata = {
            version: newArchVersionNumber,
            roleFlow: [...(currentArchCanonical.versionMetadata?.roleFlow ?? []), 'software-architect'],
          };

          const newArchArtifact = await host.workspace.createArtifact({
            type: 'architecture-plan',
            title: `Architecture Plan: ${project.name}`,
            content: updatedArchCanonical as unknown as Record<string, unknown>,
            createdByRole: 'software-architect',
            parentArtifactId: currentArchArtifactId,
          });
          await host.workspace.updateArtifact(newArchArtifact.id, { status: 'approved' });
          await host.workspace.updateArtifact(techStackArtifact.id, { status: 'approved' });

          const newArchVersion: ArchitecturePlanVersion = {
            id: generateId(),
            version: newArchVersionNumber,
            artifactId: newArchArtifact.id,
            createdAt: new Date().toISOString(),
            decision: 'approve',
          };
          project.architecturePlanVersions.push(newArchVersion);
          project.artifactIds.push(newArchArtifact.id);
          createdArtifactIds.push(newArchArtifact.id);
          project.approvedArchitecturePlan = updatedArchCanonical;
          project.updatedAt = new Date().toISOString();
          await host.workspace.setState(state);
          await host.run.checkpoint();
          host.log.info('Architecture plan approved with changes', { originalId: currentArchArtifactId, newId: newArchArtifact.id });
          break;
        }

        // ── revise / reject — regenerate with feedback ──────────────────
        if (archDecision === 'revise' || archDecision === 'reject') {
          archRevisionCount++;
          await host.workspace.updateArtifact(currentArchArtifactId, { status: 'superseded' });
          await host.workspace.updateArtifact(techStackArtifact.id, { status: 'superseded' });
          if (currentArchVersion) currentArchVersion.decision = archDecision as ValidationEntry['decision'];
          host.log.info(`Architecture plan ${archDecision}ed, regenerating`, { feedback: archFeedback, revision: archRevisionCount });

          if (!hasBudgetFor(host, 2) || archRevisionCount > ARCH_MAX_REVISIONS) {
            await host.workspace.setState(state);
            await host.run.checkpoint();
            const reason = archRevisionCount > ARCH_MAX_REVISIONS
              ? `Maximum architecture revision limit (${ARCH_MAX_REVISIONS}) reached`
              : 'Insufficient step budget for architecture regeneration';
            return {
              success: false,
              message: `${reason} for "${project.name}". Last architecture version preserved.`,
              studioState: state,
              artifactIds: createdArtifactIds,
              stepsUsed: host.run.getStepCount(),
              phasesCompleted: [],
            };
          }

          const archEditCtx = buildArchitectureEditContext(archSectionEdits, archTopologyChanges);
          const archCombinedFeedback = [
            archFeedback ?? '',
            archEditCtx,
          ].filter(Boolean).join('\n\n');

          await host.workspace.setRole('software-architect');
          host.run.reportStep(`architect-revision-v${archRevisionCount + 1}`, 'software-architect');
          host.events.emitProgress(0.3, `Software Architect: Regenerating architecture plan (revision ${archRevisionCount})`);

          const roadmapContext = project.approvedRoadmapPhases
            ? `\n\nApproved Roadmap Phases:\n${JSON.stringify(project.approvedRoadmapPhases, null, 2)}`
            : '';
          const topologyContext = project.approvedRoadmapTopology
            ? `\n\nApproved Project Topology:\n${JSON.stringify(project.approvedRoadmapTopology, null, 2)}`
            : '';

          const archRevisionResult = await host.llm.complete({
            purposeId: 'architecture-design',
            systemPrompt: `${ROLE_PROMPTS['software-architect']}

You are REVISING an architecture plan based on user feedback. The user explicitly ${archDecision}ed the previous version. Address their feedback directly. Output ONLY valid JSON matching the canonical architecture plan schema (no markdown fences, no explanation).

Quality requirements:
- Address every point in the user's feedback
- Maintain structural integrity (valid project IDs, proper references)
- Do not introduce new issues while fixing requested changes
- If the user asked to simplify, reduce complexity
- If the user asked to change technology, update all affected sections
- If the user asked to add/remove projects, update topology and all dependent sections`,
            messages: [{
              role: 'user',
              content: `Revise this architecture plan based on user feedback:\n\n${projectContext}${roadmapContext}${topologyContext}\n\nUser feedback:\n${archCombinedFeedback}\n\nPrevious architecture plan to revise:\n${JSON.stringify(currentArchCanonical, null, 2)}`,
            }],
            temperature: 0.2,
            maxTokens: 8000,
          });

          let revisedArchCanonical: ArchitecturePlanArtifactContent;
          try {
            revisedArchCanonical = JSON.parse(archRevisionResult.text.trim());
          } catch {
            throw new Error('Architecture plan revision failed: LLM returned invalid JSON. Checkpoint and retry.');
          }
          validateArchitecturePlanCanonical(revisedArchCanonical);

          const newArchVersionNumber = (project.architecturePlanVersions?.length ?? 0) + 1;
          revisedArchCanonical.versionMetadata = {
            version: newArchVersionNumber,
            roleFlow: [...(currentArchCanonical.versionMetadata?.roleFlow ?? []), 'software-architect'],
          };

          const newArchArtifact = await host.workspace.createArtifact({
            type: 'architecture-plan',
            title: `Architecture Plan: ${project.name}`,
            content: revisedArchCanonical as unknown as Record<string, unknown>,
            createdByRole: 'software-architect',
            parentArtifactId: currentArchArtifactId,
          });

          const newArchVersion: ArchitecturePlanVersion = {
            id: generateId(),
            version: newArchVersionNumber,
            artifactId: newArchArtifact.id,
            createdAt: new Date().toISOString(),
            decision: null,
          };
          project.architecturePlanVersions.push(newArchVersion);
          project.artifactIds.push(newArchArtifact.id);
          createdArtifactIds.push(newArchArtifact.id);
          project.updatedAt = new Date().toISOString();
          await host.workspace.setState(state);

          currentArchCanonical = revisedArchCanonical;
          currentArchArtifactId = newArchArtifact.id;
          currentArchVersion = newArchVersion;

          await host.run.checkpoint();
          host.run.reportStep(`architecture-approval-v${newArchVersionNumber}`, 'software-architect');
          archGateResponse = (await host.run.requestInput({
            title: 'Review Revised Architecture Plan',
            message: `Architecture plan v${newArchVersionNumber} has been generated for "${project.name}" (revision ${archRevisionCount} of ${ARCH_MAX_REVISIONS}). Please review and decide.`,
            inputSchema: buildArchitectureGateSchema(archRevisionCount < ARCH_MAX_REVISIONS),
          })) as ArchitectureGateResponse;

          continue;
        }

        // Unknown decision — treat as approve
        host.log.warn('Unknown architecture gate decision, treating as approve', { decision: archDecision });
        await host.workspace.updateArtifact(currentArchArtifactId, { status: 'approved' });
        await host.workspace.updateArtifact(techStackArtifact.id, { status: 'approved' });
        if (currentArchVersion) currentArchVersion.decision = 'approve';
        project.approvedArchitecturePlan = currentArchCanonical;
        await host.workspace.setState(state);
        await host.run.checkpoint();
        break;
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

  // Bridge is required for this skill
  if (!isBridgeAvailable(host)) {
    return { success: false, message: 'This skill requires the OS Loop Bridge. Connect the bridge and try again.' };
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

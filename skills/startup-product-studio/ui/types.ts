// ---------------------------------------------------------------------------
// Studio Domain Types
// ---------------------------------------------------------------------------
// Client-side type definitions mirroring the startup-product-studio skill's
// workspace state structure stored in SkillWorkspace.state.
// ---------------------------------------------------------------------------

export type PhaseId =
  | 'discovery'
  | 'roadmap-definition'
  | 'product-definition'
  | 'ux-definition'
  | 'architecture-definition'
  | 'implementation-phase'
  | 'qa-validation'
  | 'release-readiness';

export type RoleId =
  | 'ceo'
  | 'product-manager'
  | 'ux-ui'
  | 'software-architect'
  | 'developer'
  | 'qa';

export type GateDecision = 'approve' | 'reject' | 'revise' | 'approve-with-changes' | 'pause' | 'cancel';

// ---------------------------------------------------------------------------
// Structured Roadmap Editing
// ---------------------------------------------------------------------------

export type RoadmapPhaseEditAction = 'remove' | 'reprioritize' | 'edit-scope' | 'merge' | 'split';

export interface RoadmapPhaseEdit {
  phaseId: string;
  action: RoadmapPhaseEditAction;
  details: string;
}

export interface RoadmapScopeChanges {
  addToIncluded: string[];
  removeFromIncluded: string[];
  addToExcluded: string[];
  removeFromExcluded: string[];
}

export interface RoadmapGateResponse {
  decision: GateDecision;
  feedback?: string;
  phaseEdits?: RoadmapPhaseEdit[];
  scopeChanges?: RoadmapScopeChanges;
}

// ---------------------------------------------------------------------------
// Structured Architecture Editing
// ---------------------------------------------------------------------------

export type ArchitectureSectionId =
  | 'systemOverview'
  | 'projectTopology'
  | 'runtimeArchitecture'
  | 'dataArchitecture'
  | 'integrationArchitecture'
  | 'securityAndTrustModel'
  | 'deploymentAndEnvironmentModel'
  | 'qualityAttributes'
  | 'phaseMapping'
  | 'implementationGuidelines'
  | 'openRisks'
  | 'openQuestions';

export type ArchitectureSectionEditAction =
  | 'simplify'
  | 'add-detail'
  | 'replace'
  | 'remove-component'
  | 'add-component'
  | 'change-technology'
  | 'restructure';

export interface ArchitectureSectionEdit {
  sectionId: ArchitectureSectionId;
  action: ArchitectureSectionEditAction;
  details: string;
}

export interface ArchitectureTopologyChanges {
  addProjects: string[];
  removeProjects: string[];
  changeTypes: string[];
}

export interface ArchitectureGateResponse {
  decision: GateDecision;
  feedback?: string;
  sectionEdits?: ArchitectureSectionEdit[];
  topologyChanges?: ArchitectureTopologyChanges;
}

export type CodeProjectType = 'web' | 'mobile' | 'backend' | 'worker' | 'infra' | 'shared' | 'docs';

// ---------------------------------------------------------------------------
// Workspace State
// ---------------------------------------------------------------------------

export interface StudioState {
  studioName: string;
  projects: ProjectRecord[];
  activeProjectId: string | null;
  createdAt: string;
}

export interface ProjectRecord {
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
  phaseDialogues?: Record<string, PhaseDialogue>;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapEntry {
  phase: PhaseId;
  milestones: string[];
  deliverables: string[];
  estimatedDuration: string;
  dependencies: string[];
}

export type CodeProjectBootstrapStatus = 'pending' | 'git_initialized' | 'claude_configured' | 'ready';

export interface CodeProject {
  id: string;
  name: string;
  type: CodeProjectType;
  techStack: string;
  repoPath: string | null;
  bootstrapStatus: CodeProjectBootstrapStatus | null;
  bootstrapBridgeJobId: string | null;
}

export interface BusinessContext {
  industry: string;
  marketSegment: string;
  revenueModel: string;
  competitiveAdvantage: string;
}

export interface UserPersona {
  persona: string;
  description: string;
  painPoints: string[];
}

export interface Constraints {
  timeline: string | null;
  budget: string | null;
  technical: string[];
  regulatory: string[];
}

export interface ImplementationExecutionPhase {
  id: string;
  label: string;
  goals: string[];
  targetCodeProjectIds: string[];
  status: 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed';
  bridgeJobIds: string[];
}

export interface ImplementationStatus {
  totalTasks: number;
  completedTasks: number;
  currentIteration: number;
  totalIterationsPlanned: number;
  blockers: string[];
  executionPhases: ImplementationExecutionPhase[];
  activeExecutionPhaseIndex: number | null;
  roadmapPhaseRecords: ImplementationPhaseRecord[];
  activeRoadmapPhaseIndex: number | null;
}

export interface ValidationEntry {
  phase: PhaseId;
  decision: GateDecision;
  feedback: string | null;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Roadmap Versioning
// ---------------------------------------------------------------------------

export interface RoadmapVersion {
  id: string;
  version: number;
  entries: RoadmapEntry[];
  createdAt: string;
  decision: GateDecision | null;
}

// ---------------------------------------------------------------------------
// Architecture Plan Versioning
// ---------------------------------------------------------------------------

export interface ArchitecturePlanVersion {
  id: string;
  version: number;
  artifactId: string;
  createdAt: string;
  decision: GateDecision | null;
}

// ---------------------------------------------------------------------------
// Per-Roadmap-Phase Implementation Tracking
// ---------------------------------------------------------------------------

export type RoadmapPhaseStatus =
  | 'not_started'
  | 'planning'
  | 'plan_approved'
  | 'implementing'
  | 'qa_validating'
  | 'pm_reviewing'
  | 'user_reviewing'
  | 'completed'
  | 'failed';

export interface ImplementationPhaseRecord {
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
  pmAlignmentDecision: GateDecision | null;
  userDecision: GateDecision | null;
  bridgeJobIds: string[];
  implementationPlanVersions: ImplementationPlanVersion[];
  taskGroupProgress: TaskGroupProgress[];
  currentTaskGroupIndex: number | null;
}

export type TaskGroupProgressStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface TaskGroupProgress {
  groupLabel: string;
  taskIds: string[];
  status: TaskGroupProgressStatus;
  bridgeJobIds: string[];
  startedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
}

// ---------------------------------------------------------------------------
// QA Architecture Assessment
// ---------------------------------------------------------------------------

export type QaArchitectureAlignmentStatus = 'aligned' | 'minor-drift' | 'significant-drift';

export interface QaArchitectureAssessment {
  alignmentStatus: QaArchitectureAlignmentStatus;
  driftFindings: string[];
  qualityAttributeNotes: string[];
  boundaryViolations: string[];
}

export type QaCheckStatus = 'pass' | 'fail' | 'needs-work';
export type QaOverallVerdict = 'pass' | 'fail' | 'needs-work';

export interface QaFunctionalityCheck {
  criterion: string;
  status: QaCheckStatus;
  notes: string;
}

export interface QaDefinitionOfDoneCheck {
  item: string;
  status: 'pass' | 'fail';
  notes: string;
}

export interface QaReportArtifactContent {
  projectId: string;
  subphaseId: string;
  label: string;
  body: string;
  architectureAssessment?: QaArchitectureAssessment;
  functionalityChecks?: QaFunctionalityCheck[];
  definitionOfDoneChecks?: QaDefinitionOfDoneCheck[];
  overallVerdict?: QaOverallVerdict;
  generatedAt: string;
}

export function isQaReportArtifactContent(
  content: Record<string, unknown>,
): content is QaReportArtifactContent {
  return (
    content !== null &&
    typeof content === 'object' &&
    typeof content.projectId === 'string' &&
    typeof content.body === 'string' &&
    typeof content.generatedAt === 'string'
  );
}

// ---------------------------------------------------------------------------
// QA Gate Response
// ---------------------------------------------------------------------------

export type QaCheckOverrideAction = 'accept-as-is' | 'must-fix';

export interface QaCheckOverride {
  criterion: string;
  action: QaCheckOverrideAction;
  notes: string;
}

export interface QaGateResponse {
  decision: GateDecision;
  feedback?: string;
  checkOverrides?: QaCheckOverride[];
}

export const QA_CHECK_STATUS_LABELS: Record<QaCheckStatus, string> = {
  pass: 'Pass',
  fail: 'Fail',
  'needs-work': 'Needs Work',
};

export const QA_VERDICT_LABELS: Record<QaOverallVerdict, string> = {
  pass: 'Pass',
  fail: 'Fail',
  'needs-work': 'Needs Work',
};

// ---------------------------------------------------------------------------
// Implementation Phase Plan Artifact Content
// ---------------------------------------------------------------------------

export interface ImplPlanPhaseContext {
  roadmapPhaseId: string;
  roadmapPhaseName: string;
  summary: string;
  relatedArchitectureSections: string[];
}

export interface ImplPlanScopeDefinition {
  included: string[];
  excluded: string[];
}

export interface ImplPlanAffectedProject {
  projectId: string;
  projectName: string;
  purpose: string;
  expectedChanges: string[];
}

export type ImplPlanTaskType = 'feature' | 'refactor' | 'integration' | 'config' | 'test' | 'docs';

export interface ImplPlanTask {
  id: string;
  title: string;
  description: string;
  projectId: string;
  type: ImplPlanTaskType;
  dependencies: string[];
  expectedOutcome: string;
}

export interface ImplPlanTaskGroup {
  groupLabel: string;
  tasks: ImplPlanTask[];
}

export interface ImplPlanApiContract {
  name: string;
  producerProjectId: string;
  consumerProjectIds: string[];
  description: string;
}

export interface ImplPlanDataContract {
  name: string;
  ownerProjectId: string;
  description: string;
}

export interface ImplPlanInterfacesAndContracts {
  apis: ImplPlanApiContract[];
  boundaries: string[];
  dataContracts: ImplPlanDataContract[];
}

export interface ImplPlanDataModel {
  name: string;
  projectId: string;
  description: string;
  fields: string[];
}

export interface ImplPlanDataChanges {
  newModels: ImplPlanDataModel[];
  migrations: string[];
  storageChanges: string[];
}

export type ImplPlanRiskSeverity = 'low' | 'medium' | 'high';

export interface ImplPlanRisk {
  id: string;
  description: string;
  severity: ImplPlanRiskSeverity;
  mitigation?: string;
}

export interface ImplPlanValidation {
  verificationSteps: string[];
  testExpectations: string[];
  qaGateCriteria: string[];
}

export interface ImplPlanVersionMetadata {
  generationRunId: string;
  roleFlow: string[];
}

export interface ImplementationPhasePlanArtifactContent {
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
  versionMetadata?: ImplPlanVersionMetadata;
}

export function isImplementationPhasePlanArtifactContent(
  content: Record<string, unknown>,
): content is ImplementationPhasePlanArtifactContent {
  return (
    content !== null &&
    typeof content === 'object' &&
    typeof content.projectId === 'string' &&
    typeof content.subphaseId === 'string' &&
    typeof content.label === 'string' &&
    typeof content.body === 'string' &&
    typeof content.generatedAt === 'string' &&
    typeof content.roadmapEntryPhase === 'string' &&
    Array.isArray(content.architectureSlices) &&
    Array.isArray(content.technicalDependencies)
  );
}

export const IMPL_PLAN_TASK_TYPE_LABELS: Record<ImplPlanTaskType, string> = {
  feature: 'Feature',
  refactor: 'Refactor',
  integration: 'Integration',
  config: 'Configuration',
  test: 'Test',
  docs: 'Documentation',
};

// ---------------------------------------------------------------------------
// Implementation Phase Plan Gate Editing
// ---------------------------------------------------------------------------

export type ImplPlanTaskEditAction = 'remove' | 'reprioritize' | 'change-scope' | 'change-type' | 'add';

export interface ImplPlanTaskEdit {
  taskId: string;
  action: ImplPlanTaskEditAction;
  details: string;
  newType?: ImplPlanTaskType;
}

export interface ImplPlanScopeChanges {
  addToIncluded: string[];
  removeFromIncluded: string[];
  addToExcluded: string[];
  removeFromExcluded: string[];
}

export type ImplPlanRiskEditAction = 'remove' | 'change-severity' | 'add';

export interface ImplPlanRiskEdit {
  riskId: string;
  action: ImplPlanRiskEditAction;
  details: string;
  newSeverity?: ImplPlanRiskSeverity;
}

export interface ImplPlanDependencyChanges {
  reorderGroups: string;
  changeDependencies: string;
}

export interface ImplPlanGateResponse {
  decision: GateDecision;
  feedback?: string;
  taskEdits?: ImplPlanTaskEdit[];
  scopeChanges?: ImplPlanScopeChanges;
  riskEdits?: ImplPlanRiskEdit[];
  dependencyChanges?: ImplPlanDependencyChanges;
}

export interface ImplementationPlanVersion {
  id: string;
  version: number;
  artifactId: string;
  phaseRecordId: string;
  createdAt: string;
  decision: GateDecision | null;
}

export const IMPL_PLAN_TASK_EDIT_ACTION_LABELS: Record<ImplPlanTaskEditAction, string> = {
  'remove': 'Remove',
  'reprioritize': 'Reprioritize',
  'change-scope': 'Change Scope',
  'change-type': 'Change Type',
  'add': 'Add',
};

export const IMPL_PLAN_RISK_EDIT_ACTION_LABELS: Record<ImplPlanRiskEditAction, string> = {
  'remove': 'Remove',
  'change-severity': 'Change Severity',
  'add': 'Add',
};

// ---------------------------------------------------------------------------
// User Redirection
// ---------------------------------------------------------------------------

export type UserRedirectionAction =
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PHASE_ORDER: readonly PhaseId[] = [
  'discovery',
  'roadmap-definition',
  'product-definition',
  'ux-definition',
  'architecture-definition',
  'implementation-phase',
  'qa-validation',
  'release-readiness',
] as const;

export const PHASE_ROLE_MAP: Record<PhaseId, RoleId> = {
  'discovery': 'ceo',
  'roadmap-definition': 'product-manager',
  'product-definition': 'product-manager',
  'ux-definition': 'ux-ui',
  'architecture-definition': 'software-architect',
  'implementation-phase': 'developer',
  'qa-validation': 'qa',
  'release-readiness': 'product-manager',
};

export const PHASE_LABELS: Record<PhaseId, string> = {
  'discovery': 'Discovery',
  'roadmap-definition': 'Roadmap Definition',
  'product-definition': 'Product Definition',
  'ux-definition': 'UX Definition',
  'architecture-definition': 'Architecture Definition',
  'implementation-phase': 'Implementation',
  'qa-validation': 'QA Validation',
  'release-readiness': 'Release Readiness',
};

export const ROLE_LABELS: Record<RoleId, string> = {
  'ceo': 'CEO',
  'product-manager': 'Product Manager',
  'ux-ui': 'UX/UI Designer',
  'software-architect': 'Software Architect',
  'developer': 'Developer',
  'qa': 'QA Lead',
};

export const CODE_PROJECT_TYPE_LABELS: Record<CodeProjectType, string> = {
  'web': 'Web Application',
  'mobile': 'Mobile Application',
  'backend': 'Backend API',
  'worker': 'Background Worker',
  'infra': 'Infrastructure',
  'shared': 'Shared Library',
  'docs': 'Documentation',
};

// ---------------------------------------------------------------------------
// Canonical Roadmap Artifact Content
// ---------------------------------------------------------------------------

export interface RoadmapProductSummary {
  description: string;
  targetUsers: string[];
  coreValueProposition: string;
}

export interface RoadmapProductScope {
  included: string[];
  excluded: string[];
}

export interface RoadmapProjectTopologyEntry {
  projectId: string;
  name: string;
  purpose: string;
  techConsiderations: string[];
}

export type RoadmapPhaseRiskLevel = 'low' | 'medium' | 'high';
export type RoadmapPhaseComplexity = 'low' | 'medium' | 'high';

export interface RoadmapPhase {
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

export interface RoadmapMilestone {
  id: string;
  name: string;
  description: string;
  phaseIds: string[];
  successCriteria: string[];
}

export type CeoStrategicValidationCoherence = 'aligned' | 'minor-concerns' | 'misaligned';

export interface CeoStrategicValidation {
  coherenceScore: CeoStrategicValidationCoherence;
  flaggedIssues: string[];
  suggestedAdjustments: string[];
}

export interface RoadmapVersionMetadata {
  generationRunId: string;
  version: number;
  roleFlow: string[];
}

export interface RoadmapArtifactContent {
  projectId: string;
  projectName: string;
  productSummary: RoadmapProductSummary;
  productScope: RoadmapProductScope;
  projectTopology: RoadmapProjectTopologyEntry[];
  phases: RoadmapPhase[];
  milestones: RoadmapMilestone[];
  assumptions: string[];
  openQuestions: string[];
  generatedAt: string;
  strategicValidation?: CeoStrategicValidation;
  versionMetadata?: RoadmapVersionMetadata;
}

export function isRoadmapArtifactContent(content: Record<string, unknown>): content is RoadmapArtifactContent {
  return (
    content !== null &&
    typeof content === 'object' &&
    typeof content.productSummary === 'object' &&
    content.productSummary !== null &&
    typeof content.productScope === 'object' &&
    content.productScope !== null &&
    Array.isArray(content.projectTopology) &&
    Array.isArray(content.phases) &&
    Array.isArray(content.milestones) &&
    Array.isArray(content.assumptions) &&
    Array.isArray(content.openQuestions)
  );
}

// ---------------------------------------------------------------------------
// Canonical Architecture Plan Artifact Content
// ---------------------------------------------------------------------------

export interface ArchitectureSystemOverview {
  description: string;
  productRelationship: string;
  technicalConstraints: string[];
}

export type ArchitectureProjectType = 'web-app' | 'backend-api' | 'mobile-app' | 'worker' | 'infra' | 'shared-package' | 'docs';

export interface ArchitectureProjectEntry {
  id: string;
  name: string;
  purpose: string;
  ownership: string;
  type: ArchitectureProjectType;
  dependencies: string[];
}

export interface ArchitectureRuntimeComponent {
  name: string;
  projectId: string;
  description: string;
  responsibilities: string[];
}

export interface ArchitectureRuntimeArchitecture {
  frontends: ArchitectureRuntimeComponent[];
  backends: ArchitectureRuntimeComponent[];
  backgroundProcessing: ArchitectureRuntimeComponent[];
  externalIntegrations: { name: string; purpose: string; protocol: string }[];
}

export interface ArchitectureDataDomain {
  name: string;
  description: string;
  ownerProjectId: string;
  entities: string[];
}

export interface ArchitectureDataArchitecture {
  dataDomains: ArchitectureDataDomain[];
  persistenceStrategy: { projectId: string; technology: string; rationale: string }[];
  boundaries: string[];
  stateOwnership: { domain: string; ownerProjectId: string; accessPattern: string }[];
}

export interface ArchitectureIntegrationArchitecture {
  apiBoundaries: { name: string; producerProjectId: string; consumerProjectIds: string[]; protocol: string }[];
  internalIntegrationPoints: { description: string; projectIds: string[] }[];
  externalServices: { name: string; purpose: string; integrationMethod: string }[];
}

export interface ArchitectureSecurityAndTrustModel {
  authAssumptions: string[];
  secretHandling: string[];
  trustBoundaries: string[];
  riskySurfaces: string[];
}

export interface ArchitectureDeploymentModel {
  environmentModel: { name: string; purpose: string; characteristics: string[] }[];
  deploymentUnits: { projectId: string; strategy: string; notes: string }[];
}

export interface ArchitectureQualityAttributes {
  maintainability: string;
  scalability: string;
  testability: string;
  reliability: string;
  performance: string;
  developerExperience: string;
}

export interface ArchitecturePhaseMapping {
  phaseId: string;
  phaseName: string;
  architectureSlices: string[];
  technicalDependencies: string[];
}

export interface ArchitectureImplementationGuidelines {
  rules: string[];
  boundariesToPreserve: string[];
  antiPatterns: string[];
  codingExpectations: string[];
}

export type ArchitectureRiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ArchitectureRisk {
  id: string;
  description: string;
  severity: ArchitectureRiskSeverity;
  mitigation?: string;
}

export interface ArchitectureQuestion {
  id: string;
  question: string;
  context?: string;
}

export interface ArchitecturePlanVersionMetadata {
  version: number;
  roleFlow: string[];
}

export interface ArchitecturePlanArtifactContent {
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

export function isArchitecturePlanArtifactContent(content: Record<string, unknown>): content is ArchitecturePlanArtifactContent {
  return (
    content !== null &&
    typeof content === 'object' &&
    typeof content.systemOverview === 'object' &&
    content.systemOverview !== null &&
    Array.isArray(content.projectTopology) &&
    typeof content.runtimeArchitecture === 'object' &&
    content.runtimeArchitecture !== null &&
    typeof content.dataArchitecture === 'object' &&
    content.dataArchitecture !== null &&
    typeof content.integrationArchitecture === 'object' &&
    content.integrationArchitecture !== null &&
    typeof content.securityAndTrustModel === 'object' &&
    content.securityAndTrustModel !== null &&
    typeof content.deploymentAndEnvironmentModel === 'object' &&
    content.deploymentAndEnvironmentModel !== null &&
    typeof content.qualityAttributes === 'object' &&
    content.qualityAttributes !== null &&
    Array.isArray(content.phaseMapping) &&
    typeof content.implementationGuidelines === 'object' &&
    content.implementationGuidelines !== null &&
    Array.isArray(content.openRisks) &&
    Array.isArray(content.openQuestions)
  );
}

export const ARCHITECTURE_SECTION_LABELS: Record<ArchitectureSectionId, string> = {
  systemOverview: 'System Overview',
  projectTopology: 'Project Topology',
  runtimeArchitecture: 'Runtime Architecture',
  dataArchitecture: 'Data Architecture',
  integrationArchitecture: 'Integration Architecture',
  securityAndTrustModel: 'Security & Trust Model',
  deploymentAndEnvironmentModel: 'Deployment & Environment',
  qualityAttributes: 'Quality Attributes',
  phaseMapping: 'Phase Mapping',
  implementationGuidelines: 'Implementation Guidelines',
  openRisks: 'Open Risks',
  openQuestions: 'Open Questions',
};

export const ARCHITECTURE_SECTION_IDS: readonly ArchitectureSectionId[] = [
  'systemOverview', 'projectTopology', 'runtimeArchitecture', 'dataArchitecture',
  'integrationArchitecture', 'securityAndTrustModel', 'deploymentAndEnvironmentModel',
  'qualityAttributes', 'phaseMapping', 'implementationGuidelines', 'openRisks', 'openQuestions',
] as const;

// ---------------------------------------------------------------------------
// Interactive Dialogue Model
// ---------------------------------------------------------------------------

export type DialogueTurnStatus = 'pending' | 'answered' | 'challenged' | 'accepted';

export interface DialogueTurn {
  id: string;
  role: RoleId;
  questionId: string;
  question: string;
  answer: string | null;
  llmReaction: string | null;
  status: DialogueTurnStatus;
  timestamp: string;
}

export interface PhaseDialogue {
  phaseId: PhaseId;
  activeRole: RoleId;
  turns: DialogueTurn[];
  currentQuestionIndex: number;
  satisfactionReached: boolean;
  synthesisGenerated: boolean;
  dialogueStartedAt: string;
  dialogueCompletedAt: string | null;
}

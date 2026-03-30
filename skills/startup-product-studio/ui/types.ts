     1→// ---------------------------------------------------------------------------
     2→// Studio Domain Types
     3→// ---------------------------------------------------------------------------
     4→// Client-side type definitions mirroring the startup-product-studio skill's
     5→// workspace state structure stored in SkillWorkspace.state.
     6→// ---------------------------------------------------------------------------
     7→
     8→export type PhaseId =
     9→  | 'discovery'
    10→  | 'roadmap-definition'
    11→  | 'product-definition'
    12→  | 'ux-definition'
    13→  | 'architecture-definition'
    14→  | 'implementation-phase'
    15→  | 'qa-validation'
    16→  | 'release-readiness';
    17→
    18→export type RoleId =
    19→  | 'ceo'
    20→  | 'product-manager'
    21→  | 'ux-ui'
    22→  | 'software-architect'
    23→  | 'developer'
    24→  | 'qa';
    25→
    26→export type GateDecision = 'approve' | 'reject' | 'revise' | 'approve-with-changes' | 'pause' | 'cancel';
    27→
    28→// ---------------------------------------------------------------------------
    29→// Structured Roadmap Editing
    30→// ---------------------------------------------------------------------------
    31→
    32→export type RoadmapPhaseEditAction = 'remove' | 'reprioritize' | 'edit-scope' | 'merge' | 'split';
    33→
    34→export interface RoadmapPhaseEdit {
    35→  phaseId: string;
    36→  action: RoadmapPhaseEditAction;
    37→  details: string;
    38→}
    39→
    40→export interface RoadmapScopeChanges {
    41→  addToIncluded: string[];
    42→  removeFromIncluded: string[];
    43→  addToExcluded: string[];
    44→  removeFromExcluded: string[];
    45→}
    46→
    47→export interface RoadmapGateResponse {
    48→  decision: GateDecision;
    49→  feedback?: string;
    50→  phaseEdits?: RoadmapPhaseEdit[];
    51→  scopeChanges?: RoadmapScopeChanges;
    52→}
    53→
    54→// ---------------------------------------------------------------------------
    55→// Structured Architecture Editing
    56→// ---------------------------------------------------------------------------
    57→
    58→export type ArchitectureSectionId =
    59→  | 'systemOverview'
    60→  | 'projectTopology'
    61→  | 'runtimeArchitecture'
    62→  | 'dataArchitecture'
    63→  | 'integrationArchitecture'
    64→  | 'securityAndTrustModel'
    65→  | 'deploymentAndEnvironmentModel'
    66→  | 'qualityAttributes'
    67→  | 'phaseMapping'
    68→  | 'implementationGuidelines'
    69→  | 'openRisks'
    70→  | 'openQuestions';
    71→
    72→export type ArchitectureSectionEditAction =
    73→  | 'simplify'
    74→  | 'add-detail'
    75→  | 'replace'
    76→  | 'remove-component'
    77→  | 'add-component'
    78→  | 'change-technology'
    79→  | 'restructure';
    80→
    81→export interface ArchitectureSectionEdit {
    82→  sectionId: ArchitectureSectionId;
    83→  action: ArchitectureSectionEditAction;
    84→  details: string;
    85→}
    86→
    87→export interface ArchitectureTopologyChanges {
    88→  addProjects: string[];
    89→  removeProjects: string[];
    90→  changeTypes: string[];
    91→}
    92→
    93→export interface ArchitectureGateResponse {
    94→  decision: GateDecision;
    95→  feedback?: string;
    96→  sectionEdits?: ArchitectureSectionEdit[];
    97→  topologyChanges?: ArchitectureTopologyChanges;
    98→}
    99→
   100→export type CodeProjectType = 'web' | 'mobile' | 'backend' | 'worker' | 'infra' | 'shared' | 'docs';
   101→
   102→// ---------------------------------------------------------------------------
   103→// Workspace State
   104→// ---------------------------------------------------------------------------
   105→
   106→export interface StudioState {
   107→  studioName: string;
   108→  projects: ProjectRecord[];
   109→  activeProjectId: string | null;
   110→  createdAt: string;
   111→}
   112→
   113→export interface ProjectRecord {
   114→  id: string;
   115→  name: string;
   116→  description: string;
   117→  currentPhase: PhaseId;
   118→  completedPhases: PhaseId[];
   119→  roadmap: RoadmapEntry[] | null;
   120→  codeProjects: CodeProject[];
   121→  artifactIds: string[];
   122→  businessContext: BusinessContext | null;
   123→  targetUsers: UserPersona[];
   124→  constraints: Constraints;
   125→  implementationStatus: ImplementationStatus | null;
   126→  validationHistory: ValidationEntry[];
   127→  roadmapVersions: RoadmapVersion[];
   128→  approvedRoadmapPhases: RoadmapPhase[] | null;
   129→  approvedRoadmapTopology: RoadmapProjectTopologyEntry[] | null;
   130→  architecturePlanVersions: ArchitecturePlanVersion[];
   131→  approvedArchitecturePlan: ArchitecturePlanArtifactContent | null;
   132→  createdAt: string;
   133→  updatedAt: string;
   134→}
   135→
   136→export interface RoadmapEntry {
   137→  phase: PhaseId;
   138→  milestones: string[];
   139→  deliverables: string[];
   140→  estimatedDuration: string;
   141→  dependencies: string[];
   142→}
   143→
   144→export type CodeProjectBootstrapStatus = 'pending' | 'git_initialized' | 'claude_configured' | 'ready';
   145→
   146→export interface CodeProject {
   147→  id: string;
   148→  name: string;
   149→  type: CodeProjectType;
   150→  techStack: string;
   151→  repoPath: string | null;
   152→  bootstrapStatus: CodeProjectBootstrapStatus | null;
   153→  bootstrapBridgeJobId: string | null;
   154→}
   155→
   156→export interface BusinessContext {
   157→  industry: string;
   158→  marketSegment: string;
   159→  revenueModel: string;
   160→  competitiveAdvantage: string;
   161→}
   162→
   163→export interface UserPersona {
   164→  persona: string;
   165→  description: string;
   166→  painPoints: string[];
   167→}
   168→
   169→export interface Constraints {
   170→  timeline: string | null;
   171→  budget: string | null;
   172→  technical: string[];
   173→  regulatory: string[];
   174→}
   175→
   176→export interface ImplementationExecutionPhase {
   177→  id: string;
   178→  label: string;
   179→  goals: string[];
   180→  targetCodeProjectIds: string[];
   181→  status: 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed';
   182→  bridgeJobIds: string[];
   183→}
   184→
   185→export interface ImplementationStatus {
   186→  totalTasks: number;
   187→  completedTasks: number;
   188→  currentIteration: number;
   189→  totalIterationsPlanned: number;
   190→  blockers: string[];
   191→  executionPhases: ImplementationExecutionPhase[];
   192→  activeExecutionPhaseIndex: number | null;
   193→  roadmapPhaseRecords: ImplementationPhaseRecord[];
   194→  activeRoadmapPhaseIndex: number | null;
   195→}
   196→
   197→export interface ValidationEntry {
   198→  phase: PhaseId;
   199→  decision: GateDecision;
   200→  feedback: string | null;
   201→  timestamp: string;
   202→}
   203→
   204→// ---------------------------------------------------------------------------
   205→// Roadmap Versioning
   206→// ---------------------------------------------------------------------------
   207→
   208→export interface RoadmapVersion {
   209→  id: string;
   210→  version: number;
   211→  entries: RoadmapEntry[];
   212→  createdAt: string;
   213→  decision: GateDecision | null;
   214→}
   215→
   216→// ---------------------------------------------------------------------------
   217→// Architecture Plan Versioning
   218→// ---------------------------------------------------------------------------
   219→
   220→export interface ArchitecturePlanVersion {
   221→  id: string;
   222→  version: number;
   223→  artifactId: string;
   224→  createdAt: string;
   225→  decision: GateDecision | null;
   226→}
   227→
   228→// ---------------------------------------------------------------------------
   229→// Per-Roadmap-Phase Implementation Tracking
   230→// ---------------------------------------------------------------------------
   231→
   232→export type RoadmapPhaseStatus =
   233→  | 'not_started'
   234→  | 'planning'
   235→  | 'plan_approved'
   236→  | 'implementing'
   237→  | 'qa_validating'
   238→  | 'pm_reviewing'
   239→  | 'user_reviewing'
   240→  | 'completed'
   241→  | 'failed';
   242→
   243→export interface ImplementationPhaseRecord {
   244→  id: string;
   245→  roadmapEntryPhase: PhaseId;
   246→  roadmapPhaseId: string | null;
   247→  label: string;
   248→  status: RoadmapPhaseStatus;
   249→  goals: string[];
   250→  deliverables: string[];
   251→  validationCriteria: string[];
   252→  involvedProjectIds: string[];
   253→  architectureSlices: string[];
   254→  technicalDependencies: string[];
   255→  planArtifactId: string | null;
   256→  implementationReportArtifactId: string | null;
   257→  qaReportArtifactId: string | null;
   258→  pmAlignmentDecision: GateDecision | null;
   259→  userDecision: GateDecision | null;
   260→  bridgeJobIds: string[];
   261→  implementationPlanVersions: ImplementationPlanVersion[];
   262→  taskGroupProgress: TaskGroupProgress[];
   263→  currentTaskGroupIndex: number | null;
   264→}
   265→
   266→export type TaskGroupProgressStatus = 'pending' | 'running' | 'completed' | 'failed';
   267→
   268→export interface TaskGroupProgress {
   269→  groupLabel: string;
   270→  taskIds: string[];
   271→  status: TaskGroupProgressStatus;
   272→  bridgeJobIds: string[];
   273→  startedAt: string | null;
   274→  completedAt: string | null;
   275→  failureReason: string | null;
   276→}
   277→
   278→// ---------------------------------------------------------------------------
   279→// QA Architecture Assessment
   280→// ---------------------------------------------------------------------------
   281→
   282→export type QaArchitectureAlignmentStatus = 'aligned' | 'minor-drift' | 'significant-drift';
   283→
   284→export interface QaArchitectureAssessment {
   285→  alignmentStatus: QaArchitectureAlignmentStatus;
   286→  driftFindings: string[];
   287→  qualityAttributeNotes: string[];
   288→  boundaryViolations: string[];
   289→}
   290→
   291→export type QaCheckStatus = 'pass' | 'fail' | 'needs-work';
   292→export type QaOverallVerdict = 'pass' | 'fail' | 'needs-work';
   293→
   294→export interface QaFunctionalityCheck {
   295→  criterion: string;
   296→  status: QaCheckStatus;
   297→  notes: string;
   298→}
   299→
   300→export interface QaDefinitionOfDoneCheck {
   301→  item: string;
   302→  status: 'pass' | 'fail';
   303→  notes: string;
   304→}
   305→
   306→export interface QaReportArtifactContent {
   307→  projectId: string;
   308→  subphaseId: string;
   309→  label: string;
   310→  body: string;
   311→  architectureAssessment?: QaArchitectureAssessment;
   312→  functionalityChecks?: QaFunctionalityCheck[];
   313→  definitionOfDoneChecks?: QaDefinitionOfDoneCheck[];
   314→  overallVerdict?: QaOverallVerdict;
   315→  generatedAt: string;
   316→}
   317→
   318→export function isQaReportArtifactContent(
   319→  content: Record<string, unknown>,
   320→): content is QaReportArtifactContent {
   321→  return (
   322→    content !== null &&
   323→    typeof content === 'object' &&
   324→    typeof content.projectId === 'string' &&
   325→    typeof content.body === 'string' &&
   326→    typeof content.generatedAt === 'string'
   327→  );
   328→}
   329→
   330→// ---------------------------------------------------------------------------
   331→// QA Gate Response
   332→// ---------------------------------------------------------------------------
   333→
   334→export type QaCheckOverrideAction = 'accept-as-is' | 'must-fix';
   335→
   336→export interface QaCheckOverride {
   337→  criterion: string;
   338→  action: QaCheckOverrideAction;
   339→  notes: string;
   340→}
   341→
   342→export interface QaGateResponse {
   343→  decision: GateDecision;
   344→  feedback?: string;
   345→  checkOverrides?: QaCheckOverride[];
   346→}
   347→
   348→export const QA_CHECK_STATUS_LABELS: Record<QaCheckStatus, string> = {
   349→  pass: 'Pass',
   350→  fail: 'Fail',
   351→  'needs-work': 'Needs Work',
   352→};
   353→
   354→export const QA_VERDICT_LABELS: Record<QaOverallVerdict, string> = {
   355→  pass: 'Pass',
   356→  fail: 'Fail',
   357→  'needs-work': 'Needs Work',
   358→};
   359→
   360→// ---------------------------------------------------------------------------
   361→// Implementation Phase Plan Artifact Content
   362→// ---------------------------------------------------------------------------
   363→
   364→export interface ImplPlanPhaseContext {
   365→  roadmapPhaseId: string;
   366→  roadmapPhaseName: string;
   367→  summary: string;
   368→  relatedArchitectureSections: string[];
   369→}
   370→
   371→export interface ImplPlanScopeDefinition {
   372→  included: string[];
   373→  excluded: string[];
   374→}
   375→
   376→export interface ImplPlanAffectedProject {
   377→  projectId: string;
   378→  projectName: string;
   379→  purpose: string;
   380→  expectedChanges: string[];
   381→}
   382→
   383→export type ImplPlanTaskType = 'feature' | 'refactor' | 'integration' | 'config' | 'test' | 'docs';
   384→
   385→export interface ImplPlanTask {
   386→  id: string;
   387→  title: string;
   388→  description: string;
   389→  projectId: string;
   390→  type: ImplPlanTaskType;
   391→  dependencies: string[];
   392→  expectedOutcome: string;
   393→}
   394→
   395→export interface ImplPlanTaskGroup {
   396→  groupLabel: string;
   397→  tasks: ImplPlanTask[];
   398→}
   399→
   400→export interface ImplPlanApiContract {
   401→  name: string;
   402→  producerProjectId: string;
   403→  consumerProjectIds: string[];
   404→  description: string;
   405→}
   406→
   407→export interface ImplPlanDataContract {
   408→  name: string;
   409→  ownerProjectId: string;
   410→  description: string;
   411→}
   412→
   413→export interface ImplPlanInterfacesAndContracts {
   414→  apis: ImplPlanApiContract[];
   415→  boundaries: string[];
   416→  dataContracts: ImplPlanDataContract[];
   417→}
   418→
   419→export interface ImplPlanDataModel {
   420→  name: string;
   421→  projectId: string;
   422→  description: string;
   423→  fields: string[];
   424→}
   425→
   426→export interface ImplPlanDataChanges {
   427→  newModels: ImplPlanDataModel[];
   428→  migrations: string[];
   429→  storageChanges: string[];
   430→}
   431→
   432→export type ImplPlanRiskSeverity = 'low' | 'medium' | 'high';
   433→
   434→export interface ImplPlanRisk {
   435→  id: string;
   436→  description: string;
   437→  severity: ImplPlanRiskSeverity;
   438→  mitigation?: string;
   439→}
   440→
   441→export interface ImplPlanValidation {
   442→  verificationSteps: string[];
   443→  testExpectations: string[];
   444→  qaGateCriteria: string[];
   445→}
   446→
   447→export interface ImplPlanVersionMetadata {
   448→  generationRunId: string;
   449→  roleFlow: string[];
   450→}
   451→
   452→export interface ImplementationPhasePlanArtifactContent {
   453→  projectId: string;
   454→  subphaseId: string;
   455→  label: string;
   456→  roadmapEntryPhase: PhaseId;
   457→  body: string;
   458→  architectureSlices: string[];
   459→  technicalDependencies: string[];
   460→  generatedAt: string;
   461→  phaseContext?: ImplPlanPhaseContext;
   462→  scopeDefinition?: ImplPlanScopeDefinition;
   463→  affectedProjects?: ImplPlanAffectedProject[];
   464→  workBreakdown?: ImplPlanTaskGroup[];
   465→  interfacesAndContracts?: ImplPlanInterfacesAndContracts;
   466→  dataChanges?: ImplPlanDataChanges;
   467→  risksAndEdgeCases?: ImplPlanRisk[];
   468→  validationPlan?: ImplPlanValidation;
   469→  definitionOfDone?: string[];
   470→  versionMetadata?: ImplPlanVersionMetadata;
   471→}
   472→
   473→export function isImplementationPhasePlanArtifactContent(
   474→  content: Record<string, unknown>,
   475→): content is ImplementationPhasePlanArtifactContent {
   476→  return (
   477→    content !== null &&
   478→    typeof content === 'object' &&
   479→    typeof content.projectId === 'string' &&
   480→    typeof content.subphaseId === 'string' &&
   481→    typeof content.label === 'string' &&
   482→    typeof content.body === 'string' &&
   483→    typeof content.generatedAt === 'string' &&
   484→    typeof content.roadmapEntryPhase === 'string' &&
   485→    Array.isArray(content.architectureSlices) &&
   486→    Array.isArray(content.technicalDependencies)
   487→  );
   488→}
   489→
   490→export const IMPL_PLAN_TASK_TYPE_LABELS: Record<ImplPlanTaskType, string> = {
   491→  feature: 'Feature',
   492→  refactor: 'Refactor',
   493→  integration: 'Integration',
   494→  config: 'Configuration',
   495→  test: 'Test',
   496→  docs: 'Documentation',
   497→};
   498→
   499→// ---------------------------------------------------------------------------
   500→// Implementation Phase Plan Gate Editing
   501→// ---------------------------------------------------------------------------
   502→
   503→export type ImplPlanTaskEditAction = 'remove' | 'reprioritize' | 'change-scope' | 'change-type' | 'add';
   504→
   505→export interface ImplPlanTaskEdit {
   506→  taskId: string;
   507→  action: ImplPlanTaskEditAction;
   508→  details: string;
   509→  newType?: ImplPlanTaskType;
   510→}
   511→
   512→export interface ImplPlanScopeChanges {
   513→  addToIncluded: string[];
   514→  removeFromIncluded: string[];
   515→  addToExcluded: string[];
   516→  removeFromExcluded: string[];
   517→}
   518→
   519→export type ImplPlanRiskEditAction = 'remove' | 'change-severity' | 'add';
   520→
   521→export interface ImplPlanRiskEdit {
   522→  riskId: string;
   523→  action: ImplPlanRiskEditAction;
   524→  details: string;
   525→  newSeverity?: ImplPlanRiskSeverity;
   526→}
   527→
   528→export interface ImplPlanDependencyChanges {
   529→  reorderGroups: string;
   530→  changeDependencies: string;
   531→}
   532→
   533→export interface ImplPlanGateResponse {
   534→  decision: GateDecision;
   535→  feedback?: string;
   536→  taskEdits?: ImplPlanTaskEdit[];
   537→  scopeChanges?: ImplPlanScopeChanges;
   538→  riskEdits?: ImplPlanRiskEdit[];
   539→  dependencyChanges?: ImplPlanDependencyChanges;
   540→}
   541→
   542→export interface ImplementationPlanVersion {
   543→  id: string;
   544→  version: number;
   545→  artifactId: string;
   546→  phaseRecordId: string;
   547→  createdAt: string;
   548→  decision: GateDecision | null;
   549→}
   550→
   551→export const IMPL_PLAN_TASK_EDIT_ACTION_LABELS: Record<ImplPlanTaskEditAction, string> = {
   552→  'remove': 'Remove',
   553→  'reprioritize': 'Reprioritize',
   554→  'change-scope': 'Change Scope',
   555→  'change-type': 'Change Type',
   556→  'add': 'Add',
   557→};
   558→
   559→export const IMPL_PLAN_RISK_EDIT_ACTION_LABELS: Record<ImplPlanRiskEditAction, string> = {
   560→  'remove': 'Remove',
   561→  'change-severity': 'Change Severity',
   562→  'add': 'Add',
   563→};
   564→
   565→// ---------------------------------------------------------------------------
   566→// User Redirection
   567→// ---------------------------------------------------------------------------
   568→
   569→export type UserRedirectionAction =
   570→  | 'redefine-roadmap'
   571→  | 'redefine-phase'
   572→  | 'reorder-phases'
   573→  | 'reduce-scope'
   574→  | 'expand-scope'
   575→  | 'pivot'
   576→  | 'change-priorities'
   577→  | 'pause'
   578→  | 'continue'
   579→  | 'stop';
   580→
   581→// ---------------------------------------------------------------------------
   582→// Constants
   583→// ---------------------------------------------------------------------------
   584→
   585→export const PHASE_ORDER: readonly PhaseId[] = [
   586→  'discovery',
   587→  'roadmap-definition',
   588→  'product-definition',
   589→  'ux-definition',
   590→  'architecture-definition',
   591→  'implementation-phase',
   592→  'qa-validation',
   593→  'release-readiness',
   594→] as const;
   595→
   596→export const PHASE_ROLE_MAP: Record<PhaseId, RoleId> = {
   597→  'discovery': 'ceo',
   598→  'roadmap-definition': 'product-manager',
   599→  'product-definition': 'product-manager',
   600→  'ux-definition': 'ux-ui',
   601→  'architecture-definition': 'software-architect',
   602→  'implementation-phase': 'developer',
   603→  'qa-validation': 'qa',
   604→  'release-readiness': 'product-manager',
   605→};
   606→
   607→export const PHASE_LABELS: Record<PhaseId, string> = {
   608→  'discovery': 'Discovery',
   609→  'roadmap-definition': 'Roadmap Definition',
   610→  'product-definition': 'Product Definition',
   611→  'ux-definition': 'UX Definition',
   612→  'architecture-definition': 'Architecture Definition',
   613→  'implementation-phase': 'Implementation',
   614→  'qa-validation': 'QA Validation',
   615→  'release-readiness': 'Release Readiness',
   616→};
   617→
   618→export const ROLE_LABELS: Record<RoleId, string> = {
   619→  'ceo': 'CEO',
   620→  'product-manager': 'Product Manager',
   621→  'ux-ui': 'UX/UI Designer',
   622→  'software-architect': 'Software Architect',
   623→  'developer': 'Developer',
   624→  'qa': 'QA Lead',
   625→};
   626→
   627→export const CODE_PROJECT_TYPE_LABELS: Record<CodeProjectType, string> = {
   628→  'web': 'Web Application',
   629→  'mobile': 'Mobile Application',
   630→  'backend': 'Backend API',
   631→  'worker': 'Background Worker',
   632→  'infra': 'Infrastructure',
   633→  'shared': 'Shared Library',
   634→  'docs': 'Documentation',
   635→};
   636→
   637→// ---------------------------------------------------------------------------
   638→// Canonical Roadmap Artifact Content
   639→// ---------------------------------------------------------------------------
   640→
   641→export interface RoadmapProductSummary {
   642→  description: string;
   643→  targetUsers: string[];
   644→  coreValueProposition: string;
   645→}
   646→
   647→export interface RoadmapProductScope {
   648→  included: string[];
   649→  excluded: string[];
   650→}
   651→
   652→export interface RoadmapProjectTopologyEntry {
   653→  projectId: string;
   654→  name: string;
   655→  purpose: string;
   656→  techConsiderations: string[];
   657→}
   658→
   659→export type RoadmapPhaseRiskLevel = 'low' | 'medium' | 'high';
   660→export type RoadmapPhaseComplexity = 'low' | 'medium' | 'high';
   661→
   662→export interface RoadmapPhase {
   663→  id: string;
   664→  name: string;
   665→  description: string;
   666→  goals: string[];
   667→  deliverables: string[];
   668→  involvedProjects: string[];
   669→  dependencies: string[];
   670→  riskLevel: RoadmapPhaseRiskLevel;
   671→  estimatedComplexity: RoadmapPhaseComplexity;
   672→  validationCriteria: string[];
   673→}
   674→
   675→export interface RoadmapMilestone {
   676→  id: string;
   677→  name: string;
   678→  description: string;
   679→  phaseIds: string[];
   680→  successCriteria: string[];
   681→}
   682→
   683→export type CeoStrategicValidationCoherence = 'aligned' | 'minor-concerns' | 'misaligned';
   684→
   685→export interface CeoStrategicValidation {
   686→  coherenceScore: CeoStrategicValidationCoherence;
   687→  flaggedIssues: string[];
   688→  suggestedAdjustments: string[];
   689→}
   690→
   691→export interface RoadmapVersionMetadata {
   692→  generationRunId: string;
   693→  version: number;
   694→  roleFlow: string[];
   695→}
   696→
   697→export interface RoadmapArtifactContent {
   698→  projectId: string;
   699→  projectName: string;
   700→  productSummary: RoadmapProductSummary;
   701→  productScope: RoadmapProductScope;
   702→  projectTopology: RoadmapProjectTopologyEntry[];
   703→  phases: RoadmapPhase[];
   704→  milestones: RoadmapMilestone[];
   705→  assumptions: string[];
   706→  openQuestions: string[];
   707→  generatedAt: string;
   708→  strategicValidation?: CeoStrategicValidation;
   709→  versionMetadata?: RoadmapVersionMetadata;
   710→}
   711→
   712→export function isRoadmapArtifactContent(content: Record<string, unknown>): content is RoadmapArtifactContent {
   713→  return (
   714→    content !== null &&
   715→    typeof content === 'object' &&
   716→    typeof content.productSummary === 'object' &&
   717→    content.productSummary !== null &&
   718→    typeof content.productScope === 'object' &&
   719→    content.productScope !== null &&
   720→    Array.isArray(content.projectTopology) &&
   721→    Array.isArray(content.phases) &&
   722→    Array.isArray(content.milestones) &&
   723→    Array.isArray(content.assumptions) &&
   724→    Array.isArray(content.openQuestions)
   725→  );
   726→}
   727→
   728→// ---------------------------------------------------------------------------
   729→// Canonical Architecture Plan Artifact Content
   730→// ---------------------------------------------------------------------------
   731→
   732→export interface ArchitectureSystemOverview {
   733→  description: string;
   734→  productRelationship: string;
   735→  technicalConstraints: string[];
   736→}
   737→
   738→export type ArchitectureProjectType = 'web-app' | 'backend-api' | 'mobile-app' | 'worker' | 'infra' | 'shared-package' | 'docs';
   739→
   740→export interface ArchitectureProjectEntry {
   741→  id: string;
   742→  name: string;
   743→  purpose: string;
   744→  ownership: string;
   745→  type: ArchitectureProjectType;
   746→  dependencies: string[];
   747→}
   748→
   749→export interface ArchitectureRuntimeComponent {
   750→  name: string;
   751→  projectId: string;
   752→  description: string;
   753→  responsibilities: string[];
   754→}
   755→
   756→export interface ArchitectureRuntimeArchitecture {
   757→  frontends: ArchitectureRuntimeComponent[];
   758→  backends: ArchitectureRuntimeComponent[];
   759→  backgroundProcessing: ArchitectureRuntimeComponent[];
   760→  externalIntegrations: { name: string; purpose: string; protocol: string }[];
   761→}
   762→
   763→export interface ArchitectureDataDomain {
   764→  name: string;
   765→  description: string;
   766→  ownerProjectId: string;
   767→  entities: string[];
   768→}
   769→
   770→export interface ArchitectureDataArchitecture {
   771→  dataDomains: ArchitectureDataDomain[];
   772→  persistenceStrategy: { projectId: string; technology: string; rationale: string }[];
   773→  boundaries: string[];
   774→  stateOwnership: { domain: string; ownerProjectId: string; accessPattern: string }[];
   775→}
   776→
   777→export interface ArchitectureIntegrationArchitecture {
   778→  apiBoundaries: { name: string; producerProjectId: string; consumerProjectIds: string[]; protocol: string }[];
   779→  internalIntegrationPoints: { description: string; projectIds: string[] }[];
   780→  externalServices: { name: string; purpose: string; integrationMethod: string }[];
   781→}
   782→
   783→export interface ArchitectureSecurityAndTrustModel {
   784→  authAssumptions: string[];
   785→  secretHandling: string[];
   786→  trustBoundaries: string[];
   787→  riskySurfaces: string[];
   788→}
   789→
   790→export interface ArchitectureDeploymentModel {
   791→  environmentModel: { name: string; purpose: string; characteristics: string[] }[];
   792→  deploymentUnits: { projectId: string; strategy: string; notes: string }[];
   793→}
   794→
   795→export interface ArchitectureQualityAttributes {
   796→  maintainability: string;
   797→  scalability: string;
   798→  testability: string;
   799→  reliability: string;
   800→  performance: string;
   801→  developerExperience: string;
   802→}
   803→
   804→export interface ArchitecturePhaseMapping {
   805→  phaseId: string;
   806→  phaseName: string;
   807→  architectureSlices: string[];
   808→  technicalDependencies: string[];
   809→}
   810→
   811→export interface ArchitectureImplementationGuidelines {
   812→  rules: string[];
   813→  boundariesToPreserve: string[];
   814→  antiPatterns: string[];
   815→  codingExpectations: string[];
   816→}
   817→
   818→export type ArchitectureRiskSeverity = 'low' | 'medium' | 'high' | 'critical';
   819→
   820→export interface ArchitectureRisk {
   821→  id: string;
   822→  description: string;
   823→  severity: ArchitectureRiskSeverity;
   824→  mitigation?: string;
   825→}
   826→
   827→export interface ArchitectureQuestion {
   828→  id: string;
   829→  question: string;
   830→  context?: string;
   831→}
   832→
   833→export interface ArchitecturePlanVersionMetadata {
   834→  version: number;
   835→  roleFlow: string[];
   836→}
   837→
   838→export interface ArchitecturePlanArtifactContent {
   839→  systemOverview: ArchitectureSystemOverview;
   840→  projectTopology: ArchitectureProjectEntry[];
   841→  runtimeArchitecture: ArchitectureRuntimeArchitecture;
   842→  dataArchitecture: ArchitectureDataArchitecture;
   843→  integrationArchitecture: ArchitectureIntegrationArchitecture;
   844→  securityAndTrustModel: ArchitectureSecurityAndTrustModel;
   845→  deploymentAndEnvironmentModel: ArchitectureDeploymentModel;
   846→  qualityAttributes: ArchitectureQualityAttributes;
   847→  phaseMapping: ArchitecturePhaseMapping[];
   848→  implementationGuidelines: ArchitectureImplementationGuidelines;
   849→  openRisks: ArchitectureRisk[];
   850→  openQuestions: ArchitectureQuestion[];
   851→  versionMetadata?: ArchitecturePlanVersionMetadata;
   852→}
   853→
   854→export function isArchitecturePlanArtifactContent(content: Record<string, unknown>): content is ArchitecturePlanArtifactContent {
   855→  return (
   856→    content !== null &&
   857→    typeof content === 'object' &&
   858→    typeof content.systemOverview === 'object' &&
   859→    content.systemOverview !== null &&
   860→    Array.isArray(content.projectTopology) &&
   861→    typeof content.runtimeArchitecture === 'object' &&
   862→    content.runtimeArchitecture !== null &&
   863→    typeof content.dataArchitecture === 'object' &&
   864→    content.dataArchitecture !== null &&
   865→    typeof content.integrationArchitecture === 'object' &&
   866→    content.integrationArchitecture !== null &&
   867→    typeof content.securityAndTrustModel === 'object' &&
   868→    content.securityAndTrustModel !== null &&
   869→    typeof content.deploymentAndEnvironmentModel === 'object' &&
   870→    content.deploymentAndEnvironmentModel !== null &&
   871→    typeof content.qualityAttributes === 'object' &&
   872→    content.qualityAttributes !== null &&
   873→    Array.isArray(content.phaseMapping) &&
   874→    typeof content.implementationGuidelines === 'object' &&
   875→    content.implementationGuidelines !== null &&
   876→    Array.isArray(content.openRisks) &&
   877→    Array.isArray(content.openQuestions)
   878→  );
   879→}
   880→
   881→export const ARCHITECTURE_SECTION_LABELS: Record<ArchitectureSectionId, string> = {
   882→  systemOverview: 'System Overview',
   883→  projectTopology: 'Project Topology',
   884→  runtimeArchitecture: 'Runtime Architecture',
   885→  dataArchitecture: 'Data Architecture',
   886→  integrationArchitecture: 'Integration Architecture',
   887→  securityAndTrustModel: 'Security & Trust Model',
   888→  deploymentAndEnvironmentModel: 'Deployment & Environment',
   889→  qualityAttributes: 'Quality Attributes',
   890→  phaseMapping: 'Phase Mapping',
   891→  implementationGuidelines: 'Implementation Guidelines',
   892→  openRisks: 'Open Risks',
   893→  openQuestions: 'Open Questions',
   894→};
   895→
   896→export const ARCHITECTURE_SECTION_IDS: readonly ArchitectureSectionId[] = [
   897→  'systemOverview', 'projectTopology', 'runtimeArchitecture', 'dataArchitecture',
   898→  'integrationArchitecture', 'securityAndTrustModel', 'deploymentAndEnvironmentModel',
   899→  'qualityAttributes', 'phaseMapping', 'implementationGuidelines', 'openRisks', 'openQuestions',
   900→] as const;
   901→
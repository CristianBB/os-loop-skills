# Startup Product Studio

Agentic skill for end-to-end product creation using a startup-style workflow with role-based execution across six specialized roles.

## Execution Mode

Agentic (`executionMode: "agentic"`). The runtime launches a supervised sub-run with a workspace, step budgets, and checkpoints. The skill iterates toward a goal under runtime control.

## Roles

| Role | Responsibility |
|------|---------------|
| `ceo` | Strategic vision, market opportunity analysis, business viability assessment, go-to-market strategy |
| `product-manager` | Feature prioritization, roadmap generation, milestone definition, resource planning, launch coordination |
| `ux-ui` | User journey mapping, wireframe specifications, design system definition, prototype briefs |
| `software-architect` | System design, API contracts, data modeling, infrastructure planning, technology decisions |
| `developer` | Task breakdown, implementation planning, codebase structure, integration point mapping |
| `qa` | Test strategy, acceptance criteria, quality gates, test plans |

Role switching is reported via `host.run.reportStep(label, role)` and `host.workspace.setRole(role)`.

## Phases

| Phase | Primary Role | Steps | Description |
|-------|-------------|-------|-------------|
| `discovery` | `ceo` | market-analysis, user-needs, competitive-landscape, opportunity-assessment, business-context | Validate market opportunity, business viability, and business context |
| `roadmap-definition` | `product-manager` | feature-prioritization, roadmap-generation, milestone-definition, resource-planning | Create prioritized roadmap with milestones and resource allocation |
| `product-definition` | `product-manager` | product-vision, mvp-definition, user-personas | Define product vision, MVP scope, and detailed user personas |
| `ux-definition` | `ux-ui` | user-flow-design, wireframe-spec, design-system, prototype-brief, ux-ui-spec | Design user experience, visual system, and consolidated UX/UI specification |
| `architecture-definition` | `software-architect` | architecture-plan, api-contracts, data-model, infrastructure-plan, tech-stack-decision | Define system architecture, API contracts, and technical decisions |
| `implementation-phase` | `developer` | task-breakdown, implementation-phase-plan, codebase-structure, integration-points, repository-bootstrap*, claude-configuration*, code-execution*, implementation-report | Plan implementation across code projects; with bridge: bootstrap repos, configure .claude, execute code |
| `qa-validation` | `qa` | test-strategy, acceptance-criteria, quality-gates, test-plan, qa-report | Define quality assurance strategy, test plans, and validation report |
| `release-readiness` | `product-manager` | release-readiness-report, launch-checklist, go-to-market-brief, monitoring-plan | Assess release readiness and prepare for production launch |

Phase transitions are explicit: the user calls `advance-phase` after approving a phase's deliverables.

## Roadmap-First Workflow

After discovery phase approval, the skill automatically triggers roadmap generation — the user does not need to separately call `generate-roadmap`. The flow is:

1. Discovery steps execute → summary → user approval
2. If approved → roadmap is automatically generated → roadmap approval gate
3. If roadmap approved → stored as `RoadmapVersion` v1, roadmap-definition marked as completed, advance to product-definition
4. If roadmap rejected/revised → re-generated with user feedback, version incremented

The roadmap is a first-class versioned artifact. Each re-generation creates a new `RoadmapVersion` entry in the project's `roadmapVersions` array. The user can see version history and compare changes.

## Roadmap Artifact Schema

The roadmap artifact uses a canonical `RoadmapArtifactContent` structure with 7 top-level sections. This schema provides rich, structured data for the UI while maintaining backward compatibility with the legacy `RoadmapEntry[]` format used by the implementation-phase loop.

### Sections

| Section | Type | Description |
|---------|------|-------------|
| `productSummary` | `RoadmapProductSummary` | Concise product description, target user segments, and core value proposition |
| `productScope` | `RoadmapProductScope` | Explicit included and excluded features/capabilities |
| `projectTopology` | `RoadmapProjectTopologyEntry[]` | Code project listing with purpose and tech considerations; each entry has a `projectId` referenced by phases |
| `phases` | `RoadmapPhase[]` | Ordered development phases with goals, deliverables, risk assessment, complexity, and validation criteria |
| `milestones` | `RoadmapMilestone[]` | Meaningful checkpoints spanning one or more phases, with measurable success criteria |
| `assumptions` | `string[]` | Explicit assumptions made by the LLM during roadmap generation |
| `openQuestions` | `string[]` | Genuine unknowns that could affect the roadmap, flagged for user clarification |

### Phase Fields

Each `RoadmapPhase` contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `PhaseId` | Must be one of the 8 canonical phase ids |
| `name` | `string` | Human-readable phase name |
| `description` | `string` | What happens in this phase and why |
| `goals` | `string[]` | Specific, measurable goals (at least one required) |
| `deliverables` | `string[]` | Concrete outputs (at least one required) |
| `involvedProjects` | `string[]` | References to `projectTopology[].projectId` |
| `dependencies` | `string[]` | Phase id references this phase depends on |
| `riskLevel` | `'low' \| 'medium' \| 'high'` | Risk assessment for this phase |
| `estimatedComplexity` | `'low' \| 'medium' \| 'high'` | Complexity estimate, mapped to duration for legacy compat |
| `validationCriteria` | `string[]` | What must be true for the phase to be considered successful (at least one required) |

### Milestone Fields

Each `RoadmapMilestone` contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Kebab-case identifier |
| `name` | `string` | Milestone name |
| `description` | `string` | What this milestone represents |
| `phaseIds` | `string[]` | Phase ids this milestone spans (must reference existing phases) |
| `successCriteria` | `string[]` | Measurable success conditions (at least one required) |

### Backward Compatibility

The `deriveRoadmapEntries` helper converts canonical `RoadmapPhase[]` to legacy `RoadmapEntry[]` for the implementation-phase loop. It maps `estimatedComplexity` to `estimatedDuration` (`low` = 1-2 weeks, `medium` = 2-4 weeks, `high` = 4-8 weeks) and uses phase `goals` as `milestones`. Phases with non-standard ids are filtered out.

### Quality Requirements

The LLM prompt enforces these quality constraints:

- Every goal, deliverable, and validation criterion must be specific (no vague descriptions)
- Only phases relevant to the product and not yet completed are included
- `involvedProjects` must reference valid `projectTopology` entries
- Risk assessment must be genuine, not uniformly "low"
- Validation criteria must be verifiable by someone unfamiliar with the project
- Milestones represent meaningful checkpoints, not just phase boundaries
- Assumptions capture decisions made without user confirmation
- Open questions flag genuine unknowns that could affect the roadmap

### Example

See `examples/canonical-roadmap-artifact.json` for a complete example of a valid `RoadmapArtifactContent` object.

## Per-Implementation-Phase Validation Cycle

During the implementation phase, work is broken into sub-phases aligned with roadmap entries. Each sub-phase follows a gated lifecycle:

1. **Planning** — Developer generates an `implementation-phase-plan` artifact for the sub-phase
2. **Plan Approval** — User reviews and approves the plan before coding begins
3. **Implementing** — Developer executes code via bridge (if available) for target code projects
4. **Implementation Report** — Developer generates an `implementation-report` artifact
5. **QA Validation** — QA Lead generates a `qa-report` artifact assessing quality
6. **PM Alignment** — Product Manager checks alignment with product intent
7. **User Review** — User makes final gate decision (approve/reject/revise/pause/cancel)
8. **Next Sub-Phase** — If approved, proceed to next sub-phase; if rejected, halt

Each sub-phase independently tracks: status, plan artifact, implementation report artifact, QA report artifact, PM alignment decision, user decision, and bridge job IDs.

Sub-phase statuses: `not_started` → `planning` → `plan_approved` → `implementing` → `qa_validating` → `pm_reviewing` → `user_reviewing` → `completed` (or `failed`).

## Gates and Approval Points

The skill enforces structured gates at key decision boundaries. Each gate requires a user decision before the workflow can proceed.

### Gate Types

| Gate | Trigger | Description |
|------|---------|-------------|
| **Roadmap approval** | After `roadmap-definition` completes | The generated roadmap must be approved before proceeding to product definition. Ensures strategic alignment before committing to downstream phases. |
| **Phase completion approval** | After any phase completes | Each phase produces a summary artifact. The user reviews deliverables and decides whether to advance, revise, or halt. |
| **Architecture decision gate** | After `architecture-definition` completes | Critical decision point before implementation begins. Architecture decisions are expensive to reverse, so this gate requires explicit approval of system design, tech stack, and infrastructure plans. |

### Gate Decisions

| Decision | Effect |
|----------|--------|
| `approve` | Accept the phase deliverables and allow advancement to the next phase. |
| `reject` | Reject the deliverables. The phase must be re-executed from the beginning. |
| `revise` | Request targeted revisions to specific artifacts. The skill re-runs relevant steps without resetting the entire phase. |
| `pause` | Suspend the project. State is preserved and the project can be resumed later. No phase transition occurs. |
| `cancel` | Cancel the project entirely. State is preserved for reference but no further phase transitions are allowed. |

Gate decisions are recorded in the project's `validationHistory` with the phase, decision, optional feedback, and timestamp. The `review-artifact` action can also be used to approve, reject, or revise individual artifacts outside of phase gates.

## Actions

| Action | Required Parameters | Description |
|--------|-------------------|-------------|
| `init-studio` | `studioName` | Initialize the product studio workspace |
| `create-project` | `projectName`, `projectDescription` | Create a new product project (optionally with `codeProjects`) |
| `generate-roadmap` | — | Generate a phased roadmap for the active project |
| `run-phase` | — | Execute the current phase (or specify `targetPhase`) |
| `advance-phase` | `targetPhase` | Move the active project to the next phase |
| `switch-project` | `projectName` | Switch the active project in a multi-project studio |
| `review-artifact` | `artifactId`, `decision` | Approve, reject, or revise an artifact |
| `status-report` | — | Generate a cross-project status report |
| `run-implementation-subphase` | `roadmapPhaseIndex` | Execute a single roadmap sub-phase within implementation |
| `redirect` | `redirectionAction` | Redirect project development (redefine, pivot, pause, etc.) |

## Multi-Project Support

A single studio workspace can contain multiple products/projects. Each project independently tracks:

- Its own phase progression
- Its own code projects (web, mobile, backend, worker, infra, shared, docs)
- Its own artifacts and roadmap
- Its own business context, target users, and constraints
- Its own implementation status and validation history

Use `switch-project` to change the active project context.

## Code Projects

Each product can contain multiple code projects:

| Type | Description |
|------|-------------|
| `web` | Web application (frontend) |
| `mobile` | Mobile application (iOS/Android) |
| `backend` | Backend API or service |
| `worker` | Background worker or job processor |
| `infra` | Infrastructure-as-code repository |
| `shared` | Shared libraries or packages |
| `docs` | Documentation portal |

## Artifact Types

| Type | Created By | Phase | Description |
|------|-----------|-------|-------------|
| `studio-config` | ceo | init | Studio configuration and metadata |
| `project-brief` | product-manager | create | Project vision and code project listing |
| `market-analysis` | ceo | discovery | Market size, trends, and opportunity analysis |
| `user-needs-analysis` | ceo | discovery | Target user identification and pain points |
| `competitive-analysis` | ceo | discovery | Competitive landscape mapping |
| `opportunity-assessment` | ceo | discovery | Business viability assessment |
| `business-context` | ceo | discovery | Industry, market segment, revenue model, and competitive advantage |
| `feature-prioritization` | product-manager | roadmap-definition | Prioritized feature list with scoring |
| `roadmap` | product-manager | roadmap-definition | Phased product roadmap with milestones and deliverables |
| `milestone-definitions` | product-manager | roadmap-definition | Milestone definitions with success criteria |
| `resource-plan` | product-manager | roadmap-definition | Resource allocation across code projects |
| `product-vision` | product-manager | product-definition | Product vision, value proposition, and market positioning |
| `mvp-definition` | product-manager | product-definition | MVP scope, core features, and success criteria |
| `user-personas` | product-manager | product-definition | Detailed user personas with goals, behaviors, and pain points |
| `user-flows` | ux-ui | ux-definition | User journey and interaction flow maps |
| `wireframe-spec` | ux-ui | ux-definition | Wireframe specifications per screen |
| `design-system` | ux-ui | ux-definition | Design tokens, typography, colors, components |
| `prototype-brief` | ux-ui | ux-definition | Interaction specification for prototyping |
| `ux-ui-spec` | ux-ui | ux-definition | Consolidated UX/UI specification with design decisions and component inventory |
| `architecture-plan` | software-architect | architecture-definition | High-level system architecture and component boundaries |
| `api-contracts` | software-architect | architecture-definition | API endpoint and DTO definitions |
| `data-model` | software-architect | architecture-definition | Data schemas and storage strategy |
| `infrastructure-plan` | software-architect | architecture-definition | Infrastructure topology and deployment |
| `tech-stack-decision` | software-architect | architecture-definition | Technology choices with rationale |
| `task-breakdown` | developer | implementation-phase | Implementation tasks per code project |
| `implementation-phase-plan` | developer | implementation-phase | Task ordering and dependency graph |
| `codebase-structure` | developer | implementation-phase | Directory layout and module boundaries |
| `integration-points` | developer | implementation-phase | Cross-project integration map |
| `repository-bootstrap-report` | developer | implementation-phase | Git initialization and bootstrap status per code project |
| `claude-config-manifest` | developer | implementation-phase | .claude directory structure and file listing |
| `code-execution-report` | developer | implementation-phase | Claude Code execution results per implementation phase |
| `implementation-report` | developer | implementation-phase | Implementation progress report with completed tasks and remaining work |
| `test-strategy` | qa | qa-validation | Overall test pyramid and strategy |
| `acceptance-criteria` | qa | qa-validation | Testable acceptance criteria per feature |
| `quality-gates` | qa | qa-validation | Quality gates and release criteria |
| `test-plan` | qa | qa-validation | Detailed test plans per code project |
| `qa-report` | qa | qa-validation | QA validation report with test results and quality assessment |
| `release-readiness-report` | product-manager | release-readiness | Release readiness assessment across all code projects and quality gates |
| `launch-checklist` | product-manager | release-readiness | Pre-launch checklist |
| `go-to-market-brief` | ceo | release-readiness | Launch positioning and GTM strategy |
| `monitoring-plan` | software-architect | release-readiness | Observability and alerting plan |
| `phase-summary` | (varies) | any | Phase completion summary with decisions |
| `status-report` | product-manager | any | Cross-project status report |

## Step Budget Enforcement

The skill respects the step budget cooperatively:

- Before each phase step, it checks `host.run.getStepBudget()` and `host.run.getStepCount()`.
- If the budget cannot accommodate remaining steps + summary + approval, it wraps up the phase early with available deliverables.
- Default budget is 40 steps; hard limit is 150 steps per run.

## Checkpointing Strategy

The skill checkpoints at each significant boundary:

1. After studio initialization
2. After project creation
3. After each individual phase step completes
4. After roadmap generation
5. After phase summary
6. After user approval/rejection

This enables resume from any checkpoint if the run is interrupted.

## User Interaction

The skill requests user input at:

- **Roadmap approval**: approve or reject the generated roadmap after roadmap-definition
- **Phase completion**: approve, reject, revise, pause, or cancel the phase deliverables before advancing
- **Architecture decision gate**: explicit approval required before proceeding to implementation-phase

The user can also explicitly review any artifact via the `review-artifact` action with approve/reject/revise decisions.

## User Redirection

The user can redirect project development at any point using the `redirect` action with a `redirectionAction`:

| Redirection Action | Requires Roadmap | Description |
|-------------------|-----------------|-------------|
| `redefine-roadmap` | Yes | Regenerate the roadmap with new direction or feedback |
| `redefine-phase` | No | Re-run the current phase with new direction |
| `reorder-phases` | Yes | Change the execution order of roadmap phases |
| `reduce-scope` | Yes | Remove phases or deliverables from the roadmap |
| `expand-scope` | Yes | Add phases or deliverables to the roadmap |
| `pivot` | No | Restart from discovery with context preservation |
| `change-priorities` | Yes (+ implementing) | Reorder implementation sub-phases |
| `pause` | No | Checkpoint and pause execution |
| `continue` | No | Resume from last checkpoint |
| `stop` | No | Cancel all remaining phases |

Scope changes (`reduce-scope`, `expand-scope`, `redefine-roadmap`) create a new `RoadmapVersion` to preserve history. `pivot` creates a pivot-context artifact preserving the previous state before resetting to discovery.

## Workspace State Schema (v2.0.0)

```typescript
interface StudioState {
  studioName: string;
  projects: ProjectRecord[];
  activeProjectId: string | null;
  createdAt: string; // ISO 8601
}

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

interface RoadmapVersion {
  id: string;
  version: number;
  entries: RoadmapEntry[];
  createdAt: string;
  decision: GateDecision | null;
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

interface ImplementationPhaseRecord {
  id: string;
  roadmapEntryPhase: PhaseId;
  label: string;
  status: RoadmapPhaseStatus; // not_started | planning | plan_approved | implementing | qa_validating | pm_reviewing | user_reviewing | completed | failed
  planArtifactId: string | null;
  implementationReportArtifactId: string | null;
  qaReportArtifactId: string | null;
  pmAlignmentDecision: GateDecision | null;
  userDecision: GateDecision | null;
  bridgeJobIds: string[];
}

interface ValidationEntry {
  phase: PhaseId;
  decision: GateDecision; // approve | reject | revise | pause | cancel
  feedback: string | null;
  timestamp: string; // ISO 8601
}

type GateDecision = 'approve' | 'reject' | 'revise' | 'pause' | 'cancel';

interface CodeProject {
  id: string;
  name: string;
  type: 'web' | 'mobile' | 'backend' | 'worker' | 'infra' | 'shared' | 'docs';
  techStack: string;
  repoPath: string | null;
  bootstrapStatus: 'pending' | 'git_initialized' | 'claude_configured' | 'ready';
  bootstrapBridgeJobId: string | null;
}

interface RoadmapEntry {
  phase: PhaseId;
  milestones: string[];
  deliverables: string[];
  estimatedDuration: string;
  dependencies: string[];
}

type PhaseId =
  | 'discovery'
  | 'roadmap-definition'
  | 'product-definition'
  | 'ux-definition'
  | 'architecture-definition'
  | 'implementation-phase'
  | 'qa-validation'
  | 'release-readiness';
```

## Dedicated UI (Product Studio)

The `startup-product-studio` skill has a dedicated web experience in OS Loop AI at the `/studio` route, separate from the generic workspace views. This UI provides a purpose-built control surface for the multi-phase product development workflow.

### Workspace Creation

Users create a new product studio through the Studio UI:

1. Navigate to `/studio` in the sidebar
2. Click "New Studio"
3. Fill in studio name, first project name, description, and optional code projects
4. The dialog creates a `SkillWorkspace` with an initialized `StudioState` and a project in the `discovery` phase

### Roadmap Approval

After the `roadmap-definition` phase completes, the runtime creates a `UserInputRequest` with a gate decision schema (`approve` / `reject` / `revise`). The Studio UI detects this pattern and renders structured approval buttons instead of a freeform text input:

- **Approve**: accepts the roadmap and allows advancement to `product-definition`
- **Revise**: opens a feedback textarea; the skill re-runs relevant roadmap steps with the user's feedback
- **Reject**: opens a feedback textarea; the skill re-executes the entire `roadmap-definition` phase

### Phase Approval

The same structured gate UI appears at the end of every phase. The user sees the phase timeline with completed/active/upcoming indicators and decides whether to advance. The architecture decision gate before `implementation-phase` uses identical UX but is emphasized given its irreversibility.

### Steering the Skill

Beyond gate decisions, users can:

- **Pause** a running execution (preserves state, checkpoints the run)
- **Cancel** a running execution
- **Continue** a paused run
- **Retry** a failed run (from latest checkpoint when available)
- **Review individual artifacts** via the artifact panel (click to expand content, status badges show draft/pending/approved/rejected)
- **Switch projects** in multi-project studios via the project selector dropdown

### Background Execution

When `supportsBackgroundExecution` is `true`, the skill can continue executing after the user navigates away. The inbox aggregates pending input requests, pending approvals, and run status changes so the user is notified when attention is needed. The Studio UI reflects the latest state when the user returns.

## Bridge Integration

Bridge requirement is **optional**. The skill operates fully without the bridge for planning phases. When the bridge is connected, the `implementation-phase` uses it for code execution.

### Bridge-Backed Implementation Phase

When the bridge is available during the implementation phase:

1. **Entry conditions verified**: approved roadmap, completed architecture phase, code projects defined
2. **Repository bootstrap** per code project:
   - `git init` with project-type-appropriate `.gitignore`
   - Initial `README.md` with project description and tech stack
   - Initial bootstrap commit
   - Tracked via `CodeProject.bootstrapStatus`: `pending` → `git_initialized` → `claude_configured` → `ready`
3. **`.claude` directory configuration** per code project (18 files across 4 subdirectories):
   - `.claude/docs/` — coding-standards, architecture-context, testing-expectations, tdd-guidance, quality-gates, repository-conventions, error-handling-guidelines
   - `.claude/context/` — project-brief, active-project-topology
   - `.claude/agents/` — developer, reviewer, architecture-review, test-quality, bugfix-investigation
   - `.claude/commands/` — implement-task, run-tests, run-quality-pass, review-diff
   - Content generated via LLM based on project's tech stack and architecture artifacts
4. **Claude Code execution** — `claude --print <phase-specific-goal>` run in each code project's repository working directory with a 600-second timeout. Each sub-phase has explicit goals, bounded scope, and a user approval gate before advancing
5. **Tool installation** — Claude Code installed via bridge tool recipes if not present

Without the bridge, the implementation phase produces planning-only artifacts (task-breakdown, implementation-phase-plan, codebase-structure, integration-points, implementation-report).

### New Artifact Types (Bridge-Backed)

| Artifact Type | Role | Phase | Description |
|---------------|------|-------|-------------|
| `repository-bootstrap-report` | developer | implementation-phase | Git initialization and bootstrap status per code project |
| `claude-config-manifest` | developer | implementation-phase | .claude directory structure and file listing |
| `code-execution-report` | developer | implementation-phase | Claude Code execution results per implementation phase |

### Approval & Provenance

All bridge commands include `RequestContext { source: "skill", skill_id, run_id }` for provenance tracking and whitelist scoping. Each bridge job is tracked as a `BridgeJobRef` linked to the `WorkspaceRun`.

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes | Whether the action completed successfully |
| `message` | string | Yes | Human-readable result description |
| `studioState` | object | No | Current studio state snapshot |
| `artifactIds` | string[] | No | Artifacts created during this execution |
| `stepsUsed` | number | No | Total steps consumed |
| `phasesCompleted` | string[] | No | Phases completed in this execution |

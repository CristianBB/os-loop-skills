# Startup Product Studio

End-to-end product creation skill for OS Loop AI. Models a startup team with six specialized roles that collaborate through eight sequential phases — from market discovery to release readiness — producing versioned artifacts at every step. Designed for building production-grade software products, not toy scaffolding.

## Overview

Startup Product Studio turns a product idea into a structured development plan and, when the OS Loop Bridge is connected, into working code. It orchestrates six AI-powered roles (CEO, Product Manager, UX/UI Designer, Software Architect, Developer, QA Lead) through a phased workflow that mirrors how a real startup operates. Each phase produces concrete, reviewable artifacts. The user retains control through explicit approval gates, redirection actions, and artifact review at every stage.

The skill manages a software product end to end: from initial market analysis through roadmap definition, product scoping, UX design, system architecture, implementation, quality assurance, and release readiness. It supports multi-project codebases (e.g., a web frontend, a backend API, and a mobile app under one product studio) and tracks each project independently through the full lifecycle.

## What This Skill Does

- Analyzes market opportunity, competitive landscape, and business viability for a product idea
- Generates a phased product roadmap with milestones, deliverables, dependencies, and time estimates
- Defines product vision, MVP scope, and user personas
- Designs UX flows, wireframes, design system tokens, and consolidated UI specifications
- Plans system architecture, API contracts, data models, and infrastructure
- Breaks implementation into sub-phases with planning, coding, QA, and PM review gates
- Bootstraps Git repositories and configures Claude Code for each code project (when bridge is connected)
- Executes code through Claude Code with phase-specific goals and bounded scope (when bridge is connected)
- Validates quality with test strategies, acceptance criteria, and quality gates
- Assesses release readiness and produces launch checklists and go-to-market briefs
- Tracks all work as versioned artifacts with full revision history

## When to Use

- You have a product idea and want to systematically explore market fit, define scope, design UX, plan architecture, and implement it
- You want to turn an idea into a production software product through a structured, approval-gated process
- You need concrete artifacts (roadmaps, architecture plans, API contracts, test strategies) rather than freeform conversation
- You want to manage multiple related products (e.g., a patient portal and provider dashboard) within a single studio workspace
- You want to define a roadmap and implement it phase by phase with review at every step
- You want the agent to produce work incrementally with approval gates, not a single large output

## What Makes It Different from a Simple Coding Assistant

A coding assistant generates code on demand. Startup Product Studio simulates a startup workflow with multiple specialized roles collaborating through a structured process:

- **Phased workflow, not one-shot generation.** Work progresses through eight phases (discovery → roadmap → product definition → UX → architecture → implementation → QA → release readiness). Each phase has a defined purpose, a responsible role, and concrete deliverables.
- **Six specialized roles, not one generic assistant.** The CEO analyzes market opportunity. The Product Manager defines scope and roadmaps. The UX/UI Designer produces design specifications. The Software Architect plans system design. The Developer executes implementation. The QA Lead validates quality. Each role has dedicated prompts optimized for its domain.
- **Approval gates at every boundary.** The user reviews and explicitly approves, revises, or rejects every phase's deliverables before the workflow advances. Architecture decisions require explicit approval before implementation begins.
- **Roadmap-first development.** The skill generates a versioned roadmap before any implementation begins. The roadmap is editable, versionable, and must be approved by the user. Implementation follows the roadmap structure.
- **Versioned artifacts, not ephemeral output.** Every deliverable is stored as a versioned artifact in the workspace. Artifacts have revision chains, status tracking, and are reviewable at any time.
- **Production-grade intent.** The skill is designed for building real products with real architecture, real code projects, and real quality gates — not for generating demo apps or boilerplate.

## Execution Model

**Agentic** (`executionMode: "agentic"`). The OS Loop runtime launches a supervised sub-run with:

- A bound workspace that persists state across runs
- Step budgets (default 40, hard limit 150 per run) enforced cooperatively
- Checkpoints at every significant boundary for resume capability
- Role-based step reporting for observability
- Background execution support — the skill continues working after the user navigates away

The skill reports each step via `host.run.reportStep(label, role)` and checkpoints via `host.run.checkpoint()`. Before each phase step, it checks `host.run.getStepBudget()` and `host.run.getStepCount()`. If the budget cannot accommodate remaining steps plus summary and approval, the skill wraps up with available deliverables and surfaces a budget-exceeded status.

## Workspace Model

**Required.** The skill cannot operate without a bound `SkillWorkspace`. The workspace stores:

- `StudioState` — top-level container with studio name, projects array, and active project pointer
- `ProjectRecord` — per-project phase progression, roadmap versions, code projects, artifacts, business context, constraints, and validation history
- `SkillWorkspaceArtifact` entries — versioned artifacts with status tracking and revision chains

Workspace schema version: `2.0.0`. See the full TypeScript interface in `docs.md`.

## User Interaction Model

The skill communicates with the user through structured interactions, not freeform chat.

### Approval Gates

| Gate | When | What the User Decides |
|------|------|----------------------|
| Roadmap approval | After roadmap-definition | Accept, revise with feedback, or reject the roadmap |
| Phase completion | After any phase | Approve deliverables, request revisions, reject, pause, or cancel |
| Architecture decision | After architecture-definition | Explicit approval before committing to implementation |
| Implementation sub-phase plan | Before each coding sub-phase | Approve the plan before code execution begins |
| Implementation sub-phase completion | After each coding sub-phase | Review QA report and PM alignment before advancing |

### Gate Decisions

| Decision | Effect |
|----------|--------|
| `approve` | Accept deliverables, advance to next phase |
| `reject` | Re-execute the entire phase from scratch |
| `revise` | Re-run specific steps with user feedback |
| `pause` | Suspend the project, preserving all state |
| `cancel` | Cancel the project permanently |

### Redirection Actions

The user can redirect development at any point:

| Action | Description |
|--------|-------------|
| `redefine-roadmap` | Regenerate roadmap with new direction (creates new RoadmapVersion) |
| `redefine-phase` | Re-run current phase with new direction |
| `reorder-phases` | Change roadmap phase execution order |
| `reduce-scope` | Remove phases or deliverables |
| `expand-scope` | Add phases or deliverables |
| `pivot` | Restart from discovery, preserving context |
| `change-priorities` | Reorder implementation sub-phases |
| `pause` | Checkpoint and suspend |
| `continue` | Resume from last checkpoint |
| `stop` | Cancel all remaining phases |

## Roadmap-First Development Flow

After the discovery phase is approved, the skill automatically generates a roadmap:

1. Discovery steps execute → phase summary → user approval gate
2. If approved → roadmap auto-generated → roadmap approval gate
3. If roadmap approved → stored as `RoadmapVersion` v1, advance to product-definition
4. If roadmap rejected/revised → regenerated with feedback, version incremented

The roadmap is a first-class versioned artifact. Each regeneration (including scope changes via `reduce-scope`, `expand-scope`, `redefine-roadmap`) creates a new `RoadmapVersion` preserving the full history. The user can compare versions.

Each `RoadmapVersion` records:

- Version number (auto-incrementing)
- Phase entries with milestones, deliverables, estimated duration, and dependencies
- Creation timestamp
- Approval decision (null until the user decides)

## Internal Role Model

| Role | Slug | Primary Phases | Responsibility |
|------|------|---------------|----------------|
| CEO | `ceo` | discovery | Strategic vision, market opportunity analysis, competitive positioning, business viability, go-to-market strategy |
| Product Manager | `product-manager` | roadmap-definition, product-definition, release-readiness | Feature prioritization, roadmap generation, milestone definition, MVP scoping, launch coordination, status reporting |
| UX/UI Designer | `ux-ui` | ux-definition | User journey mapping, wireframe specifications, design system definition, prototype briefs, consolidated UX/UI specs |
| Software Architect | `software-architect` | architecture-definition | System design, API contracts, data modeling, infrastructure planning, technology decisions |
| Developer | `developer` | implementation-phase | Task breakdown, implementation planning, codebase structure, repository bootstrap, Claude Code execution, implementation reports |
| QA Lead | `qa` | qa-validation | Test strategy, acceptance criteria, quality gates, test plans, validation reports |

Each role has a dedicated system prompt in `prompts/` optimized for its domain. Role switching is reported via `host.run.reportStep(label, role)` and `host.workspace.setRole(role)` for observability.

## Multi-Project Product Support

A single studio workspace can contain multiple products. Each project independently tracks:

- Phase progression (one project can be in implementation while another is in discovery)
- Code projects of type: `web`, `mobile`, `backend`, `worker`, `infra`, `shared`, `docs`
- Artifacts and roadmap versions
- Business context, target users, and constraints
- Implementation status and validation history

Use the `switch-project` action to change the active project context. The `status-report` action generates a cross-project summary.

## Bridge and Claude Code Integration

When the OS Loop Bridge is connected, the implementation phase extends beyond planning into actual code execution. The integration follows a structured flow:

1. **Tool verification** — The skill calls `host.bridge.locateTools(['claude-code'])` to check if Claude Code is available on the system
2. **Tool installation** — If not found, the skill requests installation via `host.bridge.installTool({ toolId: 'claude-code', reason: '...' })`. Tool installations always require explicit user approval
3. **Repository bootstrap** — For each code project, the skill executes `git init`, generates `.gitignore` and `README.md`, and creates an initial commit
4. **Claude Code configuration** — The skill writes a `.claude/` directory structure with project-specific context (see Git and Repository Bootstrap Behavior)
5. **Code execution** — The skill invokes Claude Code via the bridge with phase-specific goals, bounded scope, and approval gates between sub-phases

All bridge commands include `RequestContext { source: "skill", skill_id, run_id }` for provenance tracking. The bridge independently enforces approval; the skill never bypasses the bridge's security authority.

The skill polls for job completion via `host.bridge.waitForJob(bridgeRunId)` with 2-second intervals, throwing `SkillWaitingBridgeJobSignal` which the agentic engine catches and transitions the run to `waiting_bridge_job` status.

## Git and Repository Bootstrap Behavior

For each code project in the product, the skill bootstraps a Git repository through a tracked lifecycle:

**Bootstrap status transitions:** `pending` → `git_initialized` → `claude_configured` → `ready`

### Bootstrap steps

1. **Git initialization** — `git init` with a project-type `.gitignore`, `README.md`, and initial commit. Status transitions to `git_initialized`.
2. **Claude Code configuration** — A `.claude/` directory is created with 18 files across 4 subdirectories:

```
.claude/
├── docs/
│   ├── coding-standards.md            # Tech-stack-specific conventions (linting, naming, imports)
│   ├── architecture-context.md        # System design context so Claude Code makes consistent decisions
│   ├── testing-expectations.md        # Test strategy, frameworks, and coverage targets
│   ├── tdd-guidance.md                # TDD workflow with project-specific test commands
│   ├── quality-gates.md               # Measurable criteria required before merge
│   ├── repository-conventions.md      # Git workflow, branching, PR, and commit conventions
│   └── error-handling-guidelines.md   # Error patterns specific to the project's tech stack
├── context/
│   ├── project-brief.md              # Product vision and business context for Claude Code
│   └── active-project-topology.md    # Multi-project structure and cross-service dependencies
├── agents/
│   ├── developer.md                   # Claude Code persona for implementation tasks
│   ├── reviewer.md                    # Claude Code persona for code review
│   ├── architecture-review.md         # Claude Code persona for architecture pattern review
│   ├── test-quality.md                # Claude Code persona for test design and coverage review
│   └── bugfix-investigation.md        # Claude Code persona for root cause analysis
└── commands/
    ├── implement-task.md              # /implement-task — bounded task with test expectations
    ├── run-tests.md                   # /run-tests — project-specific test runner and flags
    ├── run-quality-pass.md            # /run-quality-pass — lint + type-check + test in sequence
    └── review-diff.md                 # /review-diff — review staged changes against standards
```

Status transitions to `claude_configured`, then `ready` once verified.

3. **Bootstrap report artifact** — A `repository-bootstrap-report` artifact records the bootstrap result per code project (project ID, repo path, files generated, status).
4. **Claude config manifest artifact** — A `claude-config-manifest` artifact records the `.claude/` directory structure and file listing.

## Platform Compatibility

Supported on all platforms: **macOS**, **Windows**, **Linux**.

The skill runs entirely in the browser for planning phases. Bridge-backed features (repository bootstrap, code execution) require the OS Loop Bridge desktop application, which is available on all three platforms.

## Bridge Requirement Semantics

Bridge requirement: **optional**.

### Without Bridge (Planning Mode)

All eight phases execute fully. The implementation phase produces planning-only artifacts: task breakdown, implementation plan, codebase structure, integration points, and implementation report. No actual code is written.

### With Bridge (Full Mode)

The implementation phase extends with three additional capabilities:

1. **Repository bootstrap** — `git init` with project-type `.gitignore`, README, and initial commit per code project
2. **Claude Code configuration** — `.claude/` directory with coding standards, architecture context, testing expectations, TDD guidance, quality gates, project brief, developer/reviewer agents, and implement-task/run-tests commands
3. **Code execution** — `claude --print <goal>` invocations per code project with phase-specific goals, bounded scope, and approval gates between sub-phases

Bridge commands use timeouts: 300s for Git operations and file writes, 600s for Claude Code execution.

## Long-Running Behavior and Recovery

The skill is designed for sessions that span minutes to hours across multiple runs:

- **Checkpointing**: State is saved after studio init, project creation, each phase step, roadmap generation, phase summary, and user approval. A run interrupted at any point resumes from the last checkpoint.
- **Background execution**: When `supportsBackgroundExecution` is true, the skill continues executing after the user leaves the page. Pending input requests and approvals appear in the OS Loop inbox.
- **Multi-run progression**: A single product typically requires multiple runs to progress through all eight phases. Each run advances the project by one or more phases within the step budget.
- **Pause and resume**: The user can pause execution at any time. The skill checkpoints state, then calls `host.run.pause()` which throws `SkillPausedSignal` — the agentic engine catches this and transitions the run to paused status. The next run resumes from the checkpoint.
- **Failure recovery**: If an LLM call or bridge command fails after at least one step has completed, the agentic engine automatically checkpoints before surfacing the error. The user can retry from the checkpoint without losing completed work.

### Checkpoint boundaries

1. After studio initialization
2. After project creation
3. After each individual phase step completes
4. After roadmap generation
5. After phase summary
6. After user approval/rejection
7. Before surfacing a failure (if steps > 0)

## Artifacts Produced by the Skill

The skill produces over 35 artifact types across all phases. Key artifacts by phase:

| Phase | Artifact Type | Role | Description |
|-------|--------------|------|-------------|
| discovery | `business-context` | ceo | Industry, market segment, revenue model, competitive advantage |
| discovery | `market-analysis` | ceo | TAM/SAM/SOM analysis, market trends, opportunity sizing |
| discovery | `competitive-analysis` | ceo | Competitor mapping and differentiation opportunities |
| discovery | `opportunity-assessment` | ceo | Business viability and strategic risks |
| roadmap-definition | `roadmap` | product-manager | Phased roadmap with milestones and deliverables |
| roadmap-definition | `feature-prioritization` | product-manager | Prioritized feature list with scoring rationale |
| product-definition | `product-vision` | product-manager | Product vision, value proposition, market positioning |
| product-definition | `mvp-definition` | product-manager | MVP scope, core features, success criteria |
| product-definition | `user-personas` | product-manager | User personas with goals, behaviors, pain points |
| ux-definition | `ux-ui-spec` | ux-ui | Consolidated UX/UI specification with design decisions |
| ux-definition | `wireframe-spec` | ux-ui | Wireframe specifications per screen |
| ux-definition | `design-system` | ux-ui | Design tokens, typography, colors, components |
| architecture-definition | `architecture-plan` | software-architect | System architecture and component boundaries |
| architecture-definition | `api-contracts` | software-architect | API endpoint and DTO definitions |
| architecture-definition | `data-model` | software-architect | Data schemas and storage strategy |
| architecture-definition | `tech-stack-decision` | software-architect | Technology choices with rationale |
| implementation-phase | `implementation-phase-plan` | developer | Task ordering and dependency graph |
| implementation-phase | `implementation-report` | developer | Progress report with completed and remaining work |
| implementation-phase | `repository-bootstrap-report` | developer | Git init and bootstrap status (bridge only) |
| implementation-phase | `claude-config-manifest` | developer | .claude directory structure (bridge only) |
| implementation-phase | `code-execution-report` | developer | Claude Code execution results (bridge only) |
| qa-validation | `qa-report` | qa | Quality assessment with test results |
| qa-validation | `test-strategy` | qa | Test pyramid and strategy |
| qa-validation | `acceptance-criteria` | qa | Testable acceptance criteria per feature |
| release-readiness | `release-readiness-report` | product-manager | Release readiness across all quality gates |
| release-readiness | `launch-checklist` | product-manager | Pre-launch checklist |
| release-readiness | `go-to-market-brief` | ceo | Launch positioning and GTM strategy |
| (any) | `phase-summary` | (varies) | Phase completion summary with decisions |
| (any) | `status-report` | product-manager | Cross-project progress summary |

## Security and Approval Model

- **Sandbox**: Standard isolation with 300-second timeout and 256 MB memory limit. No network access, no filesystem access outside workspace.
- **Secret safety**: The skill declares no `requiredBindings`. Bridge commands use `__OSL_SECRET[...]__` tokens resolved by the web app — the bridge never sees secret values.
- **Provenance**: All bridge commands include `RequestContext` with skill ID and run ID. Whitelist rules are scoped to the skill context.
- **Bridge authority**: The bridge independently enforces command approval. The skill cannot bypass whitelist checks or user prompts. Tool installation always requires explicit user approval regardless of whitelist state.
- **No arbitrary code execution**: The skill module itself is sandboxed. Code execution only happens through the bridge's command execution API with full approval flow.

## Limitations

- **Step budget per run**: Default 40 steps, maximum 150. Complex phases may require multiple runs. The skill checkpoints and can resume, but a single run cannot complete all eight phases for a complex product.
- **LLM dependency**: Every phase requires LLM completion. Quality depends on the configured LLM provider and model. Token budgets per phase range from 4,000 to 10,000.
- **No code execution without bridge**: Without the OS Loop Bridge, the implementation phase produces plans only — no repositories are created, no code is written.
- **No real-time collaboration**: The skill operates in a single-user context. Multi-user collaboration is not supported.
- **Artifact content is LLM-generated**: All artifacts (roadmaps, architecture plans, test strategies) are generated by the LLM. The user must review and validate every artifact through the approval gates.

## Example User Journeys

### Journey 1: SaaS product from idea to implementation

> "I want to build a SaaS platform for freelance project management."

1. **Create studio**: `init-studio` with name "FreelanceFlow Studio"
2. **Create project**: `create-project` with description, plus code projects: `web` (Next.js frontend), `backend` (Node.js API), `docs` (documentation site)
3. **Discovery phase** (CEO role): Market analysis reveals a gap in freelancer-specific tooling. Competitive analysis maps Trello, Asana, and niche alternatives. Business context establishes a B2C SaaS revenue model. User approves discovery artifacts.
4. **Roadmap generated**: Three-phase roadmap — Phase 1: core task management. Phase 2: invoicing and payments. Phase 3: client collaboration. User reviews, requests to move invoicing to Phase 1. Roadmap regenerated as v2. User approves.
5. **Product definition** (PM role): Product vision, MVP definition scoped to Phase 1, and three user personas (solo freelancer, agency owner, client). User approves.
6. **UX definition** (UX/UI role): User flows, wireframes, design system tokens. User revises the onboarding flow. Skill re-runs wireframe step with feedback. User approves.
7. **Architecture definition** (Architect role): System design with Next.js SSR frontend, REST API, PostgreSQL. API contracts and data models. User approves the architecture.
8. **Implementation begins** (Developer role): Sub-phase 1 plan generated for backend API scaffold. User approves the plan. Bridge bootstraps the `backend` repo, configures `.claude/`, and executes Claude Code for the initial API structure. QA validates, PM confirms alignment, user approves. Advance to sub-phase 2.

### Journey 2: Multi-project product with pivot

> "I need a health monitoring platform with a patient app and a provider dashboard."

1. Studio created with two projects: "Patient Portal" (`mobile` + `backend`) and "Provider Dashboard" (`web` + `backend`)
2. Patient Portal completes discovery. Provider Dashboard begins discovery in parallel (via `switch-project`).
3. After architecture definition for Patient Portal, the user realizes the data model needs to change. User calls `redirect` with `redefine-phase` and provides feedback. Architecture phase re-runs with updated requirements.
4. During implementation, the user calls `redirect` with `reduce-scope` to defer the notification subsystem. Roadmap regenerated as v3.
5. `status-report` generates a cross-project summary showing Patient Portal in implementation and Provider Dashboard in UX definition.

### Journey 3: Planning-only mode (no bridge)

> "I want to plan my product before writing any code."

1. Full workflow from discovery through release readiness executes without the bridge.
2. Implementation phase produces planning artifacts only: task breakdown, implementation plan, codebase structure, and integration points. No repositories are created.
3. The user exports the artifacts and uses them as specifications for a development team.

## Example Agent-Discoverable Queries

The following natural-language requests should match this skill:

- "Build a product from scratch"
- "Create a startup app"
- "Define a roadmap and implement it"
- "Turn an idea into a production software product"
- "Create a web/mobile/backend product with phased development"
- "Simulate a startup workflow with multiple roles"
- "Manage a software product end to end"
- "Plan and build a SaaS application"
- "I need a product studio to develop my app idea"
- "Help me go from idea to working software"

## Developer Notes

### Directory structure

```
startup-product-studio/
├── manifest.json           # Skill manifest (schema v2.0)
├── module.ts               # Agentic execution logic
├── docs.md                 # Complete technical documentation
├── README.md               # This file
├── prompts/                # Role-specific LLM system prompts
│   ├── ceo.md
│   ├── product-manager.md
│   ├── developer.md
│   ├── software-architect.md
│   ├── ux-ui.md
│   └── qa.md
├── flows/                  # Phase flow definitions
│   ├── discovery.json
│   ├── roadmap-definition.json
│   ├── product-definition.json
│   ├── ux-definition.json
│   ├── architecture-definition.json
│   ├── implementation-phase.json
│   ├── qa-validation.json
│   ├── release-readiness.json
│   └── user-redirection.json
├── tests/                  # Validation and consistency tests
│   ├── manifest-validation.test.ts
│   ├── docs-consistency.test.ts
│   └── flow-module-consistency.test.ts
└── examples/               # Reference workspace states and walkthroughs
    ├── single-product-workspace.json
    ├── multi-project-workspace.json
    ├── walkthrough-single-product.md
    └── walkthrough-multi-project.md
```

### Extending the skill

- **Adding a new phase**: Add the phase to `manifest.json` `inputSchema.properties.targetPhase.enum`, create a flow file in `flows/`, add the phase handling in `module.ts`, update `docs.md`, and add the phase to the consistency tests.
- **Adding a new role**: Create a prompt file in `prompts/`, assign phases in the role map in `module.ts`, update `docs.md`, and add the role to the consistency tests.
- **Adding a new artifact type**: Add the type to the artifact creation logic in `module.ts`, document it in `docs.md`, and add validation for the new type.

### Error handling

When an LLM call returns content that cannot be parsed as valid JSON (e.g., during roadmap generation, `.claude` configuration, or execution phase planning), the skill retries once with a stricter JSON-only instruction. If the retry also fails, the skill throws a clean error that the agentic engine can catch, checkpoint, and surface for retry. The skill never falls back to stub or filler content.

### Running tests

```bash
# Manifest validation
npx tsx skills/startup-product-studio/tests/manifest-validation.test.ts

# Docs and examples consistency
npx tsx skills/startup-product-studio/tests/docs-consistency.test.ts

# Flow-module consistency
npx tsx skills/startup-product-studio/tests/flow-module-consistency.test.ts
```

## License

Copyright OS Loop. All rights reserved.

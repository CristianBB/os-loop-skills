# Walkthrough: Single-Product Studio

This walkthrough demonstrates the full lifecycle of creating a product using Startup Product Studio — from initial idea to release readiness. The example builds **TaskFlow**, a collaborative task management app for small teams.

## 1. Create the Studio

The user navigates to `/studio` in OS Loop and clicks "New Studio."

**Input:**
```json
{
  "action": "init-studio",
  "studioName": "TaskFlow Studio"
}
```

The skill creates a `SkillWorkspace` with an empty `StudioState`. The workspace is now bound and ready for project creation.

## 2. Create the Product

**Input:**
```json
{
  "action": "create-project",
  "projectName": "TaskFlow",
  "projectDescription": "A collaborative task management app for small teams with real-time updates, kanban boards, and time tracking. Targets freelancers and small agencies who outgrow simple to-do lists but find enterprise tools overwhelming.",
  "codeProjects": [
    { "name": "taskflow-web", "type": "web", "techStack": "Next.js, TypeScript, Tailwind CSS, shadcn/ui" },
    { "name": "taskflow-api", "type": "backend", "techStack": "Node.js, Express, PostgreSQL, Prisma" }
  ]
}
```

The skill creates a `ProjectRecord` in the `discovery` phase with two code projects. An artifact of type `project-brief` is created capturing the vision and code project listing.

## 3. Discovery Phase

**Input:**
```json
{ "action": "run-phase" }
```

The CEO role executes five steps:

1. **market-analysis** — Analyzes the SaaS/productivity market, identifies the gap between consumer to-do apps and enterprise PM tools.
2. **user-needs** — Maps pain points for freelancers (tool switching, no time tracking) and small agency leads (complexity, visibility).
3. **competitive-landscape** — Maps competitors (Trello, Asana, Linear) with positioning analysis.
4. **opportunity-assessment** — Evaluates business viability, TAM/SAM/SOM, and unit economics.
5. **business-context** — Captures industry (SaaS/Productivity), market segment, revenue model (freemium), and competitive advantage.

Each step produces a versioned artifact. After all steps complete, a `phase-summary` artifact is generated.

**Approval gate:** The user reviews the discovery deliverables and approves:

```json
{ "decision": "approve" }
```

The approval is recorded in `validationHistory`. The skill automatically advances to roadmap generation.

## 4. Roadmap Generation and Approval

The roadmap is generated automatically after discovery approval — the user does not need to call `generate-roadmap` separately. The Product Manager role creates a phased roadmap with milestones, deliverables, duration estimates, and dependencies for all eight phases.

**Roadmap approval gate:** The user reviews the roadmap. In this example, the user requests a revision:

```json
{ "decision": "revise", "feedback": "Shorten the implementation phase from 4 weeks to 3 weeks by reducing the initial feature set" }
```

The skill regenerates the roadmap incorporating the feedback and creates `RoadmapVersion` v2. The user approves v2, and it becomes the active roadmap.

## 5. Product Definition Phase

**Input:**
```json
{ "action": "run-phase" }
```

The Product Manager role executes:

1. **product-vision** — Articulates the value proposition and market positioning.
2. **mvp-definition** — Defines MVP scope: kanban board, time tracking, team invites. Excludes: reporting, integrations, mobile app.
3. **user-personas** — Creates detailed personas (Freelance Creative, Small Agency Lead) with goals, behaviors, and pain points.

The user approves the phase deliverables.

## 6. UX Definition Phase

The UX/UI Designer role executes five steps:

1. **user-flow-design** — Maps user journeys for onboarding, task creation, board management, and time tracking.
2. **wireframe-spec** — Produces wireframe specifications for key screens (dashboard, board view, task detail, timer).
3. **design-system** — Defines design tokens (colors, typography, spacing), component inventory, and interaction patterns.
4. **prototype-brief** — Creates interaction specifications for prototype handoff.
5. **ux-ui-spec** — Consolidates all UX/UI decisions into a unified specification document.

**At this point, the workspace state matches `single-product-workspace.json`** — the example JSON file in this directory shows the exact shape of `StudioState` mid-way through ux-definition with three completed phases.

## 7. Architecture Definition Phase

The Software Architect role executes:

1. **architecture-plan** — Defines the system architecture: Next.js frontend, Express API, PostgreSQL with Prisma, WebSocket for real-time.
2. **api-contracts** — Specifies REST endpoints and DTOs for tasks, boards, users, and time entries.
3. **data-model** — Designs the database schema with tables, relationships, and indexes.
4. **infrastructure-plan** — Plans deployment topology (Vercel for frontend, Railway for API, Supabase for database).
5. **tech-stack-decision** — Documents technology choices with rationale.

**Architecture decision gate:** This is the most critical approval point. Architecture decisions are expensive to reverse. The user reviews the tech stack, API contracts, and infrastructure plan before approving.

## 8. Implementation Phase

The Developer role breaks work into sub-phases aligned with roadmap entries. Each sub-phase follows the gated lifecycle:

### Without Bridge (Planning Only)

```json
{ "action": "run-phase" }
```

Steps: task-breakdown, implementation-phase-plan, codebase-structure, integration-points, implementation-report. Produces planning artifacts only.

### With Bridge (Full Implementation)

```json
{ "action": "run-implementation-subphase", "roadmapPhaseIndex": 0 }
```

The skill:
1. Verifies bridge connectivity via `host.bridge.isAvailable()`
2. Locates Claude Code: `host.bridge.locateTools(['claude-code'])`
3. Installs Claude Code if missing: `host.bridge.installTool({ toolId: 'claude-code' })`
4. Bootstraps `taskflow-web` repo: `git init`, `.gitignore`, `README.md`, initial commit
5. Configures `.claude/` directory with 18 files across agents, commands, docs, and context subdirectories
6. Executes Claude Code with implementation task context
7. Generates implementation report artifact
8. QA Lead validates, PM checks alignment, user makes gate decision

Each bridge command goes through the bridge's approval flow. The user sees a prompt for each new command template.

## 9. QA Validation Phase

The QA Lead role executes:

1. **test-strategy** — Defines the test pyramid (unit, integration, e2e) per code project.
2. **acceptance-criteria** — Creates testable criteria per MVP feature.
3. **quality-gates** — Defines release criteria (code coverage, performance benchmarks, accessibility).
4. **test-plan** — Produces detailed test plans for `taskflow-web` and `taskflow-api`.
5. **qa-report** — Generates a quality assessment with pass/fail status per gate.

## 10. Release Readiness Phase

The Product Manager and CEO roles collaborate:

1. **release-readiness-report** — Assesses readiness across all code projects and quality gates.
2. **launch-checklist** — Pre-launch checklist (monitoring, backups, rollback plan, support).
3. **go-to-market-brief** — Launch positioning, channels, messaging, success metrics.
4. **monitoring-plan** — Observability setup, alerting thresholds, dashboards.

After approval, the product lifecycle is complete. All artifacts remain accessible in the workspace for reference.

## Summary

| Phase | Role | Artifacts | Steps |
|-------|------|-----------|-------|
| discovery | CEO | market-analysis, user-needs, competitive-analysis, opportunity-assessment, business-context | 5 |
| roadmap-definition | PM | feature-prioritization, roadmap, milestone-definitions, resource-plan | 4 |
| product-definition | PM | product-vision, mvp-definition, user-personas | 3 |
| ux-definition | UX/UI | user-flows, wireframe-spec, design-system, prototype-brief, ux-ui-spec | 5 |
| architecture-definition | Architect | architecture-plan, api-contracts, data-model, infrastructure-plan, tech-stack-decision | 5 |
| implementation-phase | Developer | task-breakdown, implementation-phase-plan, codebase-structure, integration-points, implementation-report | 5+ |
| qa-validation | QA | test-strategy, acceptance-criteria, quality-gates, test-plan, qa-report | 5 |
| release-readiness | PM + CEO | release-readiness-report, launch-checklist, go-to-market-brief, monitoring-plan | 4 |

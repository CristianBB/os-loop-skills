# Example: Agentic Skill — Research Assistant

A full agentic skill demonstrating the complete agentic pattern: phased execution, role-based steps, step budget enforcement, artifact creation with versioning, checkpointing, and user input requests.

## Execution Mode

Agentic (`executionMode: "agentic"`). The runtime launches a supervised sub-run with a workspace, step budgets, and checkpoints. The skill iterates toward a goal under runtime control.

## Phases

The skill moves through three phases:

| Phase | Role | Description |
|-------|------|-------------|
| `research` | `researcher` | Identifies subtopics from the query and analyzes each one, creating a "finding" artifact per subtopic. |
| `analysis` | `analyst` | Synthesizes findings across all analyzed subtopics into a coherent overview. |
| `report` | `writer` | Produces a final Markdown report artifact and requests user review. |

Phase transitions are explicit: the skill calls `host.workspace.setPhase()` at each boundary.

## Roles

| Role | Responsibility |
|------|---------------|
| `researcher` | Identifies subtopics and analyzes each one individually. |
| `analyst` | Cross-references findings and produces a synthesis. |
| `writer` | Generates the final report and manages the user review interaction. |

Role switching is reported via `host.run.reportStep(label, role)` and `host.workspace.setRole(role)`.

## Step Budget Enforcement

The skill respects the step budget cooperatively:

- Before analyzing each subtopic, it checks `host.run.getStepBudget()` and `host.run.getStepCount()` to verify at least 3 steps remain (current analysis + synthesis + report).
- If the budget is nearly exhausted, it skips remaining subtopics and moves to synthesis with whatever findings are available.
- The `depth` input parameter controls how many subtopics are identified: `shallow` (2), `moderate` (4), `deep` (6).

Default budget is 20 steps; hard limit is 50 steps per run.

## Artifacts

| Artifact Type | Created By | Description |
|--------------|------------|-------------|
| `finding` | `researcher` | One per analyzed subtopic, containing the subtopic findings. |
| `report` | `writer` | The final synthesized research report. Marked `approved` or `needs-revision` based on user feedback. |

## Checkpointing Strategy

The skill checkpoints at each significant boundary:

1. After identifying subtopics (before the analysis loop)
2. After each individual subtopic analysis
3. After synthesis
4. After the final report and user review

This means the skill can resume from any of these points if interrupted.

## User Interaction

The skill pauses once, at the end of the report phase, to request user review. The user can approve the report or provide revision feedback. The artifact status is updated accordingly.

## Input

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `query`   | string | Yes      | The research question or topic |
| `depth`   | string | No       | `"shallow"`, `"moderate"` (default), or `"deep"` |

## Output

| Field        | Type     | Description |
|--------------|----------|-------------|
| `summary`    | string   | Executive summary of the research |
| `artifactIds`| string[] | IDs of all artifacts created |
| `stepsUsed`  | number   | Total step count |
| `phases`     | string[] | List of completed phases |

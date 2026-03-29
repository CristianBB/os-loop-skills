# Skill Execution Modes

Skills declare an `executionMode` in their manifest, which determines how the OS Loop AI runtime orchestrates their execution. There are three modes.

## Required Manifest Fields by Execution Mode

All fields below must be explicitly declared in every manifest — no implicit defaults.

| Field | Declarative | Flow | Agentic |
|-------|-------------|------|---------|
| `executionMode` | `"declarative"` | `"flow"` | `"agentic"` |
| `workspaceSupport` | `"none"` | `"optional"` or `"required"` | `"optional"` or `"required"` |
| `workspaceSchemaVersion` | `null` | semver string | semver string |
| `longRunningSupport` | `"none"` | `"none"` / `"optional"` / `"required"` | `"optional"` or `"required"` |
| `userInputSupport` | `false` (typically) | `true` / `false` | `true` / `false` |
| `artifactVersioningSupport` | `false` (typically) | `true` / `false` | `true` / `false` |
| `supportedPlatforms` | `[]` or platform list | `[]` or platform list | `[]` or platform list |
| `bridgeRequirement` | `"never"` / `"optional"` / `"required"` | same | same |
| `agenticConfig.enabled` | `false` | `false` | `true` |
| `agenticConfig.requiresWorkspace` | `false` | `false` | `true` / `false` |
| `agenticConfig.supportsBackgroundExecution` | `false` | `false` | `true` / `false` |
| `agenticConfig.supportsRoleBasedExecution` | `false` | `false` | `true` / `false` |
| `agenticConfig.maxStepsPerRun` | `null` | `null` | number or `null` |
| `agenticConfig.defaultStepBudget` | `null` | `null` | number or `null` |

---

## Declarative (default)

```json
{
  "executionMode": "declarative"
}
```

**Semantics:**
- Single invocation: runtime calls `execute(args, host)` once and returns the result.
- No internal agentic loop, no open-ended reasoning.
- The skill exposes tools/capabilities that the runtime may call directly.
- WorkspaceRun is optional and generally absent.
- The skill may still participate in approvals, permissions, and platform checks.

**When to use:** Stateless transformations, calculations, single API calls, tool registrations.

**Host API:** The full `host` object is available, but `host.run` is **not present**.

---

## Flow

```json
{
  "executionMode": "flow",
  "workspaceSupport": "optional"
}
```

**Semantics:**
- Step-driven, deterministic execution.
- The runtime creates a WorkspaceRun to track progress.
- The module can pause, checkpoint, request user input, and wait for bridge jobs.
- There is no open-ended reasoning loop — execution follows the defined flow steps.

**When to use:** Multi-step workflows, guided processes, approval-gated pipelines, structured data transformations with intermediate state.

**Host API:** The full `host` object is available, plus `host.run`:

| Method | Description |
|--------|-------------|
| `host.run.pause(reason)` | Pause the run. The module should return after calling this. |
| `host.run.requestInput(opts)` | Request user input. Returns user response when answered. |
| `host.run.checkpoint()` | Create a checkpoint of current workspace + run state. |
| `host.run.reportStep(label)` | Report a named step for progress tracking. |

---

## Agentic

```json
{
  "executionMode": "agentic",
  "workspaceSupport": "required",
  "agenticConfig": {
    "enabled": true,
    "requiresWorkspace": true,
    "supportsBackgroundExecution": false,
    "supportsRoleBasedExecution": false,
    "maxStepsPerRun": 100,
    "defaultStepBudget": 50
  }
}
```

**Semantics:**
- The runtime launches an explicit skill-level agentic sub-run.
- The sub-run is supervised by the main runtime (the main OS Loop AI runtime remains the top-level owner).
- The sub-run is tied to a WorkspaceRun, checkpointed, resumable, and bounded by step budgets.
- The runtime can pause, resume, cancel, and retry the run.

**When to use:** Open-ended reasoning tasks, research agents, project management agents, code generation agents — any skill that needs to iterate toward a goal with runtime supervision.

**Host API:** Same as flow, plus step budget enforcement:

| Method | Description |
|--------|-------------|
| `host.run.reportStep(label, role?)` | Report a step. Increments step counter. May halt if budget exceeded. |
| `host.run.getStepCount()` | Get current step count. |
| `host.run.getStepBudget()` | Get the soft step budget (null = unlimited). |
| `host.run.pause(reason)` | Checkpoint and pause the run. |
| `host.run.requestInput(opts)` | Checkpoint and request user input. |
| `host.run.checkpoint()` | Create a checkpoint. |

### Step Budget Enforcement

- **`maxStepsPerRun`** (hard limit): If set, the runtime halts execution when this count is reached. A checkpoint is created automatically.
- **`defaultStepBudget`** (soft limit): If set, the runtime auto-creates a checkpoint when this count is reached, but execution continues.
- Both limits are **cooperative** — the module must call `host.run.reportStep()` for the runtime to track progress. The execution timeout remains the absolute hard boundary.

### Role-Based Execution

If `supportsRoleBasedExecution: true`:
- The module can pass a `role` parameter to `host.run.reportStep(label, role)`.
- The runtime tracks the current role in the WorkspaceRun state.
- Role switching is explicit and inspectable.
- Role-based execution is internal to the skill run, not separate uncontrolled agents.

### Background Execution

If `supportsBackgroundExecution: true`:
- The runtime may continue the skill run outside a foreground conversation turn.
- The run must still use checkpoints, event logs, inbox/activity center, and workspace UI.
- Explicit waiting states are maintained.
- The WorkspaceRun record carries `supportsBackgroundExecution: true` so the scheduler and UI can make decisions.

If `supportsBackgroundExecution: false`:
- The runtime will not silently background-execute the skill.

### Workspace API for Agentic Skills

When `workspaceSupport` is `"optional"` or `"required"`, `host.workspace` is available with:

| Method | Description |
|--------|-------------|
| `host.workspace.getState()` | Load the workspace state object. |
| `host.workspace.setState(state)` | Replace the workspace state object. |
| `host.workspace.createArtifact({ type, title, content, parentArtifactId?, createdByRole? })` | Create a versioned artifact. `createdByRunId` is auto-populated from the current run. `parentArtifactId` links to a previous version (creates an artifact chain). |
| `host.workspace.updateArtifact(artifactId, { title?, status?, content? })` | Update an existing artifact. Use `status: 'superseded'` to mark a previous version. |
| `host.workspace.listArtifacts()` | List all artifacts in the workspace (summary: id, type, title, status, version). |
| `host.workspace.setPhase(phase)` | Set the current phase on the workspace (e.g., `"research"`, `"drafting"`, `"review"`). |
| `host.workspace.setRole(role)` | Set the current role on the workspace. |
| `host.workspace.attachApprovalRef(approvalId, kind)` | Link an approval request to the workspace. |

### Waiting States

Agentic skill runs must correctly use the following waiting states — do not collapse them:

| State | Triggered by | Meaning |
|-------|-------------|---------|
| `waiting_user_input` | `host.run.requestInput(opts)` | Run is paused waiting for user to provide input. |
| `waiting_approval` | Runtime policy engine | Run is paused waiting for an approval decision. |
| `waiting_bridge_job` | `lifecycle.trackBridgeJob()` | Run is waiting for a bridge command/install to complete. |
| `paused` | `host.run.pause(reason)` | Run is explicitly paused by the skill. |
| `recovering` | Runtime reconciler | Run has dirty state and needs checkpoint recovery. |

### Agentic Skill Authoring Checklist

When authoring an agentic skill, define:

- **Roles** — if `supportsRoleBasedExecution: true`, list the roles the skill uses and what each does.
- **Artifact outputs** — what artifacts the skill produces, their types, and whether they chain (supersede previous versions).
- **Phase boundaries** — what phases the skill moves through (e.g., `research → draft → review → final`).
- **Blocking points** — where the skill will pause for user input, approval, or bridge jobs.
- **Background support** — whether the skill checkpoints properly for background execution.
- **Workspace requirement** — whether the skill requires a workspace or can work without one.

### Agentic Skill Example

**Manifest (excerpt):**

```json
{
  "name": "research-agent",
  "description": "Multi-step research agent that explores topics, gathers sources, and produces a structured report",
  "executionMode": "agentic",
  "workspaceSupport": "required",
  "workspaceSchemaVersion": "1.0.0",
  "userInputSupport": true,
  "artifactVersioningSupport": true,
  "agenticConfig": {
    "enabled": true,
    "requiresWorkspace": true,
    "supportsBackgroundExecution": true,
    "supportsRoleBasedExecution": true,
    "maxStepsPerRun": 50,
    "defaultStepBudget": 20
  }
}
```

**Module (excerpt):**

```typescript
export async function execute(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<unknown> {
  const { topic } = args as { topic: string };

  // Phase 1: Research
  await host.workspace!.setPhase('research');
  host.run!.reportStep('search-sources', 'researcher');

  const sources = await host.llm.complete({
    purposeId: 'research',
    systemPrompt: 'Find relevant sources for the given topic.',
    messages: [{ role: 'user', content: `Research: ${topic}` }],
  });

  host.run!.reportStep('analyze-sources', 'researcher');
  await host.run!.checkpoint();

  // Phase 2: Drafting
  await host.workspace!.setPhase('drafting');
  host.run!.reportStep('write-draft', 'writer');

  const draft = await host.llm.complete({
    purposeId: 'drafting',
    systemPrompt: 'Write a structured report based on the research.',
    messages: [{ role: 'user', content: sources.text }],
  });

  const artifact = await host.workspace!.createArtifact({
    type: 'report',
    title: `Research Report: ${topic}`,
    content: { body: draft.text, sources: sources.text },
    createdByRole: 'writer',
  });

  // Phase 3: Review — ask user to confirm
  await host.workspace!.setPhase('review');
  host.run!.reportStep('request-review', 'reviewer');

  const feedback = await host.run!.requestInput({
    title: 'Review Draft Report',
    message: 'Please review the draft report and provide feedback.',
    inputSchema: {
      type: 'object',
      properties: {
        approved: { type: 'boolean' },
        feedback: { type: 'string' },
      },
    },
  });

  // If approved, finalize; otherwise revise
  if ((feedback as { approved: boolean }).approved) {
    await host.workspace!.updateArtifact(artifact.id, { status: 'approved' });
  }

  return { reportId: artifact.id };
}
```

---

## Describing Skills for Agent Reasoning

The main OS Loop AI agent uses manifest fields to decide how to launch, explain, and supervise a skill. Write your manifest so the agent can reason about your skill correctly.

### Description

Write a clear `description` that indicates the kind of work the skill performs. The agent uses this to match user intent to skills.

- Good: `"Multi-step research agent that explores topics, gathers sources, and produces a structured report"`
- Bad: `"Research tool"` (too vague — the agent cannot distinguish this from a single-query search)

### Execution Mode

Always declare `executionMode` explicitly. Omitting it defaults to `"declarative"`, which is correct for most simple skills, but flow and agentic skills **must** declare their mode so the agent knows what to expect.

### Agentic Config

For agentic skills, the `agenticConfig` fields directly affect how the agent communicates with the user:

| Field | Agent behavior |
|-------|---------------|
| `supportsBackgroundExecution: true` | Agent tells the user the skill may continue working in the background and results will appear in the inbox/workspace. |
| `supportsBackgroundExecution: false` | Agent tells the user the skill runs in the foreground conversation. |
| `supportsRoleBasedExecution: true` | Agent can explain that the skill switches between named roles (e.g., "researcher", "editor") during execution. |
| `maxStepsPerRun` | Agent can set user expectations about the maximum scope of a single run. |
| `defaultStepBudget` | Agent can explain when automatic checkpoints will occur. |

Set these honestly. If `supportsBackgroundExecution` is `true` but the skill does not actually checkpoint and surface progress via inbox, the user experience will be broken.

### Roles

When `supportsRoleBasedExecution: true`, the roles passed to `host.run.reportStep(label, role)` should be meaningful labels that the agent and user can understand (e.g., `"researcher"`, `"writer"`, `"reviewer"`). Avoid opaque internal identifiers.

### Workspace Expectations

If `workspaceSupport` is `"required"`, the agent must create or select a workspace before launching the skill. If `"optional"`, the agent may offer workspace persistence as an enhancement. Document in `docs.md` what the workspace state contains so the agent can explain it to the user.

### User Interaction Expectations

If the skill will pause for user input (via `host.run.requestInput()`), document this in `docs.md`:
- How frequently does the skill pause? (e.g., once per phase, at every decision point)
- What kind of input does it request? (e.g., approval, text, selection)
- Can the user answer asynchronously via the inbox?

This helps the agent set correct expectations when launching the skill.

---

## Key Principle

**Agentic skills are supervised runtime loops, not uncontrolled chat personas.** The main OS Loop AI runtime always remains the top-level owner. A skill's agentic loop is bounded, inspectable, and under the runtime's control.

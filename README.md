# OS Loop Skills

Official skills repository for [OS Loop AI](https://github.com/os-loop/os-loop-ai). Skills are declarative, browser-executed modules that extend the agent's capabilities.

## Repository Structure

```
skills/
  index.json                    # Registry of all skills
  {skill-slug}/
    manifest.json               # Skill manifest (required)
    module.ts                   # Skill implementation (required)
    docs.md                     # User-facing documentation (optional)
    config-schema.json          # Configuration JSON Schema (optional)
```

Each skill lives in its own directory under `skills/` using a **kebab-case slug** (e.g., `web-summary`, `github-issue-tracker`).

## Skill Package Structure

### manifest.json

The manifest declares everything about a skill: what it does, what it needs, and how it behaves. It combines top-level metadata fields with the `SkillManifest` v2.0 schema.

#### Top-level Metadata

| Field         | Type   | Required | Description                      |
|---------------|--------|----------|----------------------------------|
| `name`        | string | Yes      | Skill slug (matches directory)   |
| `description` | string | Yes      | Short description of the skill   |
| `version`     | string | Yes      | Semver version (e.g., `1.0.0`)  |
| `author`      | string | Yes      | Author name or organization      |

#### SkillManifest Fields

| Field                       | Type                          | Required | Description                                                    |
|-----------------------------|-------------------------------|----------|----------------------------------------------------------------|
| `schemaVersion`             | `"2.0"`                       | Yes      | Always `"2.0"`                                                 |
| `capabilities`              | `string[]`                    | Yes      | List of capabilities the skill provides                        |
| `requiredBindings`          | `SkillRequiredBinding[]`      | Yes      | Secrets or config the skill needs at install time              |
| `permissions`               | `SkillPermission[]`           | Yes      | Permissions the skill requires                                 |
| `inputSchema`               | `object`                      | Yes      | JSON Schema for the skill's input (must have `type: "object"`) |
| `outputSchema`              | `object`                      | Yes      | JSON Schema for the skill's output (must have `type: "object"`)|
| `compatibilityRequirements` | `string[]`                    | Yes      | Runtime compatibility requirements (see [Valid Values](#compatibilityrequirements-values)) |
| `oauth`                     | `SkillOAuthDefinition[]`      | No       | OAuth provider configurations                                  |
| `llmUsage`                  | `SkillLlmUsageDeclaration[]`  | No       | Declared LLM usage purposes                                    |
| `wasm`                      | `SkillWasmDefinition[]`       | No       | WASM module declarations                                       |
| `views`                     | `SkillViewDeclaration[]`      | No       | UI view declarations                                           |
| `tools`                     | `SkillToolDeclaration[]`      | No       | Tool registrations                                             |
| `lifecycleHooks`            | `SkillLifecycleHook[]`        | No       | Declared lifecycle hooks                                       |
| `sandbox`                   | `SkillSandboxRequirements`    | No       | Sandbox configuration (defaults provided)                      |
| `requiredMcpServers`        | `SkillRequiredMcpServer[]`    | No       | Required MCP servers                                           |
| `requiredMcpTools`          | `SkillRequiredMcpTool[]`      | No       | Required MCP tools                                             |
| `supportedPlatforms`        | `BridgePlatform[]`            | **Yes**  | Platforms the skill supports: `"macos"`, `"windows"`, `"linux"`. Empty array means all platforms. |
| `bridgeRequirement`         | `BridgeRequirement`           | **Yes**  | Bridge dependency: `"never"`, `"optional"`, or `"required"` |
| `workspaceSupport`          | `SkillWorkspaceSupport`       | **Yes**  | Workspace support: `"none"`, `"optional"`, or `"required"` |
| `workspaceSchemaVersion`    | `string \| null`              | **Yes**  | Semver version of the workspace state schema. Use `null` when `workspaceSupport` is `"none"`. |
| `longRunningSupport`        | `string`                      | **Yes**  | Long-running support: `"none"`, `"optional"`, or `"required"` |
| `userInputSupport`          | `boolean`                     | **Yes**  | Whether the skill requests user input during execution |
| `artifactVersioningSupport` | `boolean`                     | **Yes**  | Whether the skill creates versioned artifacts |
| `executionMode`             | `SkillExecutionMode`          | **Yes**  | Execution mode: `"declarative"`, `"flow"`, or `"agentic"` |
| `agenticConfig`             | `SkillAgenticConfig`          | **Yes**  | Agentic execution configuration (see below). Must be present even for non-agentic skills with `enabled: false`. |

#### SkillPermission

```json
{
  "kind": "network | storage | vault | conversation | llm | browser | wasm | filesystem",
  "scope": "string — describes the permission scope",
  "description": "string — human-readable reason",
  "browserPermissions": ["clipboard-read", "clipboard-write", "notifications", "geolocation", "camera", "microphone", "storage-persistent"]
}
```

#### SkillRequiredBinding

```json
{
  "name": "string — binding key",
  "scope": "string — what the binding provides",
  "description": "string — human-readable explanation",
  "required": true,
  "oauthProviderId": "string — optional, links to an oauth entry"
}
```

#### SkillOAuthDefinition

```json
{
  "providerId": "string",
  "displayName": "string",
  "grantType": "authorization_code | client_credentials",
  "authorizationUrl": "string",
  "tokenUrl": "string",
  "scopes": ["string"],
  "pkceRequired": true,
  "clientIdBinding": "string — references a requiredBinding",
  "clientSecretBinding": "string — optional",
  "redirectPath": "string",
  "redirectMode": "popup | same-window",
  "supportedEnvironments": ["browser-production", "browser-development"],
  "responseMode": "query | fragment",
  "clientAuthenticationMethod": "client_secret_post | client_secret_basic | none"
}
```

#### SkillLlmUsageDeclaration

```json
{
  "purposeId": "string — unique ID referenced in module code",
  "kind": "classification | generation | extraction | summarization | custom",
  "description": "string",
  "estimatedTokenBudget": 2000,
  "modelPreference": "string | null",
  "temperatureHint": 0.3
}
```

#### SkillToolDeclaration

```json
{
  "name": "string",
  "description": "string",
  "inputSchema": {},
  "outputSchema": {},
  "handlerExport": "string — name of the exported handler function in module.ts"
}
```

#### SkillViewDeclaration

```json
{
  "viewId": "string",
  "kind": "panel | card | dialog | inline",
  "entryComponent": "string",
  "description": "string"
}
```

#### SkillWasmDefinition

```json
{
  "moduleId": "string",
  "sourceKind": "inline_base64 | url | build_from_source",
  "sourceUrl": "string — optional",
  "sourceLanguage": "rust | c | cpp | assemblyscript",
  "sourceRepository": "string — optional",
  "buildCommand": "string — optional",
  "exports": ["string"],
  "memoryLimitMB": 64,
  "auditHash": "string | null"
}
```

#### SkillSandboxRequirements

```json
{
  "isolation": "strict | standard",
  "maxExecutionMs": 30000,
  "maxMemoryMB": 128,
  "allowedGlobals": [],
  "networkRules": [
    {
      "urlPattern": "https://api.example.com/*",
      "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
      "description": "string"
    }
  ]
}
```

#### SkillAgenticConfig

```json
{
  "enabled": false,
  "requiresWorkspace": false,
  "supportsBackgroundExecution": false,
  "supportsRoleBasedExecution": false,
  "maxStepsPerRun": null,
  "defaultStepBudget": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | `boolean` | `true` for agentic skills, `false` for declarative/flow |
| `requiresWorkspace` | `boolean` | If `true`, `workspaceSupport` must be `"required"` |
| `supportsBackgroundExecution` | `boolean` | Whether the skill can run in the background |
| `supportsRoleBasedExecution` | `boolean` | Whether the skill switches between named roles |
| `maxStepsPerRun` | `number \| null` | Hard step limit (halts execution when reached) |
| `defaultStepBudget` | `number \| null` | Soft step limit (auto-checkpoint when reached) |

For non-agentic skills, set `enabled: false` and all other fields to their zero values.

#### SkillRequiredMcpServer / SkillRequiredMcpTool

```json
// MCP Server
{ "name": "string", "description": "string", "urlPattern": "string — optional" }

// MCP Tool
{ "serverName": "string", "toolName": "string", "description": "string" }
```

---

### module.ts

The skill implementation file. Must export an `execute` function and may export optional lifecycle hooks.

#### Required Export

```typescript
export async function execute(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<unknown> {
  // Skill logic here
}
```

- `args` — Input matching the manifest's `inputSchema`
- `host` — Host capabilities injected by the runtime
- Returns — Output matching the manifest's `outputSchema`

#### Optional Lifecycle Hooks

```typescript
export async function onInstall(host: SkillHostCapabilities): Promise<void> {}
export async function onUninstall(host: SkillHostCapabilities): Promise<void> {}
export async function onEnable(host: SkillHostCapabilities): Promise<void> {}
export async function onDisable(host: SkillHostCapabilities): Promise<void> {}
export async function onConfigure(config: Record<string, unknown>, host: SkillHostCapabilities): Promise<void> {}
export async function onUpgrade(fromVersion: string, host: SkillHostCapabilities): Promise<void> {}
```

#### Host Capabilities

The `host` object provides the following APIs:

| Capability       | Methods                                                                 |
|------------------|-------------------------------------------------------------------------|
| `host.llm`       | `complete(req)` — LLM completion with `purposeId`, messages, temperature, maxTokens |
| `host.vault`     | `resolveBinding(name)` — Resolve a secret by binding name              |
| `host.network`   | `fetch(url, init?)` — HTTP fetch (enforced by sandbox `networkRules`)  |
| `host.storage`   | `get(key)`, `set(key, value)`, `delete(key)`, `list()` — Key-value store scoped to the skill |
| `host.events`    | `emitProgress(progress, message)`, `emitCustom(type, payload)` — Emit runtime events |
| `host.tools`     | `registerTool(def, handler)`, `callTool(name, args)` — Tool registration and invocation |
| `host.oauth`     | `authorize(providerId)`, `getToken(providerId)`, `refresh(providerId)`, `authStatus(providerId)` |
| `host.wasm`      | `instantiate(moduleId)` — Instantiate a declared WASM module           |
| `host.log`       | `debug(msg, data?)`, `info(msg, data?)`, `warn(msg, data?)`, `error(msg, data?)` |
| `host.filesystem`| `openFile()`, `openDirectory()`, `readFile(handleId)`, `writeFile(handleId, data)`, `listHandles()` — Optional |
| `host.workspace` | `getState()`, `setState(state)`, `createArtifact(artifact)`, `setPhase(phase)` — Optional, present when a workspace is active |
| `host.skillId`   | `string` — The skill instance ID                                      |
| `host.executionId`| `string` — Unique ID for this execution                               |
| `host.runId`     | `string` — The agent run ID                                           |

---

### config-schema.json (optional)

Standard JSON Schema defining user-configurable settings for the skill. The root type must be `"object"`.

```json
{
  "type": "object",
  "properties": {
    "apiEndpoint": {
      "type": "string",
      "description": "Custom API endpoint URL",
      "default": "https://api.example.com"
    },
    "maxRetries": {
      "type": "number",
      "description": "Maximum number of retry attempts",
      "default": 3
    }
  }
}
```

### docs.md (optional)

Free-form Markdown documentation shown to users in the skill detail view. Should cover what the skill does, its inputs/outputs, required permissions, and usage examples.

---

## index.json

The `skills/index.json` file is a registry of all skills in the repository. When present, the runtime uses it directly instead of scanning directories.

```json
[
  {
    "name": "web-summary",
    "description": "Fetches a web page and produces an LLM-generated summary",
    "version": "1.0.0",
    "author": "OS Loop",
    "folderPath": "skills/web-summary",
    "tags": ["web", "llm", "summarization"],
    "compatibilityRequirements": []
  }
]
```

Each entry:

| Field                       | Type       | Required | Description                              |
|-----------------------------|------------|----------|------------------------------------------|
| `name`                      | string     | Yes      | Skill slug                               |
| `description`               | string     | Yes      | Short description                        |
| `version`                   | string     | Yes      | Semver version                           |
| `author`                    | string     | Yes      | Author name                              |
| `folderPath`                | string     | Yes      | Path from repo root (e.g., `skills/web-summary`) |
| `tags`                      | string[]   | Yes      | Searchable tags                          |
| `compatibilityRequirements` | string[]   | No       | Runtime compatibility requirements       |

---

## How Skills Are Resolved

The OS Loop runtime resolves skills from GitHub repositories through this pipeline:

1. **Parse repository URL** — Extracts `owner`, `repo`, `branch`, and `skillsDirectory` (defaults to `skills`)
2. **Fetch index** — Checks for `{skillsDirectory}/index.json` first
3. **Fallback to directory scan** — If no index exists, uses the GitHub Contents API to enumerate subdirectories
4. **Fetch artifacts** — For each skill, fetches via raw.githubusercontent.com:
   - `{skillsDirectory}/{slug}/manifest.json` (required)
   - `{skillsDirectory}/{slug}/module.ts` (required)
   - `{skillsDirectory}/{slug}/docs.md` (optional)
   - `{skillsDirectory}/{slug}/config-schema.json` (optional)
5. **Validate and register** — The runtime validates the manifest, compiles the TypeScript module, and registers the skill

---

## Creating a New Skill

1. **Create a directory** under `skills/` with a kebab-case slug:
   ```
   skills/my-new-skill/
   ```

2. **Create `manifest.json`** with all required fields:
   - Set `schemaVersion` to `"2.0"`
   - Declare `capabilities`, `permissions`, `inputSchema`, `outputSchema`
   - Declare all execution-model fields explicitly: `executionMode`, `workspaceSupport`, `workspaceSchemaVersion`, `longRunningSupport`, `userInputSupport`, `artifactVersioningSupport`, `supportedPlatforms`, `bridgeRequirement`, `agenticConfig`
   - Declare `llmUsage` if the skill calls `host.llm.complete()`
   - Declare `requiredBindings` if the skill needs secrets
   - Configure `sandbox.networkRules` if the skill makes HTTP requests

3. **Create `module.ts`** with the `execute` export:
   - Accept `args` matching your `inputSchema`
   - Use `host` capabilities as needed
   - Return output matching your `outputSchema`

4. **Add documentation** (optional but recommended):
   - `docs.md` — User-facing documentation
   - `config-schema.json` — If the skill accepts user configuration

5. **Register in `skills/index.json`**:
   ```json
   {
     "name": "my-new-skill",
     "description": "What the skill does",
     "version": "1.0.0",
     "author": "Your Name",
     "folderPath": "skills/my-new-skill",
     "tags": ["relevant", "tags"]
   }
   ```

6. **Submit a pull request**

---

## Examples

The `examples/` directory contains reference skill skeletons for each execution mode:

| Example | Execution Mode | Key Features |
|---------|---------------|--------------|
| `examples/declarative-skill/` | `declarative` | Minimal complete skill, no workspace, no bridge |
| `examples/flow-skill/` | `flow` | Multi-step with pause, user input, and checkpoint |
| `examples/agentic-skill/` | `agentic` | Full agentic loop with phases, roles, artifacts, step budgets |
| `examples/workspace-aware-skill/` | `declarative` | Optional workspace persistence for cross-session state |
| `examples/background-agentic-skill/` | `agentic` | Background execution with heavy checkpointing |

Each example includes a `manifest.json`, `module.ts`, and `docs.md` with a working implementation. See `docs/execution-modes.md` for detailed documentation of each mode.

---

## Bridge-Backed System Commands

Skills that need to execute commands on the host machine (installing tools, running CLI utilities) do so through the OS Loop Bridge. The bridge is the single permission authority — it manages whitelist matching, user approval prompts, and rejection decisions.

**Important:** The bridge may reject execution of any command, including those from official skills in this repository. Official status does not grant automatic execution privileges. Skills must always handle rejection gracefully regardless of their origin.

### Requirements

- **Declare dependency**: Skills needing system commands must include `"system_tools"` in their `compatibilityRequirements` array in both `manifest.json` and `index.json`. They must also set `bridgeRequirement` to `"required"` and list their `supportedPlatforms`.
- **Provide provenance context**: Every execute or install request must include a `context` block so the bridge can trace where the request originated:
  ```json
  {
    "context": {
      "source": "skill",
      "skillId": "host.skillId value",
      "taskId": "host.executionId value",
      "runId": "host.runId value"
    }
  }
  ```
- **Provide template fields**: For commands that may be repeated, include `commandTemplate`, `argsTemplate`, and `workingDirectoryTemplate` alongside the resolved values. Templates enable whitelist matching without storing resolved secrets.
- **Handle rejections**: The bridge may reject any request. Skills must handle `accepted: false` responses gracefully and surface the rejection reason to the agent.
- **Install always requires explicit approval**: Tool installations are never whitelisted — the bridge always prompts the user. Do not retry automatically after a rejection. If a user denies an install, inform them and offer alternatives.
- **Periodic task approval**: When a skill's functionality is used within a periodic (scheduled) task that involves system tool operations, the task itself must be approved at creation or modification time. This is enforced by the web app's scheduler, not the bridge.

### Execute Request Example

```json
{
  "command": "git",
  "args": ["status"],
  "commandTemplate": "git",
  "argsTemplate": ["status"],
  "workingDirectory": "/home/user/project",
  "workingDirectoryTemplate": "/home/user/project",
  "reason": "Check repository status",
  "requestId": "req-abc-123",
  "timeoutMs": 300000,
  "context": {
    "source": "skill",
    "skillId": "my-git-skill",
    "taskId": "exec-001",
    "runId": "run-001"
  }
}
```

### Accepted Response

```json
{
  "accepted": true,
  "runId": "run-xyz-456",
  "decision": {
    "source": "whitelist",
    "message": "Matched existing whitelist rule"
  }
}
```

### Rejected Response

```json
{
  "accepted": false,
  "reason": {
    "code": "rejected_by_user",
    "message": "User denied the command execution"
  }
}
```

Rejection codes: `rejected_by_user`, `bridge_policy_denied`, `invalid_request`.

### Documentation

If a skill uses bridge-backed execution, document the reason in `docs.md` — explain which commands it runs and why system access is necessary.

---

## Platform Compatibility & Bridge Requirements

Skills can declare platform and bridge requirements to ensure they are only installed and executed in compatible environments.

### `supportedPlatforms`

An array of platform identifiers: `"macos"`, `"windows"`, `"linux"`. An empty array (or absent field) means the skill works on all platforms. The web app resolves the current platform using bridge system info when available, or browser user-agent detection as a fallback.

### `bridgeRequirement`

- `"never"` (default): The skill runs entirely in the browser. No bridge needed.
- `"optional"`: The skill works without the bridge but has enhanced features when it is connected (e.g., filesystem access, command execution).
- `"required"`: The skill cannot function without the bridge. Installation is allowed but execution is blocked if the bridge is not connected.

### `compatibilityRequirements` Values

Skills declare runtime requirements using the `compatibilityRequirements` array. The web app validates these at install and execution time.

**Bridge capabilities** (require OS Loop Bridge connection):

| Value                    | Description                                    |
|--------------------------|------------------------------------------------|
| `system_tools`           | Tool discovery, installation, command execution |
| `system_info`            | OS platform, architecture, shell, package managers |
| `filesystem`             | Native filesystem access                       |
| `mcp_proxy`              | MCP server proxying                            |
| `awake`                  | System sleep prevention                        |
| `tool_install_recipes`   | Curated install recipes                        |
| `command_permissions`    | Whitelist-based command permissions             |

**Browser capabilities** (available in all environments):

| Value            | Description                    |
|------------------|--------------------------------|
| `web-crypto`     | Web Crypto API (SubtleCrypto) |
| `indexeddb`      | IndexedDB storage              |
| `web-workers`    | Web Worker support             |
| `local-storage`  | localStorage API               |
| `fetch`          | Fetch API                      |

Skills declaring bridge capabilities as requirements must also set `bridgeRequirement` to `"required"` (or `"optional"` if the capability enhances but is not essential).

### Secret Placeholder Syntax

When a skill's command execution requires a secret (API key, token, etc.), use the placeholder syntax in command arguments or environment variables:

```
__OSL_SECRET[<secretId>]__
```

- The `secretId` is the UUID of the secret stored in the user's local Vault.
- The web runtime resolves placeholders to actual values before sending to the bridge.
- The bridge receives resolved values — it never sees placeholder IDs.
- Command output (stdout/stderr) is automatically redacted by the web runtime to prevent secret leakage.
- Skill manifests that reference `__OSL_SECRET[...]__` placeholders must declare corresponding `requiredBindings`.

Skills must never hardcode actual secret values in module code, documentation, or examples.

### Backward Compatibility

Both fields are optional. Skills without these fields are treated as cross-platform with no bridge requirement — matching the behavior of all existing skills.

### Validation

Run `npm run validate` to check all skills against the manifest standard. The validator verifies platform values, bridge requirement consistency, module existence, and absence of raw secrets in documentation.

---

## Workspace Support

Skills that manage persistent, structured state across sessions can declare workspace support. Workspaces are **runtime-owned by os-loop-ai** — they are created, persisted, and managed in the browser via IndexedDB. Skills do not manage workspace storage directly.

### When to Use Workspaces

Declare `workspaceSupport` when your skill:
- Maintains structured state that persists across multiple conversations or runs (e.g., a project tracker, a multi-step research workflow)
- Produces artifacts that need lifecycle management (draft, pending approval, approved, rejected, superseded)
- Needs to track phases, roles, or approval linkage as first-class persistent data

Do **not** use workspaces for:
- Simple stateless skills (use `"none"`, the default)
- State that fits in a single key-value store entry (use `host.storage` instead)
- Ephemeral state that only matters within a single conversation

### Manifest Fields

```json
{
  "workspaceSupport": "required",
  "workspaceSchemaVersion": "1.0.0"
}
```

- `workspaceSupport`:
  - `"none"` (default) — skill does not use workspaces
  - `"optional"` — skill can use workspaces for enhanced functionality but works without one
  - `"required"` — skill requires an active workspace to function
- `workspaceSchemaVersion`: semver string that declares the structure of the workspace `state` and `metadata` objects. Must be set when `workspaceSupport` is `"optional"` or `"required"`.

### Decision Guide

| Use case | `workspaceSupport` | Why |
|----------|-------------------|-----|
| Stateless computation (calculator, text transform) | `"none"` | No state to persist. Every invocation is self-contained. |
| Note-taking, data collection, iterative research | `"optional"` | Works in a single session without a workspace, but benefits from cross-session persistence. |
| Project tracking, multi-phase workflows, artifact production | `"required"` | The skill's core value depends on structured persistent state. Without a workspace, there is nothing to operate on. |

**Rule of thumb:** If your skill's `execute()` function reads or writes `host.workspace`, it needs `"optional"` or `"required"`. If removing the workspace would make the skill meaningless (not just less useful), use `"required"`.

### How the `workspace_manage` Tool Works at Runtime

The agent uses the `workspace_manage` runtime tool to manage workspaces. This tool is automatically available when workspace-aware skills are installed.

**Supported actions:**

| Action | Description |
|--------|-------------|
| `create` | Creates a new workspace for a skill |
| `get` | Retrieves workspace details |
| `list` | Lists workspaces for a skill |
| `update` | Updates workspace metadata or state |
| `pause` | Pauses a workspace (excluded from active snapshot) |
| `resume` | Resumes a paused workspace |
| `archive` | Archives a workspace (soft delete) |
| `set_phase` | Sets the current workflow phase |
| `set_role` | Sets the current agent role |
| `create_artifact` | Creates a tracked artifact in the workspace |
| `update_artifact` | Updates artifact content or status |
| `list_artifacts` | Lists artifacts for a workspace |

**Context fallback:** When a workspace is active in the current run, the `workspaceId` is automatically available in the tool execution context. Explicit `workspaceId` in args takes precedence over the context value.

### Artifact Lifecycle

Artifacts produced by skills follow a status lifecycle:

```
draft → pending_approval → approved
                         → rejected
                         → superseded
```

- **draft**: Initial state when created via `host.workspace.createArtifact()`.
- **pending_approval**: Submitted for review. The runtime links this to an approval ref.
- **approved / rejected**: Terminal states set through the approval system.
- **superseded**: A newer artifact replaces this one.

Skills create artifacts; the runtime and user manage their lifecycle.

### Artifact Versioning & Provenance

Artifacts support version chains. When an artifact is superseded, the runtime links the new version to the old one:

| Field | Type | Description |
|-------|------|-------------|
| `parentArtifactId` | `UUIDv7 \| null` | Previous version in the chain (`null` for first version) |
| `version` | `number` | Incrementing version within the chain (1-based) |
| `createdByRunId` | `UUIDv7 \| null` | Which run produced this artifact |
| `createdByRole` | `string \| null` | Which agent role produced this artifact |

The runtime provides version chain queries:
- `getVersionChain(artifactId)` — returns the full chain oldest-first
- `getLatestVersion(workspaceId, type)` — returns the highest-version non-superseded artifact
- `supersede(currentId, newArtifact)` — atomically marks the current artifact as superseded and links the new one

Skills create artifacts via `host.workspace.createArtifact()`. The runtime automatically populates `createdByRunId` and `createdByRole` from the current execution context. Skills do not need to manage version chains directly — the runtime handles this when artifacts are superseded.

### Multi-Tab Safety & Optimistic Concurrency

Workspaces use optimistic concurrency control via a `lockVersion` field. Every write to workspace state increments the version, and stale writes (where the caller's version doesn't match the current version) are rejected with a `ConflictError`.

This prevents silent data corruption when multiple browser tabs modify the same workspace. Skills do not need to handle `ConflictError` directly — the runtime catches it and surfaces a user-facing error.

### Workspace State Schema

The `state` object in a workspace is skill-defined. Declare the schema version in `workspaceSchemaVersion` and document the shape.

**Example — project-tracker state (v1.0.0):**
```json
{
  "projectName": "Q2 Launch",
  "tasks": [
    { "id": "task-abc", "title": "Design API", "status": "done", "createdAt": "2025-01-15T10:00:00Z", "updatedAt": "2025-01-16T14:00:00Z" },
    { "id": "task-def", "title": "Implement auth", "status": "in-progress", "createdAt": "2025-01-16T09:00:00Z", "updatedAt": "2025-01-17T11:00:00Z" }
  ],
  "createdAt": "2025-01-15T09:00:00Z"
}
```

**Example — note-organizer state (v1.0.0):**
```json
{
  "notes": [
    { "id": "note-xyz", "title": "API design notes", "content": "...", "tags": ["api", "design"], "createdAt": "2025-01-15T10:00:00Z" }
  ]
}
```

When evolving state schemas, bump `workspaceSchemaVersion` and handle migration in your module's `execute()` function.

### Validation

The validator enforces:
- `workspaceSupport` must be one of: `"none"`, `"optional"`, `"required"`
- `workspaceSchemaVersion` must be a string or null
- If `workspaceSupport` is `"optional"` or `"required"`, `workspaceSchemaVersion` should be set (warning if missing)

### Example Skills

| Skill | `workspaceSupport` | Description |
|-------|-------------------|-------------|
| `quick-calculator` | `"none"` | Stateless math and unit conversion |
| `note-organizer` | `"optional"` | Notes with optional persistence |
| `project-tracker` | `"required"` | Multi-phase project management with artifacts |

---

## Long-Running Skills & Runtime State

The OS Loop runtime owns the lifecycle of long-running skill work. Skills that perform multi-step, resumable, or background work **must not** invent their own ad hoc persistence for run state, checkpoints, or event logs.

### What the runtime provides

| Concern | Owner | Mechanism |
|---------|-------|-----------|
| Run lifecycle (start, progress, pause, resume, complete, fail) | Runtime | `WorkspaceRun` persistence + state machine |
| Checkpoints (snapshots for safe resumption) | Runtime | `WorkspaceRunCheckpoint` store |
| Event logs (structured history of run activity) | Runtime | `WorkspaceRunEvent` store |
| User input requests (blocking prompts during a run) | Runtime | `UserInputRequest` store |
| Bridge job tracking (async system commands) | Runtime | `BridgeJobRef` store |
| Bridge job concurrency control | Bridge | Global concurrency limit with automatic queuing |
| Recovery after reload, tab closure, bridge interruption | Runtime | Reconciliation service |

### What skills should do

- **Report progress** via host capabilities: `host.run.updateProgress({ phase, step, percent, message })`.
- **Request checkpoints** via `host.run.createCheckpoint()` at meaningful milestones so the runtime can resume from them.
- **Request user input** via `host.run.requestUserInput({ title, message, inputSchema })` instead of inventing custom prompt flows.
- **Store workspace-scoped application data** (notes, project tasks, artifacts) in workspace state as usual — this is skill-owned data, not run state.
- **Resume from checkpoints** by reading the latest checkpoint from the host when restarted, and determining where to pick up based on the checkpoint's `currentPhase`, `currentStep`, and `runStateSnapshot`.

### Authoring Workspace-Aware Long-Running Skills

Skills with `workspaceSupport: "required"` and `longRunningSupport` enabled that perform multi-step workflows must model blocking points and recovery explicitly:

1. **Model blocking points as structured requests, not prompt text.**
   When the skill needs a user decision mid-run, call `host.run.requestUserInput({ title, message, inputSchema })`. This transitions the run to `waiting_user_input` and surfaces the prompt in the inbox and workspace detail view. Do not embed decision logic inside freeform LLM prompts — the runtime cannot track or resume from those.

2. **Use artifacts and phases to surface intermediate work.**
   Instead of accumulating results inside hidden conversation context, create artifacts via `host.workspace.createArtifact()` and advance the phase via `host.workspace.setPhase()`. This makes progress visible to the user and inspectable by the agent through the `run_manage` and `workspace_manage` tools.

3. **Assume interruptions and recovery are normal runtime events.**
   A long-running skill execution may be interrupted by browser reload, bridge disconnection, user-initiated pause, or session expiry. Design the skill so it can resume from the last checkpoint: persist meaningful progress via `host.run.createCheckpoint()` at each milestone, and on restart, read the latest checkpoint to determine where to continue.

4. **Do not conflate workspace runs with periodic/scheduled tasks.**
   A workspace run is a single continuous execution of a skill within a workspace context, with explicit waiting states and recovery semantics. A scheduled task is a recurring trigger that creates agent runs on a schedule. They serve different purposes and use different runtime APIs.

### Bridge Job Concurrency

The bridge enforces a **global concurrency limit** on system jobs (commands and tool installations). Skills that launch bridge jobs benefit from this automatically:

- Jobs that exceed the bridge's concurrency limit are **queued** and start automatically when capacity becomes available.
- The bridge emits `bridge.job.created` and `bridge.job.updated` events as jobs transition through `Queued → Running → Completed/Failed/Terminated`.
- The runtime reconciler detects bridge job status changes (including `Queued → Running`) and updates local `BridgeJobRef` records accordingly.
- Skills that launch multiple bridge jobs (e.g., parallel installs or chained commands) will see them managed concurrently up to the bridge limit, with overflow queued transparently.

Skills do **not** need to implement queuing, throttling, or concurrency control for bridge jobs — the bridge manages this independently.

### Dirty State & Recovery Design

When a run terminates abnormally (bridge restart, timeout, browser reload), the runtime marks it as **dirty** — meaning the workspace may be in an inconsistent state. Dirty runs with partial execution are flagged as `reviewRequired`, which **blocks new runs** on the same workspace until the user takes one of these actions:

| Action | Effect |
|--------|--------|
| **Acknowledge** | Clears dirty + reviewRequired. User accepts the current state as-is. |
| **Retry from checkpoint** | Creates a new run from the last checkpoint. Clears the old run's dirty state. |
| **Discard** | Clears dirty + reviewRequired. Treats the partial state as abandoned. |

The runtime classifies dirty state based on the bridge's `recoveryHint`:
- `"bridge_restart"` or `"timeout"` → dirty (something ran, side-effects unknown)
- `"spawn_failure"` → **not dirty** (nothing actually executed)
- `null` → dirty (conservative default)

Skills do not participate in dirty-state classification or resolution — this is entirely runtime-owned. Skills should focus on creating checkpoints at meaningful milestones so the runtime has good recovery points.

### What skills must not do

- Do not persist run status, progress, or step counters independently.
- Do not implement custom recovery logic for browser reload or bridge disconnection.
- Do not poll the bridge directly for job status — the runtime reconciler handles this.
- Do not assume a run completed successfully without the runtime confirming it.
- Do not implement concurrency throttling for bridge jobs — the bridge manages this.

## Runtime Surfaces for Workspace-Aware Skills

The OS Loop runtime provides dedicated user-facing management surfaces that automatically present workspace and run information to the user. Skill authors do not need to build their own UI — the runtime derives everything from standard API usage.

### Inbox / Activity Center

A global inbox surfaces items requiring user attention. The runtime automatically derives inbox entries from:

- **Pending `UserInputRequest`** items (created via `host.run.requestUserInput()`) — shown as actionable cards the user can answer directly.
- **Pending approval requests** — shown with a link to the approval center.
- **Recoverable run failures** — shown with a retry action.
- **Bridge rejections and bridge-unavailable states** — shown with reconnect or workspace navigation actions.
- **Recently completed runs** — shown as informational items.

Skills that use `host.run.requestUserInput()` get their prompts surfaced in both the inbox and the workspace detail view. No additional skill-side work is needed.

### Workspace Detail View

Each workspace has a dedicated detail page showing:

- **Workspace metadata**: name, description, status, current phase and role.
- **Active run panel**: status badge, progress bar, current step, waiting-for indicator.
- **Run controls**: Continue, Pause, Cancel, and Retry buttons — available based on the current run state machine transitions.
- **Pending user input forms**: inline forms for answering `UserInputRequest` items.
- **Artifacts list**: all workspace artifacts with their approval status.
- **Bridge jobs**: active and completed bridge jobs with command and status.
- **Run history**: past completed/failed/cancelled runs.

### What this means for skill authors

- Skills that use `host.workspace.*` (state, artifacts) and `host.run.*` (progress, checkpoints, user input) automatically benefit from these surfaces.
- Skills should produce structured state, artifacts, and events suitable for these surfaces — but they already do so via the existing host APIs.
- Skills should **not** implement their own inbox, notification, or dashboard logic. The runtime handles this.
- Long-running workspace-aware skills should assume the runtime provides: workspace page, inbox, and explicit continue/pause/retry actions.

---

## Contribution Guidelines

- **Slug format**: kebab-case, matching `^[a-z][a-z0-9-]*$`
- **Versioning**: Strict semver (`major.minor.patch`)
- **Schemas**: `inputSchema` and `outputSchema` must have `type: "object"` at the root
- **No stubs**: Every `module.ts` must contain a complete, working implementation
- **Permissions**: Declare all permissions the skill requires — the runtime enforces them
- **LLM usage**: Every call to `host.llm.complete()` must have a matching `llmUsage` entry in the manifest with the same `purposeId`
- **Network rules**: Every URL the skill fetches must be covered by a `sandbox.networkRules` entry
- **Secret kinds**: When declaring `requiredBindings`, use appropriate secret kinds: `token`, `password`, `api_key`, `oauth_client`, `oauth_refresh_token`, `certificate`, `generic`
- **Platform & bridge**: Declare `supportedPlatforms` and `bridgeRequirement` in both `manifest.json` and `index.json`. Bridge-required skills must include `"system_tools"` in `compatibilityRequirements`

---

## Execution Modes

Skills declare an `executionMode` in their manifest that determines runtime orchestration behavior. See [docs/execution-modes.md](docs/execution-modes.md) for the full authoring guide, including how to describe skills so the main agent can reason about them correctly.

| Mode | Description | `host.run` |
|------|-------------|------------|
| `declarative` (default) | Single invocation, no loop | Not available |
| `flow` | Step-driven, deterministic, can pause/checkpoint/request input | Available |
| `agentic` | Supervised sub-run with step budgets, checkpoints, pause/resume | Available with step tracking |

The main OS Loop AI agent uses `executionMode`, `agenticConfig`, `workspaceSupport`, and `bridgeRequirement` to decide how to launch, supervise, and explain skills to the user. Always declare these fields explicitly for flow and agentic skills. See [Describing Skills for Agent Reasoning](docs/execution-modes.md#describing-skills-for-agent-reasoning) for authoring guidelines.

All existing skills in this repository use `declarative` mode.

---

## License

MIT

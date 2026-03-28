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
| `supportedPlatforms`        | `BridgePlatform[]`            | No       | Platforms the skill supports: `"macos"`, `"windows"`, `"linux"`. Empty or absent means all platforms. |
| `bridgeRequirement`         | `BridgeRequirement`           | No       | Bridge dependency: `"never"` (default), `"optional"`, or `"required"` |

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

## License

MIT

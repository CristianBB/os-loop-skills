import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const VALID_PLATFORMS = ['macos', 'windows', 'linux'] as const;
const VALID_BRIDGE_REQUIREMENTS = ['never', 'optional', 'required'] as const;
const VALID_WORKSPACE_SUPPORT = ['none', 'optional', 'required'] as const;
const VALID_LONG_RUNNING_SUPPORT = ['none', 'optional', 'required'] as const;
const VALID_EXECUTION_MODES = ['declarative', 'flow', 'agentic'] as const;
const VALID_LLM_USAGE_KINDS = [
  'classification', 'generation', 'extraction', 'summarization',
  'analysis', 'structured-output', 'custom',
] as const;
const VALID_COMPATIBILITY_REQUIREMENTS = [
  // Bridge capabilities — must stay in sync with porto CAPABILITIES constant
  // and seoul BridgeCapabilityName type (protocol.ts)
  'system_tools', 'system_info', 'filesystem', 'mcp_proxy',
  'awake', 'tool_install_recipes', 'command_permissions',
  // Browser capabilities
  'web-crypto', 'indexeddb', 'web-workers', 'local-storage', 'fetch',
] as const;
const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[a-zA-Z0-9]{36}/,
  /xox[bpsa]-[a-zA-Z0-9-]+/,
];
const PLACEHOLDER_PATTERN = /__OSL_SECRET\[.+?\]__/;

interface IndexEntry {
  name: string;
  description: string;
  version: string;
  author: string;
  folderPath: string;
  tags: string[];
  supportedPlatforms?: string[];
  bridgeRequirement?: string;
  workspaceSupport?: string;
  workspaceSchemaVersion?: string;
  compatibilityRequirements?: string[];
  longRunningSupport?: string;
  userInputSupport?: boolean;
  artifactVersioningSupport?: boolean;
  executionMode?: string;
}

interface ValidationError {
  file: string;
  message: string;
}

const errors: ValidationError[] = [];
const warnings: ValidationError[] = [];

function error(file: string, message: string): void {
  errors.push({ file, message });
}

function warn(file: string, message: string): void {
  warnings.push({ file, message });
}

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    error(path, `Failed to read or parse JSON`);
    return null;
  }
}

function validateIndexEntry(entry: IndexEntry, index: number): void {
  const ctx = `index.json[${index}]`;
  if (!entry.name) error(ctx, 'Missing "name"');
  if (!entry.description) error(ctx, 'Missing "description"');
  if (!entry.version) error(ctx, 'Missing "version"');
  if (!entry.author) error(ctx, 'Missing "author"');
  if (!entry.folderPath) error(ctx, 'Missing "folderPath"');
  if (!Array.isArray(entry.tags)) error(ctx, 'Missing or invalid "tags" (must be array)');

  if (entry.supportedPlatforms !== undefined) {
    if (!Array.isArray(entry.supportedPlatforms)) {
      error(ctx, '"supportedPlatforms" must be an array');
    } else {
      for (const p of entry.supportedPlatforms) {
        if (!(VALID_PLATFORMS as readonly string[]).includes(p)) {
          error(ctx, `Invalid platform "${p}" in supportedPlatforms. Must be one of: ${VALID_PLATFORMS.join(', ')}`);
        }
      }
    }
  }

  if (entry.bridgeRequirement !== undefined) {
    if (!(VALID_BRIDGE_REQUIREMENTS as readonly string[]).includes(entry.bridgeRequirement)) {
      error(ctx, `Invalid bridgeRequirement "${entry.bridgeRequirement}". Must be one of: ${VALID_BRIDGE_REQUIREMENTS.join(', ')}`);
    }
  }

  if (entry.workspaceSupport !== undefined) {
    if (typeof entry.workspaceSupport !== 'string' || !(VALID_WORKSPACE_SUPPORT as readonly string[]).includes(entry.workspaceSupport)) {
      error(ctx, `Invalid workspaceSupport "${entry.workspaceSupport}". Must be one of: ${VALID_WORKSPACE_SUPPORT.join(', ')}`);
    }

    // Index entries with optional/required workspace must also carry workspaceSchemaVersion
    if (entry.workspaceSupport === 'optional' || entry.workspaceSupport === 'required') {
      if (entry.workspaceSchemaVersion === undefined || entry.workspaceSchemaVersion === null) {
        error(ctx, `workspaceSupport is "${entry.workspaceSupport}" but workspaceSchemaVersion is missing from index entry. Add it so the runtime can check schema compatibility.`);
      } else if (typeof entry.workspaceSchemaVersion !== 'string') {
        error(ctx, `workspaceSchemaVersion must be a string, got "${typeof entry.workspaceSchemaVersion}"`);
      }
    }
  }

  if (entry.longRunningSupport !== undefined) {
    if (typeof entry.longRunningSupport !== 'string' || !(VALID_LONG_RUNNING_SUPPORT as readonly string[]).includes(entry.longRunningSupport)) {
      error(ctx, `Invalid longRunningSupport "${entry.longRunningSupport}". Must be one of: ${VALID_LONG_RUNNING_SUPPORT.join(', ')}`);
    }
  }

  if (entry.userInputSupport !== undefined) {
    if (typeof entry.userInputSupport !== 'boolean') {
      error(ctx, `Invalid userInputSupport "${entry.userInputSupport}". Must be a boolean`);
    }
  }

  if (entry.artifactVersioningSupport !== undefined) {
    if (typeof entry.artifactVersioningSupport !== 'boolean') {
      error(ctx, `Invalid artifactVersioningSupport "${entry.artifactVersioningSupport}". Must be a boolean`);
    }
  }

  if (entry.executionMode !== undefined) {
    if (!(VALID_EXECUTION_MODES as readonly string[]).includes(entry.executionMode)) {
      error(ctx, `Invalid executionMode "${entry.executionMode}". Must be one of: ${VALID_EXECUTION_MODES.join(', ')}`);
    }
  }
}

function validateManifest(manifestPath: string, entry: IndexEntry): void {
  const manifest = readJson<Record<string, unknown>>(manifestPath);
  if (!manifest) return;

  if (manifest.schemaVersion !== '2.0') {
    error(manifestPath, `schemaVersion must be "2.0", got "${manifest.schemaVersion}"`);
  }

  // Enforce explicit field declarations
  const requiredExplicitFields: Array<{ key: string; label: string }> = [
    { key: 'executionMode', label: 'executionMode' },
    { key: 'workspaceSupport', label: 'workspaceSupport' },
    { key: 'longRunningSupport', label: 'longRunningSupport' },
    { key: 'userInputSupport', label: 'userInputSupport' },
    { key: 'artifactVersioningSupport', label: 'artifactVersioningSupport' },
    { key: 'supportedPlatforms', label: 'supportedPlatforms' },
    { key: 'bridgeRequirement', label: 'bridgeRequirement' },
    { key: 'agenticConfig', label: 'agenticConfig' },
  ];

  for (const { key, label } of requiredExplicitFields) {
    if (manifest[key] === undefined) {
      error(manifestPath, `"${label}" must be explicitly declared in manifest`);
    }
  }

  // workspaceSchemaVersion must be present (can be null)
  if (!('workspaceSchemaVersion' in manifest)) {
    error(manifestPath, '"workspaceSchemaVersion" must be explicitly declared in manifest (use null when workspaceSupport is "none")');
  }

  if (manifest.supportedPlatforms !== undefined) {
    if (!Array.isArray(manifest.supportedPlatforms)) {
      error(manifestPath, '"supportedPlatforms" must be an array');
    } else {
      for (const p of manifest.supportedPlatforms as string[]) {
        if (!(VALID_PLATFORMS as readonly string[]).includes(p)) {
          error(manifestPath, `Invalid platform "${p}" in manifest supportedPlatforms`);
        }
      }
    }
  }

  if (manifest.bridgeRequirement !== undefined) {
    if (!(VALID_BRIDGE_REQUIREMENTS as readonly string[]).includes(manifest.bridgeRequirement as string)) {
      error(manifestPath, `Invalid bridgeRequirement "${manifest.bridgeRequirement}" in manifest`);
    }
  }

  // Validate compatibilityRequirements entries against known values
  if (Array.isArray(manifest.compatibilityRequirements)) {
    for (const req of manifest.compatibilityRequirements as string[]) {
      if (!(VALID_COMPATIBILITY_REQUIREMENTS as readonly string[]).includes(req)) {
        warn(manifestPath, `Unknown compatibilityRequirement "${req}". Known values: ${VALID_COMPATIBILITY_REQUIREMENTS.join(', ')}`);
      }
    }
  }

  // Cross-check: if bridge required, compatibilityRequirements should include system_tools
  if (manifest.bridgeRequirement === 'required') {
    const compat = manifest.compatibilityRequirements;
    if (!Array.isArray(compat) || !compat.includes('system_tools')) {
      warn(manifestPath, 'bridgeRequirement is "required" but compatibilityRequirements does not include "system_tools"');
    }
  }

  // Cross-check: if bridge required with system_tools, supportedPlatforms should be specified
  if (manifest.bridgeRequirement === 'required') {
    const platforms = manifest.supportedPlatforms;
    if (!Array.isArray(platforms) || platforms.length === 0) {
      warn(manifestPath, 'bridgeRequirement is "required" but supportedPlatforms is empty — bridge-required skills should specify which platforms they support');
    }
  }

  // Validate workspaceSupport
  if (manifest.workspaceSupport !== undefined) {
    if (!(VALID_WORKSPACE_SUPPORT as readonly string[]).includes(manifest.workspaceSupport as string)) {
      error(manifestPath, `Invalid workspaceSupport "${manifest.workspaceSupport}" in manifest. Must be one of: ${VALID_WORKSPACE_SUPPORT.join(', ')}`);
    }
  }

  // Validate workspaceSchemaVersion
  if (manifest.workspaceSchemaVersion !== undefined && manifest.workspaceSchemaVersion !== null) {
    if (typeof manifest.workspaceSchemaVersion !== 'string') {
      error(manifestPath, `workspaceSchemaVersion must be a string or null, got "${typeof manifest.workspaceSchemaVersion}"`);
    }
  }

  // Cross-check: if workspaceSupport is optional/required, workspaceSchemaVersion should be set
  if (manifest.workspaceSupport === 'optional' || manifest.workspaceSupport === 'required') {
    if (manifest.workspaceSchemaVersion === undefined || manifest.workspaceSchemaVersion === null) {
      warn(manifestPath, `workspaceSupport is "${manifest.workspaceSupport}" but workspaceSchemaVersion is not set. Declare a schema version for workspace state.`);
    }
  }

  // Validate longRunningSupport
  if (manifest.longRunningSupport !== undefined) {
    if (!(VALID_LONG_RUNNING_SUPPORT as readonly string[]).includes(manifest.longRunningSupport as string)) {
      error(manifestPath, `Invalid longRunningSupport "${manifest.longRunningSupport}" in manifest. Must be one of: ${VALID_LONG_RUNNING_SUPPORT.join(', ')}`);
    }
  }

  // Validate userInputSupport
  if (manifest.userInputSupport !== undefined) {
    if (typeof manifest.userInputSupport !== 'boolean') {
      error(manifestPath, `Invalid userInputSupport "${manifest.userInputSupport}" in manifest. Must be a boolean`);
    }
  }

  // Validate artifactVersioningSupport
  if (manifest.artifactVersioningSupport !== undefined) {
    if (typeof manifest.artifactVersioningSupport !== 'boolean') {
      error(manifestPath, `Invalid artifactVersioningSupport "${manifest.artifactVersioningSupport}" in manifest. Must be a boolean`);
    }
  }

  // Validate executionMode
  if (manifest.executionMode !== undefined) {
    if (!(VALID_EXECUTION_MODES as readonly string[]).includes(manifest.executionMode as string)) {
      error(manifestPath, `Invalid executionMode "${manifest.executionMode}" in manifest. Must be one of: ${VALID_EXECUTION_MODES.join(', ')}`);
    }
  }

  // Validate agenticConfig
  const agenticConfig = manifest.agenticConfig as Record<string, unknown> | undefined;
  if (agenticConfig !== undefined && agenticConfig !== null) {
    if (typeof agenticConfig !== 'object') {
      error(manifestPath, 'agenticConfig must be an object');
    } else {
      if (typeof agenticConfig.enabled !== 'boolean') {
        error(manifestPath, 'agenticConfig.enabled must be a boolean');
      }
      if (typeof agenticConfig.requiresWorkspace !== 'boolean') {
        error(manifestPath, 'agenticConfig.requiresWorkspace must be a boolean');
      }
      if (typeof agenticConfig.supportsBackgroundExecution !== 'boolean') {
        error(manifestPath, 'agenticConfig.supportsBackgroundExecution must be a boolean');
      }
      if (typeof agenticConfig.supportsRoleBasedExecution !== 'boolean') {
        error(manifestPath, 'agenticConfig.supportsRoleBasedExecution must be a boolean');
      }
      if (agenticConfig.maxStepsPerRun !== null && typeof agenticConfig.maxStepsPerRun !== 'number') {
        error(manifestPath, 'agenticConfig.maxStepsPerRun must be a number or null');
      }
      if (agenticConfig.defaultStepBudget !== null && typeof agenticConfig.defaultStepBudget !== 'number') {
        error(manifestPath, 'agenticConfig.defaultStepBudget must be a number or null');
      }
    }
  }

  // Cross-check: executionMode vs agenticConfig consistency
  const effectiveMode = (manifest.executionMode as string) ?? 'declarative';
  if (effectiveMode === 'declarative' && agenticConfig?.enabled === true) {
    error(manifestPath, 'declarative skills must not have agenticConfig.enabled = true');
  }
  if (effectiveMode === 'flow' && agenticConfig?.enabled === true) {
    error(manifestPath, 'flow skills must not have agenticConfig.enabled = true');
  }
  if (effectiveMode === 'agentic') {
    if (!agenticConfig) {
      error(manifestPath, 'agentic skills must declare agenticConfig');
    } else if (agenticConfig.enabled !== true) {
      error(manifestPath, 'agentic skills must have agenticConfig.enabled = true');
    }
    if (agenticConfig?.requiresWorkspace === true && manifest.workspaceSupport !== 'required') {
      error(manifestPath, 'agenticConfig.requiresWorkspace is true but workspaceSupport is not "required"');
    }
    if (!manifest.workspaceSupport || manifest.workspaceSupport === 'none') {
      warn(manifestPath, 'agentic skills typically require workspaceSupport to be "optional" or "required"');
    }
    if (!manifest.longRunningSupport || manifest.longRunningSupport === 'none') {
      warn(manifestPath, 'agentic skills typically require longRunningSupport to be "optional" or "required"');
    }
    if (agenticConfig?.enabled === true) {
      if (agenticConfig.maxStepsPerRun === null) {
        warn(manifestPath, 'agentic skill has maxStepsPerRun: null. The runtime will apply a ceiling of 1000 steps. Set an explicit limit appropriate for your skill.');
      }
      if (agenticConfig.defaultStepBudget === null) {
        warn(manifestPath, 'agentic skill has defaultStepBudget: null. No automatic checkpoints will be created at a soft boundary. Consider setting a soft budget.');
      }
    }
  }

  // Cross-check: declarative skills cannot use flow/agentic-only capabilities
  if (effectiveMode === 'declarative') {
    if (manifest.userInputSupport === true) {
      warn(manifestPath, 'declarative skills cannot call host.run.requestInput() — userInputSupport should be false');
    }
    if (manifest.longRunningSupport !== undefined && manifest.longRunningSupport !== 'none') {
      warn(manifestPath, `declarative skills have no WorkspaceRun lifecycle — longRunningSupport should be "none", got "${manifest.longRunningSupport}"`);
    }
  }

  // Validate llmUsage entries
  if (Array.isArray(manifest.llmUsage)) {
    for (const usage of manifest.llmUsage as Array<Record<string, unknown>>) {
      if (usage.kind !== undefined) {
        if (!(VALID_LLM_USAGE_KINDS as readonly string[]).includes(usage.kind as string)) {
          error(manifestPath, `Invalid llmUsage.kind "${usage.kind}". Must be one of: ${VALID_LLM_USAGE_KINDS.join(', ')}`);
        }
      }
    }
  }

  // Cross-check: if longRunningSupport is "required", workspaceSupport should be "optional" or "required"
  if (manifest.longRunningSupport === 'required') {
    const ws = manifest.workspaceSupport;
    if (ws !== 'optional' && ws !== 'required') {
      warn(manifestPath, 'longRunningSupport is "required" but workspaceSupport is not "optional" or "required"');
    }
  }

  // Cross-check: manifest name should match index entry name
  if (manifest.name && manifest.name !== entry.name) {
    warn(manifestPath, `Manifest name "${manifest.name}" does not match index entry name "${entry.name}"`);
  }

  // Cross-check: if docs or module reference secret placeholders, requiredBindings should not be empty
  const skillDir = dirname(manifestPath);
  let hasPlaceholderRefs = false;
  for (const fileName of ['docs.md', 'module.ts']) {
    const filePath = join(skillDir, fileName);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      if (PLACEHOLDER_PATTERN.test(content)) {
        hasPlaceholderRefs = true;
        break;
      }
    }
  }
  if (hasPlaceholderRefs) {
    const bindings = manifest.requiredBindings;
    if (!Array.isArray(bindings) || bindings.length === 0) {
      warn(manifestPath, 'Skill references __OSL_SECRET[...]__ placeholders but manifest.requiredBindings is empty. Declare required secret bindings.');
    }
  }
}

function validateModule(skillDir: string): void {
  const modulePath = join(skillDir, 'module.ts');
  if (!existsSync(modulePath)) {
    error(modulePath, 'module.ts is missing');
    return;
  }

  const content = readFileSync(modulePath, 'utf-8');
  const hasExecuteExport =
    /export\s+(async\s+)?function\s+execute\b/.test(content) ||
    /exports\.execute\s*=/.test(content);
  if (!hasExecuteExport) {
    warn(modulePath, 'module.ts does not appear to export an execute function. Skills must export: export async function execute(args, host)');
  }
}

function scanFileForRawSecrets(filePath: string): void {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, 'utf-8');

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      error(filePath, `Possible raw secret detected matching pattern ${pattern.source}`);
    }
  }

  // Check that any secret references use the correct placeholder syntax
  const secretRefPattern = /secret|api.?key|token|password/i;
  if (secretRefPattern.test(content)) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (secretRefPattern.test(line) && line.includes('=') && !PLACEHOLDER_PATTERN.test(line)) {
        // Only warn if it looks like an assignment with a value
        if (/[=:]\s*["'][^"']+["']/.test(line)) {
          warn(`${filePath}:${i + 1}`, 'Line appears to contain a hardcoded secret value. Use __OSL_SECRET[<secretId>]__ syntax instead.');
        }
      }
    }
  }
}

function validateDocs(skillDir: string): void {
  scanFileForRawSecrets(join(skillDir, 'docs.md'));
  scanFileForRawSecrets(join(skillDir, 'module.ts'));
}

// --- Main validation ---

const includeExamples = process.argv.includes('--examples');

console.log('Validating os-loop-skills repository...\n');

const indexPath = join(ROOT, 'skills', 'index.json');
const entries = readJson<IndexEntry[]>(indexPath);

if (!entries) {
  console.error('FATAL: Could not read skills/index.json');
  process.exit(1);
}

console.log(`Found ${entries.length} skill(s) in index.json\n`);

for (let i = 0; i < entries.length; i++) {
  const entry = entries[i];
  console.log(`  Validating: ${entry.name}`);

  validateIndexEntry(entry, i);

  const skillDir = join(ROOT, entry.folderPath);
  if (!existsSync(skillDir)) {
    error(entry.folderPath, 'Skill directory does not exist');
    continue;
  }

  const manifestPath = join(skillDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    error(manifestPath, 'manifest.json is missing');
    continue;
  }

  validateManifest(manifestPath, entry);

  // Cross-check: index.json workspaceSchemaVersion must match manifest
  const manifestData = readJson<Record<string, unknown>>(manifestPath);
  if (manifestData) {
    const indexWsv = entry.workspaceSchemaVersion;
    const manifestWsv = manifestData.workspaceSchemaVersion;
    if (indexWsv !== undefined && manifestWsv !== undefined && indexWsv !== manifestWsv) {
      error(`index.json[${i}]`, `workspaceSchemaVersion mismatch: index has "${indexWsv}" but manifest has "${manifestWsv}"`);
    }

    const indexExecMode = entry.executionMode;
    const manifestExecMode = manifestData.executionMode;
    if (indexExecMode !== undefined && manifestExecMode !== undefined && indexExecMode !== manifestExecMode) {
      error(`index.json[${i}]`, `executionMode mismatch: index has "${indexExecMode}" but manifest has "${manifestExecMode}"`);
    }
  }

  validateModule(skillDir);
  validateDocs(skillDir);
}

// --- Example validation (--examples flag) ---

if (includeExamples) {
  const examplesDir = join(ROOT, 'examples');
  if (existsSync(examplesDir)) {
    const { readdirSync, statSync } = await import('node:fs');
    const exampleDirs = readdirSync(examplesDir).filter(
      d => statSync(join(examplesDir, d)).isDirectory(),
    );

    console.log(`\nValidating ${exampleDirs.length} example(s)...\n`);

    for (const dir of exampleDirs) {
      const skillDir = join(examplesDir, dir);
      const manifestPath = join(skillDir, 'manifest.json');

      if (!existsSync(manifestPath)) {
        error(`examples/${dir}`, 'manifest.json is missing');
        continue;
      }

      const manifestData = readJson<Record<string, unknown>>(manifestPath);
      if (!manifestData) continue;

      console.log(`  Validating example: ${dir}`);

      // Build a synthetic index entry from the manifest
      const syntheticEntry: IndexEntry = {
        name: (manifestData.name as string) ?? dir,
        description: (manifestData.description as string) ?? '',
        version: (manifestData.version as string) ?? '0.0.0',
        author: (manifestData.author as string) ?? 'example',
        folderPath: `examples/${dir}`,
        tags: [],
        executionMode: manifestData.executionMode as string | undefined,
      };

      validateManifest(manifestPath, syntheticEntry);
      validateModule(skillDir);
      validateDocs(skillDir);
    }
  }
}

// --- Report ---

console.log('');

if (warnings.length > 0) {
  console.log(`⚠ ${warnings.length} warning(s):`);
  for (const w of warnings) {
    console.log(`  WARN  ${w.file}: ${w.message}`);
  }
  console.log('');
}

if (errors.length > 0) {
  console.log(`✗ ${errors.length} error(s):`);
  for (const e of errors) {
    console.log(`  ERROR ${e.file}: ${e.message}`);
  }
  console.log('\nValidation FAILED.');
  process.exit(1);
} else {
  console.log('✓ All validations passed.');
  process.exit(0);
}

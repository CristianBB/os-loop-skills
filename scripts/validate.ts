import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const VALID_PLATFORMS = ['macos', 'windows', 'linux'] as const;
const VALID_BRIDGE_REQUIREMENTS = ['never', 'optional', 'required'] as const;
const VALID_WORKSPACE_SUPPORT = ['none', 'optional', 'required'] as const;
const VALID_COMPATIBILITY_REQUIREMENTS = [
  // Bridge capabilities
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
  compatibilityRequirements?: string[];
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

  if ((entry as Record<string, unknown>).workspaceSupport !== undefined) {
    const ws = (entry as Record<string, unknown>).workspaceSupport;
    if (typeof ws !== 'string' || !(VALID_WORKSPACE_SUPPORT as readonly string[]).includes(ws)) {
      error(ctx, `Invalid workspaceSupport "${ws}". Must be one of: ${VALID_WORKSPACE_SUPPORT.join(', ')}`);
    }

    // Index entries with optional/required workspace must also carry workspaceSchemaVersion
    if (ws === 'optional' || ws === 'required') {
      const wsv = (entry as Record<string, unknown>).workspaceSchemaVersion;
      if (wsv === undefined || wsv === null) {
        error(ctx, `workspaceSupport is "${ws}" but workspaceSchemaVersion is missing from index entry. Add it so the runtime can check schema compatibility.`);
      } else if (typeof wsv !== 'string') {
        error(ctx, `workspaceSchemaVersion must be a string, got "${typeof wsv}"`);
      }
    }
  }
}

function validateManifest(manifestPath: string, entry: IndexEntry): void {
  const manifest = readJson<Record<string, unknown>>(manifestPath);
  if (!manifest) return;

  if (manifest.schemaVersion !== '2.0') {
    error(manifestPath, `schemaVersion must be "2.0", got "${manifest.schemaVersion}"`);
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
    const indexWsv = (entry as Record<string, unknown>).workspaceSchemaVersion;
    const manifestWsv = manifestData.workspaceSchemaVersion;
    if (indexWsv !== undefined && manifestWsv !== undefined && indexWsv !== manifestWsv) {
      error(`index.json[${i}]`, `workspaceSchemaVersion mismatch: index has "${indexWsv}" but manifest has "${manifestWsv}"`);
    }
  }

  validateModule(skillDir);
  validateDocs(skillDir);
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

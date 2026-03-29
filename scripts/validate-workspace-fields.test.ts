/**
 * Standalone test script for workspace-related manifest validation.
 * Run with: npx tsx scripts/validate-workspace-fields.test.ts
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strict as assert } from 'node:assert';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Inline validation helpers (same logic as validate.ts) ---

const VALID_WORKSPACE_SUPPORT = ['none', 'optional', 'required'] as const;
const VALID_LONG_RUNNING_SUPPORT = ['none', 'optional', 'required'] as const;

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

function validateWorkspaceFields(manifest: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (manifest.workspaceSupport !== undefined) {
    if (!(VALID_WORKSPACE_SUPPORT as readonly string[]).includes(manifest.workspaceSupport as string)) {
      errors.push(`Invalid workspaceSupport "${manifest.workspaceSupport}". Must be one of: ${VALID_WORKSPACE_SUPPORT.join(', ')}`);
    }
  }

  if (manifest.workspaceSchemaVersion !== undefined && manifest.workspaceSchemaVersion !== null) {
    if (typeof manifest.workspaceSchemaVersion !== 'string') {
      errors.push(`workspaceSchemaVersion must be a string or null, got "${typeof manifest.workspaceSchemaVersion}"`);
    }
  }

  if (manifest.workspaceSupport === 'optional' || manifest.workspaceSupport === 'required') {
    if (manifest.workspaceSchemaVersion === undefined || manifest.workspaceSchemaVersion === null) {
      warnings.push(`workspaceSupport is "${manifest.workspaceSupport}" but workspaceSchemaVersion is not set.`);
    }
  }

  return { errors, warnings };
}

function validateLongRunningFields(manifest: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (manifest.longRunningSupport !== undefined) {
    if (!(VALID_LONG_RUNNING_SUPPORT as readonly string[]).includes(manifest.longRunningSupport as string)) {
      errors.push(`Invalid longRunningSupport "${manifest.longRunningSupport}". Must be one of: ${VALID_LONG_RUNNING_SUPPORT.join(', ')}`);
    }
  }

  if (manifest.userInputSupport !== undefined) {
    if (typeof manifest.userInputSupport !== 'boolean') {
      errors.push(`Invalid userInputSupport "${manifest.userInputSupport}". Must be a boolean`);
    }
  }

  if (manifest.artifactVersioningSupport !== undefined) {
    if (typeof manifest.artifactVersioningSupport !== 'boolean') {
      errors.push(`Invalid artifactVersioningSupport "${manifest.artifactVersioningSupport}". Must be a boolean`);
    }
  }

  if (manifest.longRunningSupport === 'required') {
    const ws = manifest.workspaceSupport;
    if (ws !== 'optional' && ws !== 'required') {
      warnings.push('longRunningSupport is "required" but workspaceSupport is not "optional" or "required"');
    }
  }

  return { errors, warnings };
}

// --- Tests ---

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${(err as Error).message}`);
  }
}

console.log('Testing workspace field validation...\n');

test('accepts workspaceSupport: "none"', () => {
  const result = validateWorkspaceFields({ workspaceSupport: 'none' });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('accepts workspaceSupport: "optional"', () => {
  const result = validateWorkspaceFields({ workspaceSupport: 'optional', workspaceSchemaVersion: '1.0.0' });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('accepts workspaceSupport: "required"', () => {
  const result = validateWorkspaceFields({ workspaceSupport: 'required', workspaceSchemaVersion: '1.0.0' });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('rejects invalid workspaceSupport value', () => {
  const result = validateWorkspaceFields({ workspaceSupport: 'always' });
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('Invalid workspaceSupport'));
});

test('rejects non-string workspaceSupport', () => {
  const result = validateWorkspaceFields({ workspaceSupport: 42 });
  assert.equal(result.errors.length, 1);
});

test('accepts absent workspaceSupport', () => {
  const result = validateWorkspaceFields({});
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('accepts workspaceSchemaVersion as string', () => {
  const result = validateWorkspaceFields({ workspaceSupport: 'optional', workspaceSchemaVersion: '2.0.0' });
  assert.equal(result.errors.length, 0);
});

test('accepts workspaceSchemaVersion as null', () => {
  const result = validateWorkspaceFields({ workspaceSupport: 'none', workspaceSchemaVersion: null });
  assert.equal(result.errors.length, 0);
});

test('rejects workspaceSchemaVersion as number', () => {
  const result = validateWorkspaceFields({ workspaceSchemaVersion: 1 });
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('workspaceSchemaVersion must be a string'));
});

test('warns when workspaceSupport is "required" but workspaceSchemaVersion is missing', () => {
  const result = validateWorkspaceFields({ workspaceSupport: 'required' });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 1);
  assert.ok(result.warnings[0].includes('workspaceSchemaVersion is not set'));
});

test('warns when workspaceSupport is "optional" but workspaceSchemaVersion is null', () => {
  const result = validateWorkspaceFields({ workspaceSupport: 'optional', workspaceSchemaVersion: null });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 1);
});

test('no warning when workspaceSupport is "none" without workspaceSchemaVersion', () => {
  const result = validateWorkspaceFields({ workspaceSupport: 'none' });
  assert.equal(result.warnings.length, 0);
});

// --- longRunningSupport / userInputSupport / artifactVersioningSupport tests ---

test('accepts longRunningSupport: "none"', () => {
  const result = validateLongRunningFields({ longRunningSupport: 'none' });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('accepts longRunningSupport: "optional"', () => {
  const result = validateLongRunningFields({ longRunningSupport: 'optional' });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('accepts longRunningSupport: "required"', () => {
  const result = validateLongRunningFields({ longRunningSupport: 'required', workspaceSupport: 'required' });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('rejects invalid longRunningSupport value', () => {
  const result = validateLongRunningFields({ longRunningSupport: 'always' });
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('Invalid longRunningSupport'));
});

test('accepts userInputSupport: true', () => {
  const result = validateLongRunningFields({ userInputSupport: true });
  assert.equal(result.errors.length, 0);
});

test('accepts userInputSupport: false', () => {
  const result = validateLongRunningFields({ userInputSupport: false });
  assert.equal(result.errors.length, 0);
});

test('rejects invalid userInputSupport value', () => {
  const result = validateLongRunningFields({ userInputSupport: 'yes' });
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('Invalid userInputSupport'));
});

test('accepts artifactVersioningSupport: true', () => {
  const result = validateLongRunningFields({ artifactVersioningSupport: true });
  assert.equal(result.errors.length, 0);
});

test('accepts artifactVersioningSupport: false', () => {
  const result = validateLongRunningFields({ artifactVersioningSupport: false });
  assert.equal(result.errors.length, 0);
});

test('rejects invalid artifactVersioningSupport value', () => {
  const result = validateLongRunningFields({ artifactVersioningSupport: 1 });
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('Invalid artifactVersioningSupport'));
});

test('warns when longRunningSupport is "required" but workspaceSupport is "none"', () => {
  const result = validateLongRunningFields({ longRunningSupport: 'required', workspaceSupport: 'none' });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 1);
  assert.ok(result.warnings[0].includes('longRunningSupport is "required"'));
});

// --- Index entry validation ---

function validateIndexWorkspaceFields(entry: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (entry.workspaceSupport !== undefined) {
    if (!(VALID_WORKSPACE_SUPPORT as readonly string[]).includes(entry.workspaceSupport as string)) {
      errors.push(`Invalid workspaceSupport "${entry.workspaceSupport}"`);
    }

    if (entry.workspaceSupport === 'optional' || entry.workspaceSupport === 'required') {
      if (entry.workspaceSchemaVersion === undefined || entry.workspaceSchemaVersion === null) {
        errors.push(`workspaceSupport is "${entry.workspaceSupport}" but workspaceSchemaVersion is missing from index entry`);
      } else if (typeof entry.workspaceSchemaVersion !== 'string') {
        errors.push(`workspaceSchemaVersion must be a string, got "${typeof entry.workspaceSchemaVersion}"`);
      }
    }
  }

  return { errors, warnings };
}

function validateIndexManifestAlignment(
  indexEntry: Record<string, unknown>,
  manifest: Record<string, unknown>,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (indexEntry.workspaceSchemaVersion !== undefined && manifest.workspaceSchemaVersion !== undefined) {
    if (indexEntry.workspaceSchemaVersion !== manifest.workspaceSchemaVersion) {
      errors.push(`workspaceSchemaVersion mismatch: index has "${indexEntry.workspaceSchemaVersion}" but manifest has "${manifest.workspaceSchemaVersion}"`);
    }
  }

  return { errors, warnings };
}

test('index entry errors when optional workspace missing workspaceSchemaVersion', () => {
  const result = validateIndexWorkspaceFields({ workspaceSupport: 'optional' });
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('workspaceSchemaVersion is missing'));
});

test('index entry errors when required workspace missing workspaceSchemaVersion', () => {
  const result = validateIndexWorkspaceFields({ workspaceSupport: 'required' });
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('workspaceSchemaVersion is missing'));
});

test('index entry accepts optional workspace with workspaceSchemaVersion', () => {
  const result = validateIndexWorkspaceFields({ workspaceSupport: 'optional', workspaceSchemaVersion: '1.0.0' });
  assert.equal(result.errors.length, 0);
});

test('index-manifest alignment passes when versions match', () => {
  const result = validateIndexManifestAlignment(
    { workspaceSchemaVersion: '1.0.0' },
    { workspaceSchemaVersion: '1.0.0' },
  );
  assert.equal(result.errors.length, 0);
});

test('index-manifest alignment errors when versions mismatch', () => {
  const result = validateIndexManifestAlignment(
    { workspaceSchemaVersion: '1.0.0' },
    { workspaceSchemaVersion: '2.0.0' },
  );
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('mismatch'));
});

// --- executionMode and agenticConfig tests ---

const VALID_EXECUTION_MODES = ['declarative', 'flow', 'agentic'] as const;

function validateExecutionModeFields(manifest: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (manifest.executionMode !== undefined) {
    if (!(VALID_EXECUTION_MODES as readonly string[]).includes(manifest.executionMode as any)) {
      errors.push(`Invalid executionMode "${manifest.executionMode}". Must be one of: ${VALID_EXECUTION_MODES.join(', ')}`);
    }
  }

  const config = manifest.agenticConfig as Record<string, unknown> | undefined;
  const effectiveMode = (manifest.executionMode as string) ?? 'declarative';

  if (effectiveMode === 'declarative' && config?.enabled === true) {
    errors.push('declarative skills must not have agenticConfig.enabled = true');
  }
  if (effectiveMode === 'flow' && config?.enabled === true) {
    errors.push('flow skills must not have agenticConfig.enabled = true');
  }
  if (effectiveMode === 'agentic') {
    if (!config) {
      errors.push('agentic skills must declare agenticConfig');
    } else if (config.enabled !== true) {
      errors.push('agentic skills must have agenticConfig.enabled = true');
    }
    if (config?.requiresWorkspace === true && manifest.workspaceSupport !== 'required') {
      errors.push('agenticConfig.requiresWorkspace is true but workspaceSupport is not "required"');
    }
  }

  return { errors, warnings };
}

function validateIndexExecutionModeAlignment(
  indexEntry: Record<string, unknown>,
  manifest: Record<string, unknown>,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (indexEntry.executionMode !== undefined && manifest.executionMode !== undefined) {
    if (indexEntry.executionMode !== manifest.executionMode) {
      errors.push(`executionMode mismatch: index has "${indexEntry.executionMode}" but manifest has "${manifest.executionMode}"`);
    }
  }

  return { errors, warnings };
}

test('accepts executionMode: "declarative"', () => {
  const result = validateExecutionModeFields({ executionMode: 'declarative' });
  assert.equal(result.errors.length, 0);
});

test('accepts executionMode: "flow"', () => {
  const result = validateExecutionModeFields({ executionMode: 'flow' });
  assert.equal(result.errors.length, 0);
});

test('accepts executionMode: "agentic" with valid agenticConfig', () => {
  const result = validateExecutionModeFields({
    executionMode: 'agentic',
    agenticConfig: {
      enabled: true,
      requiresWorkspace: false,
      supportsBackgroundExecution: false,
      supportsRoleBasedExecution: false,
      maxStepsPerRun: null,
      defaultStepBudget: null,
    },
  });
  assert.equal(result.errors.length, 0);
});

test('rejects invalid executionMode value', () => {
  const result = validateExecutionModeFields({ executionMode: 'reactive' });
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('Invalid executionMode'));
});

test('rejects agentic without agenticConfig', () => {
  const result = validateExecutionModeFields({ executionMode: 'agentic' });
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('agentic'));
});

test('rejects declarative with agenticConfig.enabled true', () => {
  const result = validateExecutionModeFields({
    executionMode: 'declarative',
    agenticConfig: { enabled: true },
  });
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('declarative'));
});

test('rejects agenticConfig.requiresWorkspace true when workspaceSupport is not required', () => {
  const result = validateExecutionModeFields({
    executionMode: 'agentic',
    agenticConfig: {
      enabled: true,
      requiresWorkspace: true,
      supportsBackgroundExecution: false,
      supportsRoleBasedExecution: false,
      maxStepsPerRun: null,
      defaultStepBudget: null,
    },
    workspaceSupport: 'optional',
  });
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('requiresWorkspace'));
});

test('accepts absent executionMode (backward compat)', () => {
  const result = validateExecutionModeFields({});
  assert.equal(result.errors.length, 0);
});

test('index-manifest executionMode alignment passes when matching', () => {
  const result = validateIndexExecutionModeAlignment(
    { executionMode: 'declarative' },
    { executionMode: 'declarative' },
  );
  assert.equal(result.errors.length, 0);
});

test('index-manifest executionMode alignment errors when mismatched', () => {
  const result = validateIndexExecutionModeAlignment(
    { executionMode: 'declarative' },
    { executionMode: 'agentic' },
  );
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('mismatch'));
});

// --- Explicit field presence validation ---

const REQUIRED_EXPLICIT_FIELDS = [
  'executionMode', 'workspaceSupport', 'longRunningSupport',
  'userInputSupport', 'artifactVersioningSupport', 'supportedPlatforms',
  'bridgeRequirement', 'agenticConfig',
] as const;

function validateExplicitFieldPresence(manifest: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const field of REQUIRED_EXPLICIT_FIELDS) {
    if (manifest[field] === undefined) {
      errors.push(`"${field}" must be explicitly declared in manifest`);
    }
  }

  if (!('workspaceSchemaVersion' in manifest)) {
    errors.push('"workspaceSchemaVersion" must be explicitly declared in manifest');
  }

  return { errors, warnings };
}

function validateAgenticConfig(config: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof config.enabled !== 'boolean') errors.push('agenticConfig.enabled must be a boolean');
  if (typeof config.requiresWorkspace !== 'boolean') errors.push('agenticConfig.requiresWorkspace must be a boolean');
  if (typeof config.supportsBackgroundExecution !== 'boolean') errors.push('agenticConfig.supportsBackgroundExecution must be a boolean');
  if (typeof config.supportsRoleBasedExecution !== 'boolean') errors.push('agenticConfig.supportsRoleBasedExecution must be a boolean');
  if (config.maxStepsPerRun !== null && typeof config.maxStepsPerRun !== 'number') errors.push('agenticConfig.maxStepsPerRun must be a number or null');
  if (config.defaultStepBudget !== null && typeof config.defaultStepBudget !== 'number') errors.push('agenticConfig.defaultStepBudget must be a number or null');

  return { errors, warnings };
}

test('errors when workspaceSupport is missing from manifest', () => {
  const result = validateExplicitFieldPresence({ executionMode: 'declarative' });
  assert.ok(result.errors.some(e => e.includes('workspaceSupport')));
});

test('errors when agenticConfig is missing from manifest', () => {
  const result = validateExplicitFieldPresence({ executionMode: 'declarative', workspaceSupport: 'none' });
  assert.ok(result.errors.some(e => e.includes('agenticConfig')));
});

test('errors when workspaceSchemaVersion is missing from manifest', () => {
  const result = validateExplicitFieldPresence({
    executionMode: 'declarative',
    workspaceSupport: 'none',
    agenticConfig: { enabled: false },
  });
  assert.ok(result.errors.some(e => e.includes('workspaceSchemaVersion')));
});

test('no explicit field errors when all fields present', () => {
  const result = validateExplicitFieldPresence({
    executionMode: 'declarative',
    workspaceSupport: 'none',
    workspaceSchemaVersion: null,
    longRunningSupport: 'none',
    userInputSupport: false,
    artifactVersioningSupport: false,
    supportedPlatforms: [],
    bridgeRequirement: 'never',
    agenticConfig: { enabled: false },
  });
  assert.equal(result.errors.length, 0);
});

test('agenticConfig validates all required boolean fields', () => {
  const result = validateAgenticConfig({
    enabled: false,
    requiresWorkspace: false,
    supportsBackgroundExecution: false,
    supportsRoleBasedExecution: false,
    maxStepsPerRun: null,
    defaultStepBudget: null,
  });
  assert.equal(result.errors.length, 0);
});

test('agenticConfig rejects missing boolean fields', () => {
  const result = validateAgenticConfig({});
  assert.ok(result.errors.length >= 4);
});

test('agenticConfig rejects non-boolean enabled', () => {
  const result = validateAgenticConfig({
    enabled: 'yes',
    requiresWorkspace: false,
    supportsBackgroundExecution: false,
    supportsRoleBasedExecution: false,
    maxStepsPerRun: null,
    defaultStepBudget: null,
  });
  assert.ok(result.errors.some(e => e.includes('enabled')));
});

test('agenticConfig rejects non-number maxStepsPerRun', () => {
  const result = validateAgenticConfig({
    enabled: true,
    requiresWorkspace: false,
    supportsBackgroundExecution: false,
    supportsRoleBasedExecution: false,
    maxStepsPerRun: 'unlimited',
    defaultStepBudget: null,
  });
  assert.ok(result.errors.some(e => e.includes('maxStepsPerRun')));
});

test('declarative + agenticConfig.enabled true is rejected', () => {
  const result = validateExecutionModeFields({
    executionMode: 'declarative',
    agenticConfig: { enabled: true },
  });
  assert.ok(result.errors.some(e => e.includes('declarative')));
});

// --- Actual skills explicit field check ---

test('all actual skill manifests have all required explicit fields', () => {
  const indexPath = join(__dirname, '..', 'skills', 'index.json');
  const entries = JSON.parse(readFileSync(indexPath, 'utf-8')) as Array<{ name: string; folderPath: string }>;
  for (const entry of entries) {
    const manifestPath = join(__dirname, '..', entry.folderPath, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Record<string, unknown>;
    const result = validateExplicitFieldPresence(manifest);
    assert.equal(result.errors.length, 0, `Skill "${entry.name}" missing explicit fields: ${result.errors.join(', ')}`);
  }
});

// --- Actual index.json cross-check ---

test('actual index.json entries have valid executionMode', () => {
  const indexPath = join(__dirname, '..', 'skills', 'index.json');
  const entries = JSON.parse(readFileSync(indexPath, 'utf-8')) as Record<string, unknown>[];
  for (const entry of entries) {
    if (entry.executionMode !== undefined) {
      assert.ok(
        (VALID_EXECUTION_MODES as readonly string[]).includes(entry.executionMode as any),
        `Skill "${entry.name}" has invalid executionMode "${entry.executionMode}"`,
      );
    }
  }
});

test('actual index.json entries with workspace support have workspaceSchemaVersion', () => {
  const indexPath = join(__dirname, '..', 'skills', 'index.json');
  const entries = JSON.parse(readFileSync(indexPath, 'utf-8')) as Record<string, unknown>[];
  for (const entry of entries) {
    const ws = entry.workspaceSupport;
    if (ws === 'optional' || ws === 'required') {
      assert.ok(
        typeof entry.workspaceSchemaVersion === 'string',
        `Skill "${entry.name}" has workspaceSupport "${ws}" but missing workspaceSchemaVersion in index.json`,
      );
    }
  }
});

// --- Report ---

console.log('');
if (failed > 0) {
  console.log(`\n✗ ${failed} test(s) failed, ${passed} passed.`);
  process.exit(1);
} else {
  console.log(`✓ All ${passed} tests passed.`);
  process.exit(0);
}

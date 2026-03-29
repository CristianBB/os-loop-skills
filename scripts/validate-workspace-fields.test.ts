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

// --- Actual index.json cross-check ---

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

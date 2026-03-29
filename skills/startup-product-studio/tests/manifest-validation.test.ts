import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = resolve(__dirname, '..');
const SKILLS_DIR = resolve(SKILL_DIR, '..');
const MANIFEST_PATH = resolve(SKILL_DIR, 'manifest.json');
const MODULE_PATH = resolve(SKILL_DIR, 'module.ts');
const INDEX_PATH = resolve(SKILLS_DIR, 'index.json');

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

interface Manifest {
  name: string;
  description: string;
  version: string;
  author: string;
  schemaVersion: string;
  capabilities: string[];
  requiredBindings: unknown[];
  permissions: Array<{ kind: string; scope: string; description: string }>;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
  outputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
  compatibilityRequirements: string[];
  oauth: unknown[];
  llmUsage: Array<{
    purposeId: string;
    kind: string;
    description: string;
    estimatedTokenBudget: number;
    modelPreference: null;
    temperatureHint: number;
  }>;
  wasm: unknown[];
  views: unknown[];
  tools: unknown[];
  lifecycleHooks: unknown[];
  sandbox: {
    isolation: string;
    maxExecutionMs: number;
    maxMemoryMB: number;
    allowedGlobals: string[];
    networkRules: unknown[];
  };
  supportedPlatforms: string[];
  bridgeRequirement: string;
  workspaceSupport: string;
  workspaceSchemaVersion: string | null;
  longRunningSupport: string;
  userInputSupport: boolean;
  artifactVersioningSupport: boolean;
  executionMode: string;
  agenticConfig: {
    enabled: boolean;
    requiresWorkspace: boolean;
    supportsBackgroundExecution: boolean;
    supportsRoleBasedExecution: boolean;
    maxStepsPerRun: number | null;
    defaultStepBudget: number | null;
  };
}

interface IndexEntry {
  name: string;
  description: string;
  version: string;
  author: string;
  folderPath: string;
  tags: string[];
  supportedPlatforms: string[];
  bridgeRequirement: string;
  workspaceSupport: string;
  workspaceSchemaVersion?: string;
  longRunningSupport: string;
  userInputSupport: boolean;
  artifactVersioningSupport: boolean;
  executionMode: string;
}

// ── File existence ──────────────────────────────────────────────────────

console.log('=== Startup Product Studio — Manifest Validation ===\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

assert(existsSync(MANIFEST_PATH), 'manifest.json exists');
assert(existsSync(MODULE_PATH), 'module.ts exists');
assert(existsSync(INDEX_PATH), 'skills/index.json exists');

// ── Manifest field validation ───────────────────────────────────────────

const manifest = loadJson(MANIFEST_PATH) as Manifest;

// Identity
assert(manifest.name === 'startup-product-studio', 'name is startup-product-studio');
assert(typeof manifest.description === 'string' && manifest.description.length > 50, 'description is substantial');
assert(manifest.version === '2.0.0', 'version is 2.0.0');
assert(manifest.author === 'OS Loop', 'author is OS Loop');
assert(manifest.schemaVersion === '2.0', 'schemaVersion is 2.0');

// Capabilities
assert(Array.isArray(manifest.capabilities) && manifest.capabilities.length >= 1, 'capabilities is a non-empty array');
assert(manifest.capabilities.includes('product-development'), 'capabilities includes product-development');

// Permissions
assert(Array.isArray(manifest.permissions) && manifest.permissions.length >= 1, 'permissions is a non-empty array');
assert(manifest.permissions.some((p) => p.kind === 'llm'), 'permissions include llm');

// Execution mode & agentic config
assert(manifest.executionMode === 'agentic', 'executionMode is agentic');
assert(manifest.agenticConfig.enabled === true, 'agenticConfig.enabled is true');
assert(manifest.agenticConfig.requiresWorkspace === true, 'agenticConfig.requiresWorkspace is true');
assert(manifest.agenticConfig.supportsBackgroundExecution === true, 'agenticConfig.supportsBackgroundExecution is true');
assert(manifest.agenticConfig.supportsRoleBasedExecution === true, 'agenticConfig.supportsRoleBasedExecution is true');
assert(typeof manifest.agenticConfig.maxStepsPerRun === 'number' && manifest.agenticConfig.maxStepsPerRun > 0, 'agenticConfig.maxStepsPerRun is a positive number');
assert(typeof manifest.agenticConfig.defaultStepBudget === 'number' && manifest.agenticConfig.defaultStepBudget > 0, 'agenticConfig.defaultStepBudget is a positive number');
assert(
  manifest.agenticConfig.defaultStepBudget! <= manifest.agenticConfig.maxStepsPerRun!,
  'defaultStepBudget <= maxStepsPerRun',
);

// Workspace
assert(manifest.workspaceSupport === 'required', 'workspaceSupport is required');
assert(manifest.workspaceSchemaVersion === '2.0.0', 'workspaceSchemaVersion is 2.0.0');

// Consistency: agenticConfig.requiresWorkspace matches workspaceSupport
assert(
  manifest.agenticConfig.requiresWorkspace === true && manifest.workspaceSupport === 'required',
  'agenticConfig.requiresWorkspace consistent with workspaceSupport=required',
);

// Long-running & user input
assert(manifest.longRunningSupport === 'required', 'longRunningSupport is required');
assert(manifest.userInputSupport === true, 'userInputSupport is true');
assert(manifest.artifactVersioningSupport === true, 'artifactVersioningSupport is true');

// Platform & bridge
assert(
  Array.isArray(manifest.supportedPlatforms) &&
    manifest.supportedPlatforms.includes('macos') &&
    manifest.supportedPlatforms.includes('windows') &&
    manifest.supportedPlatforms.includes('linux'),
  'supportedPlatforms includes macos, windows, linux',
);
assert(manifest.bridgeRequirement === 'optional', 'bridgeRequirement is optional');

// LLM usage declarations
const expectedPurposeIds = [
  'discovery-analysis',
  'roadmap-generation',
  'product-definition',
  'design-spec',
  'architecture-design',
  'development-plan',
  'qa-strategy',
  'status-report',
];
assert(Array.isArray(manifest.llmUsage) && manifest.llmUsage.length === 8, 'llmUsage has exactly 8 entries');
for (const pid of expectedPurposeIds) {
  assert(
    manifest.llmUsage.some((u) => u.purposeId === pid),
    `llmUsage includes purposeId "${pid}"`,
  );
}
for (const usage of manifest.llmUsage) {
  assert(typeof usage.kind === 'string' && usage.kind.length > 0, `llmUsage "${usage.purposeId}" has a valid kind`);
  assert(typeof usage.estimatedTokenBudget === 'number' && usage.estimatedTokenBudget > 0, `llmUsage "${usage.purposeId}" has positive estimatedTokenBudget`);
}

// Input schema actions
const expectedActions = [
  'init-studio',
  'create-project',
  'run-phase',
  'advance-phase',
  'switch-project',
  'generate-roadmap',
  'review-artifact',
  'status-report',
  'run-implementation-subphase',
  'redirect',
];
const actionEnum = (manifest.inputSchema.properties?.action as { enum?: string[] })?.enum ?? [];
assert(actionEnum.length === expectedActions.length, `inputSchema action enum has ${expectedActions.length} values`);
for (const action of expectedActions) {
  assert(actionEnum.includes(action), `inputSchema action enum includes "${action}"`);
}

// Input schema roles
const expectedRoleEnum = ['ceo', 'product-manager', 'ux-ui', 'software-architect', 'developer', 'qa'];
const roleEnum = (manifest.inputSchema.properties?.role as { enum?: string[] })?.enum ?? [];
assert(roleEnum.length === expectedRoleEnum.length, `inputSchema role enum has ${expectedRoleEnum.length} values`);
for (const role of expectedRoleEnum) {
  assert(roleEnum.includes(role), `inputSchema role enum includes "${role}"`);
}

// Input schema redirection actions
const expectedRedirections = [
  'redefine-roadmap', 'redefine-phase', 'reorder-phases', 'reduce-scope',
  'expand-scope', 'pivot', 'change-priorities', 'pause', 'continue', 'stop',
];
const redirectEnum = (manifest.inputSchema.properties?.redirectionAction as { enum?: string[] })?.enum ?? [];
assert(redirectEnum.length === expectedRedirections.length, `inputSchema redirectionAction enum has ${expectedRedirections.length} values`);
for (const action of expectedRedirections) {
  assert(redirectEnum.includes(action), `inputSchema redirectionAction enum includes "${action}"`);
}

// Output schema required fields
assert(manifest.outputSchema.type === 'object', 'outputSchema type is object');
assert(manifest.outputSchema.required.includes('success'), 'outputSchema requires success');
assert(manifest.outputSchema.required.includes('message'), 'outputSchema requires message');

// Input schema phases (canonical)
const expectedPhaseEnum = [
  'discovery',
  'roadmap-definition',
  'product-definition',
  'ux-definition',
  'architecture-definition',
  'implementation-phase',
  'qa-validation',
  'release-readiness',
];
const phaseEnum = (manifest.inputSchema.properties?.targetPhase as { enum?: string[] })?.enum ?? [];
assert(phaseEnum.length === expectedPhaseEnum.length, `inputSchema targetPhase enum has ${expectedPhaseEnum.length} values`);
for (const phase of expectedPhaseEnum) {
  assert(phaseEnum.includes(phase), `inputSchema targetPhase enum includes "${phase}"`);
}

// Required bindings (empty initially)
assert(Array.isArray(manifest.requiredBindings) && manifest.requiredBindings.length === 0, 'requiredBindings is empty');

// Sandbox
assert(manifest.sandbox.maxExecutionMs >= 300000, 'sandbox.maxExecutionMs >= 300000');
assert(manifest.sandbox.maxMemoryMB >= 128, 'sandbox.maxMemoryMB >= 128');

// Empty arrays that must exist
assert(Array.isArray(manifest.compatibilityRequirements), 'compatibilityRequirements is an array');
assert(Array.isArray(manifest.oauth), 'oauth is an array');
assert(Array.isArray(manifest.wasm), 'wasm is an array');
assert(Array.isArray(manifest.views), 'views is an array');
assert(Array.isArray(manifest.tools), 'tools is an array');
assert(Array.isArray(manifest.lifecycleHooks), 'lifecycleHooks is an array');

// ── Index.json entry validation ─────────────────────────────────────────

const index = loadJson(INDEX_PATH) as IndexEntry[];
const entry = index.find((e) => e.name === 'startup-product-studio');
assert(entry !== undefined, 'index.json contains startup-product-studio entry');

if (entry) {
  assert(entry.folderPath === 'skills/startup-product-studio', 'index entry folderPath is correct');
  assert(entry.executionMode === manifest.executionMode, 'index entry executionMode matches manifest');
  assert(entry.bridgeRequirement === manifest.bridgeRequirement, 'index entry bridgeRequirement matches manifest');
  assert(entry.workspaceSupport === manifest.workspaceSupport, 'index entry workspaceSupport matches manifest');
  assert(entry.longRunningSupport === manifest.longRunningSupport, 'index entry longRunningSupport matches manifest');
  assert(entry.userInputSupport === manifest.userInputSupport, 'index entry userInputSupport matches manifest');
  assert(entry.artifactVersioningSupport === manifest.artifactVersioningSupport, 'index entry artifactVersioningSupport matches manifest');
  assert(Array.isArray(entry.tags) && entry.tags.length >= 5, 'index entry has sufficient tags');
  assert(entry.tags.includes('agentic'), 'index entry tags include "agentic"');
  assert(entry.tags.includes('startup'), 'index entry tags include "startup"');
}

// ── Module export validation ────────────────────────────────────────────

const moduleSource = readFileSync(MODULE_PATH, 'utf-8');
assert(moduleSource.includes('export async function execute'), 'module.ts exports async execute function');
assert(moduleSource.includes('host.workspace.getState'), 'module.ts uses host.workspace.getState');
assert(moduleSource.includes('host.workspace.setState'), 'module.ts uses host.workspace.setState');
assert(moduleSource.includes('host.workspace.createArtifact'), 'module.ts uses host.workspace.createArtifact');
assert(moduleSource.includes('host.run.reportStep'), 'module.ts uses host.run.reportStep');
assert(moduleSource.includes('host.run.requestInput'), 'module.ts uses host.run.requestInput');
assert(moduleSource.includes('host.run.checkpoint'), 'module.ts uses host.run.checkpoint');
assert(moduleSource.includes('host.workspace.setPhase'), 'module.ts uses host.workspace.setPhase');
assert(moduleSource.includes('host.workspace.setRole'), 'module.ts uses host.workspace.setRole');
assert(moduleSource.includes('host.llm.complete'), 'module.ts uses host.llm.complete');
assert(moduleSource.includes('host.events.emitProgress'), 'module.ts uses host.events.emitProgress');

// Verify all 6 roles are referenced
const expectedRoles = ['ceo', 'product-manager', 'ux-ui', 'software-architect', 'developer', 'qa'];
for (const role of expectedRoles) {
  assert(moduleSource.includes(`'${role}'`), `module.ts references role "${role}"`);
}

// Verify all 8 canonical phases are referenced
const expectedPhases = ['discovery', 'roadmap-definition', 'product-definition', 'ux-definition', 'architecture-definition', 'implementation-phase', 'qa-validation', 'release-readiness'];
for (const phase of expectedPhases) {
  assert(moduleSource.includes(`'${phase}'`), `module.ts references phase "${phase}"`);
}

// Verify canonical artifact types are referenced
const canonicalArtifactTypes = [
  'product-vision', 'business-context', 'roadmap', 'mvp-definition',
  'user-personas', 'ux-ui-spec', 'architecture-plan', 'implementation-phase-plan',
  'implementation-report', 'qa-report', 'release-readiness-report',
];
for (const artifactType of canonicalArtifactTypes) {
  assert(moduleSource.includes(`'${artifactType}'`), `module.ts references canonical artifact type "${artifactType}"`);
}

// Verify enriched ProjectRecord fields
assert(moduleSource.includes('businessContext'), 'module.ts includes businessContext field');
assert(moduleSource.includes('targetUsers'), 'module.ts includes targetUsers field');
assert(moduleSource.includes('constraints'), 'module.ts includes constraints field');
assert(moduleSource.includes('implementationStatus'), 'module.ts includes implementationStatus field');
assert(moduleSource.includes('validationHistory'), 'module.ts includes validationHistory field');

// Verify gate decision options
assert(moduleSource.includes("'pause'"), 'module.ts supports pause gate decision');
assert(moduleSource.includes("'cancel'"), 'module.ts supports cancel gate decision');

// ── Summary ─────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}

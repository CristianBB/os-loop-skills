import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = resolve(__dirname, '..');
const FLOWS_DIR = resolve(SKILL_DIR, 'flows');
const MODULE_PATH = resolve(SKILL_DIR, 'module.ts');

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

interface FlowStep {
  id: string;
  role: string;
  purposeId: string;
  artifactType: string;
  description: string;
  bridgeRequired?: boolean;
}

interface FlowDefinition {
  phaseId: string;
  primaryRole: string;
  steps: FlowStep[];
  approvalRequired?: boolean;
  nextPhase: string | null;
  perRoadmapPhaseSubSteps?: FlowStep[];
}

interface RedirectionFlow {
  flowId: string;
  actions: Array<{ id: string; description: string }>;
}

const PHASE_FLOW_IDS = [
  'discovery',
  'roadmap-definition',
  'product-definition',
  'ux-definition',
  'architecture-definition',
  'implementation-phase',
  'qa-validation',
  'release-readiness',
];

const moduleSource = readFileSync(MODULE_PATH, 'utf-8');

// Extract PHASE_CONFIGS step IDs and artifact types from module.ts source
function extractModuleSteps(phaseId: string): { ids: string[]; artifactTypes: string[]; primaryRole: string; nextPhase: string | null } {
  const escaped = phaseId.replace(/-/g, '\\-');
  const phaseRegex = new RegExp(
    `['"]?${escaped}['"]?:\\s*\\{[^}]*primaryRole:\\s*['"]([^'"]+)['"][\\s\\S]*?steps:\\s*\\[([\\s\\S]*?)\\]\\s*,\\s*nextPhase:\\s*(?:['"]([^'"]+)['"]|null)`,
  );
  const match = moduleSource.match(phaseRegex);
  if (!match) return { ids: [], artifactTypes: [], primaryRole: '', nextPhase: null };

  const primaryRole = match[1];
  const stepsBlock = match[2];
  const nextPhase = match[3] ?? null;

  const stepIdRegex = /id:\s*'([^']+)'/g;
  const artifactTypeRegex = /artifactType:\s*'([^']+)'/g;

  const ids: string[] = [];
  const artifactTypes: string[] = [];

  let m;
  while ((m = stepIdRegex.exec(stepsBlock)) !== null) ids.push(m[1]);
  while ((m = artifactTypeRegex.exec(stepsBlock)) !== null) artifactTypes.push(m[1]);

  return { ids, artifactTypes, primaryRole, nextPhase };
}

// ── Test runner ──────────────────────────────────────────────────────────

console.log('=== Startup Product Studio — Flow-Module Consistency ===\n');

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

// ── Flow file existence ──────────────────────────────────────────────────

const flowFiles = readdirSync(FLOWS_DIR).filter((f) => f.endsWith('.json'));

for (const phaseId of PHASE_FLOW_IDS) {
  assert(flowFiles.includes(`${phaseId}.json`), `flow file exists for ${phaseId}`);
}

assert(flowFiles.includes('user-redirection.json'), 'user-redirection.json exists');

// ── Per-phase consistency ────────────────────────────────────────────────

for (const phaseId of PHASE_FLOW_IDS) {
  const flowPath = resolve(FLOWS_DIR, `${phaseId}.json`);
  const flow = loadJson(flowPath) as FlowDefinition;
  const moduleSteps = extractModuleSteps(phaseId);

  assert(flow.phaseId === phaseId, `${phaseId}: flow phaseId matches filename`);
  assert(flow.primaryRole === moduleSteps.primaryRole, `${phaseId}: primary role matches (flow="${flow.primaryRole}", module="${moduleSteps.primaryRole}")`);
  assert(flow.nextPhase === moduleSteps.nextPhase, `${phaseId}: nextPhase matches (flow="${flow.nextPhase}", module="${moduleSteps.nextPhase}")`);

  // Flow step IDs must be a superset of module step IDs
  const flowStepIds = flow.steps.map((s) => s.id);
  for (const id of moduleSteps.ids) {
    assert(flowStepIds.includes(id), `${phaseId}: flow contains module step "${id}"`);
  }

  // Module step artifact types must appear in flow
  const flowArtifactTypes = flow.steps.map((s) => s.artifactType);
  for (const at of moduleSteps.artifactTypes) {
    assert(flowArtifactTypes.includes(at), `${phaseId}: flow contains artifact type "${at}"`);
  }
}

// ── User redirection flow ────────────────────────────────────────────────

const redirectionPath = resolve(FLOWS_DIR, 'user-redirection.json');
const redirection = loadJson(redirectionPath) as RedirectionFlow;

assert(redirection.flowId === 'user-redirection', 'user-redirection flow has correct flowId');

const expectedRedirections = [
  'redefine-roadmap', 'redefine-phase', 'reorder-phases',
  'reduce-scope', 'expand-scope', 'pivot',
  'change-priorities', 'pause', 'continue', 'stop',
];
const redirectActions = redirection.actions.map((a) => a.id);
for (const action of expectedRedirections) {
  assert(redirectActions.includes(action), `user-redirection contains action "${action}"`);
}

// ── bridgeRequired flag alignment ────────────────────────────────────────

const implFlowPath = resolve(FLOWS_DIR, 'implementation-phase.json');
const implFlow = loadJson(implFlowPath) as FlowDefinition;

const bridgeRequiredStepIds = implFlow.steps
  .filter((s) => s.bridgeRequired === true)
  .map((s) => s.id);

const expectedBridgeStepIds = ['repository-bootstrap', 'claude-configuration', 'code-execution'];

assert(
  bridgeRequiredStepIds.length === expectedBridgeStepIds.length,
  `implementation-phase has exactly ${expectedBridgeStepIds.length} bridgeRequired steps (found ${bridgeRequiredStepIds.length})`,
);

for (const id of expectedBridgeStepIds) {
  assert(
    bridgeRequiredStepIds.includes(id),
    `implementation-phase step "${id}" is marked bridgeRequired`,
  );
}

// perRoadmapPhaseSubSteps bridgeRequired alignment
const subStepBridgeIds = (implFlow.perRoadmapPhaseSubSteps ?? [])
  .filter((s) => s.bridgeRequired === true)
  .map((s) => s.id);

assert(subStepBridgeIds.includes('subphase-implement'), 'perRoadmapPhaseSubSteps "subphase-implement" is marked bridgeRequired');

// ── Cross-phase artifact uniqueness ──────────────────────────────────────

const crossPhaseTypes = new Set(['phase-summary', 'status-report']);
const artifactPhaseMap = new Map<string, string[]>();

for (const phaseId of PHASE_FLOW_IDS) {
  const { artifactTypes } = extractModuleSteps(phaseId);
  for (const at of artifactTypes) {
    if (crossPhaseTypes.has(at)) continue;
    if (!artifactPhaseMap.has(at)) artifactPhaseMap.set(at, []);
    artifactPhaseMap.get(at)!.push(phaseId);
  }
}

for (const [artifactType, phases] of artifactPhaseMap) {
  assert(phases.length === 1, `artifact type "${artifactType}" appears in exactly one phase (found: ${phases.join(', ')})`);
}

// ── Summary ──────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}

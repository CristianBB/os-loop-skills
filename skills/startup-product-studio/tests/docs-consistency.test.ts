import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = resolve(__dirname, '..');
const DOCS_PATH = resolve(SKILL_DIR, 'docs.md');
const README_PATH = resolve(SKILL_DIR, 'README.md');
const MANIFEST_PATH = resolve(SKILL_DIR, 'manifest.json');
const EXAMPLES_DIR = resolve(SKILL_DIR, 'examples');

interface Manifest {
  inputSchema: {
    properties: Record<string, { enum?: string[] }>;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

console.log('=== Startup Product Studio — Docs & Examples Consistency ===\n');

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

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

// ── File existence ──────────────────────────────────────────────────────

assert(existsSync(DOCS_PATH), 'docs.md exists');
assert(existsSync(MANIFEST_PATH), 'manifest.json exists');

const docs = readFileSync(DOCS_PATH, 'utf-8');
const manifest = loadJson(MANIFEST_PATH) as Manifest;

// ── docs.md references all canonical phases ─────────────────────────────

const canonicalPhases = [
  'discovery', 'roadmap-definition', 'product-definition', 'ux-definition',
  'architecture-definition', 'implementation-phase', 'qa-validation', 'release-readiness',
];

for (const phase of canonicalPhases) {
  assert(docs.includes(phase), `docs.md references phase "${phase}"`);
}

// ── docs.md references all roles ────────────────────────────────────────

const canonicalRoles = ['ceo', 'product-manager', 'ux-ui', 'software-architect', 'developer', 'qa'];

for (const role of canonicalRoles) {
  assert(docs.includes(role), `docs.md references role "${role}"`);
}

// ── docs.md references all input actions ────────────────────────────────

const actions = manifest.inputSchema.properties?.action?.enum ?? [];
assert(actions.length > 0, 'manifest has input actions defined');

for (const action of actions) {
  assert(docs.includes(action), `docs.md references action "${action}"`);
}

// ── docs.md references all gate decisions ───────────────────────────────

const gateDecisions = ['approve', 'reject', 'revise', 'pause', 'cancel'];
for (const decision of gateDecisions) {
  assert(docs.includes(`\`${decision}\``), `docs.md references gate decision "${decision}"`);
}

// ── docs.md references all redirection actions ──────────────────────────

const redirectionActions = manifest.inputSchema.properties?.redirectionAction?.enum ?? [];
assert(redirectionActions.length > 0, 'manifest has redirection actions defined');

for (const action of redirectionActions) {
  assert(docs.includes(action), `docs.md references redirection action "${action}"`);
}

// ── Example JSON files have valid StudioState structure ─────────────────

const singleProductPath = resolve(EXAMPLES_DIR, 'single-product-workspace.json');
const multiProjectPath = resolve(EXAMPLES_DIR, 'multi-project-workspace.json');

assert(existsSync(singleProductPath), 'single-product-workspace.json exists');
assert(existsSync(multiProjectPath), 'multi-project-workspace.json exists');

interface ExampleFile {
  description: string;
  studioState: {
    studioName: string;
    projects: Array<{
      id: string;
      name: string;
      currentPhase: string;
      completedPhases: string[];
      codeProjects: Array<{ id: string; name: string; type: string }>;
    }>;
    activeProjectId: string | null;
    createdAt: string;
  };
}

function validateExampleFile(path: string, label: string): void {
  const example = loadJson(path) as ExampleFile;

  assert(typeof example.description === 'string' && example.description.length > 0, `${label}: has description`);
  assert(typeof example.studioState === 'object' && example.studioState !== null, `${label}: has studioState`);
  assert(typeof example.studioState.studioName === 'string', `${label}: studioState has studioName`);
  assert(Array.isArray(example.studioState.projects) && example.studioState.projects.length > 0, `${label}: has at least one project`);
  assert(typeof example.studioState.createdAt === 'string', `${label}: studioState has createdAt`);

  // Validate all project phases are canonical
  for (const project of example.studioState.projects) {
    assert(
      canonicalPhases.includes(project.currentPhase),
      `${label}: project "${project.name}" currentPhase "${project.currentPhase}" is canonical`,
    );
    for (const completedPhase of project.completedPhases) {
      assert(
        canonicalPhases.includes(completedPhase),
        `${label}: project "${project.name}" completedPhase "${completedPhase}" is canonical`,
      );
    }
  }

  // Validate code project types
  const validCodeProjectTypes = ['web', 'mobile', 'backend', 'worker', 'infra', 'shared', 'docs'];
  for (const project of example.studioState.projects) {
    for (const cp of project.codeProjects) {
      assert(
        validCodeProjectTypes.includes(cp.type),
        `${label}: code project "${cp.name}" type "${cp.type}" is valid`,
      );
    }
  }

  // activeProjectId should reference an existing project or be null
  if (example.studioState.activeProjectId !== null) {
    const projectIds = example.studioState.projects.map((p) => p.id);
    assert(
      projectIds.includes(example.studioState.activeProjectId),
      `${label}: activeProjectId references an existing project`,
    );
  }
}

validateExampleFile(singleProductPath, 'single-product');
validateExampleFile(multiProjectPath, 'multi-project');

// Multi-project specific: should have more than one project
const multiExample = loadJson(multiProjectPath) as ExampleFile;
assert(multiExample.studioState.projects.length > 1, 'multi-project: has multiple projects');

// ── Walkthrough files exist ─────────────────────────────────────────────

const walkthroughSinglePath = resolve(EXAMPLES_DIR, 'walkthrough-single-product.md');
const walkthroughMultiPath = resolve(EXAMPLES_DIR, 'walkthrough-multi-project.md');

assert(existsSync(walkthroughSinglePath), 'walkthrough-single-product.md exists');
assert(existsSync(walkthroughMultiPath), 'walkthrough-multi-project.md exists');

// Verify walkthroughs reference canonical phases
const walkthroughSingle = readFileSync(walkthroughSinglePath, 'utf-8');
const walkthroughMulti = readFileSync(walkthroughMultiPath, 'utf-8');

for (const phase of canonicalPhases) {
  assert(walkthroughSingle.includes(phase), `walkthrough-single references phase "${phase}"`);
}

assert(walkthroughMulti.includes('switch-project'), 'walkthrough-multi demonstrates project switching');

// ── No placeholder or weak language in docs ─────────────────────────────

const weakPatterns = [
  /TODO/i,
  /FIXME/i,
  /HACK/i,
  /placeholder/i,
  /implement later/i,
  /not yet implemented/i,
];

for (const pattern of weakPatterns) {
  assert(!pattern.test(docs), `docs.md does not contain weak pattern: ${pattern.source}`);
}

// ── README.md consistency ───────────────────────────────────────────────

assert(existsSync(README_PATH), 'README.md exists');

const readme = readFileSync(README_PATH, 'utf-8');
assert(readme.length > 0, 'README.md is non-empty');

// README references all canonical phases
for (const phase of canonicalPhases) {
  assert(readme.includes(phase), `README.md references phase "${phase}"`);
}

// README references all roles
for (const role of canonicalRoles) {
  assert(readme.includes(role), `README.md references role "${role}"`);
}

// README references all gate decisions
for (const decision of gateDecisions) {
  assert(readme.includes(`\`${decision}\``), `README.md references gate decision "${decision}"`);
}

// README contains required sections
const requiredReadmeSections = [
  'Internal Role Model',
  'Example User Journeys',
  'Artifacts Produced',
  'Bridge and Claude Code Integration',
  'Git and Repository Bootstrap',
  'Agent-Discoverable Queries',
  'Developer Notes',
];

for (const section of requiredReadmeSections) {
  assert(readme.includes(section), `README.md contains section "${section}"`);
}

// README has no weak language
for (const pattern of weakPatterns) {
  assert(!pattern.test(readme), `README.md does not contain weak pattern: ${pattern.source}`);
}

// ── Claude Code command pattern and bridge semantics ─────────────────────

assert(docs.includes('claude --print'), 'docs.md references concrete command pattern "claude --print"');
assert(readme.includes('claude --print'), 'README.md references concrete command pattern "claude --print"');

// Bootstrap status values must be documented in both docs
const bootstrapStatuses = ['pending', 'git_initialized', 'claude_configured', 'ready'];
for (const status of bootstrapStatuses) {
  assert(docs.includes(status), `docs.md references bootstrap status "${status}"`);
  assert(readme.includes(status), `README.md references bootstrap status "${status}"`);
}

// 600s timeout for Claude Code execution
assert(docs.includes('600'), 'docs.md references 600-second timeout for Claude Code execution');
assert(readme.includes('600'), 'README.md references 600s timeout for Claude Code execution');

// ── .claude structure consistency between module.ts and docs ─────────────

const modulePath = resolve(SKILL_DIR, 'module.ts');
const moduleSource = readFileSync(modulePath, 'utf-8');

// Extract .claude file paths from the fileMap in module.ts
const claudeFileRegex = /'\.(claude\/[^']+)'/g;
const claudeFiles: string[] = [];
let claudeMatch;
while ((claudeMatch = claudeFileRegex.exec(moduleSource)) !== null) {
  const filePath = claudeMatch[1];
  // Deduplicate (paths appear in fileMap keys)
  if (!claudeFiles.includes(filePath)) {
    claudeFiles.push(filePath);
  }
}

assert(claudeFiles.length === 18, `.claude structure has exactly 18 files in module.ts (found ${claudeFiles.length})`);

// Verify docs.md and README.md reference each .claude file basename
for (const filePath of claudeFiles) {
  const basename = filePath.split('/').pop()!.replace('.md', '');
  assert(docs.includes(basename), `docs.md references .claude file "${basename}"`);
  assert(readme.includes(basename), `README.md references .claude file "${basename}"`);
}

// Verify all 4 subdirectories are represented
const claudeSubdirs = new Set(claudeFiles.map((f) => f.split('/')[1]));
assert(claudeSubdirs.size === 4, `.claude has exactly 4 subdirectories (found ${claudeSubdirs.size})`);
for (const dir of ['docs', 'context', 'agents', 'commands']) {
  assert(claudeSubdirs.has(dir), `.claude contains subdirectory "${dir}"`);
}

// ── Summary ─────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}

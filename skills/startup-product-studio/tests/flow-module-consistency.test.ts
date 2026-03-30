import { describe, it, expect } from 'vitest';
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

describe('Startup Product Studio — Flow-Module Consistency', () => {
  describe('flow file existence', () => {
    const flowFiles = readdirSync(FLOWS_DIR).filter((f) => f.endsWith('.json'));

    for (const phaseId of PHASE_FLOW_IDS) {
      it(`flow file exists for ${phaseId}`, () => {
        expect(flowFiles).toContain(`${phaseId}.json`);
      });
    }

    it('user-redirection.json exists', () => {
      expect(flowFiles).toContain('user-redirection.json');
    });
  });

  describe('per-phase consistency', () => {
    for (const phaseId of PHASE_FLOW_IDS) {
      describe(phaseId, () => {
        const flowPath = resolve(FLOWS_DIR, `${phaseId}.json`);
        const flow = loadJson(flowPath) as FlowDefinition;
        const moduleSteps = extractModuleSteps(phaseId);

        it('flow phaseId matches filename', () => {
          expect(flow.phaseId).toBe(phaseId);
        });

        it(`primary role matches (flow="${flow.primaryRole}", module="${moduleSteps.primaryRole}")`, () => {
          expect(flow.primaryRole).toBe(moduleSteps.primaryRole);
        });

        it(`nextPhase matches (flow="${flow.nextPhase}", module="${moduleSteps.nextPhase}")`, () => {
          expect(flow.nextPhase).toBe(moduleSteps.nextPhase);
        });

        const flowStepIds = flow.steps.map((s) => s.id);
        for (const id of moduleSteps.ids) {
          it(`flow contains module step "${id}"`, () => {
            expect(flowStepIds).toContain(id);
          });
        }

        const flowArtifactTypes = flow.steps.map((s) => s.artifactType);
        for (const at of moduleSteps.artifactTypes) {
          it(`flow contains artifact type "${at}"`, () => {
            expect(flowArtifactTypes).toContain(at);
          });
        }
      });
    }
  });

  describe('user redirection flow', () => {
    const redirectionPath = resolve(FLOWS_DIR, 'user-redirection.json');
    const redirection = loadJson(redirectionPath) as RedirectionFlow;

    it('user-redirection flow has correct flowId', () => {
      expect(redirection.flowId).toBe('user-redirection');
    });

    const expectedRedirections = [
      'redefine-roadmap', 'redefine-phase', 'reorder-phases',
      'reduce-scope', 'expand-scope', 'pivot',
      'change-priorities', 'pause', 'continue', 'stop',
    ];
    const redirectActions = redirection.actions.map((a) => a.id);

    for (const action of expectedRedirections) {
      it(`user-redirection contains action "${action}"`, () => {
        expect(redirectActions).toContain(action);
      });
    }
  });

  describe('bridgeRequired flag alignment', () => {
    const implFlowPath = resolve(FLOWS_DIR, 'implementation-phase.json');
    const implFlow = loadJson(implFlowPath) as FlowDefinition;

    const bridgeRequiredStepIds = implFlow.steps
      .filter((s) => s.bridgeRequired === true)
      .map((s) => s.id);

    const expectedBridgeStepIds = ['repository-bootstrap', 'claude-configuration', 'code-execution'];

    it(`implementation-phase has exactly ${expectedBridgeStepIds.length} bridgeRequired steps`, () => {
      expect(bridgeRequiredStepIds.length).toBe(expectedBridgeStepIds.length);
    });

    for (const id of expectedBridgeStepIds) {
      it(`implementation-phase step "${id}" is marked bridgeRequired`, () => {
        expect(bridgeRequiredStepIds).toContain(id);
      });
    }

    it('perRoadmapPhaseSubSteps "subphase-implement" is marked bridgeRequired', () => {
      const subStepBridgeIds = (implFlow.perRoadmapPhaseSubSteps ?? [])
        .filter((s) => s.bridgeRequired === true)
        .map((s) => s.id);
      expect(subStepBridgeIds).toContain('subphase-implement');
    });
  });

  describe('cross-phase artifact uniqueness', () => {
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
      it(`artifact type "${artifactType}" appears in exactly one phase`, () => {
        expect(phases.length).toBe(1);
      });
    }
  });
});

import { describe, it, expect } from 'vitest';
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

describe('Startup Product Studio — Manifest Validation', () => {
  describe('file existence', () => {
    it('manifest.json exists', () => {
      expect(existsSync(MANIFEST_PATH)).toBe(true);
    });

    it('module.ts exists', () => {
      expect(existsSync(MODULE_PATH)).toBe(true);
    });

    it('skills/index.json exists', () => {
      expect(existsSync(INDEX_PATH)).toBe(true);
    });
  });

  describe('manifest field validation', () => {
    const manifest = loadJson(MANIFEST_PATH) as Manifest;

    describe('identity', () => {
      it('name is startup-product-studio', () => {
        expect(manifest.name).toBe('startup-product-studio');
      });

      it('description is substantial', () => {
        expect(typeof manifest.description).toBe('string');
        expect(manifest.description.length).toBeGreaterThan(50);
      });

      it('version is 2.0.0', () => {
        expect(manifest.version).toBe('2.0.0');
      });

      it('author is OS Loop', () => {
        expect(manifest.author).toBe('OS Loop');
      });

      it('schemaVersion is 2.0', () => {
        expect(manifest.schemaVersion).toBe('2.0');
      });
    });

    describe('capabilities', () => {
      it('capabilities is a non-empty array', () => {
        expect(Array.isArray(manifest.capabilities)).toBe(true);
        expect(manifest.capabilities.length).toBeGreaterThanOrEqual(1);
      });

      it('capabilities includes product-development', () => {
        expect(manifest.capabilities).toContain('product-development');
      });
    });

    describe('permissions', () => {
      it('permissions is a non-empty array', () => {
        expect(Array.isArray(manifest.permissions)).toBe(true);
        expect(manifest.permissions.length).toBeGreaterThanOrEqual(1);
      });

      it('permissions include llm', () => {
        expect(manifest.permissions.some((p) => p.kind === 'llm')).toBe(true);
      });
    });

    describe('execution mode & agentic config', () => {
      it('executionMode is agentic', () => {
        expect(manifest.executionMode).toBe('agentic');
      });

      it('agenticConfig.enabled is true', () => {
        expect(manifest.agenticConfig.enabled).toBe(true);
      });

      it('agenticConfig.requiresWorkspace is true', () => {
        expect(manifest.agenticConfig.requiresWorkspace).toBe(true);
      });

      it('agenticConfig.supportsBackgroundExecution is true', () => {
        expect(manifest.agenticConfig.supportsBackgroundExecution).toBe(true);
      });

      it('agenticConfig.supportsRoleBasedExecution is true', () => {
        expect(manifest.agenticConfig.supportsRoleBasedExecution).toBe(true);
      });

      it('agenticConfig.maxStepsPerRun is a positive number', () => {
        expect(typeof manifest.agenticConfig.maxStepsPerRun).toBe('number');
        expect(manifest.agenticConfig.maxStepsPerRun).toBeGreaterThan(0);
      });

      it('agenticConfig.defaultStepBudget is a positive number', () => {
        expect(typeof manifest.agenticConfig.defaultStepBudget).toBe('number');
        expect(manifest.agenticConfig.defaultStepBudget).toBeGreaterThan(0);
      });

      it('defaultStepBudget <= maxStepsPerRun', () => {
        expect(manifest.agenticConfig.defaultStepBudget!).toBeLessThanOrEqual(manifest.agenticConfig.maxStepsPerRun!);
      });
    });

    describe('workspace', () => {
      it('workspaceSupport is required', () => {
        expect(manifest.workspaceSupport).toBe('required');
      });

      it('workspaceSchemaVersion is 2.0.0', () => {
        expect(manifest.workspaceSchemaVersion).toBe('2.0.0');
      });

      it('agenticConfig.requiresWorkspace consistent with workspaceSupport=required', () => {
        expect(manifest.agenticConfig.requiresWorkspace).toBe(true);
        expect(manifest.workspaceSupport).toBe('required');
      });
    });

    describe('long-running & user input', () => {
      it('longRunningSupport is required', () => {
        expect(manifest.longRunningSupport).toBe('required');
      });

      it('userInputSupport is true', () => {
        expect(manifest.userInputSupport).toBe(true);
      });

      it('artifactVersioningSupport is true', () => {
        expect(manifest.artifactVersioningSupport).toBe(true);
      });
    });

    describe('platform & bridge', () => {
      it('supportedPlatforms includes macos, windows, linux', () => {
        expect(Array.isArray(manifest.supportedPlatforms)).toBe(true);
        expect(manifest.supportedPlatforms).toContain('macos');
        expect(manifest.supportedPlatforms).toContain('windows');
        expect(manifest.supportedPlatforms).toContain('linux');
      });

      it('bridgeRequirement is required', () => {
        expect(manifest.bridgeRequirement).toBe('required');
      });
    });

    describe('LLM usage declarations', () => {
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

      it('llmUsage has exactly 8 entries', () => {
        expect(Array.isArray(manifest.llmUsage)).toBe(true);
        expect(manifest.llmUsage.length).toBe(8);
      });

      for (const pid of expectedPurposeIds) {
        it(`llmUsage includes purposeId "${pid}"`, () => {
          expect(manifest.llmUsage.some((u) => u.purposeId === pid)).toBe(true);
        });
      }

      it('each llmUsage entry has a valid kind and positive estimatedTokenBudget', () => {
        for (const usage of manifest.llmUsage) {
          expect(typeof usage.kind).toBe('string');
          expect(usage.kind.length).toBeGreaterThan(0);
          expect(typeof usage.estimatedTokenBudget).toBe('number');
          expect(usage.estimatedTokenBudget).toBeGreaterThan(0);
        }
      });
    });

    describe('input schema actions', () => {
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

      it(`inputSchema action enum has ${expectedActions.length} values`, () => {
        expect(actionEnum.length).toBe(expectedActions.length);
      });

      for (const action of expectedActions) {
        it(`inputSchema action enum includes "${action}"`, () => {
          expect(actionEnum).toContain(action);
        });
      }
    });

    describe('input schema roles', () => {
      const expectedRoleEnum = ['ceo', 'product-manager', 'ux-ui', 'software-architect', 'developer', 'qa'];
      const roleEnum = (manifest.inputSchema.properties?.role as { enum?: string[] })?.enum ?? [];

      it(`inputSchema role enum has ${expectedRoleEnum.length} values`, () => {
        expect(roleEnum.length).toBe(expectedRoleEnum.length);
      });

      for (const role of expectedRoleEnum) {
        it(`inputSchema role enum includes "${role}"`, () => {
          expect(roleEnum).toContain(role);
        });
      }
    });

    describe('input schema redirection actions', () => {
      const expectedRedirections = [
        'redefine-roadmap', 'redefine-phase', 'reorder-phases', 'reduce-scope',
        'expand-scope', 'pivot', 'change-priorities', 'pause', 'continue', 'stop',
      ];
      const redirectEnum = (manifest.inputSchema.properties?.redirectionAction as { enum?: string[] })?.enum ?? [];

      it(`inputSchema redirectionAction enum has ${expectedRedirections.length} values`, () => {
        expect(redirectEnum.length).toBe(expectedRedirections.length);
      });

      for (const action of expectedRedirections) {
        it(`inputSchema redirectionAction enum includes "${action}"`, () => {
          expect(redirectEnum).toContain(action);
        });
      }
    });

    describe('output schema', () => {
      it('outputSchema type is object', () => {
        expect(manifest.outputSchema.type).toBe('object');
      });

      it('outputSchema requires success', () => {
        expect(manifest.outputSchema.required).toContain('success');
      });

      it('outputSchema requires message', () => {
        expect(manifest.outputSchema.required).toContain('message');
      });
    });

    describe('input schema phases (canonical)', () => {
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

      it(`inputSchema targetPhase enum has ${expectedPhaseEnum.length} values`, () => {
        expect(phaseEnum.length).toBe(expectedPhaseEnum.length);
      });

      for (const phase of expectedPhaseEnum) {
        it(`inputSchema targetPhase enum includes "${phase}"`, () => {
          expect(phaseEnum).toContain(phase);
        });
      }
    });

    describe('required bindings', () => {
      it('requiredBindings is empty', () => {
        expect(Array.isArray(manifest.requiredBindings)).toBe(true);
        expect(manifest.requiredBindings.length).toBe(0);
      });
    });

    describe('sandbox', () => {
      it('sandbox.maxExecutionMs >= 300000', () => {
        expect(manifest.sandbox.maxExecutionMs).toBeGreaterThanOrEqual(300000);
      });

      it('sandbox.maxMemoryMB >= 128', () => {
        expect(manifest.sandbox.maxMemoryMB).toBeGreaterThanOrEqual(128);
      });
    });

    describe('required arrays', () => {
      it('compatibilityRequirements is an array', () => {
        expect(Array.isArray(manifest.compatibilityRequirements)).toBe(true);
      });

      it('compatibilityRequirements includes system_tools', () => {
        expect(manifest.compatibilityRequirements).toContain('system_tools');
      });

      it('oauth is an array', () => {
        expect(Array.isArray(manifest.oauth)).toBe(true);
      });

      it('wasm is an array', () => {
        expect(Array.isArray(manifest.wasm)).toBe(true);
      });

      it('views is an array', () => {
        expect(Array.isArray(manifest.views)).toBe(true);
      });

      it('tools is an array', () => {
        expect(Array.isArray(manifest.tools)).toBe(true);
      });

      it('lifecycleHooks is an array', () => {
        expect(Array.isArray(manifest.lifecycleHooks)).toBe(true);
      });
    });
  });

  describe('index.json entry validation', () => {
    const manifest = loadJson(MANIFEST_PATH) as Manifest;
    const index = loadJson(INDEX_PATH) as IndexEntry[];
    const entry = index.find((e) => e.name === 'startup-product-studio');

    it('index.json contains startup-product-studio entry', () => {
      expect(entry).toBeDefined();
    });

    it('index entry folderPath is correct', () => {
      expect(entry!.folderPath).toBe('skills/startup-product-studio');
    });

    it('index entry executionMode matches manifest', () => {
      expect(entry!.executionMode).toBe(manifest.executionMode);
    });

    it('index entry bridgeRequirement matches manifest', () => {
      expect(entry!.bridgeRequirement).toBe(manifest.bridgeRequirement);
    });

    it('index entry workspaceSupport matches manifest', () => {
      expect(entry!.workspaceSupport).toBe(manifest.workspaceSupport);
    });

    it('index entry longRunningSupport matches manifest', () => {
      expect(entry!.longRunningSupport).toBe(manifest.longRunningSupport);
    });

    it('index entry userInputSupport matches manifest', () => {
      expect(entry!.userInputSupport).toBe(manifest.userInputSupport);
    });

    it('index entry artifactVersioningSupport matches manifest', () => {
      expect(entry!.artifactVersioningSupport).toBe(manifest.artifactVersioningSupport);
    });

    it('index entry has sufficient tags', () => {
      expect(Array.isArray(entry!.tags)).toBe(true);
      expect(entry!.tags.length).toBeGreaterThanOrEqual(5);
    });

    it('index entry tags include "agentic"', () => {
      expect(entry!.tags).toContain('agentic');
    });

    it('index entry tags include "startup"', () => {
      expect(entry!.tags).toContain('startup');
    });
  });

  describe('module export validation', () => {
    const moduleSource = readFileSync(MODULE_PATH, 'utf-8');

    it('module.ts exports async execute function', () => {
      expect(moduleSource).toContain('export async function execute');
    });

    it('module.ts uses host.workspace.getState', () => {
      expect(moduleSource).toContain('host.workspace.getState');
    });

    it('module.ts uses host.workspace.setState', () => {
      expect(moduleSource).toContain('host.workspace.setState');
    });

    it('module.ts uses host.workspace.createArtifact', () => {
      expect(moduleSource).toContain('host.workspace.createArtifact');
    });

    it('module.ts uses host.run.reportStep', () => {
      expect(moduleSource).toContain('host.run.reportStep');
    });

    it('module.ts uses host.run.requestInput', () => {
      expect(moduleSource).toContain('host.run.requestInput');
    });

    it('module.ts uses host.run.checkpoint', () => {
      expect(moduleSource).toContain('host.run.checkpoint');
    });

    it('module.ts uses host.workspace.setPhase', () => {
      expect(moduleSource).toContain('host.workspace.setPhase');
    });

    it('module.ts uses host.workspace.setRole', () => {
      expect(moduleSource).toContain('host.workspace.setRole');
    });

    it('module.ts uses host.llm.complete', () => {
      expect(moduleSource).toContain('host.llm.complete');
    });

    it('module.ts uses host.events.emitProgress', () => {
      expect(moduleSource).toContain('host.events.emitProgress');
    });

    describe('roles', () => {
      const expectedRoles = ['ceo', 'product-manager', 'ux-ui', 'software-architect', 'developer', 'qa'];
      for (const role of expectedRoles) {
        it(`module.ts references role "${role}"`, () => {
          expect(moduleSource).toContain(`'${role}'`);
        });
      }
    });

    describe('phases', () => {
      const expectedPhases = ['discovery', 'roadmap-definition', 'product-definition', 'ux-definition', 'architecture-definition', 'implementation-phase', 'qa-validation', 'release-readiness'];
      for (const phase of expectedPhases) {
        it(`module.ts references phase "${phase}"`, () => {
          expect(moduleSource).toContain(`'${phase}'`);
        });
      }
    });

    describe('canonical artifact types', () => {
      const canonicalArtifactTypes = [
        'product-vision', 'business-context', 'roadmap', 'mvp-definition',
        'user-personas', 'ux-ui-spec', 'architecture-plan', 'implementation-phase-plan',
        'implementation-report', 'qa-report', 'release-readiness-report',
      ];
      for (const artifactType of canonicalArtifactTypes) {
        it(`module.ts references canonical artifact type "${artifactType}"`, () => {
          expect(moduleSource).toContain(`'${artifactType}'`);
        });
      }
    });

    describe('enriched ProjectRecord fields', () => {
      it('module.ts includes businessContext field', () => {
        expect(moduleSource).toContain('businessContext');
      });

      it('module.ts includes targetUsers field', () => {
        expect(moduleSource).toContain('targetUsers');
      });

      it('module.ts includes constraints field', () => {
        expect(moduleSource).toContain('constraints');
      });

      it('module.ts includes implementationStatus field', () => {
        expect(moduleSource).toContain('implementationStatus');
      });

      it('module.ts includes validationHistory field', () => {
        expect(moduleSource).toContain('validationHistory');
      });
    });

    describe('gate decisions', () => {
      it('module.ts supports pause gate decision', () => {
        expect(moduleSource).toContain("'pause'");
      });

      it('module.ts supports cancel gate decision', () => {
        expect(moduleSource).toContain("'cancel'");
      });
    });
  });
});

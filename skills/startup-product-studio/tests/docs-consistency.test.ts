import { describe, it, expect } from 'vitest';
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

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

const canonicalPhases = [
  'discovery', 'roadmap-definition', 'product-definition', 'ux-definition',
  'architecture-definition', 'implementation-phase', 'qa-validation', 'release-readiness',
];

const canonicalRoles = ['ceo', 'product-manager', 'ux-ui', 'software-architect', 'developer', 'qa'];

const gateDecisions = ['approve', 'reject', 'revise', 'pause', 'cancel'];

const weakPatterns = [
  /TODO/i,
  /FIXME/i,
  /HACK/i,
  /placeholder/i,
  /implement later/i,
  /not yet implemented/i,
];

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

describe('Startup Product Studio — Docs & Examples Consistency', () => {
  describe('file existence', () => {
    it('docs.md exists', () => {
      expect(existsSync(DOCS_PATH)).toBe(true);
    });

    it('manifest.json exists', () => {
      expect(existsSync(MANIFEST_PATH)).toBe(true);
    });
  });

  const docs = readFileSync(DOCS_PATH, 'utf-8');
  const manifest = loadJson(MANIFEST_PATH) as Manifest;

  describe('docs.md references all canonical phases', () => {
    for (const phase of canonicalPhases) {
      it(`docs.md references phase "${phase}"`, () => {
        expect(docs).toContain(phase);
      });
    }
  });

  describe('docs.md references all roles', () => {
    for (const role of canonicalRoles) {
      it(`docs.md references role "${role}"`, () => {
        expect(docs).toContain(role);
      });
    }
  });

  describe('docs.md references all input actions', () => {
    const actions = manifest.inputSchema.properties?.action?.enum ?? [];

    it('manifest has input actions defined', () => {
      expect(actions.length).toBeGreaterThan(0);
    });

    for (const action of actions) {
      it(`docs.md references action "${action}"`, () => {
        expect(docs).toContain(action);
      });
    }
  });

  describe('docs.md references all gate decisions', () => {
    for (const decision of gateDecisions) {
      it(`docs.md references gate decision "${decision}"`, () => {
        expect(docs).toContain(`\`${decision}\``);
      });
    }
  });

  describe('docs.md references all redirection actions', () => {
    const redirectionActions = manifest.inputSchema.properties?.redirectionAction?.enum ?? [];

    it('manifest has redirection actions defined', () => {
      expect(redirectionActions.length).toBeGreaterThan(0);
    });

    for (const action of redirectionActions) {
      it(`docs.md references redirection action "${action}"`, () => {
        expect(docs).toContain(action);
      });
    }
  });

  describe('example JSON files have valid StudioState structure', () => {
    const singleProductPath = resolve(EXAMPLES_DIR, 'single-product-workspace.json');
    const multiProjectPath = resolve(EXAMPLES_DIR, 'multi-project-workspace.json');

    it('single-product-workspace.json exists', () => {
      expect(existsSync(singleProductPath)).toBe(true);
    });

    it('multi-project-workspace.json exists', () => {
      expect(existsSync(multiProjectPath)).toBe(true);
    });

    const validCodeProjectTypes = ['web', 'mobile', 'backend', 'worker', 'infra', 'shared', 'docs'];

    function describeExampleFile(path: string, label: string): void {
      const example = loadJson(path) as ExampleFile;

      it(`${label}: has description`, () => {
        expect(typeof example.description).toBe('string');
        expect(example.description.length).toBeGreaterThan(0);
      });

      it(`${label}: has studioState`, () => {
        expect(typeof example.studioState).toBe('object');
        expect(example.studioState).not.toBeNull();
      });

      it(`${label}: studioState has studioName`, () => {
        expect(typeof example.studioState.studioName).toBe('string');
      });

      it(`${label}: has at least one project`, () => {
        expect(Array.isArray(example.studioState.projects)).toBe(true);
        expect(example.studioState.projects.length).toBeGreaterThan(0);
      });

      it(`${label}: studioState has createdAt`, () => {
        expect(typeof example.studioState.createdAt).toBe('string');
      });

      it(`${label}: all project phases are canonical`, () => {
        for (const project of example.studioState.projects) {
          expect(canonicalPhases).toContain(project.currentPhase);
          for (const completedPhase of project.completedPhases) {
            expect(canonicalPhases).toContain(completedPhase);
          }
        }
      });

      it(`${label}: all code project types are valid`, () => {
        for (const project of example.studioState.projects) {
          for (const cp of project.codeProjects) {
            expect(validCodeProjectTypes).toContain(cp.type);
          }
        }
      });

      it(`${label}: activeProjectId references an existing project or is null`, () => {
        if (example.studioState.activeProjectId !== null) {
          const projectIds = example.studioState.projects.map((p) => p.id);
          expect(projectIds).toContain(example.studioState.activeProjectId);
        }
      });
    }

    describeExampleFile(singleProductPath, 'single-product');
    describeExampleFile(multiProjectPath, 'multi-project');

    it('multi-project: has multiple projects', () => {
      const multiExample = loadJson(multiProjectPath) as ExampleFile;
      expect(multiExample.studioState.projects.length).toBeGreaterThan(1);
    });
  });

  describe('walkthrough files', () => {
    const walkthroughSinglePath = resolve(EXAMPLES_DIR, 'walkthrough-single-product.md');
    const walkthroughMultiPath = resolve(EXAMPLES_DIR, 'walkthrough-multi-project.md');

    it('walkthrough-single-product.md exists', () => {
      expect(existsSync(walkthroughSinglePath)).toBe(true);
    });

    it('walkthrough-multi-project.md exists', () => {
      expect(existsSync(walkthroughMultiPath)).toBe(true);
    });

    it('walkthrough-single references all canonical phases', () => {
      const walkthroughSingle = readFileSync(walkthroughSinglePath, 'utf-8');
      for (const phase of canonicalPhases) {
        expect(walkthroughSingle).toContain(phase);
      }
    });

    it('walkthrough-multi demonstrates project switching', () => {
      const walkthroughMulti = readFileSync(walkthroughMultiPath, 'utf-8');
      expect(walkthroughMulti).toContain('switch-project');
    });
  });

  describe('no placeholder or weak language in docs', () => {
    for (const pattern of weakPatterns) {
      it(`docs.md does not contain weak pattern: ${pattern.source}`, () => {
        expect(pattern.test(docs)).toBe(false);
      });
    }
  });

  describe('README.md consistency', () => {
    it('README.md exists', () => {
      expect(existsSync(README_PATH)).toBe(true);
    });

    const readme = readFileSync(README_PATH, 'utf-8');

    it('README.md is non-empty', () => {
      expect(readme.length).toBeGreaterThan(0);
    });

    for (const phase of canonicalPhases) {
      it(`README.md references phase "${phase}"`, () => {
        expect(readme).toContain(phase);
      });
    }

    for (const role of canonicalRoles) {
      it(`README.md references role "${role}"`, () => {
        expect(readme).toContain(role);
      });
    }

    for (const decision of gateDecisions) {
      it(`README.md references gate decision "${decision}"`, () => {
        expect(readme).toContain(`\`${decision}\``);
      });
    }

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
      it(`README.md contains section "${section}"`, () => {
        expect(readme).toContain(section);
      });
    }

    for (const pattern of weakPatterns) {
      it(`README.md does not contain weak pattern: ${pattern.source}`, () => {
        expect(pattern.test(readme)).toBe(false);
      });
    }
  });

  describe('Claude Code command pattern and bridge semantics', () => {
    const readme = readFileSync(README_PATH, 'utf-8');

    it('docs.md references concrete command pattern "claude --print"', () => {
      expect(docs).toContain('claude --print');
    });

    it('README.md references concrete command pattern "claude --print"', () => {
      expect(readme).toContain('claude --print');
    });

    const bootstrapStatuses = ['pending', 'git_initialized', 'claude_configured', 'ready'];
    for (const status of bootstrapStatuses) {
      it(`docs.md references bootstrap status "${status}"`, () => {
        expect(docs).toContain(status);
      });

      it(`README.md references bootstrap status "${status}"`, () => {
        expect(readme).toContain(status);
      });
    }

    it('docs.md references 600-second timeout for Claude Code execution', () => {
      expect(docs).toContain('600');
    });

    it('README.md references 600s timeout for Claude Code execution', () => {
      expect(readme).toContain('600');
    });
  });

  describe('.claude structure consistency between module.ts and docs', () => {
    const modulePath = resolve(SKILL_DIR, 'module.ts');
    const moduleSource = readFileSync(modulePath, 'utf-8');
    const readme = readFileSync(README_PATH, 'utf-8');

    const claudeFileRegex = /'\.(claude\/[^']+)'/g;
    const claudeFiles: string[] = [];
    let claudeMatch;
    while ((claudeMatch = claudeFileRegex.exec(moduleSource)) !== null) {
      const filePath = claudeMatch[1];
      if (!claudeFiles.includes(filePath)) {
        claudeFiles.push(filePath);
      }
    }

    it(`.claude structure has exactly 18 files in module.ts`, () => {
      expect(claudeFiles.length).toBe(18);
    });

    for (const filePath of claudeFiles) {
      const basename = filePath.split('/').pop()!.replace('.md', '');
      it(`docs.md references .claude file "${basename}"`, () => {
        expect(docs).toContain(basename);
      });

      it(`README.md references .claude file "${basename}"`, () => {
        expect(readme).toContain(basename);
      });
    }

    it('.claude has exactly 4 subdirectories', () => {
      const claudeSubdirs = new Set(claudeFiles.map((f) => f.split('/')[1]));
      expect(claudeSubdirs.size).toBe(4);
    });

    for (const dir of ['docs', 'context', 'agents', 'commands']) {
      it(`.claude contains subdirectory "${dir}"`, () => {
        const claudeSubdirs = new Set(claudeFiles.map((f) => f.split('/')[1]));
        expect(claudeSubdirs.has(dir)).toBe(true);
      });
    }
  });
});

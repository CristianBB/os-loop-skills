import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_SOURCE = readFileSync(
  resolve(__dirname, '..', 'module.ts'),
  'utf-8',
);

describe('Redirect Handler — Source Analysis', () => {
  const REDIRECT_ACTIONS = [
    'redefine-roadmap',
    'redefine-phase',
    'reorder-phases',
    'reduce-scope',
    'expand-scope',
    'pivot',
    'change-priorities',
    'pause',
    'continue',
    'stop',
  ];

  it('handles all 10 redirect actions in the switch statement', () => {
    for (const action of REDIRECT_ACTIONS) {
      expect(MODULE_SOURCE).toContain(`case '${action}':`);
    }
  });

  it('has a default case for unknown actions', () => {
    expect(MODULE_SOURCE).toContain('Unknown redirection action');
  });

  it('redefine-roadmap calls handleGenerateRoadmap', () => {
    const idx = MODULE_SOURCE.indexOf("case 'redefine-roadmap':");
    expect(idx).toBeGreaterThan(-1);
    const block = MODULE_SOURCE.substring(idx, idx + 300);
    expect(block).toContain('handleGenerateRoadmap');
  });

  it('pivot resets to discovery phase and preserves context', () => {
    const idx = MODULE_SOURCE.indexOf("case 'pivot':");
    expect(idx).toBeGreaterThan(-1);
    const block = MODULE_SOURCE.substring(idx, idx + 600);
    expect(block).toContain("project.currentPhase = 'discovery'");
    expect(block).toContain('project.completedPhases = []');
    expect(block).toContain('buildProjectContext');
  });

  it('stop marks remaining phases as failed', () => {
    const idx = MODULE_SOURCE.indexOf("case 'stop':");
    expect(idx).toBeGreaterThan(-1);
    const block = MODULE_SOURCE.substring(idx, idx + 400);
    expect(block).toContain("record.status = 'failed'");
    expect(block).toContain("record.userDecision = 'cancel'");
  });

  it('change-priorities reorders roadmapPhaseRecords', () => {
    const idx = MODULE_SOURCE.indexOf("case 'change-priorities':");
    expect(idx).toBeGreaterThan(-1);
    const block = MODULE_SOURCE.substring(idx, idx + 500);
    expect(block).toContain('roadmapPhaseRecords');
  });

  it('pause calls host.run.pause', () => {
    const idx = MODULE_SOURCE.indexOf("case 'pause':");
    expect(idx).toBeGreaterThan(-1);
    const block = MODULE_SOURCE.substring(idx, idx + 300);
    expect(block).toContain('host.run.pause');
  });

  it('reduce-scope and expand-scope trigger roadmap regeneration', () => {
    const idx = MODULE_SOURCE.indexOf("case 'reduce-scope':");
    expect(idx).toBeGreaterThan(-1);
    const block = MODULE_SOURCE.substring(idx, idx + 800);
    expect(block).toContain('handleGenerateRoadmap');
    expect(block).toContain('expand-scope');
  });

  it('continue returns success without modifying state', () => {
    const idx = MODULE_SOURCE.indexOf("case 'continue':");
    expect(idx).toBeGreaterThan(-1);
    const block = MODULE_SOURCE.substring(idx, idx + 300);
    expect(block).toContain('success: true');
    expect(block).toContain('continuing from phase');
  });

  it('reorder-phases creates a new RoadmapVersion', () => {
    const idx = MODULE_SOURCE.indexOf("case 'reorder-phases':");
    expect(idx).toBeGreaterThan(-1);
    const block = MODULE_SOURCE.substring(idx, idx + 1500);
    expect(block).toContain('RoadmapVersion');
    expect(block).toContain('roadmapVersions.push');
  });

  it('redefine-phase clears completed flag for current phase', () => {
    const idx = MODULE_SOURCE.indexOf("case 'redefine-phase':");
    expect(idx).toBeGreaterThan(-1);
    const block = MODULE_SOURCE.substring(idx, idx + 500);
    expect(block).toContain('completedPhases');
    expect(block).toContain('filter');
  });
});

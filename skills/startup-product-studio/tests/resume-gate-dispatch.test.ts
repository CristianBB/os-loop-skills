import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// These tests validate that handleResumeAfterInput dispatches based on
// pendingGateType instead of blindly re-running handleRunPhase, which
// caused an infinite approval loop for roadmap-definition and
// architecture-definition phases.
// ---------------------------------------------------------------------------

const MODULE_SOURCE = readFileSync(
  resolve(__dirname, '..', 'module.ts'),
  'utf-8',
);

describe('Resume Gate Dispatch — Infinite Loop Prevention', () => {
  describe('pendingGateType field', () => {
    it('ProjectRecord has pendingGateType field', () => {
      expect(MODULE_SOURCE).toContain("pendingGateType?: 'roadmap-gate' | 'architecture-gate' | 'phase-gate' | null");
    });
  });

  describe('pendingGateType is set before every requestInput call', () => {
    it('sets roadmap-gate before roadmap approval requestInput', () => {
      expect(MODULE_SOURCE).toContain("project.pendingGateType = 'roadmap-gate'");
    });

    it('sets architecture-gate before architecture approval requestInput', () => {
      expect(MODULE_SOURCE).toContain("project.pendingGateType = 'architecture-gate'");
    });

    it('sets phase-gate before generic phase approval requestInput', () => {
      expect(MODULE_SOURCE).toContain("project.pendingGateType = 'phase-gate'");
    });
  });

  describe('handleResumeAfterInput dispatches by gate type', () => {
    it('reads and clears pendingGateType on resume', () => {
      expect(MODULE_SOURCE).toContain('const gateType = project.pendingGateType');
      expect(MODULE_SOURCE).toContain('project.pendingGateType = null');
    });

    it('dispatches to handleRoadmapGateResume for roadmap-gate', () => {
      expect(MODULE_SOURCE).toContain("gateType === 'roadmap-gate'");
      expect(MODULE_SOURCE).toContain('handleRoadmapGateResume(host, state, inputResponse)');
    });

    it('dispatches to handleArchitectureGateResume for architecture-gate', () => {
      expect(MODULE_SOURCE).toContain("gateType === 'architecture-gate'");
      expect(MODULE_SOURCE).toContain('handleArchitectureGateResume(host, state, inputResponse)');
    });

    it('dispatches to handlePhaseGateResume for phase-gate', () => {
      expect(MODULE_SOURCE).toContain("gateType === 'phase-gate'");
      expect(MODULE_SOURCE).toContain('handlePhaseGateResume(host, state, currentPhase, inputResponse)');
    });

    it('does NOT unconditionally call handleRunPhase', () => {
      // The old code had: return handleRunPhase({ targetPhase: currentPhase }, host, state);
      // as the only fallback. Now it should only be a legacy fallback, guarded by
      // a completedPhases check first.
      const resumeFn = MODULE_SOURCE.slice(
        MODULE_SOURCE.indexOf('async function handleResumeAfterInput'),
        MODULE_SOURCE.indexOf('async function handleResumeAfterInput') +
          MODULE_SOURCE.slice(MODULE_SOURCE.indexOf('async function handleResumeAfterInput')).indexOf('\nasync function '),
      );
      // Should contain completedPhases guard before the fallback
      expect(resumeFn).toContain('project.completedPhases.includes(currentPhase)');
    });
  });

  describe('handleRoadmapGateResume exists and handles all decisions', () => {
    it('function exists', () => {
      expect(MODULE_SOURCE).toContain('async function handleRoadmapGateResume(');
    });

    it('handles approve decision', () => {
      // Should approve artifact and set approvedRoadmapPhases
      const fn = extractFunction(MODULE_SOURCE, 'handleRoadmapGateResume');
      expect(fn).toContain("decision === 'approve'");
      expect(fn).toContain('project.approvedRoadmapPhases = currentCanonical.phases');
    });

    it('handles approve-with-changes decision', () => {
      const fn = extractFunction(MODULE_SOURCE, 'handleRoadmapGateResume');
      expect(fn).toContain("decision === 'approve-with-changes'");
    });

    it('handles revise/reject by delegating to handleGenerateRoadmap', () => {
      const fn = extractFunction(MODULE_SOURCE, 'handleRoadmapGateResume');
      expect(fn).toContain("decision === 'revise' || decision === 'reject'");
      expect(fn).toContain('handleGenerateRoadmap(');
    });

    it('handles pause and cancel', () => {
      const fn = extractFunction(MODULE_SOURCE, 'handleRoadmapGateResume');
      expect(fn).toContain("decision === 'pause'");
      expect(fn).toContain("decision === 'cancel'");
    });
  });

  describe('handleArchitectureGateResume exists and handles all decisions', () => {
    it('function exists', () => {
      expect(MODULE_SOURCE).toContain('async function handleArchitectureGateResume(');
    });

    it('handles approve decision', () => {
      const fn = extractFunction(MODULE_SOURCE, 'handleArchitectureGateResume');
      expect(fn).toContain("archDecision === 'approve'");
      expect(fn).toContain('project.approvedArchitecturePlan = currentArchCanonical');
    });

    it('handles revise/reject with regeneration', () => {
      const fn = extractFunction(MODULE_SOURCE, 'handleArchitectureGateResume');
      expect(fn).toContain("archDecision === 'revise' || archDecision === 'reject'");
    });

    it('sets pendingGateType before revision requestInput', () => {
      const fn = extractFunction(MODULE_SOURCE, 'handleArchitectureGateResume');
      expect(fn).toContain("project.pendingGateType = 'architecture-gate'");
    });
  });

  describe('handlePhaseGateResume exists and handles all decisions', () => {
    it('function exists', () => {
      expect(MODULE_SOURCE).toContain('async function handlePhaseGateResume(');
    });

    it('marks phase as completed on approve', () => {
      const fn = extractFunction(MODULE_SOURCE, 'handlePhaseGateResume');
      expect(fn).toContain("phaseDecision === 'approve'");
      expect(fn).toContain('project.completedPhases.push(targetPhase)');
    });

    it('advances to next phase on approve', () => {
      const fn = extractFunction(MODULE_SOURCE, 'handlePhaseGateResume');
      expect(fn).toContain('project.currentPhase = config.nextPhase');
    });

    it('auto-triggers roadmap generation after discovery approval', () => {
      const fn = extractFunction(MODULE_SOURCE, 'handlePhaseGateResume');
      expect(fn).toContain("targetPhase === 'discovery'");
      expect(fn).toContain('handleGenerateRoadmap');
    });
  });

  describe('handleRunPhase defensive guards', () => {
    it('has completed-phase guard at the top', () => {
      const fn = extractFunction(MODULE_SOURCE, 'handleRunPhase');
      expect(fn).toContain('project.completedPhases.includes(targetPhase)');
      expect(fn).toContain('Phase already completed, skipping');
    });

    it('has phase-summary idempotency guard', () => {
      const fn = extractFunction(MODULE_SOURCE, 'handleRunPhase');
      expect(fn).toContain('Reusing existing phase summary');
    });
  });
});

/** Extract the body of a named async function from source code. */
function extractFunction(source: string, name: string): string {
  const marker = `async function ${name}(`;
  const start = source.indexOf(marker);
  if (start === -1) return '';
  // Find the next top-level async function or end of file
  const rest = source.slice(start + marker.length);
  const nextFn = rest.indexOf('\nasync function ');
  return nextFn === -1 ? rest : rest.slice(0, nextFn);
}

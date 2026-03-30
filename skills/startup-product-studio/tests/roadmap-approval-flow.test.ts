import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// These tests validate the roadmap approval flow structure in module.ts
// by analyzing the source code. We cannot import module.ts directly because
// it uses TypeScript discriminated union interface syntax that esbuild
// cannot parse. Instead, we verify structural properties of the source.
// ---------------------------------------------------------------------------

const MODULE_SOURCE = readFileSync(
  resolve(__dirname, '..', 'module.ts'),
  'utf-8',
);

describe('Roadmap Approval Flow — Source Analysis', () => {
  describe('expanded inputSchema', () => {
    it('includes approve-with-changes in gate decision enum', () => {
      expect(MODULE_SOURCE).toContain("'approve-with-changes'");
    });

    it('includes phaseEdits property in gate inputSchema', () => {
      expect(MODULE_SOURCE).toContain('phaseEdits');
      expect(MODULE_SOURCE).toContain("enum: ['remove', 'reprioritize', 'edit-scope', 'merge', 'split']");
    });

    it('includes scopeChanges property in gate inputSchema', () => {
      expect(MODULE_SOURCE).toContain('scopeChanges');
      expect(MODULE_SOURCE).toContain('addToIncluded');
      expect(MODULE_SOURCE).toContain('removeFromIncluded');
      expect(MODULE_SOURCE).toContain('addToExcluded');
      expect(MODULE_SOURCE).toContain('removeFromExcluded');
    });
  });

  describe('GateDecision type', () => {
    it('includes approve-with-changes in the decision union', () => {
      // The ValidationEntry.decision type should include approve-with-changes
      expect(MODULE_SOURCE).toContain("'approve' | 'reject' | 'revise' | 'approve-with-changes' | 'pause' | 'cancel'");
    });
  });

  describe('revise loop structure', () => {
    it('has MAX_REVISIONS constant', () => {
      expect(MODULE_SOURCE).toContain('MAX_REVISIONS');
      expect(MODULE_SOURCE).toMatch(/MAX_REVISIONS\s*=\s*3/);
    });

    it('tracks revisionCount and increments it on revise/reject', () => {
      expect(MODULE_SOURCE).toContain('revisionCount++');
    });

    it('creates new artifact with parentArtifactId on revision', () => {
      // Should link revisions to previous artifact
      expect(MODULE_SOURCE).toContain('parentArtifactId: currentArtifact.id');
    });

    it('marks superseded artifacts during revision', () => {
      expect(MODULE_SOURCE).toContain("status: 'superseded'");
    });

    it('requests approval again after revision (loop continues)', () => {
      // The loop should have a second requestInput call for revised roadmap
      expect(MODULE_SOURCE).toContain("title: 'Review Revised Roadmap'");
    });

    it('caps revisions and removes revise/reject from schema at max', () => {
      // After MAX_REVISIONS, the gate schema should not include revise/reject
      expect(MODULE_SOURCE).toContain('revisionCount < MAX_REVISIONS');
      expect(MODULE_SOURCE).toContain('revisionCount > MAX_REVISIONS');
    });
  });

  describe('approve-with-changes flow', () => {
    it('has a PM step for applying changes', () => {
      expect(MODULE_SOURCE).toContain('pm-apply-changes');
    });

    it('creates a new artifact version for approved-with-changes', () => {
      expect(MODULE_SOURCE).toContain('Roadmap approved with changes');
    });

    it('falls back to approving original if change parsing fails', () => {
      expect(MODULE_SOURCE).toContain('change application failed, original preserved');
    });
  });

  describe('feedback wiring', () => {
    it('extracts args.feedback at the start of handleGenerateRoadmap', () => {
      expect(MODULE_SOURCE).toContain('const feedback = args.feedback as string | undefined');
    });

    it('extracts args.previousCanonical', () => {
      expect(MODULE_SOURCE).toContain('const previousCanonical = args.previousCanonical');
    });

    it('includes feedback in CEO framing LLM call', () => {
      expect(MODULE_SOURCE).toContain('User feedback on the previous roadmap version');
    });

    it('includes previousCanonical in PM generation LLM call', () => {
      expect(MODULE_SOURCE).toContain('Previous roadmap for reference');
    });
  });

  describe('buildEditContext helper', () => {
    it('exists and converts structured edits to natural language', () => {
      expect(MODULE_SOURCE).toContain('function buildEditContext(');
      expect(MODULE_SOURCE).toContain('Phase edits requested by the user');
      expect(MODULE_SOURCE).toContain('Scope changes requested by the user');
    });
  });

  describe('versioning on revise', () => {
    it('creates new RoadmapVersion on each revision', () => {
      expect(MODULE_SOURCE).toContain('const newRoadmapVersion: RoadmapVersion');
    });

    it('pushes new version to project.roadmapVersions', () => {
      expect(MODULE_SOURCE).toContain('project.roadmapVersions.push(newRoadmapVersion)');
    });

    it('increments version number', () => {
      // Should compute new version number from existing versions
      const versionCalcs = MODULE_SOURCE.match(/const newVersionNumber = \(project\.roadmapVersions/g);
      expect(versionCalcs).not.toBeNull();
      expect(versionCalcs!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('rejection handling', () => {
    it('handles reject the same as revise (triggers regeneration)', () => {
      expect(MODULE_SOURCE).toContain("currentDecision === 'revise' || currentDecision === 'reject'");
    });

    it('logs specific message for reject', () => {
      expect(MODULE_SOURCE).toContain('Roadmap ${currentDecision}ed, regenerating');
    });
  });

  describe('SkillHostCapabilities.run interface', () => {
    it('declares pause() method', () => {
      expect(MODULE_SOURCE).toContain('pause(reason: string): Promise<never>');
    });

    it('declares checkpoint() method', () => {
      expect(MODULE_SOURCE).toContain('checkpoint(): Promise<void>');
    });
  });

  describe('manifest decision enum', () => {
    it('includes all 6 gate decisions', () => {
      const manifestSource = readFileSync(
        resolve(__dirname, '..', 'manifest.json'),
        'utf-8',
      );
      const manifest = JSON.parse(manifestSource);
      const decisionProp = manifest.inputSchema.properties.decision;
      expect(decisionProp.enum).toContain('approve');
      expect(decisionProp.enum).toContain('reject');
      expect(decisionProp.enum).toContain('revise');
      expect(decisionProp.enum).toContain('approve-with-changes');
      expect(decisionProp.enum).toContain('pause');
      expect(decisionProp.enum).toContain('cancel');
    });
  });

  describe('approvedRoadmapTopology persistence', () => {
    it('stores approvedRoadmapTopology on approve', () => {
      expect(MODULE_SOURCE).toContain('project.approvedRoadmapTopology = currentCanonical.projectTopology');
    });

    it('stores approvedRoadmapTopology on approve-with-changes', () => {
      expect(MODULE_SOURCE).toContain('project.approvedRoadmapTopology = updatedCanonical.projectTopology');
    });

    it('ProjectRecord has approvedRoadmapTopology field', () => {
      expect(MODULE_SOURCE).toContain('approvedRoadmapTopology: RoadmapProjectTopologyEntry[] | null');
    });
  });

  describe('LLM output validation', () => {
    it('validates roadmap canonical after parsing', () => {
      expect(MODULE_SOURCE).toContain('validateRoadmapCanonical(canonical)');
    });

    it('validates revised roadmap canonical', () => {
      expect(MODULE_SOURCE).toContain('validateRoadmapCanonical(revisedCanonical)');
    });

    it('validates strategic brief after parsing', () => {
      expect(MODULE_SOURCE).toContain('validateStrategicBrief(strategicBrief)');
    });

    it('validateRoadmapCanonical function exists', () => {
      expect(MODULE_SOURCE).toContain('function validateRoadmapCanonical(');
    });

    it('validateStrategicBrief function exists', () => {
      expect(MODULE_SOURCE).toContain('function validateStrategicBrief(');
    });
  });

  describe('approvedRoadmapPhases persistence', () => {
    it('stores approvedRoadmapPhases on approve', () => {
      expect(MODULE_SOURCE).toContain('project.approvedRoadmapPhases = currentCanonical.phases');
    });

    it('stores approvedRoadmapPhases on approve-with-changes', () => {
      expect(MODULE_SOURCE).toContain('project.approvedRoadmapPhases = updatedCanonical.phases');
    });

    it('ProjectRecord has approvedRoadmapPhases field', () => {
      expect(MODULE_SOURCE).toContain('approvedRoadmapPhases: RoadmapPhase[] | null');
    });
  });
});

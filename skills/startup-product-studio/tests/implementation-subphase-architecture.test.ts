import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_PATH = resolve(__dirname, '..', 'module.ts');
const source = readFileSync(MODULE_PATH, 'utf-8');

describe('implementation subphase architecture integration', () => {
  describe('planning prompt includes architecture context', () => {
    it('calls buildArchitectureContextForPhase before planning LLM call', () => {
      // Find the planning section of handleRunImplementationSubphase
      const fnMatch = source.match(
        /async function handleRunImplementationSubphase[\s\S]*?^}/m,
      );
      expect(fnMatch).not.toBeNull();
      const fnBody = fnMatch![0];

      // Verify architecture context is built
      expect(fnBody).toContain('buildArchitectureContextForPhase(project, record)');
      // Verify it's included in the planning prompt
      expect(fnBody).toContain('ARCHITECTURE CONTEXT');
    });

    it('planning prompt instructs to reference architecture slices', () => {
      const fnMatch = source.match(
        /async function handleRunImplementationSubphase[\s\S]*?^}/m,
      );
      expect(fnMatch).not.toBeNull();
      const fnBody = fnMatch![0];
      expect(fnBody).toContain('Reference the relevant architecture slices');
      expect(fnBody).toContain('Respect all implementation guidelines and boundaries');
    });

    it('plan artifact content includes architectureSlices and technicalDependencies', () => {
      const fnMatch = source.match(
        /async function handleRunImplementationSubphase[\s\S]*?^}/m,
      );
      expect(fnMatch).not.toBeNull();
      const fnBody = fnMatch![0];
      expect(fnBody).toContain('architectureSlices: record.architectureSlices');
      expect(fnBody).toContain('technicalDependencies: record.technicalDependencies');
    });
  });

  describe('two-step planning flow: architect then developer', () => {
    it('uses software-architect role for the structural skeleton step', () => {
      const fnMatch = source.match(
        /async function handleRunImplementationSubphase[\s\S]*?^}/m,
      );
      expect(fnMatch).not.toBeNull();
      const fnBody = fnMatch![0];
      expect(fnBody).toContain("ROLE_PROMPTS['software-architect']");
      expect(fnBody).toContain('subphase-plan-arch-');
      expect(fnBody).toContain('Architect planning:');
    });

    it('uses developer role for the refinement step', () => {
      const fnMatch = source.match(
        /async function handleRunImplementationSubphase[\s\S]*?^}/m,
      );
      expect(fnMatch).not.toBeNull();
      const fnBody = fnMatch![0];
      expect(fnBody).toContain('ROLE_PROMPTS.developer');
      expect(fnBody).toContain('subphase-plan-dev-');
      expect(fnBody).toContain('Developer refining:');
    });

    it('passes architect skeleton to the developer refinement step', () => {
      const fnMatch = source.match(
        /async function handleRunImplementationSubphase[\s\S]*?^}/m,
      );
      expect(fnMatch).not.toBeNull();
      const fnBody = fnMatch![0];
      expect(fnBody).toContain('ARCHITECT SKELETON');
      expect(fnBody).toContain('architectSkeleton');
    });

    it('attaches versionMetadata with generationRunId and roleFlow', () => {
      const fnMatch = source.match(
        /async function handleRunImplementationSubphase[\s\S]*?^}/m,
      );
      expect(fnMatch).not.toBeNull();
      const fnBody = fnMatch![0];
      expect(fnBody).toContain('versionMetadata');
      expect(fnBody).toContain('generationRunId');
      expect(fnBody).toContain('roleFlow');
      expect(fnBody).toContain("roleFlow.push('software-architect')");
      expect(fnBody).toContain("roleFlow.push('developer')");
    });
  });

  describe('Claude Code goal prompt includes architecture guidance', () => {
    it('calls buildClaudeCodeArchitectureGuidance in the execution pipeline', () => {
      // Architecture guidance for bridge execution is injected via executePlanTaskGroups
      // and buildTaskGroupExecutionPrompt, which are called from handleRunImplementationSubphase
      expect(source).toContain('buildClaudeCodeArchitectureGuidance(project, record)');
    });

    it('injects architecture guidance into the goal prompt', () => {
      // The archGuidance variable is used in executePlanTaskGroups (fallback path)
      // and in buildTaskGroupExecutionPrompt (structured path)
      expect(source).toContain('archGuidance');
      expect(source).toContain('goalPrompt');
    });
  });

  describe('QA validation includes architecture alignment check', () => {
    it('calls buildArchitectureContextForPhase for QA prompt', () => {
      const fnMatch = source.match(
        /async function handleRunImplementationSubphase[\s\S]*?^}/m,
      );
      expect(fnMatch).not.toBeNull();
      const fnBody = fnMatch![0];
      // Should have a QA-specific architecture context call
      expect(fnBody).toContain('qaArchitectureContext');
    });

    it('QA prompt includes architecture context and assessment schema fields', () => {
      const fnMatch = source.match(
        /async function handleRunImplementationSubphase[\s\S]*?^}/m,
      );
      expect(fnMatch).not.toBeNull();
      const fnBody = fnMatch![0];
      expect(fnBody).toContain('ARCHITECTURE CONTEXT');
      expect(fnBody).toContain('qaArchitectureContext');
    });

    it('QA report schema includes architecture assessment fields for drift and boundaries', () => {
      // The architecture assessment is defined in buildQaReportSchema, verify the schema field names
      expect(source).toContain('alignmentStatus');
      expect(source).toContain('driftFindings');
      expect(source).toContain('qualityAttributeNotes');
      expect(source).toContain('boundaryViolations');
    });

    it('QA artifact content includes architectureAssessment when available', () => {
      const fnMatch = source.match(
        /async function handleRunImplementationSubphase[\s\S]*?^}/m,
      );
      expect(fnMatch).not.toBeNull();
      const fnBody = fnMatch![0];
      expect(fnBody).toContain('architectureAssessment');
      expect(fnBody).toContain('extractArchitectureAssessment');
    });
  });

  describe('buildProjectContext includes architecture summary', () => {
    it('includes approved architecture description when available', () => {
      const fnMatch = source.match(
        /function buildProjectContext[\s\S]*?^}/m,
      );
      expect(fnMatch).not.toBeNull();
      const fnBody = fnMatch![0];
      expect(fnBody).toContain('project.approvedArchitecturePlan');
      expect(fnBody).toContain('Approved Architecture');
    });

    it('includes architecture topology names', () => {
      const fnMatch = source.match(
        /function buildProjectContext[\s\S]*?^}/m,
      );
      expect(fnMatch).not.toBeNull();
      const fnBody = fnMatch![0];
      expect(fnBody).toContain('Architecture Topology');
    });
  });
});

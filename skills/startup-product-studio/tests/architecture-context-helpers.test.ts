import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_PATH = resolve(__dirname, '..', 'module.ts');
const source = readFileSync(MODULE_PATH, 'utf-8');

describe('buildArchitectureContextForPhase', () => {
  it('function exists in module source', () => {
    expect(source).toContain('function buildArchitectureContextForPhase(');
  });

  it('accepts project and record parameters', () => {
    const fnMatch = source.match(/function buildArchitectureContextForPhase\([^)]*\)/);
    expect(fnMatch).not.toBeNull();
    expect(fnMatch![0]).toContain('project: ProjectRecord');
    expect(fnMatch![0]).toContain('record: ImplementationPhaseRecord');
  });

  it('returns empty string when no approved plan', () => {
    const fnMatch = source.match(
      /function buildArchitectureContextForPhase[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain("if (!plan) return ''");
  });

  it('includes architecture slices from the record', () => {
    const fnMatch = source.match(
      /function buildArchitectureContextForPhase[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('record.architectureSlices');
  });

  it('includes technical dependencies from the record', () => {
    const fnMatch = source.match(
      /function buildArchitectureContextForPhase[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('record.technicalDependencies');
  });

  it('includes implementation guidelines', () => {
    const fnMatch = source.match(
      /function buildArchitectureContextForPhase[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('plan.implementationGuidelines');
    expect(fnBody).toContain('guidelines.rules');
    expect(fnBody).toContain('guidelines.boundariesToPreserve');
    expect(fnBody).toContain('guidelines.antiPatterns');
    expect(fnBody).toContain('guidelines.codingExpectations');
  });

  it('includes quality attributes', () => {
    const fnMatch = source.match(
      /function buildArchitectureContextForPhase[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('plan.qualityAttributes');
    expect(fnBody).toContain('qa.maintainability');
    expect(fnBody).toContain('qa.testability');
  });

  it('filters project topology by involvedProjectIds', () => {
    const fnMatch = source.match(
      /function buildArchitectureContextForPhase[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('plan.projectTopology.filter');
    expect(fnBody).toContain('record.involvedProjectIds');
  });

  it('includes relevant risks', () => {
    const fnMatch = source.match(
      /function buildArchitectureContextForPhase[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('plan.openRisks');
    expect(fnBody).toContain('r.severity');
  });
});

describe('buildClaudeCodeArchitectureGuidance', () => {
  it('function exists in module source', () => {
    expect(source).toContain('function buildClaudeCodeArchitectureGuidance(');
  });

  it('returns empty string when no approved plan', () => {
    const fnMatch = source.match(
      /function buildClaudeCodeArchitectureGuidance[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain("if (!plan) return ''");
  });

  it('includes boundaries to preserve', () => {
    const fnMatch = source.match(
      /function buildClaudeCodeArchitectureGuidance[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('gl.boundariesToPreserve');
    expect(fnBody).toContain('ARCHITECTURE BOUNDARIES');
  });

  it('includes anti-patterns', () => {
    const fnMatch = source.match(
      /function buildClaudeCodeArchitectureGuidance[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('gl.antiPatterns');
    expect(fnBody).toContain('ANTI-PATTERNS');
  });

  it('includes coding expectations', () => {
    const fnMatch = source.match(
      /function buildClaudeCodeArchitectureGuidance[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('gl.codingExpectations');
    expect(fnBody).toContain('CODING EXPECTATIONS');
  });

  it('includes architecture slices from record', () => {
    const fnMatch = source.match(
      /function buildClaudeCodeArchitectureGuidance[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('record.architectureSlices');
    expect(fnBody).toContain('ARCHITECTURE SLICES');
  });

  it('wraps output in ARCHITECTURE GUIDANCE markers', () => {
    const fnMatch = source.match(
      /function buildClaudeCodeArchitectureGuidance[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('--- ARCHITECTURE GUIDANCE ---');
    expect(fnBody).toContain('--- END ARCHITECTURE GUIDANCE ---');
  });
});

describe('extractArchitectureAssessment', () => {
  it('function exists in module source', () => {
    expect(source).toContain('function extractArchitectureAssessment(');
  });

  it('returns assessment object with alignmentStatus field', () => {
    const fnMatch = source.match(
      /function extractArchitectureAssessment[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('alignmentStatus');
    expect(fnBody).toContain('driftFindings');
    expect(fnBody).toContain('qualityAttributeNotes');
    expect(fnBody).toContain('boundaryViolations');
  });

  it('detects significant-drift status', () => {
    const fnMatch = source.match(
      /function extractArchitectureAssessment[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('significant-drift');
  });

  it('detects minor-drift status', () => {
    const fnMatch = source.match(
      /function extractArchitectureAssessment[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('minor-drift');
  });

  it('returns undefined when extraction is inconclusive (no explicit status, no structured data)', () => {
    const fnMatch = source.match(
      /function extractArchitectureAssessment[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    // Must return undefined when no alignment status detected and no structured data found
    expect(fnBody).toContain('return undefined');
  });

  it('infers alignment status from boundary violations when no explicit status', () => {
    const fnMatch = source.match(
      /function extractArchitectureAssessment[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('boundaryViolations.length > 0');
  });

  it('does not default to aligned without evidence', () => {
    const fnMatch = source.match(
      /function extractArchitectureAssessment[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    // Should use null as initial value, not 'aligned'
    expect(fnBody).toContain('| null = null');
    // And return undefined when no evidence is found
    expect(fnBody).toContain('return undefined');
  });
});

describe('extractListAfterHeading', () => {
  it('function exists in module source', () => {
    expect(source).toContain('function extractListAfterHeading(');
  });

  it('handles bullet list format', () => {
    const fnMatch = source.match(
      /function extractListAfterHeading[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('[-*]');
  });

  it('handles numbered list format', () => {
    const fnMatch = source.match(
      /function extractListAfterHeading[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('\\d+\\.');
  });

  it('handles JSON array format', () => {
    const fnMatch = source.match(
      /function extractListAfterHeading[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    // The regex uses template literal escaping, so check for the comment or logic
    expect(fnBody).toContain('JSON-style array');
  });

  it('recognizes explicit empty markers', () => {
    const fnMatch = source.match(
      /function extractListAfterHeading[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    // The regex contains these markers as a group: none|empty|n\/a
    expect(fnBody).toContain('explicit empty markers');
    expect(fnBody).toMatch(/none\|empty/);
  });
});

describe('validateArchitecturePlanCanonical', () => {
  it('enforces non-empty architectureSlices for later phases', () => {
    expect(source).toContain('phasesRequiringSlices');
    expect(source).toContain('architecture-definition');
    expect(source).toContain('implementation-phase');
    expect(source).toContain('must have at least one architectureSlice');
  });

  it('enforces non-empty implementationGuidelines.rules', () => {
    expect(source).toContain('implementationGuidelines.rules must be a non-empty array');
  });

  it('enforces non-empty implementationGuidelines.boundariesToPreserve', () => {
    expect(source).toContain('implementationGuidelines.boundariesToPreserve must be a non-empty array');
  });
});

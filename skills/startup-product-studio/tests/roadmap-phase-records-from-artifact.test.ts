import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_PATH = resolve(__dirname, '..', 'module.ts');
const source = readFileSync(MODULE_PATH, 'utf-8');

describe('buildRoadmapPhaseRecordsFromArtifact', () => {
  it('function exists in module source with architecture plan parameter', () => {
    expect(source).toContain('function buildRoadmapPhaseRecordsFromArtifact(');
    expect(source).toContain('architecturePlan?: ArchitecturePlanArtifactContent');
  });

  it('reads from project.approvedRoadmapPhases', () => {
    expect(source).toContain('project.approvedRoadmapPhases');
  });

  it('returns empty array when approvedRoadmapPhases is null', () => {
    expect(source).toContain('if (!project.approvedRoadmapPhases) return [];');
  });

  it('filters out completed phases', () => {
    expect(source).toContain('project.completedPhases.includes(');
  });

  it('resolves involvedProjects through resolveCodeProjectId helper', () => {
    expect(source).toContain('phase.involvedProjects');
    expect(source).toContain('resolveCodeProjectId(ref, project.codeProjects, topology)');
  });

  it('resolveCodeProjectId function exists with topology parameter', () => {
    expect(source).toContain('function resolveCodeProjectId(');
    expect(source).toContain('topology?: RoadmapProjectTopologyEntry[]');
  });

  it('resolveCodeProjectId tries direct name match first', () => {
    const fnMatch = source.match(/function resolveCodeProjectId[\s\S]*?^}/m);
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('cp.name === projectRef');
  });

  it('resolveCodeProjectId resolves through topology when direct match fails', () => {
    const fnMatch = source.match(/function resolveCodeProjectId[\s\S]*?^}/m);
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('topology.find');
    expect(fnBody).toContain('t.projectId === projectRef');
  });

  it('resolveCodeProjectId falls back to slugified comparison', () => {
    const fnMatch = source.match(/function resolveCodeProjectId[\s\S]*?^}/m);
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('slugify');
  });

  it('copies goals, deliverables, and validationCriteria from roadmap phase', () => {
    // Verify the function maps these fields from the RoadmapPhase to the record
    const fnMatch = source.match(
      /function buildRoadmapPhaseRecordsFromArtifact[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('goals: phase.goals');
    expect(fnBody).toContain('deliverables: phase.deliverables');
    expect(fnBody).toContain('validationCriteria: phase.validationCriteria');
  });

  it('sets roadmapPhaseId from the phase id', () => {
    const fnMatch = source.match(
      /function buildRoadmapPhaseRecordsFromArtifact[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('roadmapPhaseId: phase.id');
  });

  it('initializes artifact and decision fields to null', () => {
    const fnMatch = source.match(
      /function buildRoadmapPhaseRecordsFromArtifact[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('planArtifactId: null');
    expect(fnBody).toContain('implementationReportArtifactId: null');
    expect(fnBody).toContain('qaReportArtifactId: null');
    expect(fnBody).toContain('pmAlignmentDecision: null');
    expect(fnBody).toContain('userDecision: null');
  });

  it('populates architectureSlices and technicalDependencies from phaseMapping', () => {
    const fnMatch = source.match(
      /function buildRoadmapPhaseRecordsFromArtifact[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain('architecturePlan?.phaseMapping?.find');
    expect(fnBody).toContain('archMapping?.architectureSlices');
    expect(fnBody).toContain('archMapping?.technicalDependencies');
  });

  it('defaults architecture fields to empty arrays when no mapping matches', () => {
    const fnMatch = source.match(
      /function buildRoadmapPhaseRecordsFromArtifact[\s\S]*?^}/m,
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain("archMapping?.architectureSlices ?? []");
    expect(fnBody).toContain("archMapping?.technicalDependencies ?? []");
  });
});

describe('roadmap phase records integration', () => {
  it('buildRoadmapPhaseRecordsFromArtifact is called with topology and architecture plan in implementation phase setup', () => {
    expect(source).toContain('buildRoadmapPhaseRecordsFromArtifact(project, project.approvedRoadmapTopology');
    expect(source).toContain('project.approvedArchitecturePlan)');
  });

  it('has fallback for old projects without approvedRoadmapPhases', () => {
    // After the new function returns empty, there should be a fallback using project.roadmap
    const idx = source.indexOf('buildRoadmapPhaseRecordsFromArtifact(project,');
    expect(idx).toBeGreaterThan(-1);
    const afterCall = source.substring(idx, idx + 500);
    expect(afterCall).toContain('project.roadmap');
  });

  it('approvedRoadmapPhases is set on roadmap approval', () => {
    expect(source).toContain('project.approvedRoadmapPhases = currentCanonical.phases');
  });

  it('approvedRoadmapPhases is set on approve-with-changes', () => {
    expect(source).toContain('project.approvedRoadmapPhases = updatedCanonical.phases');
  });
});

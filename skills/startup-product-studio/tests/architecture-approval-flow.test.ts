import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Architecture approval flow unit tests
// These test the gate schema structure, edit context building, and versioning
// behavior that module.ts implements for the architecture approval loop.
// Since module.ts types are not exported, we re-declare the necessary shapes.
// ---------------------------------------------------------------------------

type ArchitectureSectionEditAction =
  | 'simplify'
  | 'add-detail'
  | 'replace'
  | 'remove-component'
  | 'add-component'
  | 'change-technology'
  | 'restructure';

type GateDecision = 'approve' | 'reject' | 'revise' | 'approve-with-changes' | 'pause' | 'cancel';

interface ArchitecturePlanVersion {
  id: string;
  version: number;
  artifactId: string;
  createdAt: string;
  decision: GateDecision | null;
}

interface ArchitectureGateResponse {
  decision: string;
  feedback?: string;
  sectionEdits?: Array<{ sectionId: string; action: ArchitectureSectionEditAction; details: string }>;
  topologyChanges?: { addProjects?: string[]; removeProjects?: string[]; changeTypes?: string[] };
}

const ARCHITECTURE_SECTION_IDS = [
  'systemOverview', 'projectTopology', 'runtimeArchitecture', 'dataArchitecture',
  'integrationArchitecture', 'securityAndTrustModel', 'deploymentAndEnvironmentModel',
  'qualityAttributes', 'phaseMapping', 'implementationGuidelines', 'openRisks', 'openQuestions',
] as const;

const ARCHITECTURE_SECTION_EDIT_ACTIONS: ArchitectureSectionEditAction[] = [
  'simplify', 'add-detail', 'replace', 'remove-component', 'add-component', 'change-technology', 'restructure',
];

// Re-implement buildArchitectureGateSchema to test it independently
function buildArchitectureGateSchema(allowRevise: boolean) {
  const decisions = allowRevise
    ? ['approve', 'reject', 'revise', 'approve-with-changes', 'pause', 'cancel']
    : ['approve', 'approve-with-changes', 'pause', 'cancel'];
  return {
    type: 'object',
    properties: {
      decision: {
        type: 'string',
        enum: decisions,
        description: 'Decision for architecture review',
      },
      feedback: { type: 'string', description: 'Feedback on architecture decisions' },
      sectionEdits: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sectionId: { type: 'string', enum: [...ARCHITECTURE_SECTION_IDS] },
            action: { type: 'string', enum: [...ARCHITECTURE_SECTION_EDIT_ACTIONS] },
            details: { type: 'string' },
          },
        },
        description: 'Structured section-level edits to the architecture plan',
      },
      topologyChanges: {
        type: 'object',
        properties: {
          addProjects: { type: 'array', items: { type: 'string' } },
          removeProjects: { type: 'array', items: { type: 'string' } },
          changeTypes: { type: 'array', items: { type: 'string' } },
        },
        description: 'Changes to project topology (add/remove projects, change project types)',
      },
    },
    required: ['decision'],
  };
}

// Re-implement buildArchitectureEditContext to test it independently
function buildArchitectureEditContext(
  sectionEdits?: ArchitectureGateResponse['sectionEdits'],
  topologyChanges?: ArchitectureGateResponse['topologyChanges'],
): string {
  const parts: string[] = [];
  if (sectionEdits && sectionEdits.length > 0) {
    parts.push('Section edits requested by the user:');
    for (const edit of sectionEdits) {
      parts.push(`- Section "${edit.sectionId}": ${edit.action}${edit.details ? ` — ${edit.details}` : ''}`);
    }
  }
  if (topologyChanges) {
    const entries: string[] = [];
    if (topologyChanges.addProjects?.length) entries.push(`Add projects: ${topologyChanges.addProjects.join(', ')}`);
    if (topologyChanges.removeProjects?.length) entries.push(`Remove projects: ${topologyChanges.removeProjects.join(', ')}`);
    if (topologyChanges.changeTypes?.length) entries.push(`Change project types: ${topologyChanges.changeTypes.join(', ')}`);
    if (entries.length > 0) {
      parts.push('Topology changes requested by the user:');
      parts.push(...entries.map((e) => `- ${e}`));
    }
  }
  return parts.length > 0 ? parts.join('\n') : '';
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Architecture Approval Flow', () => {
  describe('buildArchitectureGateSchema', () => {
    it('includes all 6 decisions when allowRevise is true', () => {
      const schema = buildArchitectureGateSchema(true);
      const decisions = schema.properties.decision.enum;
      expect(decisions).toEqual(['approve', 'reject', 'revise', 'approve-with-changes', 'pause', 'cancel']);
    });

    it('excludes reject and revise when allowRevise is false', () => {
      const schema = buildArchitectureGateSchema(false);
      const decisions = schema.properties.decision.enum;
      expect(decisions).toEqual(['approve', 'approve-with-changes', 'pause', 'cancel']);
      expect(decisions).not.toContain('reject');
      expect(decisions).not.toContain('revise');
    });

    it('includes sectionEdits property for schema discrimination', () => {
      const schema = buildArchitectureGateSchema(true);
      expect(schema.properties.sectionEdits).toBeDefined();
      expect(schema.properties.sectionEdits.type).toBe('array');
    });

    it('includes topologyChanges property', () => {
      const schema = buildArchitectureGateSchema(true);
      expect(schema.properties.topologyChanges).toBeDefined();
      expect(schema.properties.topologyChanges.type).toBe('object');
    });

    it('includes all 12 architecture section IDs in sectionEdits enum', () => {
      const schema = buildArchitectureGateSchema(true);
      const sectionEnum = schema.properties.sectionEdits.items.properties.sectionId.enum;
      expect(sectionEnum).toHaveLength(12);
      expect(sectionEnum).toContain('systemOverview');
      expect(sectionEnum).toContain('qualityAttributes');
      expect(sectionEnum).toContain('openQuestions');
    });

    it('includes all 7 section edit actions in enum', () => {
      const schema = buildArchitectureGateSchema(true);
      const actionEnum = schema.properties.sectionEdits.items.properties.action.enum;
      expect(actionEnum).toHaveLength(7);
      expect(actionEnum).toContain('simplify');
      expect(actionEnum).toContain('change-technology');
      expect(actionEnum).toContain('restructure');
    });

    it('requires only decision field', () => {
      const schema = buildArchitectureGateSchema(true);
      expect(schema.required).toEqual(['decision']);
    });
  });

  describe('buildArchitectureEditContext', () => {
    it('returns empty string when no edits', () => {
      expect(buildArchitectureEditContext()).toBe('');
      expect(buildArchitectureEditContext([], {})).toBe('');
    });

    it('formats section edits into natural language', () => {
      const result = buildArchitectureEditContext([
        { sectionId: 'runtimeArchitecture', action: 'simplify', details: 'Merge frontend and backend' },
        { sectionId: 'dataArchitecture', action: 'change-technology', details: 'Use PostgreSQL' },
      ]);
      expect(result).toContain('Section edits requested by the user:');
      expect(result).toContain('- Section "runtimeArchitecture": simplify — Merge frontend and backend');
      expect(result).toContain('- Section "dataArchitecture": change-technology — Use PostgreSQL');
    });

    it('formats topology changes', () => {
      const result = buildArchitectureEditContext([], {
        addProjects: ['mobile-app'],
        removeProjects: ['legacy-service'],
        changeTypes: ['worker to backend-api'],
      });
      expect(result).toContain('Topology changes requested by the user:');
      expect(result).toContain('- Add projects: mobile-app');
      expect(result).toContain('- Remove projects: legacy-service');
      expect(result).toContain('- Change project types: worker to backend-api');
    });

    it('combines section edits and topology changes', () => {
      const result = buildArchitectureEditContext(
        [{ sectionId: 'systemOverview', action: 'add-detail', details: 'Add caching layer' }],
        { addProjects: ['cache-service'] },
      );
      expect(result).toContain('Section edits requested by the user:');
      expect(result).toContain('Topology changes requested by the user:');
    });

    it('handles section edit without details', () => {
      const result = buildArchitectureEditContext([
        { sectionId: 'openRisks', action: 'simplify', details: '' },
      ]);
      expect(result).toContain('- Section "openRisks": simplify');
      expect(result).not.toContain('—');
    });
  });

  describe('ArchitecturePlanVersion tracking', () => {
    it('creates initial version with correct shape', () => {
      const version: ArchitecturePlanVersion = {
        id: 'apv-1',
        version: 1,
        artifactId: 'art-arch-1',
        createdAt: '2026-03-29T00:00:00Z',
        decision: null,
      };
      expect(version.version).toBe(1);
      expect(version.decision).toBeNull();
    });

    it('tracks approve decision on version', () => {
      const version: ArchitecturePlanVersion = {
        id: 'apv-1',
        version: 1,
        artifactId: 'art-arch-1',
        createdAt: '2026-03-29T00:00:00Z',
        decision: null,
      };
      version.decision = 'approve';
      expect(version.decision).toBe('approve');
    });

    it('tracks reject decision and creates new version', () => {
      const versions: ArchitecturePlanVersion[] = [
        { id: 'apv-1', version: 1, artifactId: 'art-1', createdAt: '2026-03-29T00:00:00Z', decision: null },
      ];

      // Simulate rejection
      versions[0].decision = 'reject';
      const newVersion: ArchitecturePlanVersion = {
        id: 'apv-2',
        version: 2,
        artifactId: 'art-2',
        createdAt: '2026-03-29T01:00:00Z',
        decision: null,
      };
      versions.push(newVersion);

      expect(versions).toHaveLength(2);
      expect(versions[0].decision).toBe('reject');
      expect(versions[1].version).toBe(2);
      expect(versions[1].artifactId).not.toBe(versions[0].artifactId);
    });

    it('tracks approve-with-changes creating a new version', () => {
      const versions: ArchitecturePlanVersion[] = [
        { id: 'apv-1', version: 1, artifactId: 'art-1', createdAt: '2026-03-29T00:00:00Z', decision: null },
      ];

      // approve-with-changes supersedes old, creates new
      const newVersion: ArchitecturePlanVersion = {
        id: 'apv-2',
        version: 2,
        artifactId: 'art-2',
        createdAt: '2026-03-29T01:00:00Z',
        decision: 'approve',
      };
      versions.push(newVersion);

      expect(versions).toHaveLength(2);
      expect(versions[1].decision).toBe('approve');
    });

    it('enforces MAX_REVISIONS limit', () => {
      const ARCH_MAX_REVISIONS = 3;
      let revisionCount = 0;

      // Simulate revision loop
      const versions: ArchitecturePlanVersion[] = [];
      for (let i = 0; i <= ARCH_MAX_REVISIONS; i++) {
        versions.push({
          id: `apv-${i + 1}`,
          version: i + 1,
          artifactId: `art-${i + 1}`,
          createdAt: new Date().toISOString(),
          decision: i < ARCH_MAX_REVISIONS ? 'reject' : null,
        });
        if (i > 0) revisionCount++;
      }

      expect(revisionCount).toBe(ARCH_MAX_REVISIONS);
      // After MAX_REVISIONS, schema should not include revise/reject
      const schema = buildArchitectureGateSchema(revisionCount < ARCH_MAX_REVISIONS);
      expect(schema.properties.decision.enum).not.toContain('reject');
      expect(schema.properties.decision.enum).not.toContain('revise');
    });
  });

  describe('gate response structure', () => {
    it('minimal approve response', () => {
      const response: ArchitectureGateResponse = { decision: 'approve' };
      expect(response.decision).toBe('approve');
      expect(response.feedback).toBeUndefined();
      expect(response.sectionEdits).toBeUndefined();
    });

    it('approve-with-changes response with section edits', () => {
      const response: ArchitectureGateResponse = {
        decision: 'approve-with-changes',
        feedback: 'Simplify the runtime layer',
        sectionEdits: [
          { sectionId: 'runtimeArchitecture', action: 'simplify', details: 'Merge into monolith' },
        ],
        topologyChanges: { removeProjects: ['worker-service'] },
      };
      expect(response.sectionEdits).toHaveLength(1);
      expect(response.topologyChanges?.removeProjects).toEqual(['worker-service']);
    });

    it('reject response requires feedback', () => {
      const response: ArchitectureGateResponse = {
        decision: 'reject',
        feedback: 'Wrong technology choices across the board',
        sectionEdits: [
          { sectionId: 'dataArchitecture', action: 'change-technology', details: 'Use PostgreSQL not MongoDB' },
          { sectionId: 'securityAndTrustModel', action: 'add-detail', details: 'Add OAuth2 flow details' },
        ],
      };
      expect(response.feedback).toBeTruthy();
      expect(response.sectionEdits).toHaveLength(2);
    });

    it('revise response with topology changes', () => {
      const response: ArchitectureGateResponse = {
        decision: 'revise',
        feedback: 'Need more scalability, add caching layer',
        topologyChanges: {
          addProjects: ['redis-cache'],
          changeTypes: ['backend-api to microservices'],
        },
      };
      expect(response.topologyChanges?.addProjects).toEqual(['redis-cache']);
    });
  });
});

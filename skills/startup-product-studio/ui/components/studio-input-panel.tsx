'use client';

import { useState } from 'react';
type UUIDv7 = string;
import type { UserInputRequest, SkillWorkspaceRef } from '../views/skill-view-props';
import { ArchitectureGateDecisionPanel } from './architecture-gate-decision-panel';
import { DialoguePanel } from './dialogue-panel';
import { GateDecisionPanel } from './gate-decision-panel';
import { ImplPlanGateDecisionPanel } from './impl-plan-gate-decision-panel';
import { QaGateDecisionPanel } from './qa-gate-decision-panel';
import { RoadmapGateDecisionPanel } from './roadmap-gate-decision-panel';
import { ARCHITECTURE_SECTION_LABELS, ARCHITECTURE_SECTION_IDS, IMPL_PLAN_TASK_TYPE_LABELS, QA_CHECK_STATUS_LABELS } from '../types';
import type { ArchitectureSectionId, PhaseDialogue, ImplPlanTaskType, ImplPlanRiskSeverity, QaCheckStatus, QaOverallVerdict } from '../types';

// ---------------------------------------------------------------------------
// Schema detection
// ---------------------------------------------------------------------------

function isGateDecisionSchema(schema: Record<string, unknown>): boolean {
  const properties = schema.properties as Record<string, unknown> | undefined;
  if (!properties) return false;

  const decision = properties.decision as Record<string, unknown> | undefined;
  if (!decision) return false;

  const enumValues = decision.enum as string[] | undefined;
  if (!Array.isArray(enumValues)) return false;

  return enumValues.includes('approve') && enumValues.includes('reject');
}

function isArchitectureGateSchema(schema: Record<string, unknown>): boolean {
  const properties = schema.properties as Record<string, unknown> | undefined;
  if (!properties) return false;

  const decision = properties.decision as Record<string, unknown> | undefined;
  if (!decision) return false;

  const enumValues = decision.enum as string[] | undefined;
  if (!Array.isArray(enumValues)) return false;

  return enumValues.includes('approve-with-changes') && !!properties.sectionEdits;
}

function isImplPlanGateSchema(schema: Record<string, unknown>): boolean {
  const properties = schema.properties as Record<string, unknown> | undefined;
  if (!properties) return false;

  const decision = properties.decision as Record<string, unknown> | undefined;
  if (!decision) return false;

  const enumValues = decision.enum as string[] | undefined;
  if (!Array.isArray(enumValues)) return false;

  return enumValues.includes('approve-with-changes') && !!properties.taskEdits;
}

function isQaGateSchema(schema: Record<string, unknown>): boolean {
  const properties = schema.properties as Record<string, unknown> | undefined;
  if (!properties) return false;

  const decision = properties.decision as Record<string, unknown> | undefined;
  if (!decision) return false;

  const enumValues = decision.enum as string[] | undefined;
  if (!Array.isArray(enumValues)) return false;

  return enumValues.includes('approve-with-changes') && !!properties.checkOverrides;
}

function isRoadmapGateSchema(schema: Record<string, unknown>): boolean {
  const properties = schema.properties as Record<string, unknown> | undefined;
  if (!properties) return false;

  const decision = properties.decision as Record<string, unknown> | undefined;
  if (!decision) return false;

  const enumValues = decision.enum as string[] | undefined;
  if (!Array.isArray(enumValues)) return false;

  return enumValues.includes('approve-with-changes');
}

function isDialogueInputSchema(schema: Record<string, unknown>): boolean {
  const properties = schema.properties as Record<string, unknown> | undefined;
  if (!properties) return false;
  return '_dialogueQuestionId' in properties || 'answer' in properties;
}

function resolveCurrentDialogue(workspace: SkillWorkspaceRef | null): PhaseDialogue | null {
  if (!workspace) return null;
  const state = workspace.state as Record<string, unknown> | undefined;
  if (!state) return null;
  const projects = state.projects as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(projects)) return null;

  const activeProjectId = state.activeProjectId as string | undefined;
  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId)
    : projects[0];
  if (!activeProject) return null;

  const phaseDialogues = activeProject.phaseDialogues as Record<string, PhaseDialogue> | undefined;
  if (!phaseDialogues) return null;

  const currentPhase = activeProject.currentPhase as string | undefined;
  if (!currentPhase) return null;

  return phaseDialogues[currentPhase] ?? null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ArtifactSummary {
  id: string;
  type: string;
  title: string;
  status: string;
  content?: Record<string, unknown>;
}

interface StudioInputPanelProps {
  requests: UserInputRequest[];
  onAnswer: (id: UUIDv7, response: Record<string, unknown>) => void;
  onCancel: (id: UUIDv7) => void;
  artifacts?: ArtifactSummary[];
  workspace?: SkillWorkspaceRef | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudioInputPanel({ requests, onAnswer, onCancel, artifacts, workspace }: StudioInputPanelProps) {
  const pending = requests.filter((r) => r.status === 'pending');
  if (pending.length === 0) return null;

  // Resolve roadmap phases from the latest roadmap artifact for roadmap gate panels
  const roadmapPhases = resolveRoadmapPhases(artifacts);
  // Resolve architecture sections from the latest architecture-plan artifact
  const architectureSections = resolveArchitectureSections(artifacts);
  // Resolve implementation plan context from latest implementation-phase-plan artifact
  const implPlanContext = resolveImplPlanContext(artifacts);
  // Resolve QA report context from latest qa-report artifact
  const qaReportContext = resolveQaReportContext(artifacts);

  return (
    <div data-testid="studio-input-panel" className="space-y-3">
      <h2 className="text-sm font-medium">Pending Input</h2>
      {pending.map((req) => {
        if (isDialogueInputSchema(req.inputSchema)) {
          return (
            <DialoguePanel
              key={req.id}
              request={req}
              workspace={workspace ?? null}
              onAnswer={onAnswer}
              onCancel={onCancel}
            />
          );
        }
        if (isArchitectureGateSchema(req.inputSchema)) {
          return (
            <ArchitectureGateDecisionPanel
              key={req.id}
              request={req}
              architectureSections={architectureSections}
              onAnswer={onAnswer}
              onCancel={onCancel}
            />
          );
        }
        if (isQaGateSchema(req.inputSchema)) {
          return (
            <QaGateDecisionPanel
              key={req.id}
              request={req}
              functionalityChecks={qaReportContext.functionalityChecks}
              dodChecks={qaReportContext.dodChecks}
              overallVerdict={qaReportContext.overallVerdict}
              onAnswer={onAnswer}
              onCancel={onCancel}
            />
          );
        }
        if (isImplPlanGateSchema(req.inputSchema)) {
          return (
            <ImplPlanGateDecisionPanel
              key={req.id}
              request={req}
              tasks={implPlanContext.tasks}
              risks={implPlanContext.risks}
              scopeDefinition={implPlanContext.scopeDefinition}
              onAnswer={onAnswer}
              onCancel={onCancel}
            />
          );
        }
        if (isRoadmapGateSchema(req.inputSchema)) {
          return (
            <RoadmapGateDecisionPanel
              key={req.id}
              request={req}
              roadmapPhases={roadmapPhases}
              onAnswer={onAnswer}
              onCancel={onCancel}
            />
          );
        }
        if (isGateDecisionSchema(req.inputSchema)) {
          return <GateDecisionPanel key={req.id} request={req} onAnswer={onAnswer} onCancel={onCancel} />;
        }
        return <FallbackInputPanel key={req.id} request={req} onAnswer={onAnswer} onCancel={onCancel} />;
      })}
    </div>
  );
}

function resolveRoadmapPhases(
  artifacts?: ArtifactSummary[],
): Array<{ id: string; name: string }> {
  if (!artifacts) return [];
  const roadmapArtifact = [...artifacts]
    .reverse()
    .find((a) => a.type === 'roadmap' && a.content);
  if (!roadmapArtifact?.content) return [];
  const phases = roadmapArtifact.content.phases;
  if (!Array.isArray(phases)) return [];
  return phases
    .filter((p: unknown): p is { id: string; name: string } =>
      typeof p === 'object' && p !== null && typeof (p as Record<string, unknown>).id === 'string' && typeof (p as Record<string, unknown>).name === 'string',
    )
    .map((p) => ({ id: p.id, name: p.name }));
}

function resolveArchitectureSections(
  artifacts?: ArtifactSummary[],
): Array<{ id: ArchitectureSectionId; label: string }> {
  if (!artifacts) {
    return ARCHITECTURE_SECTION_IDS.map((id) => ({ id, label: ARCHITECTURE_SECTION_LABELS[id] }));
  }
  const archArtifact = [...artifacts]
    .reverse()
    .find((a) => a.type === 'architecture-plan' && a.content);
  if (!archArtifact?.content) {
    return ARCHITECTURE_SECTION_IDS.map((id) => ({ id, label: ARCHITECTURE_SECTION_LABELS[id] }));
  }
  // Return sections that exist in the artifact content
  return ARCHITECTURE_SECTION_IDS
    .filter((id) => id in (archArtifact.content as Record<string, unknown>))
    .map((id) => ({ id, label: ARCHITECTURE_SECTION_LABELS[id] }));
}

function resolveImplPlanContext(
  artifacts?: ArtifactSummary[],
): {
  tasks: Array<{ id: string; title: string; type: ImplPlanTaskType; groupLabel: string }>;
  risks: Array<{ id: string; description: string; severity: ImplPlanRiskSeverity }>;
  scopeDefinition: { included: string[]; excluded: string[] } | null;
} {
  const empty = { tasks: [], risks: [], scopeDefinition: null };
  if (!artifacts) return empty;

  const planArtifact = [...artifacts]
    .reverse()
    .find((a) => a.type === 'implementation-phase-plan' && a.content);
  if (!planArtifact?.content) return empty;

  const content = planArtifact.content as Record<string, unknown>;

  // Flatten tasks from workBreakdown groups
  const tasks: Array<{ id: string; title: string; type: ImplPlanTaskType; groupLabel: string }> = [];
  const workBreakdown = content.workBreakdown;
  if (Array.isArray(workBreakdown)) {
    for (const group of workBreakdown) {
      const g = group as Record<string, unknown>;
      const groupLabel = typeof g.groupLabel === 'string' ? g.groupLabel : 'Unknown';
      const groupTasks = g.tasks;
      if (Array.isArray(groupTasks)) {
        for (const task of groupTasks) {
          const t = task as Record<string, unknown>;
          if (typeof t.id === 'string' && typeof t.title === 'string') {
            const taskType = typeof t.type === 'string' && t.type in IMPL_PLAN_TASK_TYPE_LABELS
              ? (t.type as ImplPlanTaskType)
              : 'feature';
            tasks.push({ id: t.id, title: t.title, type: taskType, groupLabel });
          }
        }
      }
    }
  }

  // Extract risks
  const risks: Array<{ id: string; description: string; severity: ImplPlanRiskSeverity }> = [];
  const risksAndEdgeCases = content.risksAndEdgeCases;
  if (Array.isArray(risksAndEdgeCases)) {
    for (const risk of risksAndEdgeCases) {
      const r = risk as Record<string, unknown>;
      if (typeof r.id === 'string' && typeof r.description === 'string') {
        const severity = typeof r.severity === 'string' && ['low', 'medium', 'high'].includes(r.severity)
          ? (r.severity as ImplPlanRiskSeverity)
          : 'medium';
        risks.push({ id: r.id, description: r.description, severity });
      }
    }
  }

  // Extract scope
  let scopeDefinition: { included: string[]; excluded: string[] } | null = null;
  const scope = content.scopeDefinition as Record<string, unknown> | undefined;
  if (scope && typeof scope === 'object') {
    scopeDefinition = {
      included: Array.isArray(scope.included) ? scope.included.filter((s): s is string => typeof s === 'string') : [],
      excluded: Array.isArray(scope.excluded) ? scope.excluded.filter((s): s is string => typeof s === 'string') : [],
    };
  }

  return { tasks, risks, scopeDefinition };
}

function resolveQaReportContext(
  artifacts?: ArtifactSummary[],
): {
  functionalityChecks: Array<{ criterion: string; status: QaCheckStatus; notes: string }>;
  dodChecks: Array<{ item: string; status: 'pass' | 'fail'; notes: string }>;
  overallVerdict: QaOverallVerdict | null;
} {
  const empty: { functionalityChecks: Array<{ criterion: string; status: QaCheckStatus; notes: string }>; dodChecks: Array<{ item: string; status: 'pass' | 'fail'; notes: string }>; overallVerdict: QaOverallVerdict | null } = { functionalityChecks: [], dodChecks: [], overallVerdict: null };
  if (!artifacts) return empty;

  const qaArtifact = [...artifacts]
    .reverse()
    .find((a) => a.type === 'qa-report' && a.content);
  if (!qaArtifact?.content) return empty;

  const content = qaArtifact.content as Record<string, unknown>;

  // Extract functionality checks
  const functionalityChecks: Array<{ criterion: string; status: QaCheckStatus; notes: string }> = [];
  const rawChecks = content.functionalityChecks;
  if (Array.isArray(rawChecks)) {
    for (const check of rawChecks) {
      const c = check as Record<string, unknown>;
      if (typeof c.criterion === 'string' && typeof c.status === 'string') {
        const status = typeof c.status === 'string' && c.status in QA_CHECK_STATUS_LABELS
          ? (c.status as QaCheckStatus)
          : 'needs-work';
        functionalityChecks.push({
          criterion: c.criterion,
          status,
          notes: typeof c.notes === 'string' ? c.notes : '',
        });
      }
    }
  }

  // Extract definition of done checks
  const dodChecks: Array<{ item: string; status: 'pass' | 'fail'; notes: string }> = [];
  const rawDod = content.definitionOfDoneChecks;
  if (Array.isArray(rawDod)) {
    for (const check of rawDod) {
      const c = check as Record<string, unknown>;
      if (typeof c.item === 'string') {
        dodChecks.push({
          item: c.item,
          status: c.status === 'pass' ? 'pass' : 'fail',
          notes: typeof c.notes === 'string' ? c.notes : '',
        });
      }
    }
  }

  // Extract overall verdict
  const validVerdicts = ['pass', 'fail', 'needs-work'];
  const overallVerdict = typeof content.overallVerdict === 'string' && validVerdicts.includes(content.overallVerdict)
    ? (content.overallVerdict as QaOverallVerdict)
    : null;

  return { functionalityChecks, dodChecks, overallVerdict };
}

// ---------------------------------------------------------------------------
// Fallback: generic schema-driven input
// ---------------------------------------------------------------------------

function FallbackInputPanel({
  request,
  onAnswer,
  onCancel,
}: {
  request: UserInputRequest;
  onAnswer: (id: UUIDv7, response: Record<string, unknown>) => void;
  onCancel: (id: UUIDv7) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const properties = (request.inputSchema.properties ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const propertyEntries = Object.entries(properties);

  function handleChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function handleSubmit() {
    onAnswer(request.id, values);
  }

  return (
    <div data-testid="fallback-input-panel" className="rounded-lg border bg-card p-4 space-y-2">
      <h3 className="text-sm font-medium">{request.title}</h3>
      <p className="text-xs text-muted-foreground">{request.message}</p>

      {propertyEntries.map(([key, prop]) => {
        const enumValues = prop.enum as string[] | undefined;
        const description = (prop.description as string) ?? key;

        return (
          <div key={key}>
            <label className="block text-xs font-medium mb-1">{description}</label>
            {enumValues ? (
              <select
                value={values[key] ?? ''}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              >
                <option value="">Select...</option>
                {enumValues.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={values[key] ?? ''}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                placeholder={description}
              />
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSubmit}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Submit
        </button>
        <button
          onClick={() => onCancel(request.id)}
          className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
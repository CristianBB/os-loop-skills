'use client';

import { useState } from 'react';
import { isImplementationPhasePlanArtifactContent, IMPL_PLAN_TASK_TYPE_LABELS, ROLE_LABELS } from '../types';
import type {
  ImplementationPhasePlanArtifactContent,
  ImplPlanPhaseContext,
  ImplPlanScopeDefinition,
  ImplPlanAffectedProject,
  ImplPlanTaskGroup,
  ImplPlanTaskType,
  ImplPlanInterfacesAndContracts,
  ImplPlanDataChanges,
  ImplPlanRisk,
  ImplPlanRiskSeverity,
  ImplPlanValidation,
  ImplPlanVersionMetadata,
  RoleId,
} from '../types';

const SEVERITY_STYLES: Record<ImplPlanRiskSeverity, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const TASK_TYPE_STYLES: Record<ImplPlanTaskType, string> = {
  feature: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  refactor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  integration: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  config: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  test: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  docs: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

interface ImplementationPhasePlanArtifactRendererProps {
  content: Record<string, unknown>;
}

export function ImplementationPhasePlanArtifactRenderer({ content }: ImplementationPhasePlanArtifactRendererProps) {
  if (!isImplementationPhasePlanArtifactContent(content)) {
    return (
      <pre data-testid="impl-plan-raw-json" className="whitespace-pre-wrap text-xs text-muted-foreground">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  }

  const plan = content as ImplementationPhasePlanArtifactContent;
  const isStructured = Array.isArray(plan.workBreakdown);

  if (!isStructured) {
    return (
      <div data-testid="impl-plan-body-view" className="space-y-2 text-xs">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-foreground">{plan.label}</h3>
          {plan.architectureSlices.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {plan.architectureSlices.map((s) => (
                <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{s}</span>
              ))}
            </div>
          )}
        </div>
        <p className="whitespace-pre-wrap text-muted-foreground">{plan.body}</p>
      </div>
    );
  }

  return (
    <div data-testid="impl-plan-structured-view" className="space-y-4 text-xs">
      {plan.phaseContext && <PhaseContextSection context={plan.phaseContext} />}
      {plan.scopeDefinition && <ScopeDefinitionSection scope={plan.scopeDefinition} />}
      {plan.affectedProjects && plan.affectedProjects.length > 0 && (
        <AffectedProjectsSection projects={plan.affectedProjects} />
      )}
      {plan.workBreakdown && <WorkBreakdownSection groups={plan.workBreakdown} />}
      {plan.interfacesAndContracts && <InterfacesSection contracts={plan.interfacesAndContracts} />}
      {plan.dataChanges && <DataChangesSection changes={plan.dataChanges} />}
      {plan.risksAndEdgeCases && plan.risksAndEdgeCases.length > 0 && (
        <RisksSection risks={plan.risksAndEdgeCases} />
      )}
      {plan.validationPlan && <ValidationPlanSection validation={plan.validationPlan} />}
      {plan.definitionOfDone && plan.definitionOfDone.length > 0 && (
        <DefinitionOfDoneSection items={plan.definitionOfDone} />
      )}
      {plan.versionMetadata && <GenerationInfoSection metadata={plan.versionMetadata} />}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">{children}</h3>;
}

function CollapsibleSection({ testId, title, children }: { testId: string; title: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div data-testid={testId} className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        data-testid={`${testId}-toggle`}
        className="flex items-center gap-1 text-xs font-semibold text-foreground uppercase tracking-wide hover:text-foreground/80 transition-colors"
      >
        <span>{expanded ? '\u25B2' : '\u25BC'}</span>
        <span>{title}</span>
      </button>
      {expanded && children}
    </div>
  );
}

function PhaseContextSection({ context }: { context: ImplPlanPhaseContext }) {
  return (
    <div data-testid="impl-plan-phase-context" className="space-y-2">
      <SectionHeader>Phase Context</SectionHeader>
      <div className="space-y-1">
        <p className="font-medium">{context.roadmapPhaseName}</p>
        <p className="text-muted-foreground">{context.summary}</p>
        {context.relatedArchitectureSections.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {context.relatedArchitectureSections.map((s) => (
              <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScopeDefinitionSection({ scope }: { scope: ImplPlanScopeDefinition }) {
  return (
    <div data-testid="impl-plan-scope" className="space-y-2">
      <SectionHeader>Scope</SectionHeader>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-medium mb-0.5 text-green-700 dark:text-green-400">Included</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
            {scope.included.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div>
          <p className="font-medium mb-0.5 text-muted-foreground">Excluded</p>
          <ul className="list-disc list-inside text-muted-foreground/70 space-y-0.5">
            {scope.excluded.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function AffectedProjectsSection({ projects }: { projects: ImplPlanAffectedProject[] }) {
  return (
    <div data-testid="impl-plan-affected-projects" className="space-y-2">
      <SectionHeader>Affected Projects</SectionHeader>
      <div className="grid gap-2">
        {projects.map((project) => (
          <div key={project.projectId} className="rounded-md border bg-card p-2 space-y-1">
            <span className="font-medium">{project.projectName}</span>
            <p className="text-muted-foreground">{project.purpose}</p>
            {project.expectedChanges.length > 0 && (
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {project.expectedChanges.map((change) => <li key={change}>{change}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkBreakdownSection({ groups }: { groups: ImplPlanTaskGroup[] }) {
  return (
    <div data-testid="impl-plan-work-breakdown" className="space-y-3">
      <SectionHeader>Work Breakdown</SectionHeader>
      {groups.map((group) => (
        <div key={group.groupLabel} className="space-y-1.5">
          <p className="font-medium">{group.groupLabel}</p>
          {group.tasks.map((task) => (
            <div key={task.id} className="rounded-md border bg-card p-2 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{task.title}</span>
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${TASK_TYPE_STYLES[task.type]}`}>
                  {IMPL_PLAN_TASK_TYPE_LABELS[task.type]}
                </span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{task.projectId}</span>
              </div>
              <p className="text-muted-foreground">{task.description}</p>
              <p className="text-muted-foreground/70">Outcome: {task.expectedOutcome}</p>
              {task.dependencies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-muted-foreground/70">Depends on:</span>
                  {task.dependencies.map((dep) => (
                    <span key={dep} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{dep}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function InterfacesSection({ contracts }: { contracts: ImplPlanInterfacesAndContracts }) {
  return (
    <CollapsibleSection testId="impl-plan-interfaces" title="Interfaces & Contracts">
      <div className="space-y-3">
        {contracts.apis.length > 0 && (
          <div>
            <p className="font-medium mb-1">APIs</p>
            {contracts.apis.map((api) => (
              <div key={api.name} className="rounded-md border bg-card p-2 space-y-1 mb-1">
                <span className="font-medium">{api.name}</span>
                <p className="text-muted-foreground">{api.description}</p>
                <p className="text-muted-foreground/70">
                  {api.producerProjectId} → {api.consumerProjectIds.join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}
        {contracts.boundaries.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Boundaries</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {contracts.boundaries.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
        )}
        {contracts.dataContracts.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Data Contracts</p>
            {contracts.dataContracts.map((dc) => (
              <div key={dc.name} className="text-muted-foreground mb-0.5">
                <span className="font-medium text-foreground">{dc.name}</span>
                <span className="text-muted-foreground/70"> ({dc.ownerProjectId})</span> - {dc.description}
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

function DataChangesSection({ changes }: { changes: ImplPlanDataChanges }) {
  return (
    <CollapsibleSection testId="impl-plan-data-changes" title="Data Changes">
      <div className="space-y-3">
        {changes.newModels.length > 0 && (
          <div>
            <p className="font-medium mb-1">New Models</p>
            {changes.newModels.map((model) => (
              <div key={model.name} className="rounded-md border bg-card p-2 space-y-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-muted-foreground">({model.projectId})</span>
                </div>
                <p className="text-muted-foreground">{model.description}</p>
                <div className="flex flex-wrap gap-1">
                  {model.fields.map((f) => (
                    <span key={f} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {changes.migrations.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Migrations</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {changes.migrations.map((m) => <li key={m}>{m}</li>)}
            </ul>
          </div>
        )}
        {changes.storageChanges.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Storage Changes</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {changes.storageChanges.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

function RisksSection({ risks }: { risks: ImplPlanRisk[] }) {
  return (
    <div data-testid="impl-plan-risks" className="space-y-2">
      <SectionHeader>Risks & Edge Cases</SectionHeader>
      <div className="space-y-2">
        {risks.map((risk) => (
          <div key={risk.id} className="rounded-md border bg-card p-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{risk.description}</span>
              <span
                data-testid={`impl-plan-risk-severity-${risk.id}`}
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${SEVERITY_STYLES[risk.severity]}`}
              >
                {risk.severity}
              </span>
            </div>
            {risk.mitigation && (
              <p className="text-muted-foreground">Mitigation: {risk.mitigation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ValidationPlanSection({ validation }: { validation: ImplPlanValidation }) {
  return (
    <CollapsibleSection testId="impl-plan-validation" title="Validation Plan">
      <div className="space-y-2">
        {validation.verificationSteps.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Verification Steps</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {validation.verificationSteps.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        )}
        {validation.testExpectations.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Test Expectations</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {validation.testExpectations.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        )}
        {validation.qaGateCriteria.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">QA Gate Criteria</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {validation.qaGateCriteria.map((q) => <li key={q}>{q}</li>)}
            </ul>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

function DefinitionOfDoneSection({ items }: { items: string[] }) {
  return (
    <div data-testid="impl-plan-definition-of-done" className="space-y-2">
      <SectionHeader>Definition of Done</SectionHeader>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-1.5 text-muted-foreground">
            <span className="shrink-0 text-green-600 dark:text-green-400">&#x2713;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GenerationInfoSection({ metadata }: { metadata: ImplPlanVersionMetadata }) {
  return (
    <div data-testid="impl-plan-generation-info" className="flex items-center gap-2 pt-2 border-t text-[10px] text-muted-foreground">
      <span className="font-medium uppercase tracking-wide">Generated by</span>
      {metadata.roleFlow.map((role, idx) => (
        <span key={role} className="flex items-center gap-1">
          {idx > 0 && <span className="text-muted-foreground/50">&rarr;</span>}
          <span className="rounded bg-muted px-1.5 py-0.5">{ROLE_LABELS[role as RoleId] ?? role}</span>
        </span>
      ))}
    </div>
  );
}
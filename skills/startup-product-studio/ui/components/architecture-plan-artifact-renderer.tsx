'use client';

import { useState } from 'react';
import { isArchitecturePlanArtifactContent } from '../types';
import type {
  ArchitecturePlanArtifactContent,
  ArchitectureProjectEntry,
  ArchitectureProjectType,
  ArchitectureRuntimeArchitecture,
  ArchitectureDataArchitecture,
  ArchitectureIntegrationArchitecture,
  ArchitectureSecurityAndTrustModel,
  ArchitectureDeploymentModel,
  ArchitectureQualityAttributes,
  ArchitecturePhaseMapping,
  ArchitectureImplementationGuidelines,
  ArchitectureRisk,
  ArchitectureRiskSeverity,
  ArchitectureQuestion,
  ArchitecturePlanVersionMetadata,
} from '../types';

const SEVERITY_STYLES: Record<ArchitectureRiskSeverity, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  critical: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-100',
};

const PROJECT_TYPE_LABELS: Record<ArchitectureProjectType, string> = {
  'web-app': 'Web App',
  'backend-api': 'Backend API',
  'mobile-app': 'Mobile App',
  'worker': 'Worker',
  'infra': 'Infrastructure',
  'shared-package': 'Shared Package',
  'docs': 'Documentation',
};

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  'ceo': 'CEO',
  'product-manager': 'Product Manager',
  'ux-ui': 'UX/UI',
  'software-architect': 'Architect',
  'developer': 'Developer',
  'qa': 'QA',
};

interface ArchitecturePlanArtifactRendererProps {
  content: Record<string, unknown>;
  previousContent?: ArchitecturePlanArtifactContent | null;
}

export function ArchitecturePlanArtifactRenderer({ content, previousContent }: ArchitecturePlanArtifactRendererProps) {
  if (!isArchitecturePlanArtifactContent(content)) {
    return (
      <pre data-testid="architecture-raw-json" className="whitespace-pre-wrap text-xs text-muted-foreground">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  }

  const plan = content as ArchitecturePlanArtifactContent;

  return (
    <div data-testid="architecture-structured-view" className="space-y-4 text-xs">
      <SystemOverviewSection overview={plan.systemOverview} />
      <ProjectTopologySection topology={plan.projectTopology} />
      <RuntimeArchitectureSection runtime={plan.runtimeArchitecture} />
      <DataArchitectureSection data={plan.dataArchitecture} />
      <IntegrationArchitectureSection integration={plan.integrationArchitecture} />
      <SecuritySection security={plan.securityAndTrustModel} />
      <DeploymentSection deployment={plan.deploymentAndEnvironmentModel} />
      <QualityAttributesSection quality={plan.qualityAttributes} />
      <PhaseMappingSection mapping={plan.phaseMapping} />
      <ImplementationGuidelinesSection guidelines={plan.implementationGuidelines} />
      <OpenRisksSection risks={plan.openRisks} />
      <OpenQuestionsSection questions={plan.openQuestions} />
      {plan.versionMetadata && <VersionMetadataFooter metadata={plan.versionMetadata} />}
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

function SystemOverviewSection({ overview }: { overview: ArchitecturePlanArtifactContent['systemOverview'] }) {
  return (
    <div data-testid="architecture-system-overview" className="space-y-2">
      <SectionHeader>System Overview</SectionHeader>
      <p className="text-muted-foreground">{overview.description}</p>
      <p className="text-muted-foreground italic">{overview.productRelationship}</p>
      {overview.technicalConstraints.length > 0 && (
        <div>
          <p className="font-medium mb-0.5">Technical Constraints</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
            {overview.technicalConstraints.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProjectTopologySection({ topology }: { topology: ArchitectureProjectEntry[] }) {
  return (
    <div data-testid="architecture-project-topology" className="space-y-2">
      <SectionHeader>Project Topology</SectionHeader>
      <div className="grid gap-2">
        {topology.map((project) => (
          <div key={project.id} className="rounded-md border bg-card p-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{project.name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                {PROJECT_TYPE_LABELS[project.type] ?? project.type}
              </span>
            </div>
            <p className="text-muted-foreground">{project.purpose}</p>
            <p className="text-muted-foreground/70">Owner: {project.ownership}</p>
            {project.dependencies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-muted-foreground/70">Depends on:</span>
                {project.dependencies.map((dep) => (
                  <span key={dep} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{dep}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RuntimeArchitectureSection({ runtime }: { runtime: ArchitectureRuntimeArchitecture }) {
  return (
    <CollapsibleSection testId="architecture-runtime" title="Runtime Architecture">
      <div className="space-y-3">
        {runtime.frontends.length > 0 && (
          <div>
            <p className="font-medium mb-1">Frontends</p>
            {runtime.frontends.map((c) => (
              <div key={c.name} className="rounded-md border bg-card p-2 space-y-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">({c.projectId})</span>
                </div>
                <p className="text-muted-foreground">{c.description}</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  {c.responsibilities.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
        {runtime.backends.length > 0 && (
          <div>
            <p className="font-medium mb-1">Backends</p>
            {runtime.backends.map((c) => (
              <div key={c.name} className="rounded-md border bg-card p-2 space-y-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">({c.projectId})</span>
                </div>
                <p className="text-muted-foreground">{c.description}</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  {c.responsibilities.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
        {runtime.backgroundProcessing.length > 0 && (
          <div>
            <p className="font-medium mb-1">Background Processing</p>
            {runtime.backgroundProcessing.map((c) => (
              <div key={c.name} className="rounded-md border bg-card p-2 space-y-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">({c.projectId})</span>
                </div>
                <p className="text-muted-foreground">{c.description}</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  {c.responsibilities.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
        {runtime.externalIntegrations.length > 0 && (
          <div>
            <p className="font-medium mb-1">External Integrations</p>
            {runtime.externalIntegrations.map((e) => (
              <div key={e.name} className="flex items-center gap-2 text-muted-foreground mb-0.5">
                <span className="font-medium text-foreground">{e.name}</span>
                <span>- {e.purpose}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{e.protocol}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

function DataArchitectureSection({ data }: { data: ArchitectureDataArchitecture }) {
  return (
    <CollapsibleSection testId="architecture-data" title="Data Architecture">
      <div className="space-y-3">
        {data.dataDomains.length > 0 && (
          <div>
            <p className="font-medium mb-1">Data Domains</p>
            {data.dataDomains.map((d) => (
              <div key={d.name} className="rounded-md border bg-card p-2 space-y-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground">({d.ownerProjectId})</span>
                </div>
                <p className="text-muted-foreground">{d.description}</p>
                <div className="flex flex-wrap gap-1">
                  {d.entities.map((e) => (
                    <span key={e} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{e}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {data.persistenceStrategy.length > 0 && (
          <div>
            <p className="font-medium mb-1">Persistence Strategy</p>
            {data.persistenceStrategy.map((ps) => (
              <div key={`${ps.projectId}-${ps.technology}`} className="text-muted-foreground mb-0.5">
                <span className="font-medium text-foreground">{ps.technology}</span> ({ps.projectId}) - {ps.rationale}
              </div>
            ))}
          </div>
        )}
        {data.boundaries.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Boundaries</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {data.boundaries.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

function IntegrationArchitectureSection({ integration }: { integration: ArchitectureIntegrationArchitecture }) {
  return (
    <CollapsibleSection testId="architecture-integration" title="Integration Architecture">
      <div className="space-y-3">
        {integration.apiBoundaries.length > 0 && (
          <div>
            <p className="font-medium mb-1">API Boundaries</p>
            {integration.apiBoundaries.map((ab) => (
              <div key={ab.name} className="rounded-md border bg-card p-2 space-y-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ab.name}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{ab.protocol}</span>
                </div>
                <p className="text-muted-foreground">
                  {ab.producerProjectId} → {ab.consumerProjectIds.join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}
        {integration.internalIntegrationPoints.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Internal Integration Points</p>
            <ul className="space-y-0.5 text-muted-foreground">
              {integration.internalIntegrationPoints.map((ip) => (
                <li key={ip.description} className="flex items-start gap-1">
                  <span>{ip.description}</span>
                  <span className="text-muted-foreground/60">({ip.projectIds.join(', ')})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {integration.externalServices.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">External Services</p>
            {integration.externalServices.map((es) => (
              <div key={es.name} className="text-muted-foreground mb-0.5">
                <span className="font-medium text-foreground">{es.name}</span> - {es.purpose} ({es.integrationMethod})
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

function SecuritySection({ security }: { security: ArchitectureSecurityAndTrustModel }) {
  return (
    <CollapsibleSection testId="architecture-security" title="Security & Trust Model">
      <div className="space-y-2">
        {security.authAssumptions.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Auth Assumptions</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {security.authAssumptions.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        )}
        {security.secretHandling.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Secret Handling</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {security.secretHandling.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        )}
        {security.trustBoundaries.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Trust Boundaries</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {security.trustBoundaries.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        )}
        {security.riskySurfaces.length > 0 && (
          <div>
            <p className="font-medium mb-0.5 text-amber-700 dark:text-amber-400">Risky Surfaces</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {security.riskySurfaces.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

function DeploymentSection({ deployment }: { deployment: ArchitectureDeploymentModel }) {
  return (
    <CollapsibleSection testId="architecture-deployment" title="Deployment & Environment">
      <div className="space-y-3">
        {deployment.environmentModel.length > 0 && (
          <div>
            <p className="font-medium mb-1">Environments</p>
            {deployment.environmentModel.map((env) => (
              <div key={env.name} className="rounded-md border bg-card p-2 space-y-1 mb-1">
                <span className="font-medium">{env.name}</span>
                <p className="text-muted-foreground">{env.purpose}</p>
                <div className="flex flex-wrap gap-1">
                  {env.characteristics.map((c) => (
                    <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {deployment.deploymentUnits.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Deployment Units</p>
            {deployment.deploymentUnits.map((du) => (
              <div key={du.projectId} className="text-muted-foreground mb-0.5">
                <span className="font-medium text-foreground">{du.projectId}</span> - {du.strategy} ({du.notes})
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

function QualityAttributesSection({ quality }: { quality: ArchitectureQualityAttributes }) {
  const attributes = [
    { label: 'Maintainability', value: quality.maintainability },
    { label: 'Scalability', value: quality.scalability },
    { label: 'Testability', value: quality.testability },
    { label: 'Reliability', value: quality.reliability },
    { label: 'Performance', value: quality.performance },
    { label: 'Developer Experience', value: quality.developerExperience },
  ];

  return (
    <div data-testid="architecture-quality-attributes" className="space-y-2">
      <SectionHeader>Quality Attributes</SectionHeader>
      <div className="grid grid-cols-2 gap-2">
        {attributes.map((attr) => (
          <div key={attr.label} className="rounded-md border bg-card p-2 space-y-0.5">
            <p className="font-medium">{attr.label}</p>
            <p className="text-muted-foreground">{attr.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseMappingSection({ mapping }: { mapping: ArchitecturePhaseMapping[] }) {
  return (
    <div data-testid="architecture-phase-mapping" className="space-y-2">
      <SectionHeader>Phase Mapping</SectionHeader>
      <div className="space-y-2">
        {mapping.map((pm) => (
          <div key={pm.phaseId} className="rounded-md border bg-card p-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{pm.phaseName}</span>
              <span className="text-muted-foreground">({pm.phaseId})</span>
            </div>
            {pm.architectureSlices.length > 0 && (
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {pm.architectureSlices.map((s) => <li key={s}>{s}</li>)}
              </ul>
            )}
            {pm.technicalDependencies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-muted-foreground/70">Depends on:</span>
                {pm.technicalDependencies.map((d) => (
                  <span key={d} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{d}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ImplementationGuidelinesSection({ guidelines }: { guidelines: ArchitectureImplementationGuidelines }) {
  return (
    <CollapsibleSection testId="architecture-implementation-guidelines" title="Implementation Guidelines">
      <div className="space-y-2">
        {guidelines.rules.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Rules</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {guidelines.rules.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        )}
        {guidelines.boundariesToPreserve.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Boundaries to Preserve</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {guidelines.boundariesToPreserve.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
        )}
        {guidelines.antiPatterns.length > 0 && (
          <div>
            <p className="font-medium mb-0.5 text-red-700 dark:text-red-400">Anti-Patterns</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {guidelines.antiPatterns.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        )}
        {guidelines.codingExpectations.length > 0 && (
          <div>
            <p className="font-medium mb-0.5">Coding Expectations</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {guidelines.codingExpectations.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

function OpenRisksSection({ risks }: { risks: ArchitectureRisk[] }) {
  if (risks.length === 0) return null;

  return (
    <div data-testid="architecture-open-risks" className="space-y-2">
      <SectionHeader>Open Risks</SectionHeader>
      <div className="space-y-2">
        {risks.map((risk) => (
          <div key={risk.id} className="rounded-md border bg-card p-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{risk.description}</span>
              <span
                data-testid={`risk-severity-${risk.id}`}
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

function OpenQuestionsSection({ questions }: { questions: ArchitectureQuestion[] }) {
  if (questions.length === 0) return null;

  return (
    <div data-testid="architecture-open-questions" className="space-y-2">
      <SectionHeader>Open Questions</SectionHeader>
      <div className="space-y-1.5">
        {questions.map((q) => (
          <div key={q.id} className="flex items-start gap-1">
            <span className="shrink-0 text-amber-700 dark:text-amber-400">?</span>
            <div>
              <span className="text-foreground">{q.question}</span>
              {q.context && <p className="text-muted-foreground mt-0.5">{q.context}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VersionMetadataFooter({ metadata }: { metadata: ArchitecturePlanVersionMetadata }) {
  const roleFlowDisplay = metadata.roleFlow
    .map((r) => ROLE_DISPLAY_NAMES[r] ?? r)
    .join(' \u2192 ');

  return (
    <div data-testid="architecture-version-metadata" className="pt-2 border-t text-[10px] text-muted-foreground flex items-center gap-2">
      <span className="font-medium">v{metadata.version}{metadata.version > 1 ? ' (revised)' : ''}</span>
      <span className="text-muted-foreground/60">|</span>
      <span>{roleFlowDisplay}</span>
    </div>
  );
}
'use client';

import { useState } from 'react';
import type { SkillWorkspaceArtifact } from '../views/skill-view-props';
import type { ProjectRecord } from '../types';
import { RoadmapArtifactRenderer } from './roadmap-artifact-renderer';
import { ArchitecturePlanArtifactRenderer } from './architecture-plan-artifact-renderer';
import { QaReportArtifactRenderer } from './qa-report-artifact-renderer';
import { ImplementationPhasePlanArtifactRenderer } from './implementation-phase-plan-artifact-renderer';

const ARTIFACT_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  pending_approval: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  superseded: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

interface StudioArtifactPanelProps {
  artifacts: SkillWorkspaceArtifact[];
  project: ProjectRecord;
}

export function StudioArtifactPanel({ artifacts, project }: StudioArtifactPanelProps) {
  const projectArtifactIds = new Set(project.artifactIds);
  const filtered = artifacts.filter((a) => projectArtifactIds.has(a.id));

  if (filtered.length === 0) return null;

  // Group by type
  const groups = new Map<string, SkillWorkspaceArtifact[]>();
  for (const artifact of filtered) {
    const existing = groups.get(artifact.type) ?? [];
    existing.push(artifact);
    groups.set(artifact.type, existing);
  }

  return (
    <div data-testid="studio-artifact-panel" className="space-y-4">
      <h2 className="text-sm font-medium">Artifacts</h2>
      {Array.from(groups.entries()).map(([type, items]) => (
        <div key={type} className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground">{type}</h3>
          {items.map((artifact) => (
            <ArtifactRow key={artifact.id} artifact={artifact} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ArtifactRow({ artifact }: { artifact: SkillWorkspaceArtifact }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border bg-card text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 hover:bg-accent transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{artifact.title}</span>
          {artifact.createdByRole && (
            <span className="text-muted-foreground">by {artifact.createdByRole}</span>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${ARTIFACT_STATUS_STYLES[artifact.status] ?? ''}`}
        >
          {artifact.status.replace(/_/g, ' ')}
        </span>
      </button>
      {expanded && (
        <div className="border-t px-3 py-2 bg-muted/30">
          {artifact.type === 'roadmap' ? (
            <RoadmapArtifactRenderer content={artifact.content} />
          ) : artifact.type === 'architecture-plan' ? (
            <ArchitecturePlanArtifactRenderer content={artifact.content} />
          ) : artifact.type === 'qa-report' ? (
            <QaReportArtifactRenderer content={artifact.content} />
          ) : artifact.type === 'implementation-phase-plan' ? (
            <ImplementationPhasePlanArtifactRenderer content={artifact.content} />
          ) : (
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
              {JSON.stringify(artifact.content, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
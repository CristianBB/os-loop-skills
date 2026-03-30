'use client';

import { useEffect } from 'react';
import type { SkillViewProps } from './skill-view-props';
import { parseStudioState, getActiveProject } from '../hooks/use-studio-state';
import { StudioHeader } from '../components/studio-header';
import { PhaseTimeline } from '../components/phase-timeline';
import { StudioArtifactPanel } from '../components/studio-artifact-panel';
import { ActiveRunSidebar } from '../components/active-run-sidebar';
import { ProjectSelector } from '../components/project-selector';
import { BridgeRequiredBanner } from '../components/bridge-required-banner';
import { BootstrapProgressPanel } from '../components/bootstrap-progress-panel';
import { RoadmapPhaseProgress } from '../components/roadmap-phase-progress';
import { RedirectionControls } from '../components/redirection-controls';
import type { PhaseId, UserRedirectionAction } from '../types';

/**
 * Entry component for the workspace-detail view.
 * Rendered by Seoul's SkillViewHost when viewId === 'workspace-detail'.
 */
export function WorkspaceDetailView({ context, workspaceId }: SkillViewProps) {
  const {
    workspace,
    activeRun,
    runs,
    inputRequests,
    bridgeJobs,
    artifacts,
    answerUserInput,
    cancelUserInput,
    pauseRun,
    cancelRun,
    continueRun,
    retryRun,
    bridgeConnected,
    navigateToList,
  } = context;

  const studioState = workspace ? parseStudioState(workspace.state) : null;
  const activeProject = studioState ? getActiveProject(studioState) : null;

  if (!workspace || !studioState) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Studio not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <button
        onClick={navigateToList}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        &larr; All Studios
      </button>

      <StudioHeader
        workspace={workspace}
        studioState={studioState}
        activeProject={activeProject}
        activeRun={activeRun}
      />

      {studioState.projects.length > 1 && (
        <ProjectSelector
          projects={studioState.projects}
          activeProjectId={studioState.activeProjectId}
          onSelect={() => {}}
        />
      )}

      <BridgeRequiredBanner
        bridgeConnected={bridgeConnected}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeProject && (
            <>
              <PhaseTimeline
                project={activeProject}
                activePhase={
                  (workspace.currentPhase as PhaseId) ?? activeProject.currentPhase
                }
              />

              {activeProject.currentPhase === 'implementation-phase' &&
                activeProject.implementationStatus?.roadmapPhaseRecords &&
                activeProject.implementationStatus.roadmapPhaseRecords.length > 0 && (
                  <RoadmapPhaseProgress
                    records={activeProject.implementationStatus.roadmapPhaseRecords}
                    activeIndex={
                      activeProject.implementationStatus.activeRoadmapPhaseIndex
                    }
                  />
                )}

              {activeProject.roadmapVersions.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  Roadmap v
                  {
                    activeProject.roadmapVersions[
                      activeProject.roadmapVersions.length - 1
                    ].version
                  }{' '}
                  ({activeProject.roadmapVersions.length} versions)
                </p>
              )}

              <RedirectionControls
                hasApprovedRoadmap={activeProject.validationHistory.some(
                  (v) =>
                    v.phase === 'roadmap-definition' && v.decision === 'approve',
                )}
                isImplementing={
                  activeProject.currentPhase === 'implementation-phase'
                }
                isPaused={workspace.status === 'paused'}
                onRedirect={(_action: UserRedirectionAction) => {}}
              />

              <StudioArtifactPanel
                artifacts={artifacts}
                project={activeProject}
              />
            </>
          )}
        </div>

        <div className="space-y-6">
          {activeProject && activeProject.codeProjects.length > 0 && (
            <BootstrapProgressPanel
              codeProjects={activeProject.codeProjects}
              bridgeJobs={bridgeJobs}
            />
          )}

          {activeRun && (
            <ActiveRunSidebar
              activeRun={activeRun}
              inputRequests={inputRequests}
              bridgeJobs={bridgeJobs}
              onPause={() => pauseRun(activeRun.id)}
              onCancel={() => cancelRun(activeRun.id)}
              onContinue={() => continueRun(activeRun.id)}
              onRetry={() => retryRun(activeRun.id)}
              onAnswerInput={answerUserInput}
              onCancelInput={cancelUserInput}
            />
          )}
        </div>
      </div>

      {/* Run history */}
      {runs.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <h3 className="text-sm font-semibold">Run History</h3>
          {runs.map((run) => (
            <div key={run.id} className="flex items-center justify-between text-xs">
              <span>{run.currentStep ?? run.status}</span>
              <span className="text-muted-foreground">{run.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

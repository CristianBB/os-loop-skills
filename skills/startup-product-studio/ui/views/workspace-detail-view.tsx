'use client';

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
import { Spinner } from '../components/spinner';
import type { PhaseId, UserRedirectionAction } from '../types';
import { PHASE_LABELS } from '../types';

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

  // Show the most recent failed/cancelled run when no active run exists, so
  // the user can see the Retry button after a failure or cancellation.
  const lastTerminalRun = !activeRun
    ? runs.find((r) => r.status === 'failed' || r.status === 'cancelled') ?? null
    : null;
  const displayRun = activeRun ?? lastTerminalRun;

  if (!workspace || !studioState) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Studio not found</p>
      </div>
    );
  }

  function handleRerunPhase(phase: PhaseId, feedback: string) {
    context.executeSkillAction({
      action: 'redirect',
      redirectionAction: 'redefine-phase',
      targetPhase: phase,
      feedback,
    });
  }

  return (
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
        <button
          onClick={navigateToList}
          className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors"
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
            {activeProject ? (
              <>
                <PhaseTimeline
                  project={activeProject}
                  activePhase={
                    (workspace.currentPhase as PhaseId) ?? activeProject.currentPhase
                  }
                  onRerunPhase={handleRerunPhase}
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
                  onRedirect={(action: UserRedirectionAction) => {
                    if (action === 'pause' && activeRun) {
                      pauseRun(activeRun.id);
                    } else if (action === 'continue') {
                      const target = activeRun ?? runs.find((r) => r.status === 'paused');
                      if (target) continueRun(target.id);
                    } else if (action === 'stop' && activeRun) {
                      cancelRun(activeRun.id);
                    } else {
                      context.executeSkillAction({
                        action: 'redirect',
                        redirectionAction: action,
                      });
                    }
                  }}
                />

                <StudioArtifactPanel
                  artifacts={artifacts}
                  project={activeProject}
                />
              </>
            ) : (
              <div data-testid="no-project-empty-state" className="rounded-lg border border-dashed p-8 text-center space-y-3">
                <p className="text-sm font-medium">No project created yet</p>
                <p className="text-xs text-muted-foreground">
                  This studio has been initialised but does not have a project.
                  Ask the agent to create one, for example:
                </p>
                <code className="block text-xs bg-muted px-3 py-2 rounded-md">
                  Create a project called &quot;MyApp&quot; in the PlantValue studio
                </code>
                {studioState.projects.length > 0 && !studioState.activeProjectId && (
                  <p className="text-xs text-amber-600">
                    {studioState.projects.length} project(s) exist but none is set as active.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {activeProject && activeProject.codeProjects.length > 0 && (
              <BootstrapProgressPanel
                codeProjects={activeProject.codeProjects}
                bridgeJobs={bridgeJobs}
              />
            )}

            {/* Pending action prompt: no active run and current phase not completed */}
            {!displayRun && activeProject && (() => {
              const wsPhase = workspace.currentPhase as PhaseId | null;
              // If workspace.currentPhase is stale (already completed), fall back to project state
              const currentPhase = (wsPhase && !activeProject.completedPhases.includes(wsPhase))
                ? wsPhase
                : activeProject.currentPhase;
              const phaseCompleted = activeProject.completedPhases.includes(currentPhase);
              if (phaseCompleted) return null;
              const phaseLabel = PHASE_LABELS[currentPhase] ?? currentPhase.replace(/-/g, ' ');
              return (
                <div data-testid="pending-action-prompt" className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-4 space-y-3 dark:border-blue-700 dark:bg-blue-950">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 text-lg">▶</span>
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Ready: {phaseLabel}
                    </h3>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    This phase is ready to begin. Click below to start.
                  </p>
                  <button
                    onClick={() => context.executeSkillAction({ action: 'run-phase', targetPhase: currentPhase })}
                    className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
                  >
                    Start {phaseLabel}
                  </button>
                </div>
              );
            })()}

            {displayRun && (
              <ActiveRunSidebar
                activeRun={displayRun}
                inputRequests={inputRequests}
                bridgeJobs={bridgeJobs}
                workspace={workspace}
                onPause={() => pauseRun(displayRun.id)}
                onCancel={() => cancelRun(displayRun.id)}
                onContinue={() => continueRun(displayRun.id)}
                onRetry={() => retryRun(displayRun.id)}
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
            {runs.map((run) => {
              const isActive = run.status === 'running' || run.status === 'waiting_bridge_job';
              const isWaiting = run.status === 'waiting_user_input';
              const statusColor = run.status === 'completed' ? 'text-green-600 dark:text-green-400'
                : run.status === 'failed' ? 'text-red-600 dark:text-red-400'
                : isWaiting ? 'text-amber-600 dark:text-amber-400'
                : isActive ? 'text-blue-600 dark:text-blue-400'
                : 'text-muted-foreground';
              return (
                <div key={run.id} className="flex items-center justify-between text-xs rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    {isActive && <Spinner size="sm" className="text-blue-500 shrink-0" />}
                    {isWaiting && <span className="shrink-0 text-amber-500">&#9679;</span>}
                    <span className="truncate">
                      {run.progress?.message ?? run.currentStep ?? run.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className={`shrink-0 ml-2 font-medium ${statusColor}`}>
                    {run.status.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

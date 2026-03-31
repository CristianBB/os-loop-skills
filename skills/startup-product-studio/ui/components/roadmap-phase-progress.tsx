'use client';

import type { ImplementationPhaseRecord, RoadmapPhaseStatus, TaskGroupProgressStatus } from '../types';
import { Spinner, PulsingDot } from './spinner';

interface RoadmapPhaseProgressProps {
  records: ImplementationPhaseRecord[];
  activeIndex: number | null;
}

const STATUS_CONFIG: Record<RoadmapPhaseStatus, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-muted text-muted-foreground' },
  planning: { label: 'Planning', className: 'bg-blue-100 text-blue-800' },
  plan_approved: { label: 'Plan Approved', className: 'bg-blue-200 text-blue-900' },
  implementing: { label: 'Implementing', className: 'bg-indigo-100 text-indigo-800' },
  qa_validating: { label: 'QA Validating', className: 'bg-purple-100 text-purple-800' },
  pm_reviewing: { label: 'PM Reviewing', className: 'bg-amber-100 text-amber-800' },
  user_reviewing: { label: 'Awaiting Review', className: 'bg-orange-100 text-orange-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
};

const ACTIVE_STATUSES = new Set<RoadmapPhaseStatus>(['planning', 'implementing', 'qa_validating', 'pm_reviewing']);

const TASK_GROUP_STATUS_CONFIG: Record<TaskGroupProgressStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  running: { label: 'Running', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Done', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
};

export function RoadmapPhaseProgress({ records, activeIndex }: RoadmapPhaseProgressProps) {
  if (records.length === 0) return null;

  const completedCount = records.filter((r) => r.status === 'completed').length;

  return (
    <div data-testid="roadmap-phase-progress" className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Implementation Sub-Phases</h3>
        <span className="text-[10px] text-muted-foreground">
          {completedCount}/{records.length} completed
        </span>
      </div>

      {/* Overall progress bar */}
      {records.length > 0 && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${(completedCount / records.length) * 100}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {records.map((record, index) => {
          const config = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.not_started;
          const isActive = index === activeIndex;
          const isProcessing = ACTIVE_STATUSES.has(record.status);

          const hasTaskGroups = record.taskGroupProgress && record.taskGroupProgress.length > 0;
          const completedGroups = hasTaskGroups
            ? record.taskGroupProgress.filter((g) => g.status === 'completed').length
            : 0;

          return (
            <div key={record.id} className="space-y-1">
            <div
              data-testid={`phase-record-${record.id}`}
              className={`flex items-center justify-between rounded-md border px-3 py-2.5 text-xs transition-all ${
                isActive ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isActive && isProcessing && (
                  <Spinner size="sm" className="text-blue-500 shrink-0" />
                )}
                <span className="font-medium truncate">{record.label}</span>
                {record.involvedProjectIds && record.involvedProjectIds.length > 0 && (
                  <span
                    data-testid={`projects-count-${record.id}`}
                    className="text-[10px] text-muted-foreground"
                    title={`${record.involvedProjectIds.length} project(s)`}
                  >
                    {record.involvedProjectIds.length}P
                  </span>
                )}
                {record.goals && record.goals.length > 0 && (
                  <span
                    data-testid={`goals-count-${record.id}`}
                    className="text-[10px] text-muted-foreground"
                    title={record.goals.join('\n')}
                  >
                    {record.goals.length}G
                  </span>
                )}
                {record.deliverables && record.deliverables.length > 0 && (
                  <span
                    data-testid={`deliverables-count-${record.id}`}
                    className="text-[10px] text-muted-foreground"
                    title={record.deliverables.join('\n')}
                  >
                    {record.deliverables.length}D
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {record.planArtifactId && (
                  <span data-testid="artifact-plan" className="text-muted-foreground" title="Plan artifact">
                    P
                  </span>
                )}
                {record.implementationReportArtifactId && (
                  <span data-testid="artifact-report" className="text-muted-foreground" title="Implementation report">
                    I
                  </span>
                )}
                {record.qaReportArtifactId && (
                  <span data-testid="artifact-qa" className="text-muted-foreground" title="QA report">
                    Q
                  </span>
                )}
                {hasTaskGroups && (
                  <span
                    data-testid={`task-groups-count-${record.id}`}
                    className="text-[10px] text-muted-foreground tabular-nums"
                    title={`${completedGroups}/${record.taskGroupProgress.length} task groups`}
                  >
                    {completedGroups}/{record.taskGroupProgress.length}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.className}`}>
                  {isActive && isProcessing && <PulsingDot />}
                  {config.label}
                </span>
              </div>
            </div>

            {/* Active phase goals */}
            {isActive && record.goals && record.goals.length > 0 && (
              <div className="ml-4 rounded bg-muted/50 px-3 py-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Goals</p>
                <ul className="space-y-0.5">
                  {record.goals.map((goal, gi) => (
                    <li key={gi} className="text-[11px] text-muted-foreground">• {goal}</li>
                  ))}
                </ul>
              </div>
            )}

            {hasTaskGroups && isActive && (
              <div data-testid={`task-group-details-${record.id}`} className="ml-4 space-y-1">
                {record.taskGroupProgress.map((group, gi) => {
                  const groupConfig = TASK_GROUP_STATUS_CONFIG[group.status] ?? TASK_GROUP_STATUS_CONFIG.pending;
                  const isActiveGroup = record.currentTaskGroupIndex !== null
                    && record.currentTaskGroupIndex >= 0
                    && record.currentTaskGroupIndex < record.taskGroupProgress.length
                    && gi === record.currentTaskGroupIndex;

                  return (
                    <div
                      key={`${record.id}-group-${gi}`}
                      data-testid={`task-group-${record.id}-${gi}`}
                      className={`flex items-center justify-between rounded border px-2.5 py-1.5 text-[10px] transition-all ${
                        isActiveGroup ? 'ring-1 ring-primary border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isActiveGroup && group.status === 'running' && (
                          <Spinner size="sm" className="text-blue-500 shrink-0" />
                        )}
                        <span className="font-medium truncate">{group.groupLabel}</span>
                        <span className="text-muted-foreground">{group.taskIds.length}T</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {group.failureReason && (
                          <span
                            data-testid={`task-group-failure-${record.id}-${gi}`}
                            className="text-red-600 truncate max-w-[120px]"
                            title={group.failureReason}
                          >
                            {group.failureReason}
                          </span>
                        )}
                        <span className={`rounded-full px-1.5 py-0.5 font-medium ${groupConfig.className}`}>
                          {groupConfig.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

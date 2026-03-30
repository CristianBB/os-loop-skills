'use client';

import { useState } from 'react';
type UUIDv7 = string;
import type { UserInputRequest } from '../views/skill-view-props';
import type {
  GateDecision,
  ImplPlanTaskEditAction,
  ImplPlanTaskType,
  ImplPlanRiskEditAction,
  ImplPlanRiskSeverity,
} from '../types';
import {
  IMPL_PLAN_TASK_TYPE_LABELS,
  IMPL_PLAN_TASK_EDIT_ACTION_LABELS,
  IMPL_PLAN_RISK_EDIT_ACTION_LABELS,
} from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaskEditState {
  action: ImplPlanTaskEditAction | '';
  details: string;
  newType: ImplPlanTaskType | '';
}

interface RiskEditState {
  action: ImplPlanRiskEditAction | '';
  details: string;
  newSeverity: ImplPlanRiskSeverity | '';
}

type EditMode = 'approve-with-changes' | 'revise' | 'reject' | null;

interface ImplPlanGateDecisionPanelProps {
  request: UserInputRequest;
  tasks: Array<{ id: string; title: string; type: ImplPlanTaskType; groupLabel: string }>;
  risks: Array<{ id: string; description: string; severity: ImplPlanRiskSeverity }>;
  scopeDefinition: { included: string[]; excluded: string[] } | null;
  onAnswer: (id: UUIDv7, response: Record<string, unknown>) => void;
  onCancel: (id: UUIDv7) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TASK_ACTIONS: Array<{ value: ImplPlanTaskEditAction | ''; label: string }> = [
  { value: '', label: 'No change' },
  ...Object.entries(IMPL_PLAN_TASK_EDIT_ACTION_LABELS).map(([value, label]) => ({
    value: value as ImplPlanTaskEditAction,
    label,
  })),
];

const RISK_ACTIONS: Array<{ value: ImplPlanRiskEditAction | ''; label: string }> = [
  { value: '', label: 'No change' },
  ...Object.entries(IMPL_PLAN_RISK_EDIT_ACTION_LABELS).map(([value, label]) => ({
    value: value as ImplPlanRiskEditAction,
    label,
  })),
];

const TASK_TYPES: Array<{ value: ImplPlanTaskType; label: string }> = Object.entries(
  IMPL_PLAN_TASK_TYPE_LABELS,
).map(([value, label]) => ({ value: value as ImplPlanTaskType, label }));

const RISK_SEVERITIES: ImplPlanRiskSeverity[] = ['low', 'medium', 'high'];

const SUBMIT_LABELS: Record<string, string> = {
  'approve-with-changes': 'Approve with Changes',
  'revise': 'Submit Revision Request',
  'reject': 'Submit Rejection',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImplPlanGateDecisionPanel({
  request,
  tasks,
  risks,
  onAnswer,
}: ImplPlanGateDecisionPanelProps) {
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [feedback, setFeedback] = useState('');
  const [taskEdits, setTaskEdits] = useState<Record<string, TaskEditState>>({});
  const [riskEdits, setRiskEdits] = useState<Record<string, RiskEditState>>({});
  const [scopeAddIncluded, setScopeAddIncluded] = useState('');
  const [scopeRemoveIncluded, setScopeRemoveIncluded] = useState('');
  const [scopeAddExcluded, setScopeAddExcluded] = useState('');
  const [scopeRemoveExcluded, setScopeRemoveExcluded] = useState('');
  const [reorderGroups, setReorderGroups] = useState('');
  const [changeDependencies, setChangeDependencies] = useState('');
  const [showFeedbackError, setShowFeedbackError] = useState(false);

  function handleImmediate(decision: GateDecision) {
    onAnswer(request.id, { decision, feedback: '' });
  }

  function handleOpenEditPanel(mode: EditMode) {
    setEditMode(mode);
    setFeedback('');
    setTaskEdits({});
    setRiskEdits({});
    setScopeAddIncluded('');
    setScopeRemoveIncluded('');
    setScopeAddExcluded('');
    setScopeRemoveExcluded('');
    setReorderGroups('');
    setChangeDependencies('');
    setShowFeedbackError(false);
  }

  function handleTaskAction(taskId: string, action: string) {
    setTaskEdits((prev) => ({
      ...prev,
      [taskId]: { action: action as ImplPlanTaskEditAction | '', details: prev[taskId]?.details ?? '', newType: prev[taskId]?.newType ?? '' },
    }));
  }

  function handleTaskDetails(taskId: string, details: string) {
    setTaskEdits((prev) => ({
      ...prev,
      [taskId]: { action: prev[taskId]?.action ?? '', details, newType: prev[taskId]?.newType ?? '' },
    }));
  }

  function handleTaskNewType(taskId: string, newType: string) {
    setTaskEdits((prev) => ({
      ...prev,
      [taskId]: { action: prev[taskId]?.action ?? '', details: prev[taskId]?.details ?? '', newType: newType as ImplPlanTaskType | '' },
    }));
  }

  function handleRiskAction(riskId: string, action: string) {
    setRiskEdits((prev) => ({
      ...prev,
      [riskId]: { action: action as ImplPlanRiskEditAction | '', details: prev[riskId]?.details ?? '', newSeverity: prev[riskId]?.newSeverity ?? '' },
    }));
  }

  function handleRiskDetails(riskId: string, details: string) {
    setRiskEdits((prev) => ({
      ...prev,
      [riskId]: { action: prev[riskId]?.action ?? '', details, newSeverity: prev[riskId]?.newSeverity ?? '' },
    }));
  }

  function handleRiskNewSeverity(riskId: string, severity: string) {
    setRiskEdits((prev) => ({
      ...prev,
      [riskId]: { action: prev[riskId]?.action ?? '', details: prev[riskId]?.details ?? '', newSeverity: severity as ImplPlanRiskSeverity | '' },
    }));
  }

  function parseCommaSeparated(value: string): string[] {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const feedbackRequired = editMode === 'reject' || editMode === 'revise';

  function handleSubmit() {
    if (!editMode) return;

    if (feedbackRequired && feedback.trim() === '') {
      setShowFeedbackError(true);
      return;
    }

    const activeTaskEdits = Object.entries(taskEdits)
      .filter(([, state]) => state.action !== '')
      .map(([taskId, state]) => {
        const edit: Record<string, unknown> = {
          taskId,
          action: state.action as ImplPlanTaskEditAction,
          details: state.details,
        };
        if (state.action === 'change-type' && state.newType) {
          edit.newType = state.newType;
        }
        return edit;
      });

    const activeRiskEdits = Object.entries(riskEdits)
      .filter(([, state]) => state.action !== '')
      .map(([riskId, state]) => {
        const edit: Record<string, unknown> = {
          riskId,
          action: state.action as ImplPlanRiskEditAction,
          details: state.details,
        };
        if (state.action === 'change-severity' && state.newSeverity) {
          edit.newSeverity = state.newSeverity;
        }
        return edit;
      });

    const scopeChanges = {
      addToIncluded: parseCommaSeparated(scopeAddIncluded),
      removeFromIncluded: parseCommaSeparated(scopeRemoveIncluded),
      addToExcluded: parseCommaSeparated(scopeAddExcluded),
      removeFromExcluded: parseCommaSeparated(scopeRemoveExcluded),
    };

    const dependencyChanges = {
      reorderGroups: reorderGroups.trim(),
      changeDependencies: changeDependencies.trim(),
    };

    const response: Record<string, unknown> = {
      decision: editMode as GateDecision,
      feedback,
    };

    if (activeTaskEdits.length > 0) {
      response.taskEdits = activeTaskEdits;
    }

    if (activeRiskEdits.length > 0) {
      response.riskEdits = activeRiskEdits;
    }

    const hasScopeChanges =
      scopeChanges.addToIncluded.length > 0 ||
      scopeChanges.removeFromIncluded.length > 0 ||
      scopeChanges.addToExcluded.length > 0 ||
      scopeChanges.removeFromExcluded.length > 0;

    if (hasScopeChanges) {
      response.scopeChanges = scopeChanges;
    }

    const hasDependencyChanges = dependencyChanges.reorderGroups !== '' || dependencyChanges.changeDependencies !== '';

    if (hasDependencyChanges) {
      response.dependencyChanges = dependencyChanges;
    }

    onAnswer(request.id, response);
  }

  // ── Decision buttons ──────────────────────────────────────────────────────

  if (editMode === null) {
    return (
      <div data-testid="impl-plan-gate-decision-panel" className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium">{request.title}</h3>
        <p className="text-xs text-muted-foreground">{request.message}</p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            data-testid="impl-plan-gate-btn-approve"
            onClick={() => handleImmediate('approve')}
            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
          <button
            data-testid="impl-plan-gate-btn-approve-with-changes"
            onClick={() => handleOpenEditPanel('approve-with-changes')}
            className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
          >
            Approve with Changes
          </button>
          <button
            data-testid="impl-plan-gate-btn-revise"
            onClick={() => handleOpenEditPanel('revise')}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
          >
            Revise
          </button>
          <button
            data-testid="impl-plan-gate-btn-reject"
            onClick={() => handleOpenEditPanel('reject')}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
          >
            Reject
          </button>
          <button
            data-testid="impl-plan-gate-btn-pause"
            onClick={() => handleImmediate('pause')}
            className="rounded-md bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Pause
          </button>
          <button
            data-testid="impl-plan-gate-btn-cancel"
            onClick={() => handleImmediate('cancel')}
            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Structured edit panel ─────────────────────────────────────────────────

  return (
    <div data-testid="impl-plan-gate-decision-panel" className="rounded-lg border bg-card p-4 space-y-4">
      <h3 className="text-sm font-medium">{request.title}</h3>

      <div data-testid="impl-plan-gate-edit-panel" className="space-y-4">
        {/* Feedback */}
        <div>
          <label className="block text-xs font-medium mb-1">Feedback</label>
          <textarea
            value={feedback}
            onChange={(e) => { setFeedback(e.target.value); setShowFeedbackError(false); }}
            placeholder="Describe your feedback or requested plan changes..."
            rows={3}
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none ${showFeedbackError ? 'border-red-500' : ''}`}
          />
          {showFeedbackError && (
            <p data-testid="feedback-error" className="text-xs text-red-500 mt-1">
              Feedback is required for {editMode} decisions.
            </p>
          )}
        </div>

        {/* Task edits */}
        {tasks.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-2">Task Edits</label>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2">
                  <span className="text-xs min-w-[180px] truncate" title={`[${task.groupLabel}] ${task.title}`}>
                    <span className="inline-block rounded bg-muted px-1 py-0.5 text-[10px] mr-1">{IMPL_PLAN_TASK_TYPE_LABELS[task.type]}</span>
                    {task.title}
                  </span>
                  <select
                    data-testid={`task-action-${task.id}`}
                    value={taskEdits[task.id]?.action ?? ''}
                    onChange={(e) => handleTaskAction(task.id, e.target.value)}
                    className="rounded-md border bg-background px-2 py-1 text-xs"
                  >
                    {TASK_ACTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {taskEdits[task.id]?.action === 'change-type' && (
                    <select
                      data-testid={`task-new-type-${task.id}`}
                      value={taskEdits[task.id]?.newType ?? ''}
                      onChange={(e) => handleTaskNewType(task.id, e.target.value)}
                      className="rounded-md border bg-background px-2 py-1 text-xs"
                    >
                      <option value="">Select type...</option>
                      {TASK_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  )}
                  <input
                    data-testid={`task-details-${task.id}`}
                    type="text"
                    value={taskEdits[task.id]?.details ?? ''}
                    onChange={(e) => handleTaskDetails(task.id, e.target.value)}
                    placeholder="Details..."
                    className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scope changes */}
        <div>
          <label className="block text-xs font-medium mb-2">Scope Changes</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-muted-foreground mb-0.5">Add to included</label>
              <input
                data-testid="scope-add-included"
                type="text"
                value={scopeAddIncluded}
                onChange={(e) => setScopeAddIncluded(e.target.value)}
                placeholder="Comma-separated..."
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-0.5">Remove from included</label>
              <input
                data-testid="scope-remove-included"
                type="text"
                value={scopeRemoveIncluded}
                onChange={(e) => setScopeRemoveIncluded(e.target.value)}
                placeholder="Comma-separated..."
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-0.5">Add to excluded</label>
              <input
                data-testid="scope-add-excluded"
                type="text"
                value={scopeAddExcluded}
                onChange={(e) => setScopeAddExcluded(e.target.value)}
                placeholder="Comma-separated..."
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-0.5">Remove from excluded</label>
              <input
                data-testid="scope-remove-excluded"
                type="text"
                value={scopeRemoveExcluded}
                onChange={(e) => setScopeRemoveExcluded(e.target.value)}
                placeholder="Comma-separated..."
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Risk edits */}
        {risks.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-2">Risk Edits</label>
            <div className="space-y-2">
              {risks.map((risk) => (
                <div key={risk.id} className="flex items-center gap-2">
                  <span className="text-xs min-w-[180px] truncate" title={risk.description}>
                    <span className={`inline-block rounded px-1 py-0.5 text-[10px] mr-1 ${risk.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : risk.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'}`}>
                      {risk.severity}
                    </span>
                    {risk.description}
                  </span>
                  <select
                    data-testid={`risk-action-${risk.id}`}
                    value={riskEdits[risk.id]?.action ?? ''}
                    onChange={(e) => handleRiskAction(risk.id, e.target.value)}
                    className="rounded-md border bg-background px-2 py-1 text-xs"
                  >
                    {RISK_ACTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {riskEdits[risk.id]?.action === 'change-severity' && (
                    <select
                      data-testid={`risk-new-severity-${risk.id}`}
                      value={riskEdits[risk.id]?.newSeverity ?? ''}
                      onChange={(e) => handleRiskNewSeverity(risk.id, e.target.value)}
                      className="rounded-md border bg-background px-2 py-1 text-xs"
                    >
                      <option value="">Select...</option>
                      {RISK_SEVERITIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                  <input
                    data-testid={`risk-details-${risk.id}`}
                    type="text"
                    value={riskEdits[risk.id]?.details ?? ''}
                    onChange={(e) => handleRiskDetails(risk.id, e.target.value)}
                    placeholder="Details..."
                    className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependency changes */}
        <div>
          <label className="block text-xs font-medium mb-2">Dependency Changes</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-muted-foreground mb-0.5">Reorder groups</label>
              <input
                data-testid="dependency-reorder-groups"
                type="text"
                value={reorderGroups}
                onChange={(e) => setReorderGroups(e.target.value)}
                placeholder="Describe reordering..."
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-0.5">Change dependencies</label>
              <input
                data-testid="dependency-change-deps"
                type="text"
                value={changeDependencies}
                onChange={(e) => setChangeDependencies(e.target.value)}
                placeholder="Describe changes..."
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            data-testid="impl-plan-gate-submit"
            onClick={handleSubmit}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {SUBMIT_LABELS[editMode] ?? 'Submit'}
          </button>
          <button
            data-testid="impl-plan-gate-back"
            onClick={() => setEditMode(null)}
            className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
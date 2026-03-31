'use client';

import { useState } from 'react';
type UUIDv7 = string;
import type { UserInputRequest } from '../views/skill-view-props';
import type {
  GateDecision,
  QaCheckStatus,
  QaCheckOverrideAction,
  QaOverallVerdict,
} from '../types';
import { QA_VERDICT_LABELS } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OverrideState {
  action: QaCheckOverrideAction | '';
  notes: string;
}

type EditMode = 'approve-with-changes' | 'revise' | 'reject' | null;

interface QaGateDecisionPanelProps {
  request: UserInputRequest;
  functionalityChecks: Array<{ criterion: string; status: QaCheckStatus; notes: string }>;
  dodChecks: Array<{ item: string; status: 'pass' | 'fail'; notes: string }>;
  overallVerdict: QaOverallVerdict | null;
  onAnswer: (id: UUIDv7, response: Record<string, unknown>) => void;
  onCancel: (id: UUIDv7) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OVERRIDE_ACTIONS: Array<{ value: QaCheckOverrideAction | ''; label: string }> = [
  { value: '', label: 'No change' },
  { value: 'accept-as-is', label: 'Accept as-is' },
  { value: 'must-fix', label: 'Must fix' },
];

const VERDICT_STYLES: Record<QaOverallVerdict, string> = {
  pass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  fail: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'needs-work': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

const SUBMIT_LABELS: Record<string, string> = {
  'approve-with-changes': 'Approve with Overrides',
  'revise': 'Submit Fix Request',
  'reject': 'Submit Rejection',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QaGateDecisionPanel({
  request,
  functionalityChecks,
  dodChecks,
  overallVerdict,
  onAnswer,
}: QaGateDecisionPanelProps) {
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [feedback, setFeedback] = useState('');
  const [funcOverrides, setFuncOverrides] = useState<Record<number, OverrideState>>({});
  const [dodOverrides, setDodOverrides] = useState<Record<number, OverrideState>>({});
  const [showFeedbackError, setShowFeedbackError] = useState(false);

  const failingFuncChecks = functionalityChecks
    .map((c, i) => ({ ...c, originalIndex: i }))
    .filter((c) => c.status !== 'pass');
  const failingDodChecks = dodChecks
    .map((c, i) => ({ ...c, originalIndex: i }))
    .filter((c) => c.status === 'fail');
  const failingCount = failingFuncChecks.length + failingDodChecks.length;

  function handleImmediate(decision: GateDecision) {
    onAnswer(request.id, { decision, feedback: '' });
  }

  function handleOpenEditPanel(mode: EditMode) {
    setEditMode(mode);
    setFeedback('');
    setFuncOverrides({});
    setDodOverrides({});
    setShowFeedbackError(false);
  }

  const feedbackRequired = editMode === 'reject' || editMode === 'revise';

  function handleSubmit() {
    if (!editMode) return;

    if (feedbackRequired && feedback.trim() === '') {
      setShowFeedbackError(true);
      return;
    }

    const activeOverrides: Array<{ criterion: string; action: QaCheckOverrideAction; notes: string }> = [];

    for (let i = 0; i < failingFuncChecks.length; i++) {
      const override = funcOverrides[i];
      if (override && override.action !== '') {
        activeOverrides.push({
          criterion: failingFuncChecks[i].criterion,
          action: override.action as QaCheckOverrideAction,
          notes: override.notes,
        });
      }
    }

    for (let i = 0; i < failingDodChecks.length; i++) {
      const override = dodOverrides[i];
      if (override && override.action !== '') {
        activeOverrides.push({
          criterion: failingDodChecks[i].item,
          action: override.action as QaCheckOverrideAction,
          notes: override.notes,
        });
      }
    }

    const response: Record<string, unknown> = {
      decision: (editMode === 'approve-with-changes' ? 'approve-with-changes' : editMode) as GateDecision,
      feedback,
    };

    if (activeOverrides.length > 0) {
      response.checkOverrides = activeOverrides;
    }

    onAnswer(request.id, response);
  }

  // ── Decision buttons ──────────────────────────────────────────────────────

  if (editMode === null) {
    return (
      <div data-testid="qa-gate-decision-panel" className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium">{request.title}</h3>
        <p className="text-xs text-muted-foreground">{request.message}</p>

        {overallVerdict && (
          <div className="flex items-center gap-3">
            <div data-testid="qa-gate-verdict-summary" className="flex items-center gap-2">
              <span className="text-xs font-medium">Verdict:</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${VERDICT_STYLES[overallVerdict] ?? ''}`}>
                {QA_VERDICT_LABELS[overallVerdict] ?? overallVerdict}
              </span>
            </div>
            {failingCount > 0 && (
              <span data-testid="qa-gate-failing-count" className="text-xs text-muted-foreground">
                {failingCount} failing check{failingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            data-testid="qa-gate-btn-approve"
            onClick={() => handleImmediate('approve')}
            className="cursor-pointer rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 active:bg-green-800 transition-colors"
          >
            Approve
          </button>
          <button
            data-testid="qa-gate-btn-approve-with-overrides"
            onClick={() => handleOpenEditPanel('approve-with-changes')}
            className="cursor-pointer rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 active:bg-teal-800 transition-colors"
          >
            Approve with Overrides
          </button>
          <button
            data-testid="qa-gate-btn-request-fixes"
            onClick={() => handleOpenEditPanel('revise')}
            className="cursor-pointer rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 active:bg-amber-800 transition-colors"
          >
            Request Fixes
          </button>
          <button
            data-testid="qa-gate-btn-reject"
            onClick={() => handleOpenEditPanel('reject')}
            className="cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            Reject
          </button>
          <button
            data-testid="qa-gate-btn-pause"
            onClick={() => handleImmediate('pause')}
            className="cursor-pointer rounded-md bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 active:bg-slate-800 transition-colors"
          >
            Pause
          </button>
          <button
            data-testid="qa-gate-btn-cancel"
            onClick={() => handleImmediate('cancel')}
            className="cursor-pointer rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 active:bg-red-100 dark:hover:bg-red-950 dark:active:bg-red-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Structured edit panel ─────────────────────────────────────────────────

  return (
    <div data-testid="qa-gate-decision-panel" className="rounded-lg border bg-card p-4 space-y-4">
      <h3 className="text-sm font-medium">{request.title}</h3>

      <div data-testid="qa-gate-edit-panel" className="space-y-4">
        {/* Feedback */}
        <div>
          <label className="block text-xs font-medium mb-1">Feedback</label>
          <textarea
            value={feedback}
            onChange={(e) => { setFeedback(e.target.value); setShowFeedbackError(false); }}
            placeholder="Describe your feedback or requested fixes..."
            rows={3}
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none ${showFeedbackError ? 'border-red-500' : ''}`}
          />
          {showFeedbackError && (
            <p data-testid="feedback-error" className="text-xs text-red-500 mt-1">
              Feedback is required for {editMode === 'revise' ? 'request fixes' : editMode} decisions.
            </p>
          )}
        </div>

        {/* Failing functionality checks */}
        {failingFuncChecks.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-2">Failing Functionality Checks</label>
            <div className="space-y-2">
              {failingFuncChecks.map((check, i) => (
                <div key={check.originalIndex} data-testid={`func-override-${i}`} className="flex items-center gap-2">
                  <span className="text-xs min-w-[180px] truncate" title={check.criterion}>
                    <span className={`inline-block rounded px-1 py-0.5 text-[10px] mr-1 ${
                      check.status === 'fail'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                    }`}>
                      {check.status === 'fail' ? 'Fail' : 'Needs Work'}
                    </span>
                    {check.criterion}
                  </span>
                  <select
                    data-testid={`func-override-action-${i}`}
                    value={funcOverrides[i]?.action ?? ''}
                    onChange={(e) => setFuncOverrides((prev) => ({
                      ...prev,
                      [i]: { action: e.target.value as QaCheckOverrideAction | '', notes: prev[i]?.notes ?? '' },
                    }))}
                    className="rounded-md border bg-background px-2 py-1 text-xs"
                  >
                    {OVERRIDE_ACTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    data-testid={`func-override-notes-${i}`}
                    type="text"
                    value={funcOverrides[i]?.notes ?? ''}
                    onChange={(e) => setFuncOverrides((prev) => ({
                      ...prev,
                      [i]: { action: prev[i]?.action ?? '', notes: e.target.value },
                    }))}
                    placeholder="Notes..."
                    className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failing DoD checks */}
        {failingDodChecks.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-2">Failing Definition of Done Checks</label>
            <div className="space-y-2">
              {failingDodChecks.map((check, i) => (
                <div key={check.originalIndex} data-testid={`dod-override-${i}`} className="flex items-center gap-2">
                  <span className="text-xs min-w-[180px] truncate" title={check.item}>
                    <span className="inline-block rounded px-1 py-0.5 text-[10px] mr-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                      Fail
                    </span>
                    {check.item}
                  </span>
                  <select
                    data-testid={`dod-override-action-${i}`}
                    value={dodOverrides[i]?.action ?? ''}
                    onChange={(e) => setDodOverrides((prev) => ({
                      ...prev,
                      [i]: { action: e.target.value as QaCheckOverrideAction | '', notes: prev[i]?.notes ?? '' },
                    }))}
                    className="rounded-md border bg-background px-2 py-1 text-xs"
                  >
                    {OVERRIDE_ACTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    data-testid={`dod-override-notes-${i}`}
                    type="text"
                    value={dodOverrides[i]?.notes ?? ''}
                    onChange={(e) => setDodOverrides((prev) => ({
                      ...prev,
                      [i]: { action: prev[i]?.action ?? '', notes: e.target.value },
                    }))}
                    placeholder="Notes..."
                    className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            data-testid="qa-gate-submit"
            onClick={handleSubmit}
            className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors"
          >
            {SUBMIT_LABELS[editMode] ?? 'Submit'}
          </button>
          <button
            data-testid="qa-gate-back"
            onClick={() => setEditMode(null)}
            className="cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted active:bg-muted/80 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
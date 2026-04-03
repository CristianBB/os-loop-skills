'use client';

import { useState } from 'react';
type UUIDv7 = string;
import type { UserInputRequest } from '../views/skill-view-props';
import type { GateDecision, RoadmapPhaseEditAction } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhaseEditState {
  action: RoadmapPhaseEditAction | '';
  details: string;
}

type EditMode = 'approve-with-changes' | 'revise' | 'reject' | null;

interface RoadmapGateDecisionPanelProps {
  request: UserInputRequest;
  roadmapPhases: Array<{ id: string; name: string }>;
  onAnswer: (id: UUIDv7, response: Record<string, unknown>) => void;
  onCancel: (id: UUIDv7) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHASE_ACTIONS: Array<{ value: RoadmapPhaseEditAction | ''; label: string }> = [
  { value: '', label: 'No change' },
  { value: 'remove', label: 'Remove' },
  { value: 'reprioritize', label: 'Reprioritize' },
  { value: 'edit-scope', label: 'Edit scope' },
  { value: 'merge', label: 'Merge' },
  { value: 'split', label: 'Split' },
];

const SUBMIT_LABELS: Record<string, string> = {
  'approve-with-changes': 'Approve with Changes',
  'revise': 'Submit Revision Request',
  'reject': 'Submit Rejection',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RoadmapGateDecisionPanel({
  request,
  roadmapPhases,
  onAnswer,
  onCancel,
}: RoadmapGateDecisionPanelProps) {
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [feedback, setFeedback] = useState('');
  const [phaseEdits, setPhaseEdits] = useState<Record<string, PhaseEditState>>({});
  const [scopeAddIncluded, setScopeAddIncluded] = useState('');
  const [scopeRemoveIncluded, setScopeRemoveIncluded] = useState('');
  const [scopeAddExcluded, setScopeAddExcluded] = useState('');
  const [scopeRemoveExcluded, setScopeRemoveExcluded] = useState('');

  function handleImmediate(decision: GateDecision) {
    onAnswer(request.id, { decision, feedback: '' });
  }

  function handleOpenEditPanel(mode: EditMode) {
    setEditMode(mode);
    setFeedback('');
    setPhaseEdits({});
    setScopeAddIncluded('');
    setScopeRemoveIncluded('');
    setScopeAddExcluded('');
    setScopeRemoveExcluded('');
  }

  function handlePhaseAction(phaseId: string, action: string) {
    setPhaseEdits((prev) => ({
      ...prev,
      [phaseId]: { action: action as RoadmapPhaseEditAction | '', details: prev[phaseId]?.details ?? '' },
    }));
  }

  function handlePhaseDetails(phaseId: string, details: string) {
    setPhaseEdits((prev) => ({
      ...prev,
      [phaseId]: { action: prev[phaseId]?.action ?? '', details },
    }));
  }

  function parseCommaSeparated(value: string): string[] {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const feedbackRequired = editMode === 'reject' || editMode === 'revise';
  const [showFeedbackError, setShowFeedbackError] = useState(false);

  function handleSubmit() {
    if (!editMode) return;

    if (feedbackRequired && feedback.trim() === '') {
      setShowFeedbackError(true);
      return;
    }

    const activePhaseEdits = Object.entries(phaseEdits)
      .filter(([, state]) => state.action !== '')
      .map(([phaseId, state]) => ({
        phaseId,
        action: state.action as RoadmapPhaseEditAction,
        details: state.details,
      }));

    const scopeChanges = {
      addToIncluded: parseCommaSeparated(scopeAddIncluded),
      removeFromIncluded: parseCommaSeparated(scopeRemoveIncluded),
      addToExcluded: parseCommaSeparated(scopeAddExcluded),
      removeFromExcluded: parseCommaSeparated(scopeRemoveExcluded),
    };

    const response: Record<string, unknown> = {
      decision: editMode as GateDecision,
      feedback,
    };

    if (activePhaseEdits.length > 0) {
      response.phaseEdits = activePhaseEdits;
    }

    const hasScopeChanges =
      scopeChanges.addToIncluded.length > 0 ||
      scopeChanges.removeFromIncluded.length > 0 ||
      scopeChanges.addToExcluded.length > 0 ||
      scopeChanges.removeFromExcluded.length > 0;

    if (hasScopeChanges) {
      response.scopeChanges = scopeChanges;
    }

    onAnswer(request.id, response);
  }

  // ── Decision buttons ──────────────────────────────────────────────────────

  if (editMode === null) {
    return (
      <div data-testid="roadmap-gate-decision-panel" className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium">{request.title}</h3>
        <p className="text-xs text-muted-foreground">{request.message}</p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            data-testid="roadmap-gate-btn-approve"
            onClick={() => handleImmediate('approve')}
            className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
          >
            Approve
          </button>
          <button
            data-testid="roadmap-gate-btn-approve-with-changes"
            onClick={() => handleOpenEditPanel('approve-with-changes')}
            className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ backgroundColor: '#0d9488', color: '#ffffff' }}
          >
            Approve with Changes
          </button>
          <button
            data-testid="roadmap-gate-btn-revise"
            onClick={() => handleOpenEditPanel('revise')}
            className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ backgroundColor: '#d97706', color: '#ffffff' }}
          >
            Revise
          </button>
          <button
            data-testid="roadmap-gate-btn-reject"
            onClick={() => handleOpenEditPanel('reject')}
            className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
          >
            Reject
          </button>
          <button
            data-testid="roadmap-gate-btn-pause"
            onClick={() => handleImmediate('pause')}
            className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ backgroundColor: '#475569', color: '#ffffff' }}
          >
            Pause
          </button>
          <button
            data-testid="roadmap-gate-btn-cancel"
            onClick={() => handleImmediate('cancel')}
            className="cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ borderColor: '#fca5a5', color: '#dc2626' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Structured edit panel ─────────────────────────────────────────────────

  return (
    <div data-testid="roadmap-gate-decision-panel" className="rounded-lg border bg-card p-4 space-y-4">
      <h3 className="text-sm font-medium">{request.title}</h3>

      <div data-testid="roadmap-gate-edit-panel" className="space-y-4">
        {/* Feedback */}
        <div>
          <label className="block text-xs font-medium mb-1">Feedback</label>
          <textarea
            value={feedback}
            onChange={(e) => { setFeedback(e.target.value); setShowFeedbackError(false); }}
            placeholder="Describe your feedback or requested changes..."
            rows={3}
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none ${showFeedbackError ? 'border-red-500' : ''}`}
          />
          {showFeedbackError && (
            <p data-testid="feedback-error" className="text-xs text-red-500 mt-1">
              Feedback is required for {editMode} decisions.
            </p>
          )}
        </div>

        {/* Phase edits */}
        {roadmapPhases.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-2">Phase Edits</label>
            <div className="space-y-2">
              {roadmapPhases.map((phase) => (
                <div key={phase.id} className="flex items-center gap-2">
                  <span className="text-xs min-w-[140px] truncate">{phase.name}</span>
                  <select
                    data-testid={`phase-action-${phase.id}`}
                    value={phaseEdits[phase.id]?.action ?? ''}
                    onChange={(e) => handlePhaseAction(phase.id, e.target.value)}
                    className="rounded-md border bg-background px-2 py-1 text-xs"
                  >
                    {PHASE_ACTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    data-testid={`phase-details-${phase.id}`}
                    type="text"
                    value={phaseEdits[phase.id]?.details ?? ''}
                    onChange={(e) => handlePhaseDetails(phase.id, e.target.value)}
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
                placeholder="Comma-separated items..."
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
                placeholder="Comma-separated items..."
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
                placeholder="Comma-separated items..."
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
                placeholder="Comma-separated items..."
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            data-testid="roadmap-gate-submit"
            onClick={handleSubmit}
            className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors"
          >
            {SUBMIT_LABELS[editMode] ?? 'Submit'}
          </button>
          <button
            data-testid="roadmap-gate-back"
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
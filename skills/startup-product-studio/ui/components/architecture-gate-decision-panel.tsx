'use client';

import { useState } from 'react';
type UUIDv7 = string;
import type { UserInputRequest } from '../views/skill-view-props';
import type { GateDecision, ArchitectureSectionEditAction, ArchitectureSectionId } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SectionEditState {
  action: ArchitectureSectionEditAction | '';
  details: string;
}

type EditMode = 'approve-with-changes' | 'revise' | 'reject' | null;

interface ArchitectureGateDecisionPanelProps {
  request: UserInputRequest;
  architectureSections: Array<{ id: ArchitectureSectionId; label: string }>;
  onAnswer: (id: UUIDv7, response: Record<string, unknown>) => void;
  onCancel: (id: UUIDv7) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTION_ACTIONS: Array<{ value: ArchitectureSectionEditAction | ''; label: string }> = [
  { value: '', label: 'No change' },
  { value: 'simplify', label: 'Simplify' },
  { value: 'add-detail', label: 'Add detail' },
  { value: 'replace', label: 'Replace' },
  { value: 'remove-component', label: 'Remove component' },
  { value: 'add-component', label: 'Add component' },
  { value: 'change-technology', label: 'Change technology' },
  { value: 'restructure', label: 'Restructure' },
];

const SUBMIT_LABELS: Record<string, string> = {
  'approve-with-changes': 'Approve with Changes',
  'revise': 'Submit Revision Request',
  'reject': 'Submit Rejection',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ArchitectureGateDecisionPanel({
  request,
  architectureSections,
  onAnswer,
  onCancel,
}: ArchitectureGateDecisionPanelProps) {
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [feedback, setFeedback] = useState('');
  const [sectionEdits, setSectionEdits] = useState<Record<string, SectionEditState>>({});
  const [topologyAddProjects, setTopologyAddProjects] = useState('');
  const [topologyRemoveProjects, setTopologyRemoveProjects] = useState('');
  const [topologyChangeTypes, setTopologyChangeTypes] = useState('');

  function handleImmediate(decision: GateDecision) {
    onAnswer(request.id, { decision, feedback: '' });
  }

  function handleOpenEditPanel(mode: EditMode) {
    setEditMode(mode);
    setFeedback('');
    setSectionEdits({});
    setTopologyAddProjects('');
    setTopologyRemoveProjects('');
    setTopologyChangeTypes('');
  }

  function handleSectionAction(sectionId: string, action: string) {
    setSectionEdits((prev) => ({
      ...prev,
      [sectionId]: { action: action as ArchitectureSectionEditAction | '', details: prev[sectionId]?.details ?? '' },
    }));
  }

  function handleSectionDetails(sectionId: string, details: string) {
    setSectionEdits((prev) => ({
      ...prev,
      [sectionId]: { action: prev[sectionId]?.action ?? '', details },
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

    const activeSectionEdits = Object.entries(sectionEdits)
      .filter(([, state]) => state.action !== '')
      .map(([sectionId, state]) => ({
        sectionId,
        action: state.action as ArchitectureSectionEditAction,
        details: state.details,
      }));

    const topologyChanges = {
      addProjects: parseCommaSeparated(topologyAddProjects),
      removeProjects: parseCommaSeparated(topologyRemoveProjects),
      changeTypes: parseCommaSeparated(topologyChangeTypes),
    };

    const response: Record<string, unknown> = {
      decision: editMode as GateDecision,
      feedback,
    };

    if (activeSectionEdits.length > 0) {
      response.sectionEdits = activeSectionEdits;
    }

    const hasTopologyChanges =
      topologyChanges.addProjects.length > 0 ||
      topologyChanges.removeProjects.length > 0 ||
      topologyChanges.changeTypes.length > 0;

    if (hasTopologyChanges) {
      response.topologyChanges = topologyChanges;
    }

    onAnswer(request.id, response);
  }

  // ── Decision buttons ──────────────────────────────────────────────────────

  if (editMode === null) {
    return (
      <div data-testid="architecture-gate-decision-panel" className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium">{request.title}</h3>
        <p className="text-xs text-muted-foreground">{request.message}</p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            data-testid="arch-gate-btn-approve"
            onClick={() => handleImmediate('approve')}
            className="cursor-pointer rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 active:bg-green-800 transition-colors"
          >
            Approve
          </button>
          <button
            data-testid="arch-gate-btn-approve-with-changes"
            onClick={() => handleOpenEditPanel('approve-with-changes')}
            className="cursor-pointer rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 active:bg-teal-800 transition-colors"
          >
            Approve with Changes
          </button>
          <button
            data-testid="arch-gate-btn-revise"
            onClick={() => handleOpenEditPanel('revise')}
            className="cursor-pointer rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 active:bg-amber-800 transition-colors"
          >
            Revise
          </button>
          <button
            data-testid="arch-gate-btn-reject"
            onClick={() => handleOpenEditPanel('reject')}
            className="cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            Reject
          </button>
          <button
            data-testid="arch-gate-btn-pause"
            onClick={() => handleImmediate('pause')}
            className="cursor-pointer rounded-md bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 active:bg-slate-800 transition-colors"
          >
            Pause
          </button>
          <button
            data-testid="arch-gate-btn-cancel"
            onClick={() => handleImmediate('cancel')}
            className="cursor-pointer rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 active:bg-red-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Structured edit panel ─────────────────────────────────────────────────

  return (
    <div data-testid="architecture-gate-decision-panel" className="rounded-lg border bg-card p-4 space-y-4">
      <h3 className="text-sm font-medium">{request.title}</h3>

      <div data-testid="architecture-gate-edit-panel" className="space-y-4">
        {/* Feedback */}
        <div>
          <label className="block text-xs font-medium mb-1">Feedback</label>
          <textarea
            value={feedback}
            onChange={(e) => { setFeedback(e.target.value); setShowFeedbackError(false); }}
            placeholder="Describe your feedback or requested architecture changes..."
            rows={3}
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none ${showFeedbackError ? 'border-red-500' : ''}`}
          />
          {showFeedbackError && (
            <p data-testid="feedback-error" className="text-xs text-red-500 mt-1">
              Feedback is required for {editMode} decisions.
            </p>
          )}
        </div>

        {/* Section edits */}
        {architectureSections.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-2">Section Edits</label>
            <div className="space-y-2">
              {architectureSections.map((section) => (
                <div key={section.id} className="flex items-center gap-2">
                  <span className="text-xs min-w-[160px] truncate">{section.label}</span>
                  <select
                    data-testid={`section-action-${section.id}`}
                    value={sectionEdits[section.id]?.action ?? ''}
                    onChange={(e) => handleSectionAction(section.id, e.target.value)}
                    className="rounded-md border bg-background px-2 py-1 text-xs"
                  >
                    {SECTION_ACTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    data-testid={`section-details-${section.id}`}
                    type="text"
                    value={sectionEdits[section.id]?.details ?? ''}
                    onChange={(e) => handleSectionDetails(section.id, e.target.value)}
                    placeholder="Details..."
                    className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topology changes */}
        <div>
          <label className="block text-xs font-medium mb-2">Topology Changes</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-muted-foreground mb-0.5">Add projects</label>
              <input
                data-testid="topology-add-projects"
                type="text"
                value={topologyAddProjects}
                onChange={(e) => setTopologyAddProjects(e.target.value)}
                placeholder="Comma-separated..."
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-0.5">Remove projects</label>
              <input
                data-testid="topology-remove-projects"
                type="text"
                value={topologyRemoveProjects}
                onChange={(e) => setTopologyRemoveProjects(e.target.value)}
                placeholder="Comma-separated..."
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-0.5">Change types</label>
              <input
                data-testid="topology-change-types"
                type="text"
                value={topologyChangeTypes}
                onChange={(e) => setTopologyChangeTypes(e.target.value)}
                placeholder="Comma-separated..."
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            data-testid="architecture-gate-submit"
            onClick={handleSubmit}
            className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors"
          >
            {SUBMIT_LABELS[editMode] ?? 'Submit'}
          </button>
          <button
            data-testid="architecture-gate-back"
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
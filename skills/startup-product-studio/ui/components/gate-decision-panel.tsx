'use client';

import { useState } from 'react';
type UUIDv7 = string;
import type { UserInputRequest } from '../views/skill-view-props';
import type { GateDecision } from '../types';

interface GateDecisionPanelProps {
  request: UserInputRequest;
  onAnswer: (id: UUIDv7, response: Record<string, unknown>) => void;
  onCancel: (id: UUIDv7) => void;
}

type FeedbackMode = 'revise' | 'reject' | null;

const FEEDBACK_PLACEHOLDERS: Record<string, string> = {
  revise: 'Describe what to revise...',
  reject: 'Explain why this was rejected...',
};

export function GateDecisionPanel({ request, onAnswer, onCancel }: GateDecisionPanelProps) {
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>(null);
  const [feedback, setFeedback] = useState('');

  function handleApprove() {
    onAnswer(request.id, { decision: 'approve' as GateDecision, feedback: '' });
  }

  function handlePause() {
    onAnswer(request.id, { decision: 'pause' as GateDecision, feedback: '' });
  }

  function handleCancelDecision() {
    onAnswer(request.id, { decision: 'cancel' as GateDecision, feedback: '' });
  }

  function handleDecisionWithFeedback(mode: FeedbackMode) {
    setFeedbackMode(mode);
    setFeedback('');
  }

  function handleSubmitFeedback() {
    if (!feedbackMode) return;
    onAnswer(request.id, { decision: feedbackMode as GateDecision, feedback });
  }

  return (
    <div data-testid="gate-decision-panel" className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-medium">{request.title}</h3>
      <p className="text-xs text-muted-foreground">{request.message}</p>

      {feedbackMode === null ? (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            data-testid="gate-btn-approve"
            onClick={handleApprove}
            className="cursor-pointer rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 active:bg-green-800 transition-colors"
          >
            Approve
          </button>
          <button
            data-testid="gate-btn-revise"
            onClick={() => handleDecisionWithFeedback('revise')}
            className="cursor-pointer rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 active:bg-amber-800 transition-colors"
          >
            Revise
          </button>
          <button
            data-testid="gate-btn-reject"
            onClick={() => handleDecisionWithFeedback('reject')}
            className="cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            Reject
          </button>
          <button
            data-testid="gate-btn-pause"
            onClick={handlePause}
            className="cursor-pointer rounded-md bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 active:bg-slate-800 transition-colors"
          >
            Pause
          </button>
          <button
            data-testid="gate-btn-cancel"
            onClick={handleCancelDecision}
            className="cursor-pointer rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 active:bg-red-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={FEEDBACK_PLACEHOLDERS[feedbackMode]}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              data-testid="gate-submit"
              onClick={handleSubmitFeedback}
              className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors"
            >
              Submit {feedbackMode === 'revise' ? 'Revision Request' : 'Rejection'}
            </button>
            <button
              data-testid="gate-cancel"
              onClick={() => setFeedbackMode(null)}
              className="cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted active:bg-muted/80 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

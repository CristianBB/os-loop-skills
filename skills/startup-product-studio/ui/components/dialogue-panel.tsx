'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { PhaseDialogue, DialogueTurn, RoleId } from '../types';
import { ROLE_LABELS } from '../types';
import type { UserInputRequest, SkillWorkspaceRef } from '../views/skill-view-props';
import { RoleBadge } from './role-badge';
import { Spinner } from './spinner';

type UUIDv7 = string;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DialoguePanelProps {
  request: UserInputRequest;
  workspace: SkillWorkspaceRef | null;
  onAnswer: (id: UUIDv7, response: Record<string, unknown>) => void;
  onCancel: (id: UUIDv7) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveDialogue(workspace: SkillWorkspaceRef | null): PhaseDialogue | null {
  if (!workspace) return null;
  const state = workspace.state as Record<string, unknown> | undefined;
  if (!state) return null;
  const projects = state.projects as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(projects)) return null;

  const activeProjectId = state.activeProjectId as string | undefined;
  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId)
    : projects[0];
  if (!activeProject) return null;

  const phaseDialogues = activeProject.phaseDialogues as Record<string, PhaseDialogue> | undefined;
  if (!phaseDialogues) return null;

  const currentPhase = activeProject.currentPhase as string | undefined;
  if (!currentPhase) return null;

  return phaseDialogues[currentPhase] ?? null;
}

function getTotalQuestions(dialogue: PhaseDialogue): number {
  const questionIds = new Set<string>();
  for (const turn of dialogue.turns) {
    questionIds.add(turn.questionId);
  }
  return Math.max(questionIds.size, dialogue.currentQuestionIndex + 1);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TurnBubble({ turn }: { turn: DialogueTurn }) {
  const isAccepted = turn.status === 'accepted';
  const isChallenged = turn.status === 'challenged';

  return (
    <div className="space-y-2">
      {/* Role question — left-aligned */}
      <div className="flex items-start gap-2">
        <RoleBadge role={turn.role} />
        <div className="flex-1 rounded-lg border bg-card p-3">
          <p className="text-sm">{turn.question}</p>
        </div>
      </div>

      {/* User answer — right-aligned with muted background */}
      {turn.answer && (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-lg bg-muted px-3 py-2">
            <p className="text-sm">{turn.answer}</p>
          </div>
        </div>
      )}

      {/* LLM challenge — amber callout */}
      {isChallenged && turn.llmReaction && (
        <div className="ml-8 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">Challenge</p>
          <p className="text-sm text-amber-900 dark:text-amber-100">{turn.llmReaction}</p>
        </div>
      )}

      {/* Accepted indicator — green */}
      {isAccepted && turn.llmReaction && (
        <div className="ml-8 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
          <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">Accepted</p>
          <p className="text-sm text-green-900 dark:text-green-100">{turn.llmReaction}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DialoguePanel({ request, workspace, onAnswer, onCancel }: DialoguePanelProps) {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dialogue = resolveDialogue(workspace);
  const totalQuestions = dialogue ? getTotalQuestions(dialogue) : 0;
  const currentIndex = dialogue ? dialogue.currentQuestionIndex + 1 : 0;

  // Auto-scroll to bottom when turns change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [dialogue?.turns.length]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    onAnswer(request.id, { answer: trimmed });
    setInput('');
    setSubmitting(false);
  }, [input, submitting, onAnswer, request.id]);

  const handleSkip = useCallback(() => {
    if (submitting) return;
    setSubmitting(true);
    onAnswer(request.id, { answer: '_skip_' });
    setInput('');
    setSubmitting(false);
  }, [submitting, onAnswer, request.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  // Completed turns (all except last pending)
  const completedTurns = dialogue?.turns.filter(
    (t) => t.status === 'accepted' || t.status === 'challenged' || (t.status === 'answered' && t.answer),
  ) ?? [];

  return (
    <div data-testid="dialogue-panel" className="rounded-lg border bg-card flex flex-col overflow-hidden">
      {/* Header with progress */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{request.title}</h3>
          {dialogue && (
            <span className="text-xs text-muted-foreground">
              Question {currentIndex} of {totalQuestions}
            </span>
          )}
        </div>
        {dialogue && totalQuestions > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (currentIndex / totalQuestions) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {Math.round((currentIndex / totalQuestions) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Conversation history */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
        {completedTurns.map((turn) => (
          <TurnBubble key={turn.id} turn={turn} />
        ))}
      </div>

      {/* Current question + input */}
      <div className="border-t p-4 space-y-3">
        {request.message && (
          <p className="text-sm">{request.message}</p>
        )}

        <textarea
          ref={textareaRef}
          data-testid="dialogue-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={submitting}
        />

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Cmd+Enter to submit
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              disabled={submitting}
              className="cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted active:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || submitting}
              className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {submitting ? <Spinner size="sm" /> : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

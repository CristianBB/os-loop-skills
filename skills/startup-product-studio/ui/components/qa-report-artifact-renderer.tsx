'use client';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isQaReportArtifactContent } from '../types';
import type { QaArchitectureAlignmentStatus, QaCheckStatus, QaOverallVerdict } from '../types';

const ALIGNMENT_STYLES: Record<QaArchitectureAlignmentStatus, { label: string; className: string }> = {
  aligned: { label: 'Aligned', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  'minor-drift': { label: 'Minor Drift', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  'significant-drift': { label: 'Significant Drift', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

const VERDICT_STYLES: Record<QaOverallVerdict, { label: string; className: string }> = {
  pass: { label: 'Pass', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  fail: { label: 'Fail', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  'needs-work': { label: 'Needs Work', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
};

const CHECK_STATUS_STYLES: Record<QaCheckStatus, { label: string; className: string }> = {
  pass: { label: 'Pass', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  fail: { label: 'Fail', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  'needs-work': { label: 'Needs Work', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
};

interface QaReportArtifactRendererProps {
  content: Record<string, unknown>;
}

export function QaReportArtifactRenderer({ content }: QaReportArtifactRendererProps) {
  if (!isQaReportArtifactContent(content)) {
    return (
      <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  }

  const { body, overallVerdict, functionalityChecks, definitionOfDoneChecks, architectureAssessment } = content;

  return (
    <div data-testid="qa-report-view" className="space-y-4 text-xs">
      <div className="prose prose-xs dark:prose-invert max-w-none">
        <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
      </div>

      {overallVerdict && (
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">Overall Verdict</h4>
          <span
            data-testid="qa-overall-verdict"
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              VERDICT_STYLES[overallVerdict]?.className ?? ''
            }`}
          >
            {VERDICT_STYLES[overallVerdict]?.label ?? overallVerdict}
          </span>
        </div>
      )}

      {functionalityChecks && functionalityChecks.length > 0 && (
        <div data-testid="functionality-checks" className="rounded-md border p-3 space-y-2">
          <h4 className="font-medium text-sm">Functionality Checks</h4>
          <div className="space-y-1">
            {functionalityChecks.map((check, i) => (
              <div key={i} data-testid={`func-check-${i}`} className="flex items-start gap-2">
                <span
                  data-testid={`func-status-${i}`}
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    CHECK_STATUS_STYLES[check.status]?.className ?? ''
                  }`}
                >
                  {CHECK_STATUS_STYLES[check.status]?.label ?? check.status}
                </span>
                <span className="font-medium">{check.criterion}</span>
                {check.notes && <span className="text-muted-foreground">{check.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {definitionOfDoneChecks && definitionOfDoneChecks.length > 0 && (
        <div data-testid="dod-checks" className="rounded-md border p-3 space-y-2">
          <h4 className="font-medium text-sm">Definition of Done</h4>
          <div className="space-y-1">
            {definitionOfDoneChecks.map((check, i) => (
              <div key={i} data-testid={`dod-check-${i}`} className="flex items-start gap-2">
                <span
                  data-testid={`dod-status-${i}`}
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    check.status === 'pass'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {check.status === 'pass' ? 'Pass' : 'Fail'}
                </span>
                <span className="font-medium">{check.item}</span>
                {check.notes && <span className="text-muted-foreground">{check.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {architectureAssessment && (
        <div data-testid="architecture-assessment" className="rounded-md border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">Architecture Alignment</h4>
            <span
              data-testid="alignment-status-badge"
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                ALIGNMENT_STYLES[architectureAssessment.alignmentStatus]?.className ?? ''
              }`}
            >
              {ALIGNMENT_STYLES[architectureAssessment.alignmentStatus]?.label ?? architectureAssessment.alignmentStatus}
            </span>
          </div>

          {architectureAssessment.driftFindings.length > 0 && (
            <div>
              <h5 className="font-medium text-muted-foreground">Drift Findings</h5>
              <ul data-testid="drift-findings" className="list-disc pl-4 space-y-0.5">
                {architectureAssessment.driftFindings.map((finding, i) => (
                  <li key={i}>{finding}</li>
                ))}
              </ul>
            </div>
          )}

          {architectureAssessment.qualityAttributeNotes.length > 0 && (
            <div>
              <h5 className="font-medium text-muted-foreground">Quality Attributes</h5>
              <ul data-testid="quality-notes" className="list-disc pl-4 space-y-0.5">
                {architectureAssessment.qualityAttributeNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {architectureAssessment.boundaryViolations.length > 0 && (
            <div>
              <h5 className="font-medium text-red-600 dark:text-red-400">Boundary Violations</h5>
              <ul data-testid="boundary-violations" className="list-disc pl-4 space-y-0.5 text-red-600 dark:text-red-400">
                {architectureAssessment.boundaryViolations.map((violation, i) => (
                  <li key={i}>{violation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
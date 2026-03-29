# Example: Background Agentic Skill — Batch Processor

An agentic skill with background execution support that processes items from workspace state in a loop, checkpointing after every N items for graceful resume after interruption.

## Execution Mode

Agentic (`executionMode: "agentic"`) with `supportsBackgroundExecution: true`. The runtime may continue this skill outside a foreground conversation turn. The skill relies on checkpointing and workspace state to maintain progress across interruptions.

## Processing Pattern

1. **Load state** — reads the `items` array and `cursorIndex` from workspace state. If no items exist, seeds 12 demo items (pangrams for character frequency analysis).
2. **Process loop** — iterates from `cursorIndex` through the items array, processing each pending item. Skips items already marked as `processed` or `error` (from a prior run).
3. **Checkpoint** — after every `batchSize` items (default: 5), saves state and creates a checkpoint. This is the core of the resume strategy.
4. **Summary** — on completion, creates a summary artifact with statistics and per-item results.

## Resume Behavior

When the skill is interrupted (timeout, user cancellation, runtime restart) and later resumed:

- Workspace state is loaded, including the `cursorIndex` marking the last saved position.
- Items before the cursor that are already `processed` or `error` are skipped.
- Processing continues from the first `pending` item at or after the cursor.
- The worst-case data loss is `batchSize - 1` items (those processed since the last checkpoint).

This makes the skill safe for long-running batch jobs that may be interrupted multiple times.

## Step Budget

The skill checks the step budget before processing each item, reserving 1 step for the final summary. If the budget is exhausted, it stops processing, creates the summary with whatever has been completed, and reports the remaining items as pending.

Default budget: 50 steps. Hard limit: 200 steps per run.

## Workspace State Schema

```json
{
  "items": [
    {
      "id": "item-000",
      "payload": "text to process",
      "status": "pending",
      "result": null,
      "errorMessage": null,
      "processedAt": null
    }
  ],
  "cursorIndex": 0,
  "startedAt": "2026-03-29T10:00:00.000Z",
  "lastCheckpointAt": null,
  "completedAt": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `items` | BatchItem[] | The items to process. Each has `id`, `payload`, `status`, `result`, `errorMessage`, `processedAt`. |
| `cursorIndex` | number | Index of the next item to process. Advances after each item. |
| `startedAt` | string | ISO timestamp of when processing began. |
| `lastCheckpointAt` | string | ISO timestamp of the most recent checkpoint. |
| `completedAt` | string | ISO timestamp of completion (null if still running). |

## Item Processing

Each item's `payload` string undergoes character frequency analysis:
- Word count and character count
- Top 10 most frequent characters with counts

In a real skill, this processing function would be replaced with the actual business logic (API calls, data transformation, file processing, etc.).

## Artifacts

| Artifact Type | Description |
|--------------|-------------|
| `summary` | Created on completion. Contains a Markdown report with statistics, per-item results, error details, and any remaining pending items. |

## Input

| Parameter   | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `batchSize` | number | No       | Items between checkpoints (default: 5) |

## Output

| Field              | Type   | Description |
|--------------------|--------|-------------|
| `processedCount`   | number | Items successfully processed |
| `skippedCount`     | number | Items that errored |
| `summaryArtifactId`| string | ID of the summary artifact |
| `stepsUsed`        | number | Total steps executed |

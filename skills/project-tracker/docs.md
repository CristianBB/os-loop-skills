# Project Tracker

Tracks projects through planning, execution, and review phases. Produces structured artifacts (status reports) and manages task state across conversations.

## Workspace Requirement

This skill requires an active workspace (`workspaceSupport: "required"`). A workspace must be created or selected before the skill can execute.

## Actions

### `init`
Creates a new project in the workspace.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `projectName` | No | Name for the project (defaults to "Untitled Project") |

### `add-task`
Adds a task to the current project.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `taskTitle` | Yes | Title of the task |

### `update-task`
Updates a task's status.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `taskTitle` | Yes | Title of the task to update |
| `taskStatus` | Yes | One of: `todo`, `in-progress`, `blocked`, `done` |

### `generate-report`
Uses the LLM to produce a markdown status report from the current project state. The report is saved as a workspace artifact with type `report`.

### `advance-phase`
Moves the project to a new phase.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `targetPhase` | Yes | One of: `planning`, `execution`, `review`, `complete` |

## Workspace State Schema (v1.0.0)

```json
{
  "projectName": "string",
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "status": "todo | in-progress | blocked | done",
      "createdAt": "ISO 8601",
      "updatedAt": "ISO 8601"
    }
  ],
  "createdAt": "ISO 8601"
}
```

## Example Flow

1. Agent activates workspace: `workspace_manage { action: "create", skillId: "...", name: "Q2 Launch" }`
2. Initialize project: `project-tracker { action: "init", projectName: "Q2 Launch" }`
3. Add tasks: `project-tracker { action: "add-task", taskTitle: "Design API contracts" }`
4. Advance phase: `project-tracker { action: "advance-phase", targetPhase: "execution" }`
5. Track progress: `project-tracker { action: "update-task", taskTitle: "Design API contracts", taskStatus: "done" }`
6. Generate report: `project-tracker { action: "generate-report" }` → saves artifact

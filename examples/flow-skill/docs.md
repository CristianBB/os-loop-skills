# Example: Flow Skill — Multi-Step Greeting

A flow skill that demonstrates multi-step execution with pause and user input. The skill generates a greeting, pauses to ask the user how they want it personalized, then refines the result.

## Execution Mode

Flow (`executionMode: "flow"`). The runtime creates a WorkspaceRun to track progress. The skill uses `host.run` to report steps, request input, and checkpoint state.

## Flow Steps

| Step | Label | Description |
|------|-------|-------------|
| 1 | `greet` | Generates an initial greeting using `host.llm.complete`. |
| — | *(pause)* | Calls `host.run.requestInput` to ask the user for a personalization preference. The run enters the `waiting_user_input` state until the user responds. |
| 2 | `personalize` | Refines the greeting using the user's preference via a second LLM call. |

## Pause Behavior

The skill pauses exactly once, between the "greet" and "personalize" steps. The user is shown the initial greeting and asked how to personalize it (e.g., "make it more formal", "add a joke"). The input schema expects a single `preference` string.

If the user does not respond immediately, the run remains in `waiting_user_input`. The runtime can resume it when the user provides input — the checkpoint created before the pause preserves the initial greeting so the LLM call is not repeated.

## Workspace Usage

Optional. If a workspace is available, the skill appends each greeting to a `greetingHistory` array in workspace state. This allows the user to revisit past greetings across sessions.

## Input

| Parameter  | Type   | Required | Description |
|------------|--------|----------|-------------|
| `name`     | string | Yes      | Name of the person to greet |
| `occasion` | string | No       | Occasion for the greeting (default: "general") |

## Output

| Field     | Type     | Description |
|-----------|----------|-------------|
| `greeting`| string   | The final personalized greeting |
| `steps`   | string[] | Labels of completed flow steps |

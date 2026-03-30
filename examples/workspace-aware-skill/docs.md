# Example: Workspace-Aware Skill — Greeting with Memory

A declarative skill that uses optional workspace persistence to remember user preferences across sessions. Demonstrates the pattern of graceful degradation: the skill works without a workspace (stateless defaults), but gains cross-session memory when one is available.

## Execution Mode

Declarative (`executionMode: "declarative"`). No `host.run` API is used. The skill is invoked once and returns immediately.

## Workspace Usage

Optional (`workspaceSupport: "optional"`). The skill checks for `host.workspace` at runtime:

- **With workspace:** Loads saved preferences (style, language, greeting count), merges overrides from the current invocation, generates a greeting that acknowledges returning users, and saves the updated preferences back.
- **Without workspace:** Uses default preferences (or the style/language provided in args), generates a first-time greeting, and nothing is persisted.

### Workspace State Schema

```json
{
  "preferences": {
    "style": "casual",
    "language": "en",
    "lastGreetedName": "Alice",
    "greetingCount": 5
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `style` | string | One of: `formal`, `casual`, `enthusiastic`, `poetic` |
| `language` | string | Language code: `en`, `es`, `fr` |
| `lastGreetedName` | string | The last name that was greeted |
| `greetingCount` | number | Total number of greetings generated in this workspace |

## Supported Languages

The skill includes greeting templates for English (`en`), Spanish (`es`), and French (`fr`). Unknown language codes fall back to English.

## Returning User Awareness

When `greetingCount > 1` (only possible with workspace persistence), the greeting acknowledges that the user has been greeted before, including the greeting number. First-time greetings use a different template.

## Input

| Parameter  | Type   | Required | Description |
|------------|--------|----------|-------------|
| `name`     | string | Yes      | Name of the person to greet |
| `style`    | string | No       | Greeting style override (saved to preferences) |
| `language` | string | No       | Language code override (saved to preferences) |

## Output

| Field            | Type    | Description |
|------------------|---------|-------------|
| `greeting`       | string  | The generated greeting text |
| `preferencesUsed`| object  | The preferences that were applied |
| `persistent`     | boolean | Whether a workspace was used |

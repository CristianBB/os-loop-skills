# Note Organizer

Captures, tags, and retrieves notes. Works standalone within a single session, or with an active workspace for cross-session persistence and export.

## Workspace Requirement

This skill has optional workspace support (`workspaceSupport: "optional"`). Without a workspace, notes exist only for the current session. With a workspace, notes persist and can be exported as artifacts.

## Actions

### `add`
Captures a new note. If no tags are provided, auto-tags using the LLM.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `title` | No | Note title (defaults to "Untitled") |
| `content` | No | Note body text |
| `tags` | No | Tags to assign (auto-generated if empty) |

### `search`
Finds notes by text query and/or tags.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `query` | No | Text to search in title and content |
| `tags` | No | Tags to filter by |

### `list`
Returns all notes in the notebook.

### `tag`
Adds tags to an existing note.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `title` | Yes | Title of the note to tag |
| `tags` | Yes | Tags to add |

### `export`
Exports all notes as a markdown artifact. Requires an active workspace.

## Workspace State Schema (v1.0.0)

```json
{
  "notes": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "tags": ["string"],
      "createdAt": "ISO 8601"
    }
  ]
}
```

## Behavior With vs Without Workspace

| Feature | No Workspace | With Workspace |
|---------|-------------|----------------|
| Add notes | Session only | Persists across sessions |
| Search/list | Current session | All accumulated notes |
| Export | Not available | Creates artifact |
| Auto-tag | Works | Works |

## Execution Model

| Field | Value |
|-------|-------|
| Execution Mode | Declarative |
| Workspace Support | Optional |
| Long-Running Support | Optional |
| User Input Support | false |
| Artifact Versioning | false |
| Platform Compatibility | All platforms |
| Bridge Requirement | Never |
| Secret Bindings | None |

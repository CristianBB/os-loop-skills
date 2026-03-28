# File Indexer

Indexes files in a directory, listing file paths, names, and extensions.

## Input

| Name | Type | Required | Description |
|------|------|----------|-------------|
| directory | string | Yes | Directory path to index |
| extensions | string[] | No | File extensions to include (e.g. [".ts", ".js"]). Empty means all files. |

## Output

| Name | Type | Description |
|------|------|-------------|
| files | array | Indexed file entries with path, name, and extension |
| totalCount | number | Total number of indexed files |
| source | string | "bridge" or "browser" — indicates which filesystem access was used |

## Platform Compatibility

- **Supported platforms**: All (cross-platform)
- **Bridge requirement**: Optional — uses bridge filesystem when available, falls back to browser File System Access API

## Degraded Behavior Without Bridge

When the bridge is not connected, the skill falls back to the browser's File System Access API (`showDirectoryPicker`). This requires the user to manually select the directory via a system dialog and only supports top-level file listing (no recursive traversal).

## How It Works

1. If bridge filesystem is available, lists the directory contents directly.
2. Otherwise, prompts the user to select a directory via the browser dialog.
3. Filters files by extension if specified.
4. Returns the indexed entries with metadata.

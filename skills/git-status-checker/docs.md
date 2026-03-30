# Git Status Checker

Checks the current git repository status using the OS Loop Bridge.

## Input

| Name | Type | Required | Description |
|------|------|----------|-------------|
| workingDirectory | string | Yes | Path to the git repository |

## Output

| Name | Type | Description |
|------|------|-------------|
| branch | string | Current branch name |
| clean | boolean | Whether the working tree is clean |
| output | string | Raw git status output |

## Platform Compatibility

- **Supported platforms**: macOS, Linux, Windows
- **Bridge requirement**: Required — uses bridge command execution to run `git status`

## How It Works

1. Invokes `git status --porcelain --branch` via the bridge's command execution capability.
2. Parses the branch name from the first line of output.
3. Determines if the working tree is clean (no status lines beyond the branch header).

## Execution Model

| Field | Value |
|-------|-------|
| Execution Mode | Declarative |
| Workspace Support | None |
| Long-Running Support | None |
| User Input Support | false |
| Artifact Versioning | false |
| Platform Compatibility | macOS, Linux, Windows |
| Bridge Requirement | Required |
| Secret Bindings | None |

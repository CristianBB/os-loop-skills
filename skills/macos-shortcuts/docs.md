# macOS Shortcuts

Runs automations from the macOS Shortcuts app via the OS Loop Bridge.

## Input

| Name | Type | Required | Description |
|------|------|----------|-------------|
| shortcutName | string | Yes | Name of the macOS Shortcut to run |
| input | string | No | Optional text input to pass to the shortcut |

## Output

| Name | Type | Description |
|------|------|-------------|
| output | string | Shortcut execution output |
| exitCode | number | Exit code of the shortcuts command |

## Platform Compatibility

- **Supported platforms**: macOS only
- **Bridge requirement**: Required — uses bridge command execution to invoke the `shortcuts` CLI

## How It Works

1. Invokes the macOS `shortcuts run <name>` CLI command via bridge command execution.
2. If input text is provided, passes it via `--input-type text --input <text>`.
3. Returns the command output and exit code.

## Prerequisites

- macOS 12 (Monterey) or later
- The named Shortcut must already exist in the Shortcuts app

## Execution Model

| Field | Value |
|-------|-------|
| Execution Mode | Declarative |
| Workspace Support | None |
| Long-Running Support | None |
| User Input Support | false |
| Artifact Versioning | false |
| Platform Compatibility | macOS |
| Bridge Requirement | Required |
| Secret Bindings | None |

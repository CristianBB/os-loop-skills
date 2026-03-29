# Example: Declarative Skill — Text Reverse

A minimal complete declarative skill that reverses a string. This is the simplest possible skill implementation and serves as the starting point for understanding the OS Loop skill contract.

## Execution Mode

Declarative (`executionMode: "declarative"`). The runtime calls `execute(args, host)` once and returns the result. There is no workspace, no LLM usage, no agentic loop, and no `host.run` API.

## Input

| Parameter | Type   | Required | Description       |
|-----------|--------|----------|-------------------|
| `text`    | string | Yes      | The text to reverse |

## Output

| Field    | Type   | Description            |
|----------|--------|------------------------|
| `result` | string | The reversed text      |

## Unicode Handling

The skill uses `[...text].reverse()` (spread into code points) rather than `text.split('').reverse()` so that multi-byte characters such as emoji and CJK supplementary characters are reversed correctly.

## Example

**Input:**
```json
{ "text": "Hello, world!" }
```

**Output:**
```json
{ "result": "!dlrow ,olleH" }
```

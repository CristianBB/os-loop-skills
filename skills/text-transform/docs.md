# Text Transform

Transforms text between different cases and formats.

## Input

| Name | Type | Required | Description |
|------|------|----------|-------------|
| text | string | Yes | The text to transform |
| mode | string | Yes | One of: uppercase, lowercase, title, camel, snake, kebab |

## Output

| Name | Type | Description |
|------|------|-------------|
| result | string | The transformed text |

## Platform Compatibility

- **Supported platforms**: All (cross-platform)
- **Bridge requirement**: Never — runs entirely in the browser

## How It Works

Applies the selected string transformation directly. No LLM or network access required.

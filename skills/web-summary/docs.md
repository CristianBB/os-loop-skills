# Web Summary

Fetches a web page and produces an LLM-generated summary of its content.

## Input

| Parameter   | Type   | Required | Default | Description                              |
|-------------|--------|----------|---------|------------------------------------------|
| `url`       | string | Yes      | —       | The URL to fetch and summarize           |
| `maxLength` | number | No       | 500     | Maximum summary length in characters     |

## Output

| Field       | Type        | Description                                  |
|-------------|-------------|----------------------------------------------|
| `summary`   | string      | The generated summary                        |
| `title`     | string/null | Page title extracted from HTML, if available |
| `fetchedAt` | string      | ISO 8601 timestamp of when the page was fetched |

## Permissions

- **network** — Makes an outbound HTTP GET request to the provided URL
- **llm** — Uses LLM summarization to condense page content

## How It Works

1. Fetches the target URL via HTTP GET
2. Extracts the page title from `<title>` tags
3. Strips scripts, styles, navigation, and HTML tags to extract text content
4. Truncates content to 12,000 characters for LLM context
5. Sends the content to the LLM with a summarization prompt
6. Returns the summary, title, and fetch timestamp

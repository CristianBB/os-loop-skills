# Quick Calculator

Evaluates mathematical expressions and performs unit conversions. Fully stateless — no workspace, no LLM usage, no network access.

## Workspace Requirement

None (`workspaceSupport: "none"`). This skill is purely computational with no persistent state.

## Expression Evaluation

Pass an `expression` string to evaluate:

```json
{ "expression": "2 + 3 * 4" }
```

### Supported Operations
- Arithmetic: `+`, `-`, `*`, `/`, `%`, `^`
- Functions: `sqrt()`, `abs()`, `floor()`, `ceil()`, `round()`, `sin()`, `cos()`, `tan()`, `log()` (base 10), `ln()` (natural), `exp()`
- Constants: `pi`, `e`
- Percentages: `15% of 200` → `30`, `25%` → `0.25`

### Examples
| Expression | Result |
|-----------|--------|
| `2 + 3 * 4` | 14 |
| `sqrt(144)` | 12 |
| `15% of 200` | 30 |
| `2 ^ 10` | 1024 |
| `sin(pi / 2)` | 1 |

## Unit Conversion

Pass a `convert` object:

```json
{ "convert": { "value": 100, "from": "km", "to": "mi" } }
```

### Supported Units
- **Length**: m, km, cm, mm, in, ft, yd, mi
- **Weight**: kg, g, mg, lb, oz, t
- **Temperature**: c (Celsius), f (Fahrenheit), k (Kelvin)
- **Volume**: l, ml, gal, qt, pt, cup, floz

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `expression` | No* | Math expression to evaluate |
| `convert` | No* | Unit conversion `{ value, from, to }` |
| `precision` | No | Decimal places (default: 6) |

*One of `expression` or `convert` must be provided.

## Execution Model

| Field | Value |
|-------|-------|
| Execution Mode | Declarative |
| Workspace Support | None |
| Long-Running Support | None |
| User Input Support | false |
| Artifact Versioning | false |
| Platform Compatibility | All platforms |
| Bridge Requirement | Never |
| Secret Bindings | None |

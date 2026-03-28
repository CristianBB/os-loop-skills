interface SkillHostCapabilities {
  log: {
    debug(msg: string, data?: Record<string, unknown>): void;
    info(msg: string, data?: Record<string, unknown>): void;
    warn(msg: string, data?: Record<string, unknown>): void;
    error(msg: string, data?: Record<string, unknown>): void;
  };
  [key: string]: unknown;
}

const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  // Length
  m: { km: 0.001, cm: 100, mm: 1000, in: 39.3701, ft: 3.28084, mi: 0.000621371, yd: 1.09361 },
  km: { m: 1000, cm: 100000, mm: 1000000, in: 39370.1, ft: 3280.84, mi: 0.621371, yd: 1093.61 },
  cm: { m: 0.01, km: 0.00001, mm: 10, in: 0.393701, ft: 0.0328084, mi: 6.2137e-6, yd: 0.0109361 },
  in: { m: 0.0254, cm: 2.54, mm: 25.4, ft: 1 / 12, yd: 1 / 36, mi: 1 / 63360 },
  ft: { m: 0.3048, cm: 30.48, mm: 304.8, in: 12, yd: 1 / 3, mi: 1 / 5280, km: 0.0003048 },
  mi: { m: 1609.34, km: 1.60934, ft: 5280, yd: 1760, in: 63360 },

  // Weight
  kg: { g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274, t: 0.001 },
  g: { kg: 0.001, mg: 1000, lb: 0.00220462, oz: 0.035274 },
  lb: { kg: 0.453592, g: 453.592, oz: 16, t: 0.000453592 },
  oz: { kg: 0.0283495, g: 28.3495, lb: 0.0625 },

  // Temperature handled separately

  // Volume
  l: { ml: 1000, gal: 0.264172, qt: 1.05669, pt: 2.11338, cup: 4.22675, floz: 33.814 },
  ml: { l: 0.001, gal: 0.000264172, floz: 0.033814 },
  gal: { l: 3.78541, ml: 3785.41, qt: 4, pt: 8, cup: 16, floz: 128 },
};

function convertTemperature(value: number, from: string, to: string): number | null {
  const f = from.toLowerCase();
  const t = to.toLowerCase();

  if (f === 'c' && t === 'f') return (value * 9) / 5 + 32;
  if (f === 'f' && t === 'c') return ((value - 32) * 5) / 9;
  if (f === 'c' && t === 'k') return value + 273.15;
  if (f === 'k' && t === 'c') return value - 273.15;
  if (f === 'f' && t === 'k') return ((value - 32) * 5) / 9 + 273.15;
  if (f === 'k' && t === 'f') return ((value - 273.15) * 9) / 5 + 32;
  if (f === t) return value;
  return null;
}

function convertUnit(value: number, from: string, to: string): number | null {
  const f = from.toLowerCase();
  const t = to.toLowerCase();

  if (f === t) return value;

  // Temperature
  const tempUnits = ['c', 'f', 'k', 'celsius', 'fahrenheit', 'kelvin'];
  const normTemp = (u: string) => u === 'celsius' ? 'c' : u === 'fahrenheit' ? 'f' : u === 'kelvin' ? 'k' : u;
  if (tempUnits.includes(f) || tempUnits.includes(t)) {
    return convertTemperature(value, normTemp(f), normTemp(t));
  }

  // Table lookup
  const conversions = UNIT_CONVERSIONS[f];
  if (conversions && conversions[t] !== undefined) {
    return value * conversions[t];
  }

  // Try reverse
  const reverseConversions = UNIT_CONVERSIONS[t];
  if (reverseConversions && reverseConversions[f] !== undefined) {
    return value / reverseConversions[f];
  }

  return null;
}

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue; }

    // Numbers (including decimals)
    if (/[\d.]/.test(expr[i])) {
      let num = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) { num += expr[i]; i++; }
      tokens.push(num);
      continue;
    }

    // Named functions and constants
    if (/[a-zA-Z]/.test(expr[i])) {
      let name = '';
      while (i < expr.length && /[a-zA-Z]/.test(expr[i])) { name += expr[i]; i++; }
      tokens.push(name.toLowerCase());
      continue;
    }

    // Operators and parens
    if ('+-*/^%()'.includes(expr[i])) {
      tokens.push(expr[i]);
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${expr[i]}`);
  }
  return tokens;
}

function evaluateExpression(expr: string): number {
  // Preprocess: "15% of 200" → "0.15 * 200"
  const percentOfPattern = /(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/gi;
  let processed = expr.replace(percentOfPattern, (_, pct, val) => `(${pct} / 100 * ${val})`);

  // Preprocess: trailing % → /100
  processed = processed.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1 / 100)');

  const tokens = tokenize(processed);
  let pos = 0;

  function peek(): string | undefined { return tokens[pos]; }
  function consume(): string { return tokens[pos++]; }

  function parseAtom(): number {
    const token = peek();

    if (token === '(') {
      consume(); // (
      const val = parseAddSub();
      if (peek() !== ')') throw new Error('Missing closing parenthesis');
      consume(); // )
      return val;
    }

    // Functions
    const functions: Record<string, (x: number) => number> = {
      sqrt: Math.sqrt,
      abs: Math.abs,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      log: Math.log10,
      ln: Math.log,
      exp: Math.exp,
    };

    if (token && functions[token]) {
      consume();
      if (peek() !== '(') throw new Error(`Expected ( after ${token}`);
      consume();
      const arg = parseAddSub();
      if (peek() !== ')') throw new Error('Missing closing parenthesis');
      consume();
      return functions[token](arg);
    }

    // Constants
    if (token === 'pi') { consume(); return Math.PI; }
    if (token === 'e') { consume(); return Math.E; }

    // Unary minus
    if (token === '-') {
      consume();
      return -parseAtom();
    }

    // Number
    if (token && /^[\d.]+$/.test(token)) {
      consume();
      const val = parseFloat(token);
      if (isNaN(val)) throw new Error(`Invalid number: ${token}`);
      return val;
    }

    throw new Error(`Unexpected token: ${token ?? 'end of expression'}`);
  }

  function parsePower(): number {
    let left = parseAtom();
    while (peek() === '^') {
      consume();
      const right = parseAtom();
      left = Math.pow(left, right);
    }
    return left;
  }

  function parseMulDiv(): number {
    let left = parsePower();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = consume();
      const right = parsePower();
      if (op === '*') left *= right;
      else if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        left /= right;
      } else left %= right;
    }
    return left;
  }

  function parseAddSub(): number {
    let left = parseMulDiv();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseMulDiv();
      if (op === '+') left += right;
      else left -= right;
    }
    return left;
  }

  const result = parseAddSub();
  if (pos < tokens.length) throw new Error(`Unexpected token: ${tokens[pos]}`);
  return result;
}

function roundTo(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value) && Math.abs(value) < 1e15) return value.toString();
  if (Math.abs(value) < 1e-6 || Math.abs(value) > 1e15) return value.toExponential(6);
  return value.toString();
}

export async function execute(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const precision = (args.precision as number) ?? 6;

  // Unit conversion
  if (args.convert) {
    const conv = args.convert as { value: number; from: string; to: string };
    const result = convertUnit(conv.value, conv.from, conv.to);

    if (result === null) {
      host.log.warn('Unsupported conversion', { from: conv.from, to: conv.to });
      return {
        success: false,
        error: `Cannot convert from "${conv.from}" to "${conv.to}". Unsupported unit pair.`,
      };
    }

    const rounded = roundTo(result, precision);
    host.log.info('Unit conversion', { value: conv.value, from: conv.from, to: conv.to, result: rounded });

    return {
      success: true,
      result: rounded,
      formatted: `${conv.value} ${conv.from} = ${formatNumber(rounded)} ${conv.to}`,
    };
  }

  // Expression evaluation
  const expression = args.expression as string;
  if (!expression) {
    return {
      success: false,
      error: 'Provide either an "expression" to evaluate or a "convert" object for unit conversion.',
    };
  }

  try {
    const result = evaluateExpression(expression);
    const rounded = roundTo(result, precision);
    host.log.info('Expression evaluated', { expression, result: rounded });

    return {
      success: true,
      result: rounded,
      formatted: `${expression} = ${formatNumber(rounded)}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    host.log.error('Evaluation failed', { expression, error: message });

    return {
      success: false,
      error: `Failed to evaluate "${expression}": ${message}`,
    };
  }
}

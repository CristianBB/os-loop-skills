interface SkillHostCapabilities {
  log: {
    debug(msg: string, data?: Record<string, unknown>): void;
    info(msg: string, data?: Record<string, unknown>): void;
    warn(msg: string, data?: Record<string, unknown>): void;
    error(msg: string, data?: Record<string, unknown>): void;
  };
  workspace?: {
    getState(): Promise<PreferencesState | null>;
    setState(state: PreferencesState): Promise<void>;
  };
  [key: string]: unknown;
}

interface Preferences {
  style: 'formal' | 'casual' | 'enthusiastic' | 'poetic';
  language: string;
  lastGreetedName: string | null;
  greetingCount: number;
}

interface PreferencesState {
  preferences: Preferences;
}

const DEFAULT_PREFERENCES: Preferences = {
  style: 'casual',
  language: 'en',
  lastGreetedName: null,
  greetingCount: 0,
};

const GREETINGS: Record<string, Record<string, (name: string, count: number) => string>> = {
  en: {
    formal: (name, count) =>
      count > 1
        ? `Good day, ${name}. A pleasure to see you again — this is greeting number ${count}.`
        : `Good day, ${name}. It is a pleasure to make your acquaintance.`,
    casual: (name, count) =>
      count > 1
        ? `Hey ${name}! Welcome back — greeting #${count} for you.`
        : `Hey ${name}! Nice to meet you.`,
    enthusiastic: (name, count) =>
      count > 1
        ? `${name}!! So great to see you again! This is our ${count}${ordinalSuffix(count)} time!`
        : `${name}!! SO great to meet you! This is going to be awesome!`,
    poetic: (name, count) =>
      count > 1
        ? `Once more the dawn reveals your name, dear ${name} — ${count} greetings, each a verse.`
        : `Like morning light upon the page, a greeting finds you, ${name}, for the very first time.`,
  },
  es: {
    formal: (name, count) =>
      count > 1
        ? `Buenos dias, ${name}. Es un placer verle de nuevo — saludo numero ${count}.`
        : `Buenos dias, ${name}. Es un placer conocerle.`,
    casual: (name, count) =>
      count > 1
        ? `Hola ${name}! Bienvenido de vuelta — saludo #${count}.`
        : `Hola ${name}! Encantado de conocerte.`,
    enthusiastic: (name, count) =>
      count > 1
        ? `${name}!! Que alegria verte de nuevo! Esta es la vez numero ${count}!`
        : `${name}!! Que alegria conocerte! Esto va a ser genial!`,
    poetic: (name, count) =>
      count > 1
        ? `De nuevo el alba susurra tu nombre, ${name} — ${count} saludos, cada uno un verso.`
        : `Como luz de manana sobre la pagina, un saludo te encuentra, ${name}, por primera vez.`,
  },
  fr: {
    formal: (name, count) =>
      count > 1
        ? `Bonjour, ${name}. C'est un plaisir de vous revoir — salutation numero ${count}.`
        : `Bonjour, ${name}. C'est un plaisir de faire votre connaissance.`,
    casual: (name, count) =>
      count > 1
        ? `Salut ${name} ! Content de te revoir — salut #${count}.`
        : `Salut ${name} ! Ravi de te rencontrer.`,
    enthusiastic: (name, count) =>
      count > 1
        ? `${name} !! Trop content de te revoir ! C'est la ${count}e fois !`
        : `${name} !! Trop content de te rencontrer ! Ca va etre genial !`,
    poetic: (name, count) =>
      count > 1
        ? `L'aube une fois encore murmure ton nom, ${name} — ${count} salutations, chacune un vers.`
        : `Comme la lumiere du matin sur la page, un salut te trouve, ${name}, pour la toute premiere fois.`,
  },
};

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function generateGreeting(name: string, prefs: Preferences): string {
  const langGreetings = GREETINGS[prefs.language] ?? GREETINGS['en'];
  const greetingFn = langGreetings[prefs.style] ?? langGreetings['casual'];
  return greetingFn(name, prefs.greetingCount);
}

/**
 * Generates a personalized greeting with optional workspace persistence.
 *
 * When a workspace is available:
 *   - Loads saved preferences (style, language, greeting count)
 *   - Merges any overrides from the current invocation
 *   - Generates a greeting that acknowledges returning users
 *   - Saves updated preferences back to workspace
 *
 * Without a workspace:
 *   - Uses defaults (or the style/language provided in args)
 *   - Generates a first-time greeting
 *   - Nothing is persisted
 */
export async function execute(
  args: Record<string, unknown>,
  host: SkillHostCapabilities,
): Promise<Record<string, unknown>> {
  const name = args.name as string;

  if (typeof name !== 'string' || name.trim().length === 0) {
    host.log.error('Invalid name', { received: typeof name });
    return {
      greeting: '',
      persistent: false,
      error: 'The "name" argument must be a non-empty string.',
    };
  }

  // Load preferences from workspace, or start with defaults
  let prefs: Preferences = { ...DEFAULT_PREFERENCES };
  const persistent = !!host.workspace;

  if (host.workspace) {
    const state = await host.workspace.getState();
    if (state?.preferences) {
      prefs = { ...DEFAULT_PREFERENCES, ...state.preferences };
    }
    host.log.debug('Loaded preferences from workspace', { prefs });
  }

  // Apply any overrides from the current invocation
  if (args.style && typeof args.style === 'string') {
    prefs.style = args.style as Preferences['style'];
  }
  if (args.language && typeof args.language === 'string') {
    prefs.language = args.language;
  }

  // Update greeting count
  prefs.greetingCount += 1;
  prefs.lastGreetedName = name.trim();

  // Generate the greeting
  const greeting = generateGreeting(name.trim(), prefs);

  host.log.info('Greeting generated', {
    name: name.trim(),
    style: prefs.style,
    language: prefs.language,
    greetingCount: prefs.greetingCount,
    persistent,
  });

  // Save updated preferences back to workspace
  if (host.workspace) {
    await host.workspace.setState({ preferences: prefs });
    host.log.debug('Preferences saved to workspace');
  }

  return {
    greeting,
    preferencesUsed: {
      style: prefs.style,
      language: prefs.language,
      greetingCount: prefs.greetingCount,
      lastGreetedName: prefs.lastGreetedName,
    },
    persistent,
  };
}

import env, { isProduction } from '../config/env';

type Level = 'debug' | 'info' | 'warn' | 'error';

const RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = RANK[env.LOG_LEVEL];

/** Never let a token, password or card detail reach the log sink. */
const REDACTED_KEYS = /^(password|newpassword|confirmpassword|token|refreshtoken|accesstoken|authorization|clientid|otp|secret|signature)$/i;

function redact(value: unknown, depth = 0): unknown {
  if (value === null || typeof value !== 'object' || depth > 4) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACTED_KEYS.test(key) ? '[redacted]' : redact(item, depth + 1);
  }
  return out;
}

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  if (RANK[level] < threshold) return;

  const entry = { level, time: new Date().toISOString(), message, ...(context ? (redact(context) as object) : {}) };

  // One JSON object per line so hosted log platforms (Vercel, CloudWatch,
  // Datadog) index the fields instead of storing an opaque string.
  const line = isProduction ? JSON.stringify(entry) : `${level.toUpperCase()} ${message}${context ? ` ${JSON.stringify(redact(context))}` : ''}`;

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context),
};

export default logger;

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

/**
 * A comma-separated allowlist ("https://a.com, https://b.com") into a deduped array.
 * `*` is kept verbatim so `CORS_ORIGINS=*` still means "reflect any origin" for
 * throwaway environments; production rejects it below.
 */
const originList = z
  .string()
  .transform((raw) =>
    raw
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
  )
  .pipe(z.array(z.string()).min(1, 'At least one origin is required'));

const booleanish = (fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((raw) => (raw === undefined || raw === '' ? fallback : ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase())));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  // The shared-secret gate every non-public route sits behind (clientid.middleware).
  CLIENT_ID: z.string().min(1, 'CLIENT_ID is required'),
  // `local` waives both the clientId gate and, in the docs, the auth requirement.
  // Guarded against production below.
  SITE_MODE: z.string().optional(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_AUDIENCE: z.string().default(''),
  JWT_ISSUER: z.string().default(''),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  JWT_EMAIL_VERIFY_EXPIRES: z.string().default('1d'),
  JWT_PASSWORD_RESET_EXPIRES: z.string().default('1h'),

  // Browser origins allowed to call this API. There is no default: a wrong
  // guess here either blocks the real UI or opens the API to every site.
  CORS_ORIGINS: originList,

  // Public base URL of the web UI, used to build links inside emails.
  APP_PUBLIC_URL: z.string().url().optional(),
  APP_NAME: z.string().default('PMS'),

  // Swagger is a full map of the API surface; off by default in production.
  ENABLE_API_DOCS: booleanish(process.env.NODE_ENV !== 'production'),
  // Number of proxy hops in front of the app. Vercel and most PaaS put exactly
  // one; it must be right or express-rate-limit keys every caller to the same IP.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  // Max JSON body size. Generous enough for a variant with base64 image refs.
  JSON_BODY_LIMIT: z.string().default('1mb'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

type Env = z.infer<typeof schema>;

function loadEnv(): Env {
  // The web app's own variables are read here as a fallback so an existing
  // deployment that only sets NEXT_PUBLIC_* keeps working after this change.
  const raw = {
    ...process.env,
    APP_NAME: process.env.APP_NAME || process.env.NEXT_PUBLIC_APP_NAME,
    APP_PUBLIC_URL: process.env.APP_PUBLIC_URL || process.env.NEXT_PUBLIC_MAIN_DOMAIN_URL,
  };

  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    const lines = parsed.error.issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    // Crashing at boot beats a server that answers requests it cannot fulfil:
    // a missing JWT_SECRET would otherwise surface as a 500 on every login.
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }

  const env = parsed.data;

  if (env.NODE_ENV === 'production') {
    if (env.SITE_MODE === 'local') {
      throw new Error('SITE_MODE=local disables the clientId gate and must never be set in production.');
    }
    if (env.CORS_ORIGINS.includes('*')) {
      throw new Error('CORS_ORIGINS=* is not allowed in production. List the exact web origins.');
    }
    if (!env.APP_PUBLIC_URL) {
      throw new Error('APP_PUBLIC_URL is required in production so emailed links point at the real site.');
    }
  }

  return env;
}

const env = loadEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isLocalMode = env.SITE_MODE === 'local';

export default env;

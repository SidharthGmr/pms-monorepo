import 'reflect-metadata';
// env must come first: it validates configuration and throws before anything
// else gets a chance to read a half-configured process.env.
import env, { isLocalMode, isProduction } from './src/config/env';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions, relaxSpecForLocalMode } from './src/config/swagger';
import routes from './src/routes/index.routes';
import prisma from './src/config/prisma';
import logger from './src/utils/logger';
import asyncHandler from './src/middleware/asyncHandler.middleware';
import clientidMiddleware from './src/middleware/clientid.middleware';
import errorHandler from './src/middleware/errorHandler.middleware';
import requestContext from './src/middleware/requestContext.middleware';
import { apiLimiter } from './src/middleware/rateLimiter.middleware';
import CustomResponse from './src/dtos/custom-response';
import PlainDto from './src/dtos/plain.dto';

const app = express();

// express-rate-limit and req.ip only read the client address from X-Forwarded-For
// when the app trusts the proxy. Set this to the real number of hops: trusting
// every hop lets a caller spoof the header and slip past the rate limiter.
app.set('trust proxy', env.TRUST_PROXY_HOPS);
app.disable('x-powered-by');

app.use(requestContext);

app.use(
  helmet({
    // The Swagger UI page below pulls its script and stylesheet from a CDN and is
    // the only HTML this API serves, so the CSP is scoped to exactly that.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        imgSrc: ["'self'", 'data:', 'https://unpkg.com'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // This is a JSON API read cross-origin by the web app; the default
    // same-origin resource policy would block those reads.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

const allowedOrigins = env.CORS_ORIGINS;
const allowAnyOrigin = allowedOrigins.includes('*');

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header means a server-to-server or tooling call (curl, Postman,
      // an uptime probe) - there is no browser to protect, so let it through.
      if (!origin || allowAnyOrigin) return callback(null, true);
      if (allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);

      logger.warn('cors rejected', { origin });
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'clientid', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
    maxAge: 86400,
  }),
);

// An explicit ceiling: without one, a single oversized payload can pin the event
// loop while body-parser buffers it into memory.
app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.JSON_BODY_LIMIT }));

// --- Uptime probes -----------------------------------------------------------
// Deliberately mounted before the clientId gate: a load balancer or uptime
// monitor has no reason to hold the shared secret.

app.get('/health/live', (_req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.get('/health/ready', async (_req, res) => {
  try {
    // Liveness only says the process is up; readiness has to prove it can still
    // reach Postgres, which is what actually breaks in production.
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'READY' });
  } catch (error) {
    logger.error('readiness check failed', { error: (error as Error)?.message });
    res.status(503).json({ status: 'NOT_READY' });
  }
});

// --- API docs ----------------------------------------------------------------
// On by default in development. In production a full route map is a
// reconnaissance aid, so it is served only when ENABLE_API_DOCS is set.

if (env.ENABLE_API_DOCS) {
  const swaggerDocs = relaxSpecForLocalMode(swaggerJsdoc(swaggerOptions) as Record<string, any>);

  app.get('/swagger.json', (_req, res) => {
    res.json(swaggerDocs);
  });

  // Swagger UI is served from CDN assets rather than swagger-ui-express's static
  // middleware, whose asset paths break under serverless bundling on Vercel.
  const docsPage = [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + env.APP_NAME + ' API</title>',
    '<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">',
    '</head>',
    '<body>',
    '<div id="swagger-ui"></div>',
    '<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>',
    '<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>',
    '<script>',
    'window.onload = function () {',
    '  SwaggerUIBundle({',
    "    url: '/swagger.json',",
    "    dom_id: '#swagger-ui',",
    '    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],',
    "    layout: 'BaseLayout',",
    '  });',
    '};',
    '</script>',
    '</body>',
    '</html>',
  ].join('\n');

  app.get('/api', (_req, res) => {
    res.type('html').send(docsPage);
  });
}

// --- Application routes ------------------------------------------------------

app.use(apiLimiter);
app.use(asyncHandler(clientidMiddleware.verify));
app.use('/', routes);

// Anything that falls through is a 404 in the same envelope as every other
// response, so the client's error handling needs no special case for it.
app.use((req, res) => {
  const response: CustomResponse<PlainDto> = {
    success: false,
    message: `Cannot ${req.method} ${req.path}`,
  };
  res.status(404).json(response);
});

app.use(errorHandler);

// --- Process lifecycle -------------------------------------------------------
// On Vercel this module is imported and the platform owns the lifecycle, so the
// server is only started when this file is the process entry point.

if (require.main === module) {
  const server = app.listen(env.PORT, () => {
    logger.info('api started', {
      port: env.PORT,
      env: env.NODE_ENV,
      docs: env.ENABLE_API_DOCS ? `http://localhost:${env.PORT}/api` : 'disabled',
      siteMode: isLocalMode ? 'local (clientId gate bypassed)' : 'gated',
      corsOrigins: allowAnyOrigin ? '*' : allowedOrigins,
    });
  });

  // Without this, a deploy or scale-down kills in-flight requests mid-write and
  // leaves Postgres connections to time out on their own.
  const shutdown = (signal: string) => {
    logger.info('shutting down', { signal });

    const forceExit = setTimeout(() => {
      logger.error('forced shutdown: connections did not drain in 10s');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async () => {
      await prisma.$disconnect().catch((error) => logger.error('prisma disconnect failed', { error: (error as Error)?.message }));
      clearTimeout(forceExit);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // A rejection nobody handled has already left state half-written; log it loudly
  // rather than letting Node's default warning scroll past unnoticed.
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled promise rejection', { error: reason instanceof Error ? reason.message : String(reason) });
  });

  process.on('uncaughtException', (error) => {
    logger.error('uncaught exception', { error: error.message, stack: error.stack });
    // The process is in an undefined state after this point; exiting lets the
    // supervisor start a clean one.
    if (isProduction) process.exit(1);
  });
}

export default app;
module.exports = app;

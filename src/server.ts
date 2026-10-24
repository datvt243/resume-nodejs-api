/**
 * Learning nodejs basic
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
require('module-alias/register');
require('./alias');
import dotenv from 'dotenv';

import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';

import { errorsMiddleware, notFoundHandler, rateLimitMiddleware, startMemStoreCleanup, requestLogger, languageMiddleware } from '@/middlewares';
import { sessionConfig, corsConfig, swaggerSpec } from '@/config';
import { logger } from '@/logger';
import router from '@/routers';
import { initRedis } from '@/services/redis';

dotenv.config();

// Last safety net: Node ≥15 exits on an unhandled rejection; asyncHandler should make this unreachable.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { error: reason instanceof Error ? reason.message : String(reason), stack: reason instanceof Error ? reason.stack : undefined });
});

const runServer = async ({ portNumber }: { portNumber: number }) => {
  const app = express();

  app.use(requestLogger);

  // parse cookies (httpOnly JWT cookies) → req.cookies
  app.use(cookieParser());

  // resolve request language (Accept-Language) → req.lang / req.t(key)
  app.use(languageMiddleware);

  app.use(session(sessionConfig()));
  app.use(cors(corsConfig()));

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  /**
   * @swagger
   * /health:
   *   get:
   *     tags: [Health]
   *     summary: Health check
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 uptime:
   *                   type: number
   */
  // Health check endpoint (exempt from rate limiting)
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API documentation (Swagger UI) - exempt from rate limiting
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use(rateLimitMiddleware);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(router);
  app.use(notFoundHandler);
  app.use(errorsMiddleware);

  const _env = process.env['NODE_ENV'] || 'development';
  /**
   * Respect LOCAL_PORT whenever it's actually set, in every environment —
   * it used to be silently ignored in production (always forced to 3008
   * regardless of LOCAL_PORT), which broke docker-compose.prod.yml's
   * port mapping when LOCAL_PORT carried .env.example's dev default
   * (fix-prod-port-ignores-local-port trap, doctrine/domains/PROJECT.md).
   * Only fall back to the env-specific default (3001 dev / 3008 prod,
   * same as before) when LOCAL_PORT is unset, so an existing deploy that
   * never set LOCAL_PORT keeps its current port unchanged.
   */
  const _portNumber = process.env['LOCAL_PORT'] ? portNumber : _env !== 'production' ? portNumber : 3008;

  // Initialize Redis for token blacklist (non-blocking)
  await initRedis();

  // Start in-memory store cleanup (no-op if Redis is available)
  try {
    startMemStoreCleanup();
  } catch (err) {
    logger.error('[RateLimit] Failed to start memStore cleanup', { err: (err as Error).message, stack: (err as Error).stack });
  }
  app.listen(_portNumber, () => {
    logger.info(`App listening on port: ${_portNumber} - ${_env}`);
  });

  // TODO: close the MongoDB connection on process exit (coming soon)
};

const { LOCAL_PORT } = process.env;
import connectMongo from '@/database/mongo.db';

const startServer = async () => {
  try {
    const isConnected = await connectMongo();
    isConnected && runServer({ portNumber: parseInt(LOCAL_PORT || '3001', 10) });
  } catch (e) {
    logger.error(`Failed to start server`, { error: (e as Error).message, stack: (e as Error).stack });
  }
};

startServer();

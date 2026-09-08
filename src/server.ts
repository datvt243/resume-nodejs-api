/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Learning nodejs basic
 */
require('module-alias/register');
require('./alias');
import dotenv from 'dotenv';

import path, { dirname } from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
/* import exitHook from 'exit-hook'; */

import { errorsMiddleware, rateLimitMiddleware, startMemStoreCleanup, requestLogger, languageMiddleware } from '@/middlewares';
import { sessionConfig, corsConfig, swaggerSpec } from '@/config';
import { logger } from '@/logger';
import router from '@/routers';
import { initRedis } from '@/services/redis';

dotenv.config();

const runServer = async ({ portNumber }: { portNumber: number }) => {
  const app = express();

  /* const __dirname = dirname(new URL(import.meta.url).pathname); */

  /**
   * request logging
   */
  app.use(requestLogger);

  /**
   * resolve request language (Accept-Language) → req.lang / req.t(key)
   */
  app.use(languageMiddleware);

  /**
   * use Session
   */
  app.use(session(sessionConfig()));
  /**
   * use CORS
   */
  app.use(cors(corsConfig()));

  /**
   * use Body-parser
   */
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
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  /**
   * API documentation (Swagger UI) - exempt from rate limiting
   */
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  /**
   * rate limiting (with health exemption)
   */
  app.use(rateLimitMiddleware);

  /**
   * use static-files
   */
  app.use(express.static(path.join(__dirname, 'public')));

  /**
   * use router
   */
  app.use(router);

  /**
   * use middleware
   */
  app.use(errorsMiddleware);

  /**
   * use template-engine
   */
  app.set('view engine', 'pug');
  app.set('views', './views'); /* app.set('views', './view'); */

  /**
   * listen app
   */
  const _env = process.env.NODE_ENV || 'development';
  // Respect LOCAL_PORT whenever it's actually set, in every environment —
  // it used to be silently ignored in production (always forced to 3008
  // regardless of LOCAL_PORT), which broke docker-compose.prod.yml's
  // port mapping when LOCAL_PORT carried .env.example's dev default
  // (fix-prod-port-ignores-local-port trap, doctrine/domains/PROJECT.md).
  // Only fall back to the env-specific default (3001 dev / 3008 prod,
  // same as before) when LOCAL_PORT is unset, so an existing deploy that
  // never set LOCAL_PORT keeps its current port unchanged.
  const _portNumber = process.env.LOCAL_PORT ? portNumber : _env !== 'production' ? portNumber : 3008;

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

  /* exitHook(() => {
        // TODO: close connect mongo (coming soon...)
    }); */
};

/**
 * connect to mongoDB
 */
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

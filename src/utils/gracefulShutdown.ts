/**
 * Drain the app on SIGTERM/SIGINT instead of dying mid-request: stop
 * accepting connections, let in-flight requests finish (they may still
 * need Mongo/Redis), then close Redis and Mongo, then exit.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import type { Server } from 'http';
import { closeRedis } from '@/services/redis';
import { MongoDBConnection } from '@/database/mongo.db';
import { logger } from '@/logger';

// Well under Render's ~30s SIGTERM→SIGKILL window, so a hung request can't cost us the clean Mongo/Redis close.
export const SHUTDOWN_TIMEOUT_MS = 10 * 1000;

/**
 * Builds the signal handler for `server`. Runs once; a second signal
 * while draining is ignored. Each close step logs its own failure and
 * the next step still runs.
 */
export const createShutdown = (server: Server, timeoutMs = SHUTDOWN_TIMEOUT_MS) => {
  let shuttingDown = false;

  return async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`[Shutdown] ${signal} received, draining`);

    const forceExit = setTimeout(() => {
      logger.error('[Shutdown] Timed out draining, forcing exit');
      process.exit(1);
    }, timeoutMs);
    forceExit.unref();

    await new Promise<void>((resolve) => {
      server.close((err) => {
        if (err) logger.error('[Shutdown] HTTP server close error', { err: err.message, stack: err.stack });
        resolve();
      });
    });
    await closeRedis();
    await MongoDBConnection.getInstance().disconnect();

    clearTimeout(forceExit);
    logger.info('[Shutdown] Done');
    process.exit(0);
  };
};

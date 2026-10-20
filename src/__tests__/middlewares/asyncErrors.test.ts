/**
 * The real router + notFoundHandler + errorsMiddleware, wired like
 * server.ts, over real HTTP: a rejected async handler must reach the JSON
 * error handler, and unknown routes must 404 for every method.
 */

import http from 'http';
import type { AddressInfo } from 'net';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { handlerGetInformationByEmail } from '@/candidate/candidate.service';
import { errorsMiddleware, notFoundHandler } from '@/middlewares/errors.middleware';
import router from '@/routers';
import { logger } from '@/logger';

jest.mock('@/logger');
jest.mock('@/candidate/candidate.service');
jest.mock('@/middlewares/verifyToken.middleware', () => {
  // asyncHandler requires a promise, like the real async verifyToken returns.
  const pass = (req: Request, _res: Response, next: NextFunction) => {
    req.user = { _id: 'u1' };
    next();
    return Promise.resolve();
  };
  return { verifyToken: jest.fn(pass), verifyTokenByQuery: jest.fn(pass) };
});

let server: http.Server;
let base: string;
const unhandled = jest.fn();

beforeAll(async () => {
  process.on('unhandledRejection', unhandled);
  const app = express();
  app.use(express.json());
  app.use(router);
  app.use(notFoundHandler);
  app.use(errorsMiddleware);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  process.off('unhandledRejection', unhandled);
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

describe('async error safety', () => {
  it('a rejecting service returns the JSON 500 from errorsMiddleware', async () => {
    jest.mocked(handlerGetInformationByEmail).mockRejectedValueOnce(new Error('mongo timeout'));

    const res = await fetch(`${base}/api/v1/candidate/a@b.co`, { signal: AbortSignal.timeout(2000) });
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ success: false, errorCode: 'INTERNAL_SERVER_ERROR' });
    expect(unhandled).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('ERROR: mongo timeout', expect.anything());
  });
});

describe('notFoundHandler', () => {
  it.each(['GET', 'POST', 'PUT', 'DELETE'])('%s to an unknown /api route → 404 NOT_FOUND JSON', async (method) => {
    for (const path of ['/api/nope', '/api/v1/nope', '/api/v2/nope']) {
      const res = await fetch(`${base}${path}`, { method });
      expect(res.status).toBe(404);
      // errorsMiddleware's existing error keys — the envelope change is a later phase.
      const body = (await res.json()) as object;
      expect(body).toMatchObject({ success: false, errorCode: 'NOT_FOUND' });
      expect(Object.keys(body).sort()).toEqual(['errorCode', 'message', 'success']);
    }
  });

  it('an unknown non-API GET is a 404, not the landing page', async () => {
    const res = await fetch(`${base}/some/page`);
    expect(res.status).toBe(404);
  });

  it('GET / still serves the landing page', async () => {
    const res = await fetch(`${base}/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Hello World!');
  });
});

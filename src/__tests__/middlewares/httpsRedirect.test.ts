/**
 * Real-HTTP tests for httpsRedirect, mounted ahead of helmet the same way
 * as `src/server.ts`. `redirect: 'manual'` so fetch reports the 308 itself.
 */

import http from 'http';
import type { AddressInfo } from 'net';
import express from 'express';
import helmet from 'helmet';
import { httpsRedirect } from '@/middlewares/httpsRedirect.middleware';
import { helmetConfig } from '@/config/helmet.config';

let mockNodeEnv = 'production';
jest.mock('@/config/process.config', () => ({
  get NODE_ENV() {
    return mockNodeEnv;
  },
}));

let server: http.Server;
let base: string;

beforeAll(async () => {
  const app = express();
  app.use(httpsRedirect);
  app.use(helmet(helmetConfig()));
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.all('/api/x', (_req, res) => {
    res.json({ ok: true });
  });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  mockNodeEnv = 'production';
});

const get = (path: string, headers: Record<string, string> = {}, method = 'GET') =>
  fetch(`${base}${path}`, { method, headers, redirect: 'manual' });

describe('httpsRedirect', () => {
  it('308-redirects a plain-HTTP request to https, keeping host + path + query', async () => {
    const res = await get('/api/x?a=1', { 'x-forwarded-proto': 'http' });

    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe(`https://${new URL(base).host}/api/x?a=1`);
  });

  it('uses 308 for POST too, so the method and body survive', async () => {
    const res = await get('/api/x', { 'x-forwarded-proto': 'http' }, 'POST');

    expect(res.status).toBe(308);
  });

  it('reads the first value of a multi-hop x-forwarded-proto', async () => {
    const res = await get('/api/x', { 'x-forwarded-proto': 'http, https' });

    expect(res.status).toBe(308);
  });

  it('passes https and header-less requests through', async () => {
    expect((await get('/api/x', { 'x-forwarded-proto': 'https' })).status).toBe(200);
    expect((await get('/api/x')).status).toBe(200);
  });

  it('never redirects /health', async () => {
    const res = await get('/health', { 'x-forwarded-proto': 'http' });

    expect(res.status).toBe(200);
  });

  it('is a no-op outside production', async () => {
    mockNodeEnv = 'development';
    const res = await get('/api/x', { 'x-forwarded-proto': 'http' });

    expect(res.status).toBe(200);
  });

  it('still sends HSTS on https responses', async () => {
    const res = await get('/api/x', { 'x-forwarded-proto': 'https' });

    expect(res.headers.get('strict-transport-security')).toContain('max-age=');
  });
});

/**
 * Tests for helmet.config.ts over real HTTP (Node's built-in fetch against
 * an ephemeral Express app mounted the same way as `src/server.ts`), so the
 * actual response headers are asserted, not just the options object.
 */

import http from 'http';
import type { AddressInfo } from 'net';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { helmetConfig } from '@/config/helmet.config';

let server: http.Server;
let base: string;

beforeAll(async () => {
  const app = express();
  app.use(helmet(helmetConfig()));
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup({ openapi: '3.0.0', info: { title: 't', version: '1' }, paths: {} }));
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('helmetConfig', () => {
  it('sets the standard security headers and hides X-Powered-By', async () => {
    const res = await fetch(`${base}/health`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(res.headers.get('strict-transport-security')).toContain('max-age=');
    expect(res.headers.get('x-powered-by')).toBeNull();
  });

  it('allows cross-origin embedding of served resources', async () => {
    const res = await fetch(`${base}/health`);

    expect(res.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
  });

  it('keeps Swagger UI compatible with the CSP (no inline scripts)', async () => {
    const res = await fetch(`${base}/api-docs/`);
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-security-policy')).toContain("script-src 'self'");
    expect(html).toContain('swagger-ui-init.js');
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
  });
});

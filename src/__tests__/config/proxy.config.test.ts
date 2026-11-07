/**
 * Issue #386 — the rate-limit key (req.ip) must be the real client behind
 * Render's proxy, without letting a client forge it via X-Forwarded-For.
 */
import express from 'express';
import http from 'http';
import type { AddressInfo } from 'net';
import { trustProxySetting } from '@/config/proxy.config';

const ipSeenWith = async (hops: number | undefined, xff: string): Promise<string> => {
  const app = express();
  if (hops) app.set('trust proxy', hops);
  app.get('/', (req, res) => res.send(req.ip));
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    return await new Promise((resolve, reject) => {
      http
        .get({ port, path: '/', headers: { 'x-forwarded-for': xff } }, (res) => {
          let body = '';
          res.on('data', (chunk: Buffer) => (body += chunk.toString()));
          res.on('end', () => resolve(body));
        })
        .on('error', reject);
    });
  } finally {
    server.close();
  }
};

describe('trustProxySetting (issue #386)', () => {
  it.each([
    ['1', 1],
    ['2', 2],
    [undefined, undefined],
    ['', undefined],
    ['0', undefined],
    ['-1', undefined],
    ['abc', undefined],
    ['1.5', undefined],
  ])('TRUST_PROXY_HOPS=%p → %p', (raw, expected) => {
    expect(trustProxySetting(raw)).toBe(expected);
  });

  it('1 hop: req.ip is the rightmost X-Forwarded-For entry, a client-forged left entry is ignored', async () => {
    expect(await ipSeenWith(trustProxySetting('1'), '6.6.6.6, 203.0.113.7')).toBe('203.0.113.7');
  });

  it('unset: req.ip stays the socket address, X-Forwarded-For is ignored', async () => {
    const ip = await ipSeenWith(trustProxySetting(undefined), '203.0.113.7');
    expect(ip).not.toBe('203.0.113.7');
    expect(ip).toMatch(/127\.0\.0\.1|::1/);
  });
});

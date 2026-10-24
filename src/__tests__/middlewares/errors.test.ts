/**
 * errorsMiddleware over real HTTP with the same body parser as server.ts:
 * third-party errors get their real status/code, and an unexpected error's
 * text never reaches the client in production.
 */

import http from 'http';
import type { AddressInfo } from 'net';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { errorsMiddleware } from '@/middlewares/errors.middleware';
import { REQUEST_BODY_LIMIT } from '@/config/body.config';
import { logger } from '@/logger';

jest.mock('@/logger');
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
  app.use(bodyParser.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));
  app.use(bodyParser.json({ limit: REQUEST_BODY_LIMIT }));
  app.post('/echo', (_req, res) => {
    res.json({ ok: true });
  });
  app.get('/boom', () => {
    throw new Error('secret db text');
  });
  app.get('/cast', () => {
    throw new mongoose.Error.CastError('ObjectId', 'nope', '_id');
  });
  app.get('/invalid', () => {
    const err = new mongoose.Error.ValidationError();
    err.addError('birthday', new mongoose.Error.ValidatorError({ path: 'birthday', type: 'required', message: 'Path `birthday` is required.' }));
    throw err;
  });
  app.get('/duplicate', () => {
    throw Object.assign(new Error('E11000 duplicate key error collection: resume.candidates'), { code: 11000, keyValue: { email: 'a@b.co' } });
  });
  app.use(errorsMiddleware);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  mockNodeEnv = 'production';
});

const postJson = (body: string) => fetch(`${base}/echo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
const postForm = (body: string) => fetch(`${base}/echo`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });

describe('errorsMiddleware', () => {
  it('malformed JSON body → 400 MALFORMED_JSON', async () => {
    const res = await postJson('{"a":');
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ success: false, error: { code: 'MALFORMED_JSON' } });
  });

  it('JSON body over REQUEST_BODY_LIMIT → 413 PAYLOAD_TOO_LARGE', async () => {
    const res = await postJson(JSON.stringify({ a: 'x'.repeat(1024 * 1024) }));
    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ success: false, error: { code: 'PAYLOAD_TOO_LARGE' } });
  });

  it('urlencoded body over REQUEST_BODY_LIMIT → 413 PAYLOAD_TOO_LARGE', async () => {
    const res = await postForm(`a=${'x'.repeat(1024 * 1024)}`);
    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ success: false, error: { code: 'PAYLOAD_TOO_LARGE' } });
  });

  it('bodies over the old 100kb default but under REQUEST_BODY_LIMIT are accepted', async () => {
    expect((await postJson(JSON.stringify({ a: 'x'.repeat(500 * 1024) }))).status).toBe(200);
    expect((await postForm(`a=${'x'.repeat(500 * 1024)}`)).status).toBe(200);
  });

  it('Mongoose CastError reaching the middleware directly → 400 BAD_REQUEST', async () => {
    const res = await fetch(`${base}/cast`);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ success: false, error: { code: 'BAD_REQUEST', message: 'ID không đúng định dạng' } });
  });

  it('Mongoose ValidationError reaching the middleware directly → 400 VALIDATION_ERROR with translated details', async () => {
    const res = await fetch(`${base}/invalid`);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: { code: 'VALIDATION_ERROR', message: expect.any(String), details: [{ field: 'birthday', message: 'Ngày sinh là bắt buộc' }] } });
  });

  it('duplicate key reaching the middleware directly → 409 CONFLICT, driver text not sent', async () => {
    const res = await fetch(`${base}/duplicate`);
    const text = await res.text();
    expect(res.status).toBe(409);
    expect(JSON.parse(text)).toMatchObject({ success: false, error: { code: 'CONFLICT', message: 'email đã tồn tại' } });
    expect(text).not.toContain('E11000');
  });

  it('production: an unexpected error is a 500 without its message or stack, but the log keeps it', async () => {
    const res = await fetch(`${base}/boom`);
    const text = await res.text();
    expect(res.status).toBe(500);
    expect(text).not.toContain('secret db text');
    expect(JSON.parse(text)).toEqual({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Lỗi hệ thống' } });
    expect(logger.error).toHaveBeenCalledWith('ERROR [INTERNAL_SERVER_ERROR]: secret db text', expect.objectContaining({ stack: expect.stringContaining('secret db text') }));
  });

  it('development: an unexpected error still shows its message', async () => {
    mockNodeEnv = 'development';
    const res = await fetch(`${base}/boom`);
    expect(await res.json()).toMatchObject({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'secret db text', stack: expect.any(String) } });
  });
});

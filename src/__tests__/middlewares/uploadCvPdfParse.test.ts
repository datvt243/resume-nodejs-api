/**
 * Tests for uploadCvPdfParse.middleware.ts over a real HTTP multipart
 * request (Node's built-in fetch/FormData against an ephemeral Express
 * app) — multer's file filter and size limit only run on a real stream.
 */

import http from 'http';
import type { AddressInfo } from 'net';
import express from 'express';
import { uploadCvPdfParseMiddleware } from '@/middlewares/uploadCvPdfParse.middleware';
import { CV_MAX_FILE_SIZE } from '@/middlewares/uploadCV.middleware';

let server: http.Server;
let url: string;

beforeAll(async () => {
  const app = express();
  app.use((req, _res, next) => {
    req.lang = 'en';
    next();
  });
  app.post('/parse', uploadCvPdfParseMiddleware, (req, res) => {
    res.json({ size: req.file?.size, inMemory: Buffer.isBuffer(req.file?.buffer), path: req.file?.path ?? null });
  });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/parse`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const post = (content: Buffer | string, filename: string, type: string) => {
  const form = new FormData();
  form.append('file', new Blob([content], { type }), filename);
  return fetch(url, { method: 'POST', body: form });
};

describe('uploadCvPdfParseMiddleware', () => {
  it('keeps an accepted PDF in memory only (no disk path)', async () => {
    const res = await post('%PDF-1.4 fake', 'cv.pdf', 'application/pdf');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ size: 13, inMemory: true, path: null });
  });

  it('rejects a non-PDF file with 400', async () => {
    const res = await post('hello', 'cv.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual(expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'Only PDF files are accepted' }) }));
  });

  it('rejects a PDF over 5 MB with 400', async () => {
    const res = await post(Buffer.alloc(CV_MAX_FILE_SIZE + 1), 'cv.pdf', 'application/pdf');

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual(expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'File exceeds the allowed size (5 MB)' }) }));
  });
});

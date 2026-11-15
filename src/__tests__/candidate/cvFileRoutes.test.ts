/**
 * Stored-CV upload + download through the real candidate router over HTTP:
 * multer middleware, controller and response envelope together. The
 * service layer is spied on so no database is needed.
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import express from 'express';
import routeCandidate from '@/routers/api/v1/candidate.route';
import * as candidateService from '@/candidate/candidate.service';
import { CV_UPLOAD_DIR } from '@/middlewares/uploadCV.middleware';
import { ErrorCode } from '@/errors';
import { t } from '@/utils/i18n';

describe('POST /upload-cv + GET /cv-file', () => {
  const candidateId = `test-cv-routes-${process.pid}`;
  const storedPath = path.join(CV_UPLOAD_DIR, `${candidateId}-cv.pdf`);
  let server: http.Server;
  let baseUrl: string;

  beforeAll((done) => {
    const app = express();
    // Stands in for verifyToken (covered by its own tests).
    app.use((req, _res, next) => {
      req.user = { _id: candidateId };
      next();
    });
    app.use('/candidate', routeCandidate);
    server = app.listen(0, () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/candidate`;
      done();
    });
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(storedPath, { force: true });
  });

  afterAll((done) => {
    fs.rmSync(storedPath, { force: true });
    server.close(() => done());
  });

  const upload = (file?: { body: Buffer; type: string; name: string }) => {
    const form = new FormData();
    if (file) form.append('cv', new Blob([file.body], { type: file.type }), file.name);
    else form.append('note', 'no file here');
    return fetch(`${baseUrl}/upload-cv`, { method: 'POST', body: form });
  };
  const pdf = (size: number, name = 'my-cv.pdf') => ({ body: Buffer.alloc(size, 'a'), type: 'application/pdf', name });

  it('stores a valid PDF and answers 200 with { originalName, uploadedAt }', async () => {
    const spy = jest.spyOn(candidateService, 'handlerUploadCV').mockResolvedValue({
      success: true,
      message: 'ok',
      data: { originalName: 'my-cv.pdf', uploadedAt: 1 },
    });

    const res = await upload(pdf(10));

    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ originalName: 'my-cv.pdf', uploadedAt: 1 });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ candidateId, originalName: 'my-cv.pdf' }));
    expect(fs.statSync(storedPath).size).toBe(10);
  });

  it('rejects a file over 5MB with 400 cvFileTooLarge', async () => {
    const spy = jest.spyOn(candidateService, 'handlerUploadCV');

    const res = await upload(pdf(5 * 1024 * 1024 + 1));

    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toBe(t('candidate.cvFileTooLarge'));
    expect(spy).not.toHaveBeenCalled();
  });

  it.each([
    ['a non-PDF mime type', { body: Buffer.from('a'), type: 'text/plain', name: 'cv.pdf' }],
    ['a non-.pdf extension', { body: Buffer.from('a'), type: 'application/pdf', name: 'cv.txt' }],
  ])('rejects %s with 400 FILE_INVALID_TYPE', async (_label, file) => {
    const spy = jest.spyOn(candidateService, 'handlerUploadCV');

    const res = await upload(file);

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe(ErrorCode.FILE_INVALID_TYPE);
    expect(spy).not.toHaveBeenCalled();
    expect(fs.existsSync(storedPath)).toBe(false);
  });

  it('answers 400 when the request carries no file', async () => {
    const spy = jest.spyOn(candidateService, 'handlerUploadCV');

    const res = await upload();

    expect(res.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it('answers 404 on GET /cv-file before any upload, even with a file on disk', async () => {
    fs.mkdirSync(CV_UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(storedPath, 'orphan');
    jest.spyOn(candidateService, 'handlerGetCVFile').mockResolvedValue(null);

    const res = await fetch(`${baseUrl}/cv-file`);

    expect(res.status).toBe(404);
  });

  it('answers 404 on GET /cv-file when the record exists but the file is gone', async () => {
    jest.spyOn(candidateService, 'handlerGetCVFile').mockResolvedValue({ originalName: 'my-cv.pdf', uploadedAt: new Date() } as any);

    const res = await fetch(`${baseUrl}/cv-file`);

    expect(res.status).toBe(404);
  });

  it('downloads the stored file under its original name', async () => {
    fs.mkdirSync(CV_UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(storedPath, 'stored-pdf-bytes');
    jest.spyOn(candidateService, 'handlerGetCVFile').mockResolvedValue({ originalName: 'my-cv.pdf', uploadedAt: new Date() } as any);

    const res = await fetch(`${baseUrl}/cv-file`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toContain('my-cv.pdf');
    expect(await res.text()).toBe('stored-pdf-bytes');
  });
});

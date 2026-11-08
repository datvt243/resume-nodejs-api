/**
 * Issue #383 — uploaded CVs live outside public/ (express.static), and the
 * boot-time move empties the old public folder.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import express from 'express';
import { CV_UPLOAD_DIR, moveLegacyCvUploads, uploadCVMiddleware } from '@/middlewares/uploadCV.middleware';

describe('CV storage outside public/ (issue #383)', () => {
  let root: string;
  let from: string;
  let to: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-move-'));
    from = path.join(root, 'public', 'uploads', 'cv');
    to = path.join(root, 'storage', 'cv');
    fs.mkdirSync(from, { recursive: true });
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('CV_UPLOAD_DIR is not under the express.static public/ root', () => {
    expect(CV_UPLOAD_DIR.split(path.sep)).not.toContain('public');
    expect(CV_UPLOAD_DIR.endsWith(path.join('storage', 'cv'))).toBe(true);
  });

  it('moves every <id>-cv.pdf into the new folder and leaves other files alone', () => {
    fs.writeFileSync(path.join(from, 'a-cv.pdf'), 'A');
    fs.writeFileSync(path.join(from, 'b-cv.pdf'), 'B');
    fs.writeFileSync(path.join(from, '.gitkeep'), '');

    expect(moveLegacyCvUploads(from, to)).toBe(2);

    expect(fs.readFileSync(path.join(to, 'a-cv.pdf'), 'utf8')).toBe('A');
    expect(fs.readFileSync(path.join(to, 'b-cv.pdf'), 'utf8')).toBe('B');
    expect(fs.readdirSync(from)).toEqual(['.gitkeep']);
  });

  it('keeps the newer copy already in the new folder and removes the legacy one', () => {
    fs.mkdirSync(to, { recursive: true });
    fs.writeFileSync(path.join(from, 'a-cv.pdf'), 'old');
    fs.writeFileSync(path.join(to, 'a-cv.pdf'), 'new');

    moveLegacyCvUploads(from, to);

    expect(fs.readFileSync(path.join(to, 'a-cv.pdf'), 'utf8')).toBe('new');
    expect(fs.existsSync(path.join(from, 'a-cv.pdf'))).toBe(false);
  });

  it('is a no-op when the old folder does not exist', () => {
    expect(moveLegacyCvUploads(path.join(root, 'missing'), to)).toBe(0);
    expect(fs.existsSync(to)).toBe(false);
  });
});

describe('CV re-upload keeps the stored CV until the new one succeeded', () => {
  const candidateId = `test-upload-${process.pid}`;
  const finalPath = path.join(CV_UPLOAD_DIR, `${candidateId}-cv.pdf`);
  let server: http.Server;
  let url: string;

  beforeAll((done) => {
    const app = express();
    app.use((req, _res, next) => {
      req.user = { _id: candidateId };
      next();
    });
    app.post('/upload', uploadCVMiddleware, (_req, res) => res.status(200).json({ success: true }));
    server = app.listen(0, () => {
      const address = server.address();
      url = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/upload`;
      done();
    });
  });

  afterAll((done) => {
    fs.rmSync(finalPath, { force: true });
    server.close(() => done());
  });

  const post = (size: number) => {
    const form = new FormData();
    form.append('cv', new Blob([Buffer.alloc(size, 'a')], { type: 'application/pdf' }), 'cv.pdf');
    return fetch(url, { method: 'POST', body: form });
  };
  const leftoverTemps = () => fs.readdirSync(CV_UPLOAD_DIR).filter((name) => name.startsWith(candidateId) && name.endsWith('.tmp'));

  it('a valid upload lands at <candidateId>-cv.pdf with no temp file left', async () => {
    expect((await post(10)).status).toBe(200);
    expect(fs.statSync(finalPath).size).toBe(10);
    expect(leftoverTemps()).toEqual([]);
  });

  it('an oversized re-upload is rejected and the previous CV stays intact', async () => {
    expect((await post(5 * 1024 * 1024 + 1)).status).toBe(400);
    expect(fs.statSync(finalPath).size).toBe(10);
    expect(leftoverTemps()).toEqual([]);
  });
});

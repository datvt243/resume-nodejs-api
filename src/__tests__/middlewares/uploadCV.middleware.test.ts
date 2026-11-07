/**
 * Issue #383 — uploaded CVs live outside public/ (express.static), and the
 * boot-time move empties the old public folder.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { CV_UPLOAD_DIR, moveLegacyCvUploads } from '@/middlewares/uploadCV.middleware';

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

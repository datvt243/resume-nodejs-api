/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Multer config for project/certificate/award image
 *   uploads (issue #72). Stores to disk under
 *   `src/public/uploads/images/` — same public/static pattern already
 *   used for PDF export and CV upload. Unlike the CV upload (private,
 *   served only through an authenticated route), these images belong to
 *   a candidate's public portfolio (shown on `GET /api/me/:email`) — a
 *   plain static URL is the correct, intentional design here, not the
 *   same trust-boundary gap recorded as a Trap for `/uploads/cv/*`.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { Request } from 'express';

export const IMAGE_UPLOAD_DIR = path.join('src', 'public', 'uploads', 'images');
export const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
export const IMAGE_MAX_FILES = 5; // per request

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(IMAGE_UPLOAD_DIR)) fs.mkdirSync(IMAGE_UPLOAD_DIR, { recursive: true });
    cb(null, IMAGE_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // `<recordId>-<timestamp>-<random>.<ext>` — unique per file (unlike
    // the CV upload's deterministic name, images are additive, not
    // replace-in-place) and never derived from the client-supplied
    // original filename (path traversal risk).
    const recordId = (req.params as Record<string, string>)?.id || 'unknown';
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(6).toString('hex');
    cb(null, `${recordId}-${Date.now()}-${unique}${ext}`);
  },
});

// Real content-type check, not just whatever the client's multipart
// request claims — checked on both mimetype and extension, same
// discipline as uploadCV.middleware.ts.
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isImageMime = file.mimetype.startsWith('image/');
  const isAllowedExt = ALLOWED_EXTENSIONS.includes(path.extname(file.originalname).toLowerCase());
  if (isImageMime && isAllowedExt) return cb(null, true);
  cb(new Error('INVALID_FILE_TYPE'));
};

export const uploadImagesMiddleware = multer({
  storage,
  limits: { fileSize: IMAGE_MAX_FILE_SIZE, files: IMAGE_MAX_FILES },
  fileFilter,
}).array('images', IMAGE_MAX_FILES);

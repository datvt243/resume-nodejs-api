/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Multer config for the candidate CV file upload
 *   (GitHub issue #76 follow-up — "frontend added a CV upload UI,
 *   backend needs an endpoint to save it"). Stores to disk under
 *   `src/public/uploads/cv/`, one file per candidate — the destination
 *   filename is always `<candidateId>-cv.pdf`, so a re-upload simply
 *   overwrites the previous file with no separate cleanup step needed.
 */
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { formatReturn } from '@/utils';
import { t } from '@/utils/i18n';

// Relative to the process CWD (repo root when running `ts-node`/compiled
// `dist/server.js` — same convention `services/createPDF.ts` already
// uses for `src/public/pdf/`).
export const CV_UPLOAD_DIR = path.join('src', 'public', 'uploads', 'cv');
export const CV_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB, per operator decision

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(CV_UPLOAD_DIR)) fs.mkdirSync(CV_UPLOAD_DIR, { recursive: true });
    cb(null, CV_UPLOAD_DIR);
  },
  filename: (req, _file, cb) => {
    // Deterministic per-candidate filename — never derived from the
    // client-supplied original filename (path traversal / collision
    // risk) — matches candidateId, which every other CV-section model
    // already trusts as the ownership key.
    const candidateId = (req as any).user?._id;
    cb(null, `${candidateId}-cv.pdf`);
  },
});

// Real content-type check, not just the frontend's `accept="application/pdf"`
// (client-side only, trivially bypassable) — checked on both mimetype and
// extension.
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
  if (isPdfMime && isPdfExt) return cb(null, true);
  cb(new Error('INVALID_FILE_TYPE'));
};

const upload = multer({
  storage,
  limits: { fileSize: CV_MAX_FILE_SIZE, files: 1 },
  fileFilter,
}).single('cv');

/**
 * Wraps multer's callback-style error handling into this project's
 * `formatReturn` response shape, instead of letting a raw `MulterError`
 * fall through to the generic (500) branch of the global error handler.
 */
export const uploadCVMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only ever mounted behind `verifyToken` (see candidate.route.ts) —
  // `req.user._id` is already guaranteed by that point, same assumption
  // every other candidate handler (fnUpdate/fnDelete) already makes.
  upload(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: t('candidate.cvFileTooLarge', (req as any).lang),
      });
    }
    if (err instanceof Error && err.message === 'INVALID_FILE_TYPE') {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: t('candidate.cvInvalidFileType', (req as any).lang),
      });
    }
    return formatReturn(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: t('candidate.cvUploadFailed', (req as any).lang),
    });
  });
};

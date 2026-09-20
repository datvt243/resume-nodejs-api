/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Multer config for the LinkedIn "Data export" ZIP upload
 *   (issue #141 — parse-and-return endpoint, nothing is persisted to
 *   disk or DB). Kept in memory only, unlike uploadCV.middleware.ts's
 *   disk storage -- there is no per-candidate file to keep around here.
 */
import path from 'path';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { formatReturn } from '@/utils';
import { t } from '@/utils/i18n';

export const LINKEDIN_EXPORT_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isZipMime = file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.mimetype === 'application/octet-stream';
  const isZipExt = path.extname(file.originalname).toLowerCase() === '.zip';
  if (isZipMime && isZipExt) return cb(null, true);
  cb(new Error('INVALID_FILE_TYPE'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LINKEDIN_EXPORT_MAX_FILE_SIZE, files: 1 },
  fileFilter,
}).single('file');

/**
 * Same callback-to-formatReturn wrapping pattern as uploadCVMiddleware.
 * Only ever mounted behind `verifyToken` (see candidate.route.ts).
 */
export const uploadLinkedInExportMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: t('linkedinImport.fileTooLarge', (req as any).lang),
      });
    }
    if (err instanceof Error && err.message === 'INVALID_FILE_TYPE') {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: t('linkedinImport.invalidFileType', (req as any).lang),
      });
    }
    return formatReturn(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: t('linkedinImport.parseFailed', (req as any).lang),
    });
  });
};

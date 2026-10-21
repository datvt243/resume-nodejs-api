/**
 * Multer config for the LinkedIn "Data export" ZIP upload — a
 * parse-and-return endpoint, nothing is persisted to disk or DB. Kept
 * in memory only, unlike uploadCV.middleware.ts's disk storage: there's
 * no per-candidate file to keep around here.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import path from 'path';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { formatReturn } from '@/utils';
import { t } from '@/utils/i18n';
import { ErrorCode } from '@/errors';

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
        message: t('linkedinImport.fileTooLarge', req.lang),
      });
    }
    if (err instanceof Error && err.message === 'INVALID_FILE_TYPE') {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        errorCode: ErrorCode.FILE_INVALID_TYPE,
        success: false,
        message: t('linkedinImport.invalidFileType', req.lang),
      });
    }
    return formatReturn(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: t('linkedinImport.parseFailed', req.lang),
    });
  });
};

/**
 * Multer config for the PDF CV import upload — a parse-and-return
 * endpoint, nothing is persisted to disk or DB. Same 5 MB / PDF-only
 * rules as uploadCV.middleware.ts, but kept in memory like
 * uploadLinkedInExport.middleware.ts: the file is only read, never kept.
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
import { CV_MAX_FILE_SIZE } from '@/middlewares/uploadCV.middleware';

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
  if (isPdfMime && isPdfExt) return cb(null, true);
  cb(new Error('INVALID_FILE_TYPE'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CV_MAX_FILE_SIZE, files: 1 },
  fileFilter,
}).single('file');

/**
 * Same callback-to-formatReturn wrapping pattern as uploadCVMiddleware.
 * Only ever mounted behind `verifyToken` (see candidate.route.ts).
 */
export const uploadCvPdfParseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: t('cvPdfImport.fileTooLarge', req.lang),
      });
    }
    if (err instanceof Error && err.message === 'INVALID_FILE_TYPE') {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        errorCode: ErrorCode.FILE_INVALID_TYPE,
        success: false,
        message: t('cvPdfImport.invalidFileType', req.lang),
      });
    }
    return formatReturn(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: t('cvPdfImport.parseFailed', req.lang),
    });
  });
};

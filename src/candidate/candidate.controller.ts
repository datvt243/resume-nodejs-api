/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { formatReturn, validateSchema, handleError } from '@/utils';
import { schemaCandidate, schemaCandidatePatch } from '@/candidate/candidate.validate';
import {
  handlerUpdate,
  handlerDelete,
  handlerGetInformationByEmail,
  handlerGetInformationById,
  handlerUploadCV,
  handlerGetCVFile,
} from '@/candidate/candidate.service';
import { CV_UPLOAD_DIR } from '@/middlewares/uploadCV.middleware';
import { t } from '@/utils/i18n';

export const fnGetInformationById = async (req: Request, res: Response) => {
  const { id = '' } = req.params;
  const doc = await handlerGetInformationById(id);

  const _flag = !!doc;
  return formatReturn(res, { success: _flag, message: _flag ? '' : t('candidate.userNotFound', (req as any).lang), data: doc });
};

export const fnGetInformationByEmail = async (req: Request, res: Response) => {
  const { email = '' } = req.params;
  const doc = await handlerGetInformationByEmail(email);
  const _flag = !!doc;
  return formatReturn(res, { success: _flag, message: _flag ? '' : t('candidate.userNotFound', (req as any).lang), data: doc });
};

export const fnUpdate = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate data come from req.body
   */
  const { isValidated, value, errors } = validateSchema({ schema: schemaCandidate, item: { ...req.body }, lang: (req as any).lang });
  if (!isValidated)
    return formatReturn(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: t('validation.hasErrors', (req as any).lang),
      errors,
    });

  /**
   * update data
   * Force _id to the authenticated user's own id — never trust a client-
   * supplied _id here, or any authenticated user could overwrite another
   * candidate's profile.
   */
  try {
    const _result = await handlerUpdate({ ...value, _id: (req as any).user?._id }, (req as any).lang);
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

export const fnUploadCV = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * `uploadCVMiddleware` (candidate.route.ts) already validated the file
   * (PDF only, <= 5 MB) and saved it to disk as `<candidateId>-cv.pdf`
   * before this handler runs — only the DB record is left to write.
   */
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: t('candidate.cvUploadFailed', (req as any).lang) });
  }

  try {
    const _result = await handlerUploadCV((req as any).user?._id, file.originalname, (req as any).lang);
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

export const fnDownloadCV = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * Self only — always the authenticated user's own id (same IDOR-safe
   * pattern as fnUpdate/fnDelete), never a client-supplied one. Serves
   * the stored file through this authenticated route rather than a
   * static/public URL, so a CV can't be fetched by guessing a path.
   */
  try {
    const candidateId = (req as any).user?._id;
    const cvFile = await handlerGetCVFile(candidateId);
    if (!cvFile) {
      return formatReturn(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: t('candidate.cvFileNotFound', (req as any).lang),
      });
    }

    const filePath = path.join(CV_UPLOAD_DIR, `${candidateId}-cv.pdf`);
    return res.download(filePath, cvFile.originalName || 'CV.pdf');
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

export const fnDelete = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * Self-delete only — always the authenticated user's own id, never a
   * client-supplied one (see fnUpdate for the same IDOR-safety pattern).
   */
  try {
    const _result = await handlerDelete((req as any).user?._id, (req as any).lang);
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

export const fnUpdateFields = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate data gửi lên
   */
  const { isValidated, value, errors } = validateSchema({
    schema: schemaCandidatePatch,
    item: { ...req.body },
    lang: (req as any).lang,
  });
  if (!isValidated)
    return formatReturn(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: t('validation.hasErrors', (req as any).lang),
      errors,
    });

  /**
   * update data — force _id to the authenticated user (see fnUpdate)
   */
  try {
    const _result = await handlerUpdate({ ...value, _id: (req as any).user?._id }, (req as any).lang);
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { formatReturn, validateSchema, handleError, ok } from '@/utils';
import { AuthenticationError, NotFoundError } from '@/errors';
import { schemaCandidate, schemaCandidatePatch } from '@/candidate/candidate.validate';
import {
  handlerUpdate,
  handlerDelete,
  handlerGetInformationByEmail,
  handlerGetInformationById,
  handlerUploadCV,
  handlerGetCVFile,
  handlerGetVisits,
} from '@/candidate/candidate.service';
import { CV_UPLOAD_DIR } from '@/middlewares/uploadCV.middleware';
import { parseLinkedInExportZip } from '@/candidate/parseLinkedInExport.service';
import { parseCvPdf } from '@/candidate/parseCvPdf.service';
import { handlerGetVisitStats, resolveVisitStatsQuery } from '@/candidate/visitStats.service';
import { t } from '@/utils/i18n';

export const fnGetInformationById = async (req: Request, res: Response, next: NextFunction) => {
  const { id = '' } = req.params;
  const doc = await handlerGetInformationById(id);
  if (!doc) return next(new NotFoundError(t('candidate.userNotFound', req.lang)));
  return ok(res, doc);
};

export const fnGetInformationByEmail = async (req: Request, res: Response, next: NextFunction) => {
  const { email = '' } = req.params;
  const doc = await handlerGetInformationByEmail(email);
  if (!doc) return next(new NotFoundError(t('candidate.userNotFound', req.lang)));
  return ok(res, doc);
};

export const fnUpdate = async (req: Request, res: Response, next: NextFunction) => {
  const { isValidated, value, errors } = validateSchema({ schema: schemaCandidate, item: { ...req.body }, lang: req.lang });
  if (!isValidated)
    return formatReturn(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: t('validation.hasErrors', req.lang),
      errors,
    });

  /**
   * Force _id to the authenticated user's own id — never trust a client-
   * supplied _id here, or any authenticated user could overwrite another
   * candidate's profile.
   */
  try {
    const _result = await handlerUpdate({ ...value, _id: req.user?._id }, req.lang);
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

export const fnUploadCV = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * `uploadCVMiddleware` (candidate.route.ts) already validated the file
   * (PDF only, <= 5 MB) and saved it to disk as `<candidateId>-cv.pdf`
   * before this handler runs — only the DB record is left to write.
   */
  const file = req.file;
  if (!file) {
    return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: t('candidate.cvUploadFailed', req.lang) });
  }

  try {
    if (!req.user?._id) throw new AuthenticationError();
    const _result = await handlerUploadCV({ candidateId: req.user._id, originalName: file.originalname, lang: req.lang });
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
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
    if (!req.user?._id) throw new AuthenticationError();
    const candidateId = req.user._id;
    const cvFile = await handlerGetCVFile(candidateId);
    if (!cvFile) {
      return formatReturn(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: t('candidate.cvFileNotFound', req.lang),
      });
    }

    const filePath = path.join(CV_UPLOAD_DIR, `${candidateId}-cv.pdf`);
    return res.download(filePath, cvFile.originalName || 'CV.pdf');
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

export const fnParseLinkedInExport = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * `uploadLinkedInExportMiddleware` (candidate.route.ts) already
   * validated the file (.zip only, <= 20 MB) and kept it in memory --
   * nothing is written to disk or persisted to the DB here. Stateless
   * parse-and-return: the frontend maps the result into its existing
   * create forms for the user to review/edit before saving.
   */
  const file = req.file;
  if (!file) {
    return formatReturn(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: t('linkedinImport.noFileUploaded', req.lang),
    });
  }

  try {
    const data = parseLinkedInExportZip(file.buffer);
    return formatReturn(res, { success: true, message: t('linkedinImport.parseSuccess', req.lang), data });
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_ZIP') {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: t('linkedinImport.invalidZip', req.lang),
      });
    }
    handleError({ err, next, lang: req.lang });
  }
};

export const fnParseCvPdf = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * `uploadCvPdfParseMiddleware` (candidate.route.ts) already validated
   * the file (.pdf only, <= 5 MB) and kept it in memory -- same
   * stateless parse-and-return contract as fnParseLinkedInExport.
   * Readable but unrecognized content is a 200 with empty arrays, not an
   * error: `extractedText` still lets the user copy from it by hand.
   */
  const file = req.file;
  if (!file) {
    return formatReturn(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: t('cvPdfImport.noFileUploaded', req.lang),
    });
  }

  try {
    const data = await parseCvPdf(file.buffer);
    return formatReturn(res, { success: true, message: t('cvPdfImport.parseSuccess', req.lang), data });
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_PDF') {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: t('cvPdfImport.invalidPdf', req.lang),
      });
    }
    handleError({ err, next, lang: req.lang });
  }
};

export const fnGetVisits = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * Self only — always the authenticated user's own id (same IDOR-safe
   * pattern as fnUpdate/fnDelete/fnDownloadCV), never a client-supplied
   * one, so a candidate can only ever see their own visit stats.
   */
  try {
    if (!req.user?._id) throw new AuthenticationError();
    const _result = await handlerGetVisits(req.user._id, req.lang);
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

export const fnGetVisitStats = async (req: Request, res: Response, next: NextFunction) => {
  // Self only, same as fnGetVisits: the id comes from the verified JWT, never from the request.
  try {
    if (!req.user?._id) throw new AuthenticationError();
    const query = resolveVisitStatsQuery({ interval: req.query['interval'], from: req.query['from'], to: req.query['to'], tz: req.query['tz'] });
    if (!query) {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: t('candidate.visitStatsInvalidQuery', req.lang),
      });
    }
    const data = await handlerGetVisitStats(req.user._id, query);
    return formatReturn(res, { success: true, message: t('candidate.getVisitStatsSuccess', req.lang), data });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

export const fnDelete = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * Self-delete only — always the authenticated user's own id, never a
   * client-supplied one (see fnUpdate for the same IDOR-safety pattern).
   */
  try {
    if (!req.user?._id) throw new AuthenticationError();
    const _result = await handlerDelete(req.user._id, req.lang);
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

export const fnUpdateFields = async (req: Request, res: Response, next: NextFunction) => {
  const { isValidated, value, errors } = validateSchema({
    schema: schemaCandidatePatch,
    item: { ...req.body },
    lang: req.lang,
  });
  if (!isValidated)
    return formatReturn(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: t('validation.hasErrors', req.lang),
      errors,
    });

  // Force _id to the authenticated user — same IDOR-safety pattern as fnUpdate.
  try {
    const _result = await handlerUpdate({ ...value, _id: req.user?._id }, req.lang);
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

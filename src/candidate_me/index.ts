/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { formatReturn, handleError } from '@/utils';
import { formatReturnFailed } from '@/services';
import { createCV } from '@/services/createPDF';
import * as MODEL from '@/models';

// Localized ({vi, en}) fields get resolved down to a single string for
// public-facing reads (profile view, PDF export) — the owner's own
// authenticated CRUD endpoints (candidate_profile/*) still return the
// full {vi, en} object so they can edit both languages.
const resolveLocalizedText = (value: any, lang: string): string => {
  if (typeof value === 'string') return value; // defensive: pre-migration data shape
  if (!value || typeof value !== 'object') return '';
  return value[lang] || value.vi || value.en || '';
};

export const fnGetAboutMe = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.params;
  const lang = req.query.lang === 'en' ? 'en' : 'vi';
  if (!email) res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Không tìm thấy Email'));

  /**
   * get data
   */
  try {
    const _me = await handlerGetAboutMe(email, lang);
    // Private profile (issue #75) — same response shape as "email not
    // found" so a private profile isn't distinguishable from a
    // non-existent one. Only gates this public route; the authenticated
    // self-export path (fnExportPDF) calls handlerGetAboutMe directly
    // and is unaffected — a candidate can always see/export their own
    // data regardless of this flag.
    if (_me.success && (_me.data as any)?.isPublic === false) {
      return formatReturn(res, formatReturnFailed('Email không tồn tại'));
    }
    return formatReturn(res, _me);
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

export const handlerGetAboutMe = async (email: string, lang: string = 'vi') => {
  const removeFields = { __v: 0, createdAt: 0, updatedAt: 0, candidateId: 0 };

  const { candidateQuerySafe } = await import('@/utils/querySafe');
  const safeEmailQuery = candidateQuerySafe.safeQuery({}, { email });
  const document = await MODEL.Candidate.findOne(safeEmailQuery, { ...removeFields }).exec();
  if (!document) return formatReturnFailed('Email không tồn tại');

  const { _id } = document;

  /**
   * lấy thông tin liên quan [học vấn, kinh nghiệm, người liên hệ]
   */
  const getMoreInfo: { collection: string; model: any }[] = [
    { collection: 'generalInformation', model: MODEL.generalInformation },
    { collection: 'experiences', model: MODEL.Experience },
    { collection: 'educations', model: MODEL.Education },
    { collection: 'references', model: MODEL.Reference },
    { collection: 'projects', model: MODEL.Project },
    { collection: 'certificates', model: MODEL.Certificate },
    { collection: 'awards', model: MODEL.Award },
  ];

  const dataResult = JSON.parse(JSON.stringify(document));
  delete dataResult.password;

  for (const { collection, model } of getMoreInfo) {
    dataResult[collection] = [];
    const { idQuerySafe } = await import('@/utils/querySafe');
    // _id here is a Mongoose ObjectId instance (from the raw document,
    // destructured before the JSON.parse/stringify flatten above), not a
    // string. QuerySafe.safeQuery only accepts string values (typeof
    // check) — passing the ObjectId directly made it silently drop the
    // candidateId filter, so this query returned EVERY candidate's CV
    // section data unfiltered.
    const safeCandidateQuery = idQuerySafe.safeQuery({}, { candidateId: _id?.toString() || '' });
    const _find: undefined | Record<string, any> | Record<string, any>[] = await model
      .find(safeCandidateQuery, { _id: 0, ...removeFields })
      .exec();
    if (!_find) continue;
    // Flatten Mongoose documents to plain objects immediately (same as
    // `document` above) — spreading a live Mongoose document later (for
    // the language-resolution step) only copies its internal bookkeeping
    // properties ($__, _doc, ...), not the clean schema fields, since
    // those are only reachable via getters that a plain object spread
    // doesn't invoke.
    dataResult[collection] = JSON.parse(JSON.stringify(_find));
  }

  dataResult['generalInformation'] = ((data: Record<string, any>[]) => {
    if (!data.length) return {};
    return data[0];
  })(dataResult['generalInformation']);

  /**
   * Resolve localized ({vi, en}) fields down to a single string for this
   * language, falling back to whichever variant is non-empty.
   */
  dataResult.introduction = resolveLocalizedText(dataResult.introduction, lang);
  for (const key of ['educations', 'experiences', 'awards', 'certificates', 'projects']) {
    dataResult[key] = (dataResult[key] || []).map((item: Record<string, any>) => ({
      ...item,
      description: resolveLocalizedText(item.description, lang),
    }));
  }
  if (dataResult.generalInformation && Object.keys(dataResult.generalInformation).length) {
    // Spread into a new plain object rather than mutating in place —
    // generalInformation still holds a live Mongoose document here (only
    // the top-level Candidate doc went through JSON.parse(JSON.stringify)
    // above), so assigning a plain string onto a subdocument path would
    // route through Mongoose's own setter/caster instead of just
    // overwriting the value in the response payload.
    dataResult.generalInformation = {
      ...dataResult.generalInformation,
      career: resolveLocalizedText(dataResult.generalInformation.career, lang),
      careerGoal: resolveLocalizedText(dataResult.generalInformation.careerGoal, lang),
    };
  }

  return {
    success: true,
    data: dataResult,
    message: 'Lấy thông tin ứng viên thành công',
  };
};

export const fnExportPDF = async (req: Request, res: Response, next: NextFunction) => {
  /**
   *
   */

  // Use the authenticated user's own id — never a client-supplied one,
  // or any authenticated user could export another candidate's PDF.
  const _id = (req as any).user?._id;
  if (!_id) {
    res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('CandidateId not found'));
    return;
  }

  const { idQuerySafe } = await import('@/utils/querySafe');
  const find = await MODEL.Candidate.findOne(idQuerySafe.safeQuery({}, { _id })).exec();
  if (!find) {
    res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Candidate not found'));
    return;
  }

  const { email } = find;
  if (!email) {
    res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Email not found'));
    return;
  }

  try {
    const lang = req.query.lang === 'en' ? 'en' : 'vi';
    const { success, message, data } = await handlerGetAboutMe(email, lang);
    if (!success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Lấy thông tin ứng viên thất bại'));
      return;
    }

    // ?format=json reuses the same aggregated data already assembled for
    // the PDF path — no new dependency, no new data-fetch (issue #76).
    if (req.query.format === 'json') {
      formatReturn(res, { success, message, data });
      return;
    }

    await createCV(data, res);
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

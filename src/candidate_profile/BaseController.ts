/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { Response, Request, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Schema } from 'joi';
import multer from 'multer';

import type { Model } from 'mongoose';
import { created, formatReturn, handleError, ok, toAppError, validateSchema } from '@/utils/index';
import type { BaseReturn } from '@/types/base.type';
import { logger } from '@/logger';
import { baseDeleteDocument, baseFindDocument, baseRestoreDocument, CrudDocument } from '@/services';
import * as MODELS from '@/models';
import { t } from '@/utils/i18n';
import { uploadImagesMiddleware } from '@/middlewares/uploadImages.middleware';

/**
 * Field name used to sort by — no `$`, so this can't smuggle a Mongo
 * operator into `.sort()`, and it can only ever reorder rows, never widen
 * which rows come back. A leading `-` (Mongoose convention) means desc.
 */
const SORT_FIELD_REGEX = /^-?[a-zA-Z0-9_.]+$/;

// Bulk-create hard cap — a single request cannot create more
// than this many entries regardless of what the client sends.
const MAX_BULK_ITEMS = 100;

/**
 * Dynamic lookup across all 9 CV-section models (keyed by the
 * `:collection` route param), accessed with a request-supplied string key
 * — this requires an index signature, and the only type every one of the
 * 9 differently-shaped concrete models can structurally satisfy there is
 * `CrudDocument` (see `services/index.ts`'s doc comment). Mongoose's
 * `Model<T>` is invariant in a way plain structural subtyping doesn't
 * reach, though: assigning a concrete `Model<ConcreteDoc>` directly into a
 * `Model<CrudDocument>`-typed slot fails (confirmed — tried it, `tsc`
 * reports real mismatches on fields like `schema.obj.candidateId`'s exact
 * inferred shape). A `Model<T>` genuinely needs `T` inferred fresh by a
 * generic function call, not assigned to a fixed variable type. Each cast
 * below is the one unavoidable, narrow exception that pattern has for a
 * dynamic per-collection lookup table — every USE of `modelObject[x]`
 * downstream (baseGetAll, baseDelete, ...) stays fully typed with zero
 * further casts, since it's passed straight into the generic
 * `base*Document` functions, which re-infer `T` themselves. Would go away
 * entirely if each model file exported its own document interface (a
 * bigger, separate follow-up — not required by this node's scope).
 */
const modelObject: { [key: string]: Model<CrudDocument> } = {
  generalInformation: MODELS.generalInformation as unknown as Model<CrudDocument>,
  experiences: MODELS.Experience as unknown as Model<CrudDocument>,
  educations: MODELS.Education as unknown as Model<CrudDocument>,
  references: MODELS.Reference as unknown as Model<CrudDocument>,
  projects: MODELS.Project as unknown as Model<CrudDocument>,
  certificates: MODELS.Certificate as unknown as Model<CrudDocument>,
  awards: MODELS.Award as unknown as Model<CrudDocument>,
  applications: MODELS.Application as unknown as Model<CrudDocument>,
  profiles: MODELS.Profile as unknown as Model<CrudDocument>,
};

export const baseGetAll = async (req: Request, res: Response, next: NextFunction) => {
  const { candidateId, collection } = req.body;

  if (!candidateId || !collection || !modelObject[collection])
    return formatReturn(res, { statusCode: StatusCodes.NOT_FOUND, data: null, message: t('common.notFoundData', req.lang) });

  /**
   * Optional pagination/sort. Omitting page/limit keeps the
   * pre-existing "return everything" behavior (`data` stays a plain
   * array) — this is purely additive, no existing caller is affected.
   */
  const { page, limit, sort } = req.query as Record<string, string | undefined>;

  try {
    const _result = await baseFindDocument({
      fields: { candidateId: candidateId },
      model: modelObject[collection],
      findOne: false,
      lang: req.lang,
      page: page !== undefined ? parseInt(page, 10) : undefined,
      limit: limit !== undefined ? parseInt(limit, 10) : undefined,
      sort: sort && SORT_FIELD_REGEX.test(sort) ? sort : undefined,
    });
    return ok(res, _result.data, _result.message);
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

export const baseDelete = async (req: Request, res: Response, next: NextFunction) => {
  const { id, collection = '' } = req.params;

  if (!id) return formatReturn(res, { success: false, message: t('common.notFoundId', req.lang) });
  if (!(collection && modelObject[collection]))
    return formatReturn(res, { success: false, message: t('common.cannotDelete', req.lang) });

  try {
    const _result = await baseDeleteDocument({
      model: modelObject[collection],
      _id: id,
      userID: req.body.candidateId || '',
      name: '',
      lang: req.lang,
    });
    return ok(res, null, _result.message);
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

export const baseRestore = async (req: Request, res: Response, next: NextFunction) => {
  const { id, collection = '' } = req.params;

  if (!id) return formatReturn(res, { success: false, message: t('common.notFoundId', req.lang) });
  if (!(collection && modelObject[collection]))
    return formatReturn(res, { success: false, message: t('common.cannotRestore', req.lang) });

  /**
   * restore — same ownership pattern as baseDelete: userID
   * always comes from req.body.candidateId, which verifyToken.middleware.ts
   * already forces to the authenticated req.user._id.
   */
  try {
    const _result = await baseRestoreDocument({
      model: modelObject[collection],
      _id: id,
      userID: req.body.candidateId || '',
      name: '',
      lang: req.lang,
    });
    return ok(res, null, _result.message);
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

export const baseUploadImages = async (req: Request, res: Response, next: NextFunction) => {
  const { id, collection = '' } = req.params;
  const candidateId = req.user?._id;

  if (!id) return formatReturn(res, { success: false, message: t('common.notFoundId', req.lang) });
  if (!(collection && modelObject[collection]))
    return formatReturn(res, { success: false, message: t('common.notFoundData', req.lang) });

  const MODEL = modelObject[collection];

  try {
    /**
     * Ownership check BEFORE parsing/storing any uploaded file — never
     * trust req.body.candidateId (see the still-open
     * fix-idor-broken-access-control trap — baseDelete above is exactly
     * that bug, not fixed here, out of this task's scope). Always
     * cross-check the real owner against the authenticated req.user._id.
     */
    const document = await MODEL.findById(id);
    if (!document) return formatReturn(res, { statusCode: StatusCodes.NOT_FOUND, success: false, message: t('common.notFoundId', req.lang) });
    if (!document.candidateId || document.candidateId.toString() !== candidateId) {
      return formatReturn(res, { statusCode: StatusCodes.FORBIDDEN, success: false, message: t('common.updateNotYours', req.lang) });
    }

    // Only now safe to parse the multipart body and write files to disk.
    await new Promise<void>((resolve, reject) => {
      uploadImagesMiddleware(req, res, (err: unknown) => (err ? reject(err) : resolve()));
    });

    /**
     * `req.files` is typed as `File[] | { [field]: File[] } | undefined` since
     * multer supports both `.array()` and `.fields()` configs; `uploadImagesMiddleware`
     * (uploadImages.middleware.ts) always uses `.array('images', ...)`, so this
     * specific call site is genuinely always `File[] | undefined` — narrowing here.
     */
    const files = (req.files || []) as Express.Multer.File[];
    if (!files.length) {
      return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: t('images.noFilesUploaded', req.lang) });
    }

    const newUrls = files.map((f) => `/uploads/images/${f.filename}`);
    const images = [...(document.images || []), ...newUrls];
    await MODEL.updateOne({ _id: id }, { images });

    return formatReturn(res, { success: true, message: t('images.uploadSuccess', req.lang), data: { images } });
  } catch (err) {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: t('images.fileTooLarge', req.lang) });
    }
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_COUNT') {
      return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: t('images.tooManyFiles', req.lang) });
    }
    if (err instanceof Error && err.message === 'INVALID_FILE_TYPE') {
      return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: t('images.invalidFileType', req.lang) });
    }
    handleError({ err, next, lang: req.lang });
  }
};

export const createCrudController = (props: {
  schema: Schema;
  service: {
    handlerCreate: (item: Record<string, unknown>, lang?: string) => Promise<BaseReturn>;
    handlerUpdate: (args: {
      item: Record<string, unknown>;
      userID?: string | undefined;
      lang?: string | undefined;
    }) => Promise<BaseReturn>;
  };
  booleanDefaultField?: string;
}) => {
  const { schema, service, booleanDefaultField } = props;

  const fnCreate = async (req: Request, res: Response, next: NextFunction) => {
    const { isValidated, value = {}, errors, message } = validateSchema({ schema, item: { ...req.body }, lang: req.lang });
    if (!isValidated) return formatReturn(res, { success: false, message, errors });

    try {
      if (booleanDefaultField && !value[booleanDefaultField]) value[booleanDefaultField] = false;
      const _result = await service.handlerCreate(value, req.lang);
      return created(res, _result.data, _result.message);
    } catch (err) {
      handleError({ err, next, lang: req.lang });
    }
  };

  const fnUpdate = async (req: Request, res: Response, next: NextFunction) => {
    const { isValidated, value = {}, errors, message } = validateSchema({ schema, item: { ...req.body }, lang: req.lang });
    if (!isValidated) return formatReturn(res, { success: false, message, errors });

    try {
      if (booleanDefaultField && !value[booleanDefaultField]) value[booleanDefaultField] = false;
      const _result = await service.handlerUpdate({ item: value, userID: req.user?._id, lang: req.lang });
      return ok(res, _result.data, _result.message);
    } catch (err) {
      handleError({ err, next, lang: req.lang });
    }
  };

  /**
   * Bulk-create: one request, many entries, best-effort per item (a bad
   * entry doesn't block the rest) — pairs with the stateless
   * LinkedIn-export-parse flow: parse -> review client-side -> bulk-save.
   */
  const fnBulkCreate = async (req: Request, res: Response, next: NextFunction) => {
    const lang = req.lang;
    /**
     * Same IDOR-safe pattern as every other write path, but applied per
     * array item: verifyToken only forces req.body.candidateId at the top
     * level, never touching entries nested inside req.body.items.
     */
    const candidateId = req.user?._id;
    const items = Array.isArray(req.body.items) ? req.body.items : null;

    if (!items || !items.length) {
      return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: t('common.bulkNoItems', lang) });
    }
    if (items.length > MAX_BULK_ITEMS) {
      return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: t('common.bulkTooManyItems', lang) });
    }

    try {
      const results: Array<{ index: number; success: boolean; [key: string]: unknown }> = [];

      for (let index = 0; index < items.length; index++) {
        const { isValidated, value = {}, errors, message } = validateSchema({
          schema,
          item: { ...items[index], candidateId },
          lang,
        });

        if (!isValidated) {
          results.push({ index, success: false, message, errors });
          continue;
        }

        if (booleanDefaultField && !value[booleanDefaultField]) value[booleanDefaultField] = false;
        try {
          const result = await service.handlerCreate(value, lang);
          results.push({ index, ...result, success: true });
        } catch (err) {
          // One item failing must not abort the rest; an unexpected error's text stays out of the response.
          const e = toAppError(err, lang);
          if (!e.isOperational) logger.error('Bulk create item failed', { index, error: e.message, stack: e.stack });
          results.push({ index, success: false, message: e.isOperational ? e.message : t('common.createFailed', lang), errors: e.errors });
        }
      }

      const succeeded = results.filter((r) => r.success).length;
      const summary = { total: results.length, succeeded, failed: results.length - succeeded };

      /**
       * Every item failed: a 400 with `success: false`. Written directly with
       * the same body keys because utils/helper.ts's formatResponse() nulls
       * out `data` whenever `success` is false, which would drop
       * `results`/`summary`, the one thing the caller needs here.
       */
      if (succeeded === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: t('common.createFailed', lang), errors: null, data: { results, summary } });
      }

      /**
       * At least one item was created: envelope `success` stays true and
       * per-item outcome lives in `results[].success`/`summary`, for the same
       * formatResponse() reason as above.
       */
      return formatReturn(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: summary.failed === 0 ? t('common.createSuccess', lang) : t('common.createFailed', lang),
        data: { results, summary },
      });
    } catch (err) {
      handleError({ err, next, lang });
    }
  };

  return { fnCreate, fnUpdate, fnBulkCreate };
};

import { Response, Request, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Schema } from 'joi';
import multer from 'multer';

import { formatReturn, handleError, validateSchema } from '@/utils/index';
import { baseDeleteDocument, baseFindDocument } from '@/services';
import * as MODELS from '@/models';
import { t } from '@/utils/i18n';
import { uploadImagesMiddleware } from '@/middlewares/uploadImages.middleware';
interface baseProp {
  model: any;
  fields: { _id?: string; candidateId?: string };
  findOne?: boolean;
}

// Field name used to sort by — no `$`, so this can't smuggle a Mongo
// operator into `.sort()`, and it can only ever reorder rows, never widen
// which rows come back. A leading `-` (Mongoose convention) means desc.
const SORT_FIELD_REGEX = /^-?[a-zA-Z0-9_.]+$/;

const modelObject: { [key: string]: any } = {
  generalInformation: MODELS.generalInformation,
  experiences: MODELS.Experience,
  educations: MODELS.Education,
  references: MODELS.Reference,
  projects: MODELS.Project,
  certificates: MODELS.Certificate,
  awards: MODELS.Award,
};

export const baseGetAll = async (req: Request, res: Response, next: NextFunction) => {
  const { candidateId, collection } = req.body;

  if (!candidateId || !collection || !modelObject[collection])
    return formatReturn(res, { statusCode: StatusCodes.NOT_FOUND, data: null, message: t('common.notFoundData', (req as any).lang) });

  // Optional pagination/sort (issue #73). Omitting page/limit keeps the
  // pre-existing "return everything" behavior (`data` stays a plain
  // array) — this is purely additive, no existing caller is affected.
  const { page, limit, sort } = req.query as Record<string, string | undefined>;

  try {
    const _result = await baseFindDocument({
      fields: { candidateId: candidateId },
      model: modelObject[collection],
      findOne: false,
      lang: (req as any).lang,
      page: page !== undefined ? parseInt(page, 10) : undefined,
      limit: limit !== undefined ? parseInt(limit, 10) : undefined,
      sort: sort && SORT_FIELD_REGEX.test(sort) ? sort : undefined,
    });
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

export const baseDelete = async (req: Request, res: Response, next: NextFunction) => {
  const { id, collection = '' } = req.params;

  if (!id) return formatReturn(res, { success: false, message: t('common.notFoundId', (req as any).lang) });
  if (!(collection && modelObject[collection]))
    return formatReturn(res, { success: false, message: t('common.cannotDelete', (req as any).lang) });

  /**
   * delete
   */
  try {
    const _result = await baseDeleteDocument({
      model: modelObject[collection],
      _id: id,
      userID: req.body.candidateId || '',
      name: '',
      lang: (req as any).lang,
    });
    return formatReturn(res, { ..._result });
  } catch (err) {
    //
    handleError(err, next, (req as any).lang);
  }
};

export const baseUploadImages = async (req: Request, res: Response, next: NextFunction) => {
  const { id, collection = '' } = req.params;
  const candidateId = (req as any).user?._id;

  if (!id) return formatReturn(res, { success: false, message: t('common.notFoundId', (req as any).lang) });
  if (!(collection && modelObject[collection]))
    return formatReturn(res, { success: false, message: t('common.notFoundData', (req as any).lang) });

  const MODEL = modelObject[collection];

  try {
    // Ownership check BEFORE parsing/storing any uploaded file — never
    // trust req.body.candidateId (see the still-open
    // fix-idor-broken-access-control trap — baseDelete above is exactly
    // that bug, not fixed here, out of this task's scope). Always
    // cross-check the real owner against the authenticated req.user._id.
    const document = await MODEL.findById(id);
    if (!document) return formatReturn(res, { statusCode: StatusCodes.NOT_FOUND, success: false, message: t('common.notFoundId', (req as any).lang) });
    if (!document.candidateId || document.candidateId.toString() !== candidateId) {
      return formatReturn(res, { statusCode: StatusCodes.FORBIDDEN, success: false, message: t('common.updateNotYours', (req as any).lang) });
    }

    // Only now safe to parse the multipart body and write files to disk.
    await new Promise<void>((resolve, reject) => {
      uploadImagesMiddleware(req, res, (err: unknown) => (err ? reject(err) : resolve()));
    });

    const files = ((req as any).files || []) as Express.Multer.File[];
    if (!files.length) {
      return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: t('images.noFilesUploaded', (req as any).lang) });
    }

    const newUrls = files.map((f) => `/uploads/images/${f.filename}`);
    const images = [...(document.images || []), ...newUrls];
    await MODEL.updateOne({ _id: id }, { images });

    return formatReturn(res, { success: true, message: t('images.uploadSuccess', (req as any).lang), data: { images } });
  } catch (err) {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: t('images.fileTooLarge', (req as any).lang) });
    }
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_COUNT') {
      return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: t('images.tooManyFiles', (req as any).lang) });
    }
    if (err instanceof Error && err.message === 'INVALID_FILE_TYPE') {
      return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: t('images.invalidFileType', (req as any).lang) });
    }
    handleError(err, next, (req as any).lang);
  }
};

export const createCrudController = (props: {
  schema: Schema;
  service: {
    handlerCreate: (item: Record<string, any>, lang?: string) => Promise<any>;
    handlerUpdate: (item: Record<string, any>, userID?: string, lang?: string) => Promise<any>;
  };
  booleanDefaultField?: string;
}) => {
  const { schema, service, booleanDefaultField } = props;

  const fnCreate = async (req: Request, res: Response, next: NextFunction) => {
    const { isValidated, value = {}, errors, message } = validateSchema({ schema, item: { ...req.body }, lang: (req as any).lang });
    if (!isValidated) return formatReturn(res, { success: false, message, errors });

    try {
      if (booleanDefaultField && !value[booleanDefaultField]) value[booleanDefaultField] = false;
      const _result = await service.handlerCreate(value, (req as any).lang);
      return formatReturn(res, { statusCode: StatusCodes.CREATED, ..._result });
    } catch (err) {
      handleError(err, next, (req as any).lang);
    }
  };

  const fnUpdate = async (req: Request, res: Response, next: NextFunction) => {
    const { isValidated, value = {}, errors, message } = validateSchema({ schema, item: { ...req.body }, lang: (req as any).lang });
    if (!isValidated) return formatReturn(res, { success: false, message, errors });

    try {
      if (booleanDefaultField && !value[booleanDefaultField]) value[booleanDefaultField] = false;
      const _result = await service.handlerUpdate(value, (req as any).user?._id, (req as any).lang);
      return formatReturn(res, { ..._result });
    } catch (err) {
      handleError(err, next, (req as any).lang);
    }
  };

  return { fnCreate, fnUpdate };
};

/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { handlerGet, handlerCreate, handlerUpdate } from './generalInformation.service';
import { schemaGeneralInformation, schemaGeneralInformationPatch } from './generalInformation.validate';
import { formatReturn, handleError, validateSchema } from '@/utils';
import { t } from '@/utils/i18n';

const VALIDATE_SCHEMA = schemaGeneralInformation;
const VALIDATE_SCHEMA_PATCH = schemaGeneralInformationPatch;

export const fnGet = async (req: Request, res: Response, next: NextFunction) => {
  const candidateId = req.body.candidateId || '';
  if (!candidateId)
    return formatReturn(res, { statusCode: StatusCodes.NOT_FOUND, data: null, message: t('common.notFoundData', req.lang) });
  try {
    const _resultRaw = await handlerGet(candidateId, req.lang);

    if (!_resultRaw.success) {
      return formatReturn(res, _resultRaw);
    }

    /**
     * `_resultRaw`'s inferred type isn't a true discriminated union
     * (neither branch's `success` is a literal type), so the
     * `!_resultRaw.success` guard above doesn't narrow away
     * `handlerGet`'s error-path shape (which has no `data` field at
     * all). Narrowing properly here instead of casting; a full fix
     * belongs to BaseService.ts's return shapes.
     */
    const rawData = 'data' in _resultRaw ? _resultRaw.data : undefined;
    const data = Array.isArray(rawData) ? (rawData.length ? rawData[0] : {}) : rawData;

    return formatReturn(res, {
      success: true,
      message: _resultRaw.message || '',
      data,
    });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

export const fnCreate = async (req: Request, res: Response, next: NextFunction) => {
  const { isValidated, value = {}, errors, message } = validateSchema({
    schema: VALIDATE_SCHEMA,
    item: { ...req.body },
    lang: req.lang,
  });
  if (!isValidated) return formatReturn(res, { success: false, message, errors });

  try {
    const _result = await handlerCreate(value, req.lang);
    return formatReturn(res, { statusCode: _result.success ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST, ..._result });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

export const fnUpdate = async (req: Request, res: Response, next: NextFunction) => {
  const { isValidated, value, errors, message } = validateSchema({
    schema: req.method === 'PUT' ? VALIDATE_SCHEMA : VALIDATE_SCHEMA_PATCH,
    item: { ...req.body },
    lang: req.lang,
  });
  if (!isValidated) return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message, errors });

  try {
    const _result = await handlerUpdate({ item: value, userID: req.user?._id, lang: req.lang });
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

export const fnUpdateFields = async (req: Request, res: Response, next: NextFunction) => {
  const { isValidated, value, errors, message } = validateSchema({
    schema: VALIDATE_SCHEMA_PATCH,
    item: { ...req.body },
    lang: req.lang,
  });
  if (!isValidated) return formatReturn(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message, errors });

  try {
    const _result = await handlerUpdate({ item: value, userID: req.user?._id, lang: req.lang });
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

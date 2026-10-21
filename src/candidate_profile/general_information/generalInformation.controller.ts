/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { handlerGet, handlerCreate, handlerUpdate } from './generalInformation.service';
import { schemaGeneralInformation, schemaGeneralInformationPatch } from './generalInformation.validate';
import { created, formatReturn, handleError, ok, validateSchema } from '@/utils';
import { t } from '@/utils/i18n';

const VALIDATE_SCHEMA = schemaGeneralInformation;
const VALIDATE_SCHEMA_PATCH = schemaGeneralInformationPatch;

export const fnGet = async (req: Request, res: Response, next: NextFunction) => {
  const candidateId = req.body.candidateId || '';
  if (!candidateId)
    return formatReturn(res, { statusCode: StatusCodes.NOT_FOUND, data: null, message: t('common.notFoundData', req.lang) });
  try {
    const { data: rawData, message } = await handlerGet(candidateId, req.lang);
    const data = Array.isArray(rawData) ? (rawData.length ? rawData[0] : {}) : rawData;

    return ok(res, data, message);
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
    return created(res, _result.data, _result.message);
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
    return ok(res, _result.data, _result.message);
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
    return ok(res, _result.data, _result.message);
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

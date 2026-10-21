/**
 * Utility functions for HTTP responses and error handling
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import type { BaseReturn } from '@/types/base.type.ts';
import { AppError, ErrorCode, ValidationError, BadRequestError, ConflictError, TokenExpiredError, InvalidTokenError } from '@/errors';
import { t, tErrorType, DEFAULT_LANG } from '@/utils/i18n';

/**
 * MongoDB's duplicate-key error (`E11000`) isn't one of Mongoose's own
 * exported error classes — it's the raw driver's `MongoServerError`
 * (from the `mongodb` package, a transitive dependency of `mongoose`, not
 * declared directly in `package.json`) — so it's duck-typed here instead
 * of importing a class from an undeclared dependency.
 */
const isDuplicateKeyError = (err: unknown): err is { code: 11000; keyValue?: Record<string, unknown> } =>
  typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000;

interface formatReturn extends BaseReturn {
  statusCode?: null | number;
}

/**
 * Derive a Mongoose `select` string from the keys of an update payload
 */
export const getSelectFields = (fields: Record<string, unknown>): string => Object.keys(fields).join(', ');

/**
 * Map any thrown value to an `AppError`: known third-party errors (body-parser,
 * jsonwebtoken, Mongoose, Mongo duplicate key) get their real status/code;
 * anything else becomes a non-operational 500 whose message
 * `errorsMiddleware` hides in production.
 */
export const toAppError = (err: unknown, lang: string | undefined = DEFAULT_LANG): AppError => {
  if (err instanceof AppError) return err;

  if (err instanceof mongoose.Error.CastError) {
    return new BadRequestError({
      message: t('errors.invalidIdFormat', lang),
      errors: err.message,
    });
  }

  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new ConflictError({ message: t('errors.duplicateKey', lang).replace('{{field}}', field) });
  }

  /**
   * Mongoose validation error — translate each field's error using the
   * same generic error-type + field-label approach as Joi (see
   * utils/valid.ts). Only `required` is currently used by any model's
   * schema; anything else falls back to Mongoose's own hardcoded message.
   */
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.entries(err.errors).map(([field, e]) => {
      if (e?.kind === 'required') {
        const labelKey = `fieldLabels.${field}`;
        const translatedLabel = t(labelKey, lang);
        const label = translatedLabel === labelKey ? field : translatedLabel;
        return (tErrorType('any.required', lang) ?? '{{label}}').replace('{{label}}', label);
      }
      return e.message;
    });
    return new ValidationError({ message: t('validation.hasErrors', lang), errors: details });
  }

  // body-parser and jsonwebtoken errors are recognized by their documented `type`/`name`.
  const { type, name } = (typeof err === 'object' && err !== null ? err : {}) as { type?: unknown; name?: unknown };
  if (type === 'entity.parse.failed')
    return new AppError({ message: t('errors.malformedJson', lang), errorCode: ErrorCode.MALFORMED_JSON });
  if (type === 'entity.too.large')
    return new AppError({ message: t('errors.payloadTooLarge', lang), errorCode: ErrorCode.PAYLOAD_TOO_LARGE });
  if (name === 'TokenExpiredError') return new TokenExpiredError(t('auth.tokenExpired', lang));
  if (name === 'JsonWebTokenError') return new InvalidTokenError(t('auth.invalidToken', lang));

  const unexpected = new AppError({
    message: (err instanceof Error && err.message) || t('errors.internalServerError', lang),
    isOperational: false,
  });
  // Keep the original stack so the log points at the real failure, not here.
  if (err instanceof Error && err.stack) unexpected.stack = err.stack;
  return unexpected;
};

/**
 * Pass error to global error handler via next()
 * Use this in catch blocks to forward errors to middleware
 */
export const handleError = ({
  err,
  next,
  lang = DEFAULT_LANG,
}: {
  err: unknown;
  next: NextFunction;
  lang?: string | undefined;
}): void => next(toAppError(err, lang));

export const formatResponse = (props: BaseReturn) => {
  const { type = '', success, message, errors = {}, data } = props;

  const getData = (() => {
    if (!success) return null;
    if (type === 'register') return null;
    if (type === 'login') {
      const { token = '', user = null } = data as { token: string; user: null | Record<string, string> };
      return { token, user };
    }
    return data;
  })();

  return {
    success,
    message,
    errors,
    data: getData,
  };
};

export const formatReturn = (res: Response, props: formatReturn) => {
  const {
    success = false,
    message = '',
    errors = null,
    data = null,
    statusCode = null,
  } = props;

  const _statusCode: number = (() => {
    if (statusCode) return statusCode;
    if (success) return StatusCodes['OK'];
    return StatusCodes['BAD_REQUEST'];
  })();

  return res.status(_statusCode).json(
    formatResponse({
      success,
      message,
      errors,
      data,
    }),
  );
};

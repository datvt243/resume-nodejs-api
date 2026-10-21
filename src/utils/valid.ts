/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { Schema, ValidationError, ValidationErrorItem } from 'joi';
import { _log } from '@/utils';
import { t, tErrorType, DEFAULT_LANG } from '@/utils/i18n';
import type { ErrorDetail } from '@/errors/AppError';

export const validateSchema = ({
  schema,
  item = {},
  lang = DEFAULT_LANG,
}: {
  schema: Schema;
  item: Partial<Record<string, unknown>>;
  // `| undefined` (`exactOptionalPropertyTypes`): callers pass `req.lang`,
  // itself `string | undefined` — a real "not resolved yet" state, not an
  // accidental omission.
  lang?: string | undefined;
}) => {
  const validationOptions = { abortEarly: false };
  if (!schema || typeof schema.validate !== 'function') {
    return { isValidated: false, message: t('validation.invalidSchema', lang) };
  }
  const { error, value } = schema.validate(item, validationOptions);
  return error
    ? { isValidated: false, message: t('validation.hasErrors', lang), errors: formatValidateError(error, lang) }
    : { isValidated: true, value, message: '' };
};

/**
 * Translate a single Joi error detail using a generic, per-error-type
 * template (`joiErrors.<type>`) + a translated field label
 * (`fieldLabels.<key>`) — this ignores whatever `.messages({...})` string
 * was set on the schema itself, since those are baked in at module-load
 * time in one hardcoded language and can't respond to a per-request
 * Accept-Language. Falls back to Joi's own rendered message if the error
 * type isn't in our template dictionary (better a real message in the
 * wrong language than nothing).
 */
const translateJoiDetail = (detail: ValidationErrorItem, lang: string): string => {
  const template = tErrorType(detail.type, lang);
  if (template === undefined) return detail.message;

  const fieldKey = detail?.context?.key ?? detail?.path?.[detail.path.length - 1];
  const labelKey = `fieldLabels.${String(fieldKey)}`;
  const translatedLabel = t(labelKey, lang);
  const label = translatedLabel === labelKey ? detail?.context?.label || fieldKey : translatedLabel;

  return template.replace('{{label}}', String(label)).replace('{{limit}}', String(detail?.context?.['limit'] ?? ''));
};

// One entry per failing field, keyed by its full dotted path so nested errors (`items.3.company`) don't collide.
export const formatValidateError = (error: ValidationError, lang: string = DEFAULT_LANG): ErrorDetail[] =>
  error.details.map((detail) => ({ field: detail.path.join('.'), message: translateJoiDetail(detail, lang) }));

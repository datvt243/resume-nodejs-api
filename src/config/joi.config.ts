/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import Joi from 'joi';
import { phoneRegex, slugRegex } from '@/config/regex.config';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

interface JoiProps {
  type?: string;
  min?: number;
  max?: number;
  required?: boolean;
  label?: string;
  pattern?: string;
  title?: string;
}
const objectIdValidator = Joi.extend((joi) => ({
  type: 'objectId',
  base: joi
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .required(),
  messages: {
    'objectId.base': '{{#label}} must be a valid ObjectId',
  },
}));

export const _id = objectIdValidator.objectId().required();

export const candidateId = Joi.string();

export const getObject = (fields: Joi.SchemaMap) => {
  return Joi.object(fields);
};

export const email = Joi.string()
  .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'vn'] } })
  .trim()
  .required();
import { passwordRegex } from '@/config/regex.config';

export const password = Joi.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).regex(passwordRegex).trim().strict().required();

export const firstName = Joi.string().min(1).max(15).trim().required();

export const lastName = Joi.string().min(1).max(35).trim().required();

export const fullName = Joi.string().min(3).max(50).trim().required();

export const company = Joi.string().min(0).max(100).trim().required();

export const position = Joi.string().min(0).max(100).trim().required();

export const phone = Joi.string().pattern(phoneRegex).trim().required();

/**
 * Free-text content stored per language (vi/en) — see
 * models/part/index.ts's localizedTextSchema for the Mongoose side.
 * Individual language values may be empty; only the object itself is
 * required (matches the previous plain-string fields' lenient min(0)
 * behavior, just with a language dimension added).
 */
const localizedTextShape = {
  vi: Joi.string().allow(''),
  en: Joi.string().allow(''),
};

export const introduction = Joi.object(localizedTextShape).required().label('Giới thiệu bản thân');

export const startDate = Joi.number().required();
export const endDate = Joi.number().greater(Joi.ref('startDate'));

/**
 * Vanity slug for the public profile — lowercased before the
 * pattern check runs so a caller sending mixed case isn't rejected (the
 * Mongoose model also lowercases on save, this just keeps validation
 * consistent with the stored value).
 */
export const slug = Joi.string().trim().lowercase().min(3).max(50).pattern(slugRegex);

export const _boolean = Joi.boolean();
export const _arrayString = Joi.array().items(Joi.string());

export const foreignLanguages = Joi.array().items({
  language: Joi.string(),
  level: Joi.string(),
});

export const description = Joi.object(localizedTextShape).required().label('Mô tả');

export const descriptionOptional = Joi.object(localizedTextShape).label('Mô tả');

export const _stringDefault = (props: JoiProps) => {
  const { min = 3, max = 100, title = 'Title' } = props;
  return Joi.string().min(min).max(max).trim().required().label(title);
};

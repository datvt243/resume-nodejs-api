/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
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
type JoiMessages = Record<string, any>;

// Định nghĩa một custom validator cho ObjectId của MongoDB
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

export const settingJoiValidate = (props: JoiProps) => {
  const { type = 'string', min = null, max = null, required = false, label = '', pattern = '' } = props;

  const _messages: JoiMessages = {};
  const _joi: any = Joi;

  if (type) {
    if (type === 'string') _joi.string();
    if (type === 'number') _joi.number();
    if (type === 'boolean') _joi.boolean();
    _messages[`${type}.empty`] = 'Họ tên không được trống';
  }

  if (pattern) {
    _joi.pattern(pattern);
  }

  if (min !== null) {
    _joi.min(min);
    _messages[`string.min`] = 'Field phải có ít nhất {#limit} ký tự';
  }
  if (max !== null) {
    _joi.max(max);
    _messages[`string.max`] = 'Field không được vượt quá {#limit} ký tự';
  }

  if (required) {
    _joi.required();
    _messages[`any.required`] = `{#label} là bắt buộc`;
  }

  _joi.trim().strict();

  if (label) {
    _joi.label(label);
  }

  _joi.messages(_messages);

  return _joi;
};

export const _id = objectIdValidator.objectId().required();

export const candidateId = Joi.string();

export const getObject = (fields: Record<string, any>) => {
  return Joi.object(fields);
};

export const email = Joi.string()
  .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'vn'] } })
  .trim()
  .strict()
  .required()
  .messages({
    'any.required': 'Email là bắt buộc',
    'string.empty': 'Email không được rỗng',
    'string.email': 'Email không đúng định dạng',
  });
import { passwordRegex } from '@/config/regex.config';

export const password = Joi.string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_MAX_LENGTH)
  .regex(passwordRegex)
  .trim()
  .strict()
  .required()
  .messages({
    'any.required': 'Password là bắt buộc',
    'string.empty': 'Password không được rỗng',
    'string.min': 'Password phải có ít nhất 12 ký tự',
    'string.max': 'Password không được vượt quá 128 ký tự',
    'string.pattern.base': 'Password phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  });

export const firstName = Joi.string().min(1).max(15).trim().strict().required().messages({
  'any.required': 'Họ là bắt buộc',
  'string.min': 'Họ có ít nhất {#limit} ký tự',
  'string.max': 'Họ có ít nhất {#limit} ký tự',
  'string.empty': 'Họ không được trống',
});

export const lastName = Joi.string().min(3).max(35).trim().strict().required().messages({
  'any.required': 'Tên là bắt buộc',
  'string.min': 'Tên có ít nhất {#limit} ký tự',
  'string.max': 'Tên có ít nhất {#limit} ký tự',
  'string.empty': 'Tên không được trống',
});

export const fullName = Joi.string().min(3).max(50).trim().strict().required().messages({
  'any.required': 'Họ tên là bắt buộc',
  'string.min': 'Họ tên có ít nhất {#limit} ký tự',
  'string.max': 'Họ tên có ít nhất {#limit} ký tự',
  'string.empty': 'Họ tên không được trống',
});

export const company = Joi.string().min(0).max(100).trim().strict().required().messages({
  'any.required': 'Tên công ty là bắt buộc',
  'string.min': 'Tên công ty có ít nhất {#limit} ký tự',
  'string.max': 'Tên công ty có ít nhất {#limit} ký tự',
  'string.empty': 'Tên công ty tên không được trống',
});

export const position = Joi.string().min(0).max(100).trim().strict().required().messages({
  'any.required': 'Vị trí là bắt buộc',
  'string.min': 'Vị trí ty có ít nhất {#limit} ký tự',
  'string.max': 'Vị trí ty có ít nhất {#limit} ký tự',
  'string.empty': 'Vị trí ty tên không được trống',
});

export const phone = Joi.string().pattern(phoneRegex).trim().strict().required().messages({
  'any.required': 'Số điện thoại là bắt buộc',
  'string.pattern.base': 'Số điện thoại {#value} không hợp lệ. Số điện thoại phải có 10-11 chữ số',
  'string.empty': 'Số điện thoại không được để trống',
});

// Free-text content stored per language (vi/en) — see
// models/part/index.ts's localizedTextSchema for the Mongoose side.
// Individual language values may be empty; only the object itself is
// required (matches the previous plain-string fields' lenient min(0)
// behavior, just with a language dimension added).
const localizedTextShape = {
  vi: Joi.string().allow(''),
  en: Joi.string().allow(''),
};

export const introduction = Joi.object(localizedTextShape).required().label('Giới thiệu bản thân').messages({
  'any.required': '{#label} không được rỗng',
  'object.base': '{#label} phải là object dạng vi/en',
});

export const startDate = Joi.number().required().messages({
  'any.required': 'Ngày bắt đầu là bắt buộc',
  'number.empty': 'Ngày bắt đầu không được trống',
});
export const endDate = Joi.number().greater(Joi.ref('startDate')).messages({
  'number.greater': 'Ngày kết thúc phải lớn hơn ngày bắt đầu',
});

// Vanity slug for the public profile (issue #120) — lowercased before the
// pattern check runs so a caller sending mixed case isn't rejected (the
// Mongoose model also lowercases on save, this just keeps validation
// consistent with the stored value).
export const slug = Joi.string().trim().lowercase().min(3).max(50).pattern(slugRegex).messages({
  'string.min': 'Slug phải có ít nhất {#limit} ký tự',
  'string.max': 'Slug không được vượt quá {#limit} ký tự',
  'string.pattern.base': 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang',
});

export const _boolean = Joi.boolean();
export const _arrayString = Joi.array().items(Joi.string());

export const foreignLanguages = Joi.array().items({
  language: Joi.string(),
  level: Joi.string(),
});

export const description = Joi.object(localizedTextShape).required().label('Mô tả').messages({
  'any.required': `{#label} là bắt buộc`,
  'object.base': `{#label} phải là object dạng vi/en`,
});

export const descriptionOptional = Joi.object(localizedTextShape).label('Mô tả').messages({
  'object.base': `{#label} phải là object dạng vi/en`,
});

export const _stringDefault = (props: JoiProps) => {
  const { min = 3, max = 100, title = 'Title' } = props;
  return Joi.string().min(min).max(max).trim().strict().required().label(title).messages({
    'any.required': `{#label} là bắt buộc`,
    'string.min': `{#label} có ít nhất {#limit} ký tự`,
    'string.max': `{#label} có ít nhất {#limit} ký tự`,
    'string.empty': `{#label} không được trống`,
  });
};

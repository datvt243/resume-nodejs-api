/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi from 'joi';
import { email, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '@/config/joi.config';
import { passwordRegex } from '@/config/regex.config';

/**
 * Password strength validation
 * - At least PASSWORD_MIN_LENGTH characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const password = Joi.string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_MAX_LENGTH)
  .regex(passwordRegex)
  .trim()
  .strict()
  .label('Password')
  .required()
  .messages({
    'string.empty': 'Mật khẩu không được để trống',
    'string.min': 'Mật khẩu phải có ít nhất {{#limit}} ký tự',
    'string.max': 'Mật khẩu không được vượt quá {{#limit}} ký tự',
    'string.pattern.base': 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  });

export const schemaAuthRegister = Joi.object({
  email,
  password,
  repassword: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Password không khớp',
  }),
}).with('password', 'repassword');

export const schemaAuthLogin = Joi.object({
  email,
  password,
});

export const schemaForgotPassword = Joi.object({
  email,
});

export const schemaResetPassword = Joi.object({
  token: Joi.string().trim().strict().required().messages({
    'any.required': 'Token không được để trống',
    'string.empty': 'Token không được để trống',
  }),
  password,
  repassword: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Password không khớp',
  }),
}).with('password', 'repassword');

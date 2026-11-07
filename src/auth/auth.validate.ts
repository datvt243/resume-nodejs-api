/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import Joi from 'joi';
import { email, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '@/config/joi.config';
import { passwordRegex } from '@/config/regex.config';

export const password = Joi.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).regex(passwordRegex).trim().strict().label('Password').required();

export const schemaAuthRegister = Joi.object({
  email,
  password,
  repassword: Joi.any().valid(Joi.ref('password')).required(),
}).with('password', 'repassword');

// Strength rules apply on register/reset only: an account created under older, looser rules must still be able to log in.
export const schemaAuthLogin = Joi.object({
  email,
  password: Joi.string().max(PASSWORD_MAX_LENGTH).label('Password').required(),
});

export const schemaForgotPassword = Joi.object({
  email,
});

export const schemaResetPassword = Joi.object({
  token: Joi.string().trim().strict().required(),
  password,
  repassword: Joi.any().valid(Joi.ref('password')).required(),
}).with('password', 'repassword');

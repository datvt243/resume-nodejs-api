/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi from 'joi';

import { getObject, _id, firstName, lastName, phone, candidateId, introduction, _boolean } from '@/config/joi.config';

export const schemaCandidatePatch = getObject({
  _id: _id,
  candidateId,
  isPublic: _boolean,
  socialMedia: Joi.object({
    github: Joi.string(),
    linkedin: Joi.string(),
    website: Joi.string(),
  }),
});

export const schemaCandidate = getObject({
  _id: _id,
  firstName,
  lastName,
  phone,
  marital: Joi.boolean().required().messages({
    'any.required': 'Tình trạng hôn nhân không được rỗng',
  }),
  gender: Joi.boolean().required().messages({
    'any.required': 'Giới tính không được rỗng',
  }),
  birthday: Joi.number().min(0).required().messages({
    'any.required': 'Ngày sinh không được rỗng',
  }),
  address: Joi.string().min(0).max(255).required().messages({
    'any.required': 'Địa chỉ không được rỗng',
  }),
  introduction,
  socialMedia: Joi.object({
    github: Joi.string(),
    linkedin: Joi.string(),
    website: Joi.string(),
  }),
  candidateId,
});

// personal information: thông tin cá nhân
// general information: thông tin chung

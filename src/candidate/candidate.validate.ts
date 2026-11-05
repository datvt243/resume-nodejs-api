/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import Joi from 'joi';

import { getObject, _id, firstName, lastName, phone, candidateId, introduction, _boolean, slug } from '@/config/joi.config';

export const schemaCandidatePatch = getObject({
  _id: _id,
  candidateId,
  isPublic: _boolean,
  slug,
  // sanitised again when used as a filename; rejecting these up front keeps the stored value honest
  cvFileName: Joi.string().trim().max(100).pattern(/^[^\\/"\r\n]*$/).allow('').label('Tên file CV'),
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
  marital: Joi.boolean().required(),
  gender: Joi.boolean().required(),
  birthday: Joi.number().min(0).required(),
  address: Joi.string().min(0).max(255).required(),
  introduction,
  socialMedia: Joi.object({
    github: Joi.string(),
    linkedin: Joi.string(),
    website: Joi.string(),
  }),
  candidateId,
});

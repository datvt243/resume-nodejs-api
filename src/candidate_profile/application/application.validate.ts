/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import Joi from 'joi';
import { _id, company, position, candidateId } from '@/config/joi.config';
import { APPLICATION_STATUSES } from '@/models/application.model';

export const schemaApplication = Joi.object({
  _id,
  company,
  position,
  appliedDate: Joi.number().required(),
  status: Joi.string()
    .valid(...APPLICATION_STATUSES)
    .required(),
  note: Joi.string().allow('').max(1000).trim(),
  jobLink: Joi.string().allow('').max(500).trim(),
  // null or '' unlinks; ownership is checked in application.service.ts.
  profileId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, ''),
  candidateId,
});

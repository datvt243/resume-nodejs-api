/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import Joi from 'joi';
import { _id, _boolean, candidateId, startDate, endDate, descriptionOptional } from '@/config/joi.config';

export const schemaEducation = Joi.object({
  _id,
  school: Joi.string().min(1).max(255).trim().required(),
  major: Joi.string().min(3).max(255).trim().required(),
  startDate,
  endDate,
  isCurrent: _boolean,
  description: descriptionOptional,
  candidateId,
});

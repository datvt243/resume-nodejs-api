/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import Joi from 'joi';
import { _id, _boolean, candidateId, startDate, endDate, descriptionOptional, localizedName } from '@/config/joi.config';

export const schemaEducation = Joi.object({
  _id,
  school: localizedName(1),
  major: localizedName(1),
  startDate,
  endDate,
  isCurrent: _boolean,
  description: descriptionOptional,
  // only PUT /reorder sets it; stripped so an entry read from GET can be sent back unchanged
  order: Joi.any().strip(),
  candidateId,
});

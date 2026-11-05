/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import Joi from 'joi';
import { _id, candidateId, startDate, endDate, description, _stringDefault, _arrayString, _boolean } from '@/config/joi.config';

export const schemaProject = Joi.object({
  _id,
  name: _stringDefault({ min: 0, max: 50, title: 'Project' }),
  description,
  position: _stringDefault({ min: 0, max: 100, title: 'Vị trí' }),
  technology: _arrayString,
  companyId: Joi.string().trim().strict(),
  images: _arrayString,
  link: Joi.string().trim().max(100).allow('').label('Liên kết'),
  isWorking: _boolean,
  startDate,
  endDate,
  candidateId,
});

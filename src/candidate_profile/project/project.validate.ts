/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import Joi from 'joi';
import { PROJECT_TYPES } from '@/models/project.model';
import { _id, candidateId, startDate, endDate, description, _stringDefault, _arrayString, _boolean } from '@/config/joi.config';

export const schemaProject = Joi.object({
  _id,
  name: _stringDefault({ min: 0, max: 50, title: 'Project' }),
  description,
  position: _stringDefault({ min: 0, max: 100, title: 'Vị trí' }),
  technology: _arrayString,
  type: Joi.string()
    .valid(...PROJECT_TYPES)
    .default('personal'),
  // ownership is checked in project.service.ts
  experienceId: Joi.when('type', {
    is: 'company',
    then: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    otherwise: Joi.valid(null, ''),
  }),
  images: _arrayString,
  link: Joi.string().trim().max(100).allow('').label('Liên kết'),
  isWorking: _boolean,
  startDate,
  endDate,
  // only PUT /reorder sets it; stripped so an entry read from GET can be sent back unchanged
  order: Joi.any().strip(),
  candidateId,
});

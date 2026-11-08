/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import Joi from 'joi';
import { _id, _arrayString, candidateId, _stringDefault, description } from '@/config/joi.config';

export const schemaAward = Joi.object({
  _id,
  name: _stringDefault({ min: 0, max: 50, title: 'Chứng chỉ' }),
  organization: _stringDefault({ min: 0, max: 50, title: 'Tổ chức' }),
  issueDate: Joi.number().required(),
  link: Joi.string().trim().max(100).uri({ scheme: ['http', 'https'] }).allow('').label('Liên kết'),
  images: _arrayString,
  description: description,
  candidateId,
});

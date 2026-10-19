/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import Joi from 'joi';
import {
  _id,
  _boolean,
  _arrayString,
  company,
  position,
  candidateId,
  startDate,
  endDate,
  description,
} from '@/config/joi.config';
import { CAREER_BREAK_TYPES } from '@/models/experience.model';

// A career break has no employer: company/position become optional, a known type is required instead.
const isCareerBreak = { is: true, then: Joi.string().allow('').optional() };

export const schemaExperience = Joi.object({
  _id,
  company: company.when('isCareerBreak', isCareerBreak),
  position: position.when('isCareerBreak', isCareerBreak),
  startDate,
  endDate,
  isCurrent: _boolean,
  isCareerBreak: _boolean,
  careerBreakType: Joi.string()
    .valid('', ...CAREER_BREAK_TYPES)
    .when('isCareerBreak', { is: true, then: Joi.invalid('').required() }),
  description: description,
  candidateId,
  skills: _arrayString,
});

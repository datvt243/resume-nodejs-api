/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import Joi from 'joi';

import {
  getObject,
  _id,
  position,
  candidateId,
  foreignLanguages,
  _arrayString,
  _stringDefault,
  description,
  _boolean,
} from '@/config/joi.config';

const _sub = {
  candidateId,
  openToWork: _boolean,
  professionalSkillsGroup: _arrayString,
  professionalSkills: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      exp: Joi.number().required(),
      group: Joi.string(),
    }),
  ),
  personalSkills: Joi.array().items({
    name: Joi.string(),
  }),
  mainSkills: Joi.array()
    .items({
      name: Joi.string(),
    })
    .max(5),
  foreignLanguages: foreignLanguages,
  socialMedia: Joi.object({
    github: Joi.string(),
    linkedin: Joi.string(),
    website: Joi.string(),
  }),
};

export const schemaGeneralInformationPatch = getObject({
  _id: _id,
  ..._sub,
});

export const schemaGeneralInformation = getObject({
  _id: _id,
  positionDesired: position,
  career: description.label('Nghề nghiệp'),
  levelCurrent: _stringDefault({ min: 3, max: 100, title: 'Cấp bậc hiện tại' }),
  levelDesired: _stringDefault({ min: 3, max: 100, title: 'Cấp bậc mong muốn' }),
  salaryDesired: Joi.number().min(0).required().label('Lương mong muốn'),
  education: _stringDefault({ min: 3, max: 100, title: 'Học vấn' }),
  workLocation: _stringDefault({ min: 3, max: 100, title: 'Địa điểm làm việc' }),
  workForm: _stringDefault({ min: 0, max: 100, title: 'Hình thức làm việc' }),
  careerGoal: description.label('Mục tiêu nghề nghiệp'),
  yearsOfExperience: Joi.number().min(0).required(),
  ..._sub,
});

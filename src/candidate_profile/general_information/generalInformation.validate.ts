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
  familiarSkills: Joi.array().items({
    name: Joi.string(),
  }),
  foreignLanguages: foreignLanguages,
  socialMedia: Joi.object({
    github: Joi.string(),
    linkedin: Joi.string(),
    website: Joi.string(),
  }),
};

const salary = Joi.number().min(0).allow(null);

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
  salaryDesiredFrom: salary.label('Lương mong muốn từ'),
  salaryDesiredTo: salary
    .when('salaryDesiredFrom', { is: Joi.number().required(), then: Joi.number().min(Joi.ref('salaryDesiredFrom')) })
    .label('Lương mong muốn đến'),
  // shortcut: resume-vuejs-website still sends one `salaryDesired`, read as From = To; drop once it sends the range
  salaryDesired: salary.label('Lương mong muốn'),
  education: _stringDefault({ min: 3, max: 100, title: 'Học vấn' }),
  workLocation: _stringDefault({ min: 3, max: 100, title: 'Địa điểm làm việc' }),
  workForm: _stringDefault({ min: 0, max: 100, title: 'Hình thức làm việc' }),
  careerGoal: description.label('Mục tiêu nghề nghiệp'),
  yearsOfExperience: Joi.number().min(0).required(),
  ..._sub,
}).custom((value: Record<string, unknown>) => {
  const { salaryDesired, ...rest } = value;
  if (salaryDesired === undefined || rest['salaryDesiredFrom'] !== undefined || rest['salaryDesiredTo'] !== undefined) return rest;
  return { ...rest, salaryDesiredFrom: salaryDesired, salaryDesiredTo: salaryDesired };
});

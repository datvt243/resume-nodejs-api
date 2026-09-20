/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi from 'joi';
import { _id, company, position, candidateId } from '@/config/joi.config';
import { APPLICATION_STATUSES } from '@/models/application.model';

export const schemaApplication = Joi.object({
  _id,
  company,
  position,
  appliedDate: Joi.number().required().messages({
    'any.required': 'Ngày nộp đơn là bắt buộc',
    'number.empty': 'Ngày nộp đơn không được trống',
  }),
  status: Joi.string()
    .valid(...APPLICATION_STATUSES)
    .required()
    .messages({
      'any.required': 'Trạng thái là bắt buộc',
      'any.only': 'Trạng thái không hợp lệ',
    }),
  note: Joi.string().allow('').max(1000).trim().messages({
    'string.max': 'Ghi chú có nhiều nhất 1000 ký tự',
  }),
  jobLink: Joi.string().allow('').max(500).trim().messages({
    'string.max': 'Liên kết có nhiều nhất 500 ký tự',
  }),
  candidateId,
});

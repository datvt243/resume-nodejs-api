/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi from 'joi';
import { _id, candidateId } from '@/config/joi.config';

// Ids reference existing CV-section documents by _id — plain Mongo
// ObjectId hex strings, not free-text (no data duplication, matches
// issue #133's "chọn lọc một tập con... từ cùng một nguồn dữ liệu gốc").
const objectIdArray = Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).default([]);

export const schemaProfile = Joi.object({
  _id,
  name: Joi.string().min(1).max(100).trim().strict().required().messages({
    'any.required': 'Tên profile là bắt buộc',
    'string.empty': 'Tên profile không được trống',
    'string.max': 'Tên profile có nhiều nhất {#limit} ký tự',
  }),
  educationIds: objectIdArray,
  experienceIds: objectIdArray,
  projectIds: objectIdArray,
  certificateIds: objectIdArray,
  awardIds: objectIdArray,
  referenceIds: objectIdArray,
  candidateId,
});

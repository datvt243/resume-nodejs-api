/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import Joi from 'joi';
import { _id, candidateId } from '@/config/joi.config';

// Ids reference existing CV-section documents by _id — plain Mongo
// ObjectId hex strings, not free-text (no data duplication; a profile
// selects a subset from the same underlying section data).
const objectIdArray = Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).default([]);

export const schemaProfile = Joi.object({
  _id,
  name: Joi.string().min(1).max(100).trim().required(),
  educationIds: objectIdArray,
  experienceIds: objectIdArray,
  projectIds: objectIdArray,
  certificateIds: objectIdArray,
  awardIds: objectIdArray,
  referenceIds: objectIdArray,
  candidateId,
});

/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: One document per profile visit (analytics for the public
 * GET /api/me/:email profile) — candidateId + ip + location, timestamped.
 */

import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const schema = new Schema(
  {
    // No explicit `_id` field here (unlike award.model.ts and other
    // CV-section models) — a bare `_id: ObjectId` redeclaration overrides
    // Mongoose's implicit auto-generating `_id` path (`auto: true`),
    // which those other models only get away with because they're always
    // created through `baseCreateDocument` (services/index.ts), which
    // explicitly passes `_id: null` as a workaround. `Visit` is created
    // directly via `Model.create()` (candidate_me/index.ts), bypassing
    // that helper — leaving `_id` out entirely lets Mongoose's default
    // auto-generation do its job, avoiding a real "document must have an
    // _id before saving" crash (found live in production, see node
    // fix-visit-model-missing-id).
    candidateId: { type: ObjectId, required: true, ref: 'candidate', index: true },
    ip: { type: String, default: '' },
    location: { type: String, default: '' },
  },
  { timestamps: true },
);

const Visit = mongoose.model('visit', schema);

export default Visit;

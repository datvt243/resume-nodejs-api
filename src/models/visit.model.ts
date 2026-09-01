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
    _id: ObjectId,
    candidateId: { type: ObjectId, required: true, ref: 'candidate', index: true },
    ip: { type: String, default: '' },
    location: { type: String, default: '' },
  },
  { timestamps: true },
);

const Visit = mongoose.model('visit', schema);

export default Visit;

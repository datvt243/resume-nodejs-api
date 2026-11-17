/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

export const APPLICATION_STATUSES = ['applied', 'interview', 'offer', 'accepted', 'rejected'];

const schema = new Schema(
  {
    _id: ObjectId,
    company: { type: String, default: '', required: [false, 'Vui lòng nhập tên công ty'] },
    position: { type: String, default: '', required: [false, 'Vui lòng nhập vị trí ứng tuyển'] },
    appliedDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày nộp đơn'] },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'applied' },
    note: { type: String, default: '' },
    jobLink: { type: String, default: '' },
    // CV profile sent with this application; kept (not nulled) if that profile is soft-deleted later.
    profileId: { type: ObjectId, default: null, ref: 'profile' },
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate' },
    // soft-delete — null nghĩa là chưa xoá
    deletedAt: { type: Number, default: null },
  },
  { timestamps: true },
);

// Every query filters on candidateId + soft-delete; the prefix also serves candidateId-only lookups.
schema.index({ candidateId: 1, deletedAt: 1 });

const Application = mongoose.model('application', schema);

export default Application;

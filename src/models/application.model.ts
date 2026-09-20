/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

export const APPLICATION_STATUSES = ['applied', 'interview', 'offer', 'rejected'];

const schema = new Schema(
  {
    _id: ObjectId,
    company: { type: String, default: '', required: [false, 'Vui lòng nhập tên công ty'] },
    position: { type: String, default: '', required: [false, 'Vui lòng nhập vị trí ứng tuyển'] },
    appliedDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày nộp đơn'] },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'applied' },
    note: { type: String, default: '' },
    jobLink: { type: String, default: '' },
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate', index: true },
    /* soft-delete (issue #121) — null nghĩa là chưa xoá */
    deletedAt: { type: Number, default: null },
  },
  { timestamps: true },
);

const Application = mongoose.model('application', schema);

export default Application;

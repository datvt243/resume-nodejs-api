/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const schema = new Schema(
  {
    fullName: { type: String, default: '', required: [false, 'Vui lòng nhập Họ tên'] },
    phone: { type: String, default: '', required: [false, 'Vui lòng nhập Số điện thoại'] },
    company: { type: String, default: '', required: [false, 'Vui lòng nhập Công ty'] },
    position: { type: String, default: '', required: [false, 'Vui lòng nhập Vị trí công việc'] },
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate', index: true },
    /* soft-delete (issue #121) — null nghĩa là chưa xoá */
    deletedAt: { type: Number, default: null },
  },
  { timestamps: true },
);

const Reference = mongoose.model('reference', schema);

export default Reference;

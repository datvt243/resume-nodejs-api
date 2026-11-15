/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
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
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate' },
    // soft-delete — null nghĩa là chưa xoá
    deletedAt: { type: Number, default: null },
  },
  { timestamps: true },
);

// Every query filters on candidateId + soft-delete; the prefix also serves candidateId-only lookups.
schema.index({ candidateId: 1, deletedAt: 1 });

const Reference = mongoose.model('reference', schema);

export default Reference;

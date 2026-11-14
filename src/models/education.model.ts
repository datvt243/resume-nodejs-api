/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import mongoose from 'mongoose';
import { localizedTextSchema } from '@/models/part';
const Schema = mongoose.Schema;

const ObjectId = mongoose.Schema.Types.ObjectId;
const schema = new Schema(
  {
    _id: ObjectId,
    school: { type: localizedTextSchema, default: () => ({}) },
    major: { type: localizedTextSchema, default: () => ({}) },
    startDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày bắt đầu'] },
    endDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày kết thúc'] },
    description: { type: localizedTextSchema, default: () => ({}) },
    isCurrent: { type: Boolean, default: false },
    // manual CV display position, set only by PUT /education/reorder; absent until the first reorder
    order: { type: Number },
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate', index: true },
    // soft-delete — null nghĩa là chưa xoá
    deletedAt: { type: Number, default: null },
  },
  { timestamps: true },
);

const Education = mongoose.model('education', schema);

export default Education;

/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import mongoose from 'mongoose';
import { localizedTextSchema } from '@/models/part';
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

export const PROJECT_TYPES = ['company', 'personal'];

const schema = new Schema(
  {
    _id: ObjectId,
    name: { type: String, default: '', required: [false, 'Vui lòng nhập tên dự án'] },
    description: { type: localizedTextSchema, default: () => ({}) },
    position: { type: String, default: '', required: [false, 'Vui lòng nhập vị trí công việc'] },
    technology: { type: Array, of: String },
    // default also covers legacy projects stored before `type` existed
    type: { type: String, enum: PROJECT_TYPES, default: 'personal' },
    experienceId: { type: ObjectId, default: null, ref: 'experience' },
    images: { type: Array, of: String },
    link: { type: String, default: '', required: [false, 'Vui lòng nhập liên kết'] },
    isWorking: { type: Boolean, default: false },
    startDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày bắt đầu'] },
    endDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày kết thúc'] },
    // manual CV display position, set only by PUT /project/reorder; absent until the first reorder
    order: { type: Number },
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate', index: true },
    // soft-delete — null nghĩa là chưa xoá
    deletedAt: { type: Number, default: null },
  },
  { timestamps: true },
);

const Project = mongoose.model('project', schema);

export default Project;

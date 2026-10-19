/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import mongoose from 'mongoose';
import { localizedTextSchema } from '@/models/part';
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

// LinkedIn's career-break types; labels live in locales `cv.careerBreakTypes.*`
export const CAREER_BREAK_TYPES = [
  'careerTransition',
  'caregiving',
  'fullTimeParenting',
  'gapYear',
  'healthAndWellbeing',
  'layoff',
  'personalGoal',
  'professionalDevelopment',
  'relocation',
  'retirement',
  'travel',
  'voluntaryWork',
];

const schema = new Schema(
  {
    company: { type: String, default: '', required: [false, 'Vui lòng nhập Tên công ty'] },
    position: { type: String, default: '', required: [false, 'Vui lòng nhập vị trí công việc'] },
    startDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày bắt đầu'] },
    endDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày kết thúc'] },
    description: { type: localizedTextSchema, default: () => ({}) },
    isCurrent: { type: Boolean, default: false },
    isCareerBreak: { type: Boolean, default: false },
    careerBreakType: { type: String, enum: ['', ...CAREER_BREAK_TYPES], default: '' },
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate', index: true },
    skills: { type: Array, of: String },
    // soft-delete — null nghĩa là chưa xoá
    deletedAt: { type: Number, default: null },
  },
  { timestamps: true },
);

const Experience = mongoose.model('experience', schema);

export default Experience;

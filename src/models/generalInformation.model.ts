/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

import { foreignLanguageSchema, professionalSkillsSchema, personalSkills, localizedTextSchema } from '@/models/part';

const schema = new Schema(
  {
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate', unique: true },
    positionDesired: { type: String, default: '', required: [false, 'Vui lòng nhập vị trí mong muốn'] },
    career: { type: localizedTextSchema, default: () => ({}) },
    levelCurrent: { type: String, default: '', required: [false, 'Vui lòng nhập cấp bậc hiện tại'] },
    levelDesired: { type: String, default: '', required: [false, 'Vui lòng nhập cấp bậc mong muốn'] },
    salaryDesiredFrom: { type: Number, default: null },
    salaryDesiredTo: { type: Number, default: null },
    education: { type: String, default: '', required: [false, 'Vui lòng học vấn'] },
    yearsOfExperience: { type: Number, default: 0, required: [false, 'Vui lòng nhập số năm kinh nghiệm'] },
    workLocation: { type: String, default: '', required: [false, 'Vui lòng nhập địa điểm làm việc'] },
    workForm: { type: String, default: '', required: [false, 'Vui lòng nhập hình thức làm việc'] },
    openToWork: { type: Boolean, default: false, required: false },
    careerGoal: { type: localizedTextSchema, default: () => ({}) },
    personalSkills: { type: [personalSkills], default: [] },
    mainSkills: { type: [personalSkills], default: [] },
    familiarSkills: { type: [personalSkills], default: [] },
    professionalSkills: { type: [professionalSkillsSchema], default: [] },
    professionalSkillsGroup: { type: Array, of: String, default: [], required: [false, 'Vui lòng nhập nhóm'] },
    foreignLanguages: {
      type: [foreignLanguageSchema],
      default: [],
      required: [false, 'Vui lòng nhập ngoại ngữ'],
    },
    // soft-delete — null nghĩa là chưa xoá
    deletedAt: { type: Number, default: null },
  },
  { timestamps: true },
);

// A document saved before the range existed only has `salaryDesired`; read it as an exact range instead of migrating.
schema.pre('init', function (raw: unknown) {
  if (typeof raw !== 'object' || raw === null) return;
  const doc = raw as Record<string, unknown>;
  if (doc['salaryDesired'] == null || doc['salaryDesiredFrom'] !== undefined || doc['salaryDesiredTo'] !== undefined) return;
  doc['salaryDesiredFrom'] = doc['salaryDesired'];
  doc['salaryDesiredTo'] = doc['salaryDesired'];
});

const generalInformation = mongoose.model('general-information', schema);

export default generalInformation;

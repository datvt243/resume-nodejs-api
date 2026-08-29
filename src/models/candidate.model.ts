/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import mongoose from 'mongoose';
import { localizedTextSchema } from '@/models/part';
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const schema = new Schema(
  {
    /* _id: ObjectId, */
    _id: { type: ObjectId, required: false },
    email: {
      type: String,
      default: '',
      required: [false, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không đúng định dạng'],
      unique: true,
      sparse: true,
      index: true,
    },
    password: { type: String, default: '', required: [false, 'Password is required'] },

    /* họ và tên */
    firstName: { type: String, default: '', required: false },
    lastName: { type: String, default: '', required: false },

    gender: { type: Boolean, default: 0, required: false },
    marital: { type: Boolean, default: 0, required: false },
    birthday: { type: Number, default: 0, min: 0, required: false },
    address: { type: String, default: '' },

    phone: { type: String, default: '', required: false },
    introduction: { type: localizedTextSchema, default: () => ({}) },
    socialMedia: {
      github: { type: String, required: false },
      linkedin: { type: String, required: false },
      website: { type: String, required: false },
    },
    /* CV file đã upload (khác với PDF export live-generate ở /download-pdf) */
    cvFile: {
      originalName: { type: String, required: false },
      uploadedAt: { type: Number, required: false },
    },
    /* hiển thị public tại GET /api/me/:email hay không, default true để giữ nguyên hành vi cũ */
    isPublic: { type: Boolean, default: true, required: false },
    /* đã xác thực email chưa (issue #71) — không chặn login, chỉ để frontend tự quyết định hiển thị */
    emailVerified: { type: Boolean, default: false, required: false },
  },
  { timestamps: true },
);

const Candidate = mongoose.model('candidate', schema);

export default Candidate;

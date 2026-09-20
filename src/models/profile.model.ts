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
    _id: ObjectId,
    name: { type: String, required: [true, 'Vui lòng nhập tên profile'] },
    educationIds: { type: [ObjectId], default: [], ref: 'education' },
    experienceIds: { type: [ObjectId], default: [], ref: 'experience' },
    projectIds: { type: [ObjectId], default: [], ref: 'project' },
    certificateIds: { type: [ObjectId], default: [], ref: 'certificate' },
    awardIds: { type: [ObjectId], default: [], ref: 'award' },
    referenceIds: { type: [ObjectId], default: [], ref: 'reference' },
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate', index: true },
    /* soft-delete (issue #121 pattern) — null nghĩa là chưa xoá */
    deletedAt: { type: Number, default: null },
  },
  { timestamps: true },
);

const Profile = mongoose.model('profile', schema);

export default Profile;

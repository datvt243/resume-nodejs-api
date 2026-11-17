/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
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
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate' },
    // soft-delete — null nghĩa là chưa xoá
    deletedAt: { type: Number, default: null },
  },
  { timestamps: true },
);

// Every query filters on candidateId + soft-delete; the prefix also serves candidateId-only lookups.
schema.index({ candidateId: 1, deletedAt: 1 });

const Profile = mongoose.model('profile', schema);

export default Profile;

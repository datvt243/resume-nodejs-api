/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import ProfileModel from '@/models/profile.model';
import * as MODELS from '@/models';
import { createCrudService } from '@/candidate_profile/BaseService';

export const { handlerGet, handlerCreate, handlerUpdate, handlerDelete } = createCrudService({
  model: ProfileModel,
  name: 'profile',
});

// Default profile, no data loss (issue #133): a candidate with zero rows in
// `profiles` (brand new, or never created a custom one) gets a "Tổng hợp"
// (All) profile synthesized on first read, containing every existing
// section item's _id — so GET /api/me/:value's ?profile= filter always has
// something to resolve to, and no existing candidate's data disappears.
export const ensureDefaultProfile = async (candidateId: string) => {
  const existing = await ProfileModel.countDocuments({ candidateId, deletedAt: null });
  if (existing > 0) return;

  const idsOf = async (model: any) => (await model.find({ candidateId, deletedAt: null }, '_id').exec()).map((doc: any) => doc._id);

  const [educationIds, experienceIds, projectIds, certificateIds, awardIds, referenceIds] = await Promise.all([
    idsOf(MODELS.Education),
    idsOf(MODELS.Experience),
    idsOf(MODELS.Project),
    idsOf(MODELS.Certificate),
    idsOf(MODELS.Award),
    idsOf(MODELS.Reference),
  ]);

  await ProfileModel.create({
    candidateId,
    name: 'Tổng hợp',
    educationIds,
    experienceIds,
    projectIds,
    certificateIds,
    awardIds,
    referenceIds,
  });
};

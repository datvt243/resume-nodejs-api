/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { Model, Types } from 'mongoose';
import ProfileModel from '@/models/profile.model';
import * as MODELS from '@/models';
import { createCrudService } from '@/candidate_profile/BaseService';
import { CrudDocument } from '@/services';
import { idQuerySafe } from '@/utils/querySafe';
import { t, DEFAULT_LANG } from '@/utils/i18n';
import { ValidationError } from '@/errors';

const crud = createCrudService({
  model: ProfileModel,
  name: 'profile',
});

export const { handlerGet, handlerDelete } = crud;

const SECTION_ID_FIELDS: Array<[string, Model<CrudDocument>]> = [
  ['educationIds', MODELS.Education as unknown as Model<CrudDocument>],
  ['experienceIds', MODELS.Experience as unknown as Model<CrudDocument>],
  ['projectIds', MODELS.Project as unknown as Model<CrudDocument>],
  ['certificateIds', MODELS.Certificate as unknown as Model<CrudDocument>],
  ['awardIds', MODELS.Award as unknown as Model<CrudDocument>],
  ['referenceIds', MODELS.Reference as unknown as Model<CrudDocument>],
];

/**
 * Joi only checks the ids' shape; this rejects any id that isn't a
 * non-deleted entry of the same candidate in that section (unknown,
 * someone else's, or deleted), one detail per offending `field.index`.
 */
const checkSectionIds = async (item: Record<string, unknown>, lang: string) => {
  const safeCandidateQuery = idQuerySafe.safeQuery({}, { candidateId: item['candidateId'] });
  const details = (
    await Promise.all(
      SECTION_ID_FIELDS.map(async ([field, model]) => {
        const ids = Array.isArray(item[field]) ? (item[field] as string[]) : [];
        if (!ids.length) return [];
        // ids are Joi-validated 24-hex strings, safe to merge into $in directly.
        const found = 'candidateId' in safeCandidateQuery ? await model.find({ ...safeCandidateQuery, _id: { $in: ids }, deletedAt: null }, '_id').exec() : [];
        const owned = new Set(found.map((doc) => doc._id.toString()));
        return ids.flatMap((id, index) => (owned.has(id.toLowerCase()) ? [] : [{ field: `${field}.${index}`, message: t('profile.entryNotFound', lang) }]));
      }),
    )
  ).flat();

  if (details.length) throw new ValidationError(t('profile.entryNotFound', lang), details);
};

export const handlerCreate = async (item: Record<string, unknown>, lang: string = DEFAULT_LANG) => {
  await checkSectionIds(item, lang);
  return crud.handlerCreate(item, lang);
};

export const handlerUpdate = async (props: { item: Record<string, unknown>; userID?: string | undefined; lang?: string | undefined }) => {
  await checkSectionIds(props.item, props.lang ?? DEFAULT_LANG);
  return crud.handlerUpdate(props);
};

/**
 * Default profile, no data loss: a candidate with zero rows in
 * `profiles` (brand new, or never created a custom one) gets a "Tổng hợp"
 * (All) profile synthesized on first read, containing every existing
 * section item's _id — so GET /api/me/:value's ?profile= filter always has
 * something to resolve to, and no existing candidate's data disappears.
 */
export const ensureDefaultProfile = async (candidateId: string) => {
  const existing = await ProfileModel.countDocuments({ candidateId, deletedAt: null });
  if (existing > 0) return;

  /**
   * `Model<CrudDocument>` + a narrow, justified cast per caller — same
   * Mongoose `Model<T>` invariance pattern as elsewhere (no concrete
   * model can be assigned to a fixed, different `Model<CrudDocument>`
   * slot without one).
   */
  const idsOf = async (model: Model<CrudDocument>) => (await model.find({ candidateId, deletedAt: null }, '_id').exec()).map((doc) => doc._id);

  const [educationIds, experienceIds, projectIds, certificateIds, awardIds, referenceIds] = await Promise.all([
    idsOf(MODELS.Education as unknown as Model<CrudDocument>),
    idsOf(MODELS.Experience as unknown as Model<CrudDocument>),
    idsOf(MODELS.Project as unknown as Model<CrudDocument>),
    idsOf(MODELS.Certificate as unknown as Model<CrudDocument>),
    idsOf(MODELS.Award as unknown as Model<CrudDocument>),
    idsOf(MODELS.Reference as unknown as Model<CrudDocument>),
  ]);

  /**
   * Explicit `_id`: profile.model.ts redeclares `_id: ObjectId`, which
   * replaces Mongoose's auto-generated `_id` — `create()` without one
   * throws "document must have an _id before saving" (see visit.model.ts).
   */
  await ProfileModel.create({
    _id: new Types.ObjectId(),
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

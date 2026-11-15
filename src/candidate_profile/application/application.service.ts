/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import ApplicationModel from '@/models/application.model';
import ProfileModel from '@/models/profile.model';
import { createCrudService } from '@/candidate_profile/BaseService';
import { idQuerySafe } from '@/utils/querySafe';
import { t, DEFAULT_LANG } from '@/utils/i18n';
import { BadRequestError } from '@/errors';
import { withDBTimeout } from '@/utils/timeout';

const crud = createCrudService({
  model: ApplicationModel,
  name: 'đơn ứng tuyển',
});

export const { handlerGet, handlerDelete } = crud;

/**
 * Joi only checks the shape of `profileId`; this rejects one that isn't a
 * non-deleted profile of the same candidate, so an application can never
 * point at someone else's (or a deleted) profile. `''` is normalised to
 * null (unlink); an omitted `profileId` is left out, so an update keeps
 * the current link.
 */
const checkProfileLink = async (item: Record<string, unknown>, lang: string): Promise<Record<string, unknown>> => {
  const profileId = item['profileId'] === '' ? null : item['profileId'];
  if (profileId === undefined) return item;
  if (profileId === null) return { ...item, profileId: null };

  const safeQuery = idQuerySafe.safeQuery({}, { _id: profileId, candidateId: item['candidateId'] });
  const owned = '_id' in safeQuery && 'candidateId' in safeQuery ? await ProfileModel.exists({ ...safeQuery, deletedAt: null }) : null;
  if (owned) return item;

  throw new BadRequestError(t('application.profileNotFound', lang));
};

const OPEN_STATUS_RANK: Record<string, number> = { applied: 0, interview: 1, offer: 2 };

/** Open statuses move forward only (skips allowed) or end in `rejected`; `accepted` follows `offer`; `accepted`/`rejected` are final. */
export const isStatusTransitionAllowed = (from: string, to: string): boolean => {
  const fromRank = OPEN_STATUS_RANK[from];
  if (from === to) return true;
  if (fromRank === undefined) return false;
  if (to === 'rejected') return true;
  if (to === 'accepted') return from === 'offer';
  const toRank = OPEN_STATUS_RANK[to];
  return toRank !== undefined && toRank > fromRank;
};

/**
 * A missing, deleted or foreign id skips the check so the base update
 * still answers its own 404/403.
 */
const checkStatusTransition = async (item: Record<string, unknown>, lang: string): Promise<void> => {
  if (typeof item['status'] !== 'string') return;

  const safeQuery = idQuerySafe.safeQuery({}, { _id: item['_id'], candidateId: item['candidateId'] });
  if (!('_id' in safeQuery && 'candidateId' in safeQuery)) return;

  // shortcut: read-then-write, so two concurrent updates can both pass; fine for one candidate's own data, use a conditional updateOne if that changes.
  const current = await withDBTimeout(ApplicationModel.findOne({ ...safeQuery, deletedAt: null }).select('status').lean<{ status?: string }>().exec());
  if (typeof current?.status !== 'string' || isStatusTransitionAllowed(current.status, item['status'])) return;

  throw new BadRequestError(t('application.statusTransitionInvalid', lang));
};

export const handlerCreate = async (item: Record<string, unknown>, lang: string = DEFAULT_LANG) => {
  return crud.handlerCreate(await checkProfileLink(item, lang), lang);
};

export const handlerUpdate = async (props: { item: Record<string, unknown>; userID?: string | undefined; lang?: string | undefined }) => {
  const lang = props.lang ?? DEFAULT_LANG;
  await checkStatusTransition(props.item, lang);
  return crud.handlerUpdate({ ...props, item: await checkProfileLink(props.item, lang) });
};

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

export const handlerCreate = async (item: Record<string, unknown>, lang: string = DEFAULT_LANG) => {
  return crud.handlerCreate(await checkProfileLink(item, lang), lang);
};

export const handlerUpdate = async (props: { item: Record<string, unknown>; userID?: string | undefined; lang?: string | undefined }) => {
  return crud.handlerUpdate({ ...props, item: await checkProfileLink(props.item, props.lang ?? DEFAULT_LANG) });
};

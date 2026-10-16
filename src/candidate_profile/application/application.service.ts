/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { StatusCodes } from 'http-status-codes';
import ApplicationModel from '@/models/application.model';
import ProfileModel from '@/models/profile.model';
import { createCrudService } from '@/candidate_profile/BaseService';
import { idQuerySafe } from '@/utils/querySafe';
import { t, DEFAULT_LANG } from '@/utils/i18n';

const crud = createCrudService({
  model: ApplicationModel,
  name: 'đơn ứng tuyển',
});

export const { handlerGet, handlerDelete } = crud;

type ProfileLinkCheck = { item: Record<string, unknown> } | { failure: { success: false; statusCode: number; message: string } };

/**
 * Joi only checks the shape of `profileId`; this rejects one that isn't a
 * non-deleted profile of the same candidate, so an application can never
 * point at someone else's (or a deleted) profile. `''` is normalised to
 * null (unlink); an omitted `profileId` is left out, so an update keeps
 * the current link.
 */
const checkProfileLink = async (item: Record<string, unknown>, lang: string): Promise<ProfileLinkCheck> => {
  const profileId = item['profileId'] === '' ? null : item['profileId'];
  if (profileId === undefined) return { item };
  if (profileId === null) return { item: { ...item, profileId: null } };

  const safeQuery = idQuerySafe.safeQuery({}, { _id: profileId, candidateId: item['candidateId'] });
  const owned = '_id' in safeQuery && 'candidateId' in safeQuery ? await ProfileModel.exists({ ...safeQuery, deletedAt: null }) : null;
  if (owned) return { item };

  return { failure: { success: false, statusCode: StatusCodes.BAD_REQUEST, message: t('application.profileNotFound', lang) } };
};

export const handlerCreate = async (item: Record<string, unknown>, lang: string = DEFAULT_LANG) => {
  const check = await checkProfileLink(item, lang);
  return 'failure' in check ? check.failure : crud.handlerCreate(check.item, lang);
};

export const handlerUpdate = async (props: { item: Record<string, unknown>; userID?: string | undefined; lang?: string | undefined }) => {
  const check = await checkProfileLink(props.item, props.lang ?? DEFAULT_LANG);
  return 'failure' in check ? check.failure : crud.handlerUpdate({ ...props, item: check.item });
};

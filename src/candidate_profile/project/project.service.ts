/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import ProjectModel from '@/models/project.model';
import ExperienceModel from '@/models/experience.model';
import { createCrudService } from '@/candidate_profile/BaseService';
import { idQuerySafe } from '@/utils/querySafe';
import { t, DEFAULT_LANG } from '@/utils/i18n';
import { BadRequestError } from '@/errors';

const crud = createCrudService({
  model: ProjectModel,
  name: 'dự án',
});

export const { handlerGet, handlerDelete } = crud;

/**
 * Joi only checks the shape of `experienceId`; this rejects one that isn't
 * a non-deleted experience of the same candidate, so a company project can
 * never point at someone else's (or a deleted) experience. A personal
 * project always stores null, so switching a project to personal unlinks it.
 */
const checkExperienceLink = async (item: Record<string, unknown>, lang: string): Promise<Record<string, unknown>> => {
  if (item['type'] !== 'company') return { ...item, experienceId: null };

  const safeQuery = idQuerySafe.safeQuery({}, { _id: item['experienceId'], candidateId: item['candidateId'] });
  const owned = '_id' in safeQuery && 'candidateId' in safeQuery ? await ExperienceModel.exists({ ...safeQuery, deletedAt: null }) : null;
  if (owned) return item;

  throw new BadRequestError(t('project.experienceNotFound', lang));
};

export const handlerCreate = async (item: Record<string, unknown>, lang: string = DEFAULT_LANG) => {
  return crud.handlerCreate(await checkExperienceLink(item, lang), lang);
};

export const handlerUpdate = async (props: { item: Record<string, unknown>; userID?: string | undefined; lang?: string | undefined }) => {
  return crud.handlerUpdate({ ...props, item: await checkExperienceLink(props.item, props.lang ?? DEFAULT_LANG) });
};

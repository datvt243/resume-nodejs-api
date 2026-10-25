/**
 * Shared CRUD handler factory for candidate_profile sections (education, experience, award, ...)
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { Model } from 'mongoose';
import { baseFindDocument, baseCreateDocument, baseUpdateDocument, baseDeleteDocument, CrudDocument } from '@/services';
import { withDBTimeout } from '@/utils/timeout';
import { DEFAULT_LANG } from '@/utils/i18n';

export const createCrudService = <T extends CrudDocument>(props: { model: Model<T>; name?: string }) => {
  const { model: MODEL, name = '' } = props;

  const handlerGet = async (candidateId: string, lang: string = DEFAULT_LANG) => {
    return withDBTimeout(baseFindDocument({ fields: { candidateId }, model: MODEL, findOne: false, lang }));
  };

  const handlerCreate = async (item: Record<string, unknown>, lang: string = DEFAULT_LANG) => {
    return withDBTimeout(
      baseCreateDocument({
        document: { ...item },
        model: MODEL,
        name,
        lang,
        hookHasErrors: () => {},
      }),
    );
  };

  const handlerUpdate = async ({
    item,
    userID,
    lang = DEFAULT_LANG,
  }: {
    item: Record<string, unknown>;
    userID?: string | undefined;
    lang?: string | undefined;
  }) => {
    return withDBTimeout(baseUpdateDocument({ document: item, model: MODEL, userID, lang }));
  };

  const handlerDelete = async ({
    id,
    userID,
    lang = DEFAULT_LANG,
  }: {
    id: string;
    userID: string;
    lang?: string | undefined;
  }) => {
    return withDBTimeout(baseDeleteDocument({ model: MODEL, _id: id, userID, name, lang }));
  };

  return { handlerGet, handlerCreate, handlerUpdate, handlerDelete };
};

/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import generalInformationSchema from '@/models/generalInformation.model';
import { baseFindDocument, baseCreateDocument } from '@/services';
import { withDBTimeout } from '@/utils/timeout';
import { createCrudService } from '@/candidate_profile/BaseService';
import { t, DEFAULT_LANG } from '@/utils/i18n';
import { ConflictError } from '@/errors';

const MODEL = generalInformationSchema;
const NAME = 'Thông tin chung';

export const { handlerGet, handlerUpdate, handlerDelete } = createCrudService({ model: MODEL, name: NAME });

export const handlerCreate = async (document: Record<string, unknown>, lang: string = DEFAULT_LANG) => {
  // Refuse to create a second generalInformation document for a candidate that already has one.
  const candidateId = typeof document?.['candidateId'] === 'string' ? document['candidateId'] : undefined;
  const { success, data } = await withDBTimeout(
    baseFindDocument({
      model: MODEL,
      fields: { candidateId },
    }),
  );
  if (success && !!data) throw new ConflictError(t('generalInformation.alreadyExists', lang));

  return withDBTimeout(
    baseCreateDocument({
      document: { ...document },
      model: MODEL,
      name: NAME,
      lang,
      hookHasErrors: () => {},
    }),
  );
};

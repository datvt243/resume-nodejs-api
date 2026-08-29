/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import fs from 'fs';
import path from 'path';
import * as MODELS from '@/models';
import { validateModel } from '@/utils';
import { candidateQuerySafe } from '@/utils/querySafe';
import { t, DEFAULT_LANG } from '@/utils/i18n';
import { CV_UPLOAD_DIR } from '@/middlewares/uploadCV.middleware';

const MODEL = MODELS.Candidate;

// CV section models keyed by candidateId — deleted alongside the
// candidate document itself so a self-delete doesn't leave orphaned data.
const CV_SECTION_MODELS: any[] = [
  MODELS.generalInformation,
  MODELS.Experience,
  MODELS.Education,
  MODELS.Reference,
  MODELS.Project,
  MODELS.Certificate,
  MODELS.Award,
];

export const handlerGetInformationById = async (id: string, props: { select: string } = { select: '' }) => {
  const { select = '' } = props;
  // `select` here is already a whitelisted, space-joined field list (see
  // callers) — re-wrapping it in candidateQuerySafe.whitelistSelect([select])
  // treated the whole joined string as a single field name, which never
  // matched the allow-list, silently making the select a no-op and
  // returning the full document (including password) to every caller.
  // Default to excluding password when no explicit select is given.
  const find = MODEL.findById(id).select(select || '-password');
  return await find.exec();
};

export const handlerGetInformationByEmail = async (email: string) => {
  const safeEmailQuery = candidateQuerySafe.safeQuery({}, { email });
  const find = await MODEL.findOne(safeEmailQuery).select('-password').exec();
  return find;
};

export const handlerUpdate = async (item: Record<string, any>, lang: string = DEFAULT_LANG) => {
  /**
   * @return
   *  success: boolean,
   *  message: string,
   *  data: Document,
   *  errors: Array
   *
   */

  if (!(await MODEL.findById(item._id))) {
    return { success: false, message: t('common.idNotFound', lang) };
  }

  const value = { ...item };

  /**
   * validate data trước khi lưu vào database
   */
  const { valid, message, errors } = await validateModel(MODEL, value);
  if (!valid) return { success: false, message, errors };

  /**
   * update
   */
  const res = await MODEL.updateOne({ _id: value._id || '' }, value).exec();

  /**
   * lấy thông tin vừa update (SAFE SELECT)
   */
  const safeSelect = candidateQuerySafe.whitelistSelect(Object.keys(value));
  const _find = await handlerGetInformationById(value._id, { select: safeSelect });
  /**
   * return
   */
  return { success: true, message: t('common.updateSuccess', lang), errors: {}, data: _find ? _find : {} };
};

export const handlerUploadCV = async (candidateId: string, originalName: string, lang: string = DEFAULT_LANG) => {
  if (!(await MODEL.findById(candidateId))) {
    return { success: false, message: t('common.idNotFound', lang) };
  }

  const uploadedAt = Date.now();
  await MODEL.updateOne({ _id: candidateId }, { cvFile: { originalName, uploadedAt } }).exec();

  return { success: true, message: t('candidate.cvUploadSuccess', lang), errors: {}, data: { originalName, uploadedAt } };
};

export const handlerGetCVFile = async (candidateId: string) => {
  const doc = await MODEL.findById(candidateId).select('cvFile').exec();
  return doc?.get('cvFile.originalName') ? doc.get('cvFile') : null;
};

export const handlerDelete = async (_id: string, lang: string = DEFAULT_LANG) => {
  if (!(await MODEL.findById(_id))) {
    return { success: false, message: t('common.idNotFound', lang) };
  }

  await Promise.all(CV_SECTION_MODELS.map((model) => model.deleteMany({ candidateId: _id })));
  await MODEL.deleteOne({ _id }).exec();

  // Uploaded CV file lives on disk, not in Mongo — deleting only the DB
  // record would leave the actual PDF (real personal data) behind.
  const cvFilePath = path.join(CV_UPLOAD_DIR, `${_id}-cv.pdf`);
  if (fs.existsSync(cvFilePath)) fs.unlinkSync(cvFilePath);

  return { success: true, message: t('candidate.deleteAccountSuccess', lang), errors: {}, data: null };
};

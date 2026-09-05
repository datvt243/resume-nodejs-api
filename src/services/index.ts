/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import mongoose, { Schema, Document } from 'mongoose';
import type { BaseReturn } from '@/types/base.type';
import { getSelectFields } from '@/utils/helper';
import { t, DEFAULT_LANG } from '@/utils/i18n';
interface baseProp {
  model: any;
  fields: { _id?: string; candidateId?: string };
  findOne?: boolean;
  lang?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

// Pagination (issue #73) hard cap — a caller cannot request more than this
// many documents per page regardless of what `limit` it passes.
const MAX_PAGE_LIMIT = 100;

const formatReturn = (props: BaseReturn) => {
  const { success = false, message = '', errors = null, data = null } = props;
  return {
    success,
    message,
    errors,
    data,
  };
};
export const formatReturnFailed = (props: string | BaseReturn) => {
  if (typeof props === 'string') {
    return formatReturn({ success: false, message: props, errors: null, data: null });
  }
  const { message = '', errors = null, data = null } = props;
  return {
    success: false,
    message,
    errors,
    data,
  };
};

export const baseFindDocument = async (props: baseProp) => {
  const { model: MODEL, fields = { _id: '' }, findOne = true, lang = DEFAULT_LANG, page, limit, sort } = props;

  if (!MODEL || !fields || !Object.keys(fields).length) return formatReturnFailed(t('common.notFoundData', lang));

  const idQuerySafe = (await import('@/utils/querySafe')).idQuerySafe;
  const safeFields = idQuerySafe.safeQuery({}, fields);

  if (findOne) {
    const find = await MODEL.findOne(safeFields).exec();
    return formatReturn({ success: true, data: find, message: '', errors: null });
  }

  let query = MODEL.find(safeFields);
  if (sort) query = query.sort(sort);

  /**
   * Pagination (issue #73) is opt-in: it only kicks in when the caller
   * passes a valid positive `limit`. No `limit` -> exactly the old
   * behavior (`data` is the full, unpaginated array), so every existing
   * caller of baseGetAll keeps working unchanged.
   */
  const hasPagination = Number.isInteger(limit) && (limit as number) > 0;
  if (!hasPagination) {
    const find = await query.exec();
    return formatReturn({ success: true, data: find, message: '', errors: null });
  }

  const safeLimit = Math.min(limit as number, MAX_PAGE_LIMIT);
  const safePage = Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([query.skip(skip).limit(safeLimit).exec(), MODEL.countDocuments(safeFields)]);

  return formatReturn({
    success: true,
    data: {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    },
    message: '',
    errors: null,
  });
};

export const baseDeleteDocument = async (props: { model: any; _id: string; name: string; userID: string; lang?: string }) => {
  const { model: MODEL, _id: __id, userID, lang = DEFAULT_LANG } = props;

  /**
   * Check Document có tồn tại không -> findById
   */
  const { isExist, message: _mess, document } = await _baseHelper().baseCheckDocumentById(MODEL, __id, lang);
  if (!isExist) return formatReturnFailed(_mess);

  const { _id, candidateId = '' } = document;

  /**
   * Kiểm tra doc cần xoá có thuộc người đang xoá hay không
   */
  if (candidateId.toString() !== userID) return formatReturnFailed(t('common.deleteNotYours', lang));

  /**
   * tiến hành xoá
   */
  let success = false,
    message = t('common.deleteFailed', lang),
    error = null;
  try {
    const { deletedCount = 0 } = await MODEL.deleteOne({ _id }).exec();
    success = !!deletedCount;
    message = t('common.deleteSuccess', lang);
  } catch (err) {
    error = err;
  }

  return formatReturn({
    success,
    message,
    errors: error,
  });
};

export const baseUpdateDocument = async (props: {
  document: Record<string, any>;
  model: any;
  userID?: string;
  lang?: string;
  hookHasErrors?: (props: any) => void;
}) => {
  /**
   * get values
   */
  const { document, model: MODEL, userID, lang = DEFAULT_LANG } = props;

  /**
   * @return
   *  success: boolean,
   *  message: string,
   *  data: Document,
   *  error: Array
   *
   */

  const _valueUpdate = { ...document };
  const { _id } = _valueUpdate;

  /**
   * Check Document có tồn tại không -> findById
   */
  const { isExist, message: _mess, document: _existing } = await _baseHelper().baseCheckDocumentById(MODEL, _id, lang);
  if (!isExist) return formatReturnFailed(_mess);

  /**
   * Kiểm tra doc cần update có thuộc người đang update hay không
   * (đối chiếu owner của document ĐÃ TỒN TẠI, không phải candidateId gửi
   * lên trong payload — nếu không, update có thể "cướp" document của
   * người khác bằng cách gửi kèm candidateId của chính mình)
   */
  if (userID !== undefined && _existing?.candidateId !== undefined && _existing.candidateId.toString() !== userID) {
    return formatReturnFailed(t('common.updateNotYours', lang));
  }

  /**
   * validate ở mongoose model
   */
  const modelValid = await _baseHelper().modelValidate(MODEL, { ..._valueUpdate });
  if (!modelValid.success) return formatReturnFailed({ message: modelValid.message, errors: modelValid.errors });

  /**
   * Save
   */
  let _success = true,
    _message = t('common.updateSuccess', lang),
    _data = null,
    _errors = {};

  try {
    await MODEL.updateOne({ _id }, _valueUpdate).exec();
    _data = await _baseHelper().getDocumentUpdated(_id, { model: MODEL, select: getSelectFields(_valueUpdate) });
  } catch (err) {
    const { message = '', errors = [] } = _baseHelper().handlerCatchError(err);
    _success = false;
    _message = message || t('common.updateFailed', lang);
    _errors = errors;
    props?.hookHasErrors?.({ err });
  } finally {
    /**
     * return
     */
    return formatReturn({
      success: _success,
      message: _message,
      errors: _errors,
      data: _data,
    });
  }
};

export const baseCreateDocument = async (props: {
  document: Record<string, any>;
  model: any;
  name: string;
  lang?: string;
  hookHasErrors?: (p: any) => Promise<void> | void;
  hookAfterSave?: (document: any, prop: BaseReturn) => Promise<any> | any;
}) => {
  const { document, model: MODEL, lang = DEFAULT_LANG } = props;

  /**
   * remove _id nếu có
   */
  delete document._id;

  /**
   * Nếu không có candidateId thì trả về thất bại
   */
  if (!document.candidateId) return formatReturnFailed(t('common.createFailed', lang));

  /**
   * validate ở mongoose model
   */
  const modelValid = await _baseHelper().modelValidate(MODEL, { ...document });
  if (!modelValid.success) return formatReturnFailed({ message: modelValid.message, errors: modelValid.errors });

  /**
   * Lưu data
   */
  let _success = true,
    _data = null,
    _message = t('common.createSuccess', lang),
    _errors = {};

  try {
    _data = await MODEL.create({ _id: null, ...document });
    /**
     * callback thực hiện sau khi thêm mới thành công. Nếu hook trả về
     * (khác undefined), dùng giá trị đó thay _data — trước đây hook nhận
     * `data` qua destructure-by-value nên gán lại bên trong hook không hề
     * cập nhật _data ở đây, khiến response luôn trả nguyên kết quả thô của
     * MODEL.create() (Mongoose giữ `_id: null` như đã truyền, thay vì id
     * thật mà MongoDB gán khi lưu) thay vì list mới đã refetch.
     */
    if (props?.hookAfterSave) {
      const replacement = await props.hookAfterSave(document, { success: _success, message: _message, data: _data });
      if (replacement !== undefined) _data = replacement;
    }
  } catch (err) {
    const { message = '', errors = [] } = _baseHelper().handlerCatchError(err);
    _success = false;
    _message = message || t('common.createFailed', lang);
    _errors = errors;

    /**
     * callback if it's has error
     */
    props?.hookHasErrors?.({ err });
  } finally {
    /**
     * return
     */
    return formatReturn({ success: _success, message: _message, errors: _errors, data: _data });
  }
};

export const basePatchDocument = async (props: { document: Record<string, any>; model: any; lang?: string }) => {
  /**
   * get value
   */
  const { document, model: MODEL, lang = DEFAULT_LANG } = props;

  const { _id } = document;

  /**
   * Check Document có tồn tại không -> findById
   */
  const { isExist, message: _mess } = await _baseHelper().baseCheckDocumentById(MODEL, _id, lang);
  if (!isExist) return formatReturnFailed(_mess);

  /**
   * validate ở mongoose model
   */
  const modelValid = await _baseHelper().modelValidate(MODEL, { ...document });
  if (!modelValid.success) return formatReturnFailed({ message: modelValid.message, errors: modelValid.errors });

  try {
    await MODEL.updateOne({ _id }, document).exec();
    /**
     * get information
     */
    const data = await _baseHelper().getDocumentUpdated(_id, { model: MODEL, select: getSelectFields(document) });

    /**
     * return
     */
    return { success: true, message: t('common.updateSuccess', lang), errors: {}, data: data ? data : null };
  } catch (err) {
    /**
     * catch errors
     */
    return { success: false, message: t('common.updateFailed', lang), error: err, data: null };
  }
};

const _baseHelper = () => {
  return {
    getDocumentUpdated: async (_id: string, props: { model: any; select: string }) => {
      const { model: MODEL, select = '' } = props;
      const find = MODEL.findById(_id);
      /* if (select) {
                find.select(select);
            } */
      const record = await find.exec();
      return record;
    },
    modelValidate: async (model: any, value: any) => {
      let message = '',
        success = true;
      let errors: null | string[] = null;

      try {
        await model.validate(value);
      } catch (err) {
        const errs = [];
        if (err instanceof mongoose.Error.ValidationError) {
          const { errors: _errs } = err;
          for (const [k, v] of Object.entries(_errs)) {
            errs.push(k);
          }
        }

        success = false;
        message = '';
        errors = errs;
      }
      return { success, message, errors };
    },
    handlerCatchError: (error: any) => {
      if (error instanceof ReferenceError) {
        return {
          message: 'ReferenceError',
          errors: [error.message],
        };
      }

      return {
        message: 'An unknown error',
        errors: {},
      };
    },
    baseCheckDocumentById: async (MODEL: any, _id: string, lang: string = DEFAULT_LANG) => {
      let message = t('common.idNotFound', lang);

      if (!_id) return { isExist: false, message };

      let isExist = true;
      const idQuerySafe = (await import('@/utils/querySafe')).idQuerySafe;
      const _find = await MODEL.findOne(idQuerySafe.safeQuery({}, { _id })).exec();
      if (!_find) {
        isExist = false;
      } else {
        isExist = true;
        message = '';
      }
      return { isExist, message, document: _find };
    },
  };
};

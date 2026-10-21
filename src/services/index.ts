/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import mongoose, { Model, Types } from 'mongoose';
import type { BaseReturn } from '@/types/base.type';
import { getSelectFields } from '@/utils/helper';
import { t, DEFAULT_LANG } from '@/utils/i18n';
import { AuthorizationError, BadRequestError, NotFoundError, ValidationError } from '@/errors';

/**
 * The minimal raw-document shape every CV-section model shares, at the
 * level this generic CRUD core actually touches it (ownership check via
 * `candidateId`, soft-delete via `deletedAt`). Deliberately NOT extending
 * Mongoose's `Document` — `Model<T>`'s `T` type parameter is the RAW
 * schema-inferred shape (before the `Document` instance-method wrapper
 * Mongoose adds), so constraining `T` to `extends Document` would reject
 * every real model (none of their raw inferred types carry `$`-prefixed
 * Document instance methods themselves). Each `base*Document` function
 * below is generic over `T`, inferred per call site from whichever
 * concrete model is passed in — `Education`/`Experience`/etc. are NOT
 * individually typed yet (`mongoose.model(name, schema)` infers a real
 * per-field shape automatically, but that's still just a plain object
 * shape, not a shared interface), so this only requires each real model
 * to structurally satisfy these 2 optional fields, which all 9 already do.
 */
export interface CrudDocument {
  candidateId?: Types.ObjectId | string;
  deletedAt?: number | null;
  /**
   * Only 3 of the 9 CV sections (Project/Certificate/Award) actually carry
   * an `images` array, but `BaseController.ts`'s `baseUploadImages` is the
   * one generic handler that touches it across whichever section the route
   * wires it to — same shared-optional-field shape as `candidateId`/
   * `deletedAt` above, not a claim every section has images.
   */
  images?: string[];
}

interface baseProp<T extends CrudDocument> {
  model: Model<T>;
  /**
   * `candidateId?: string | undefined`: several callers (e.g.
   * generalInformation.service.ts) narrow `document?.candidateId` with a
   * `typeof x === 'string' ? x : undefined` guard before passing it here —
   * a real "not a string" state, not an accidental omission.
   */
  fields: { _id?: string; candidateId?: string | undefined };
  findOne?: boolean;
  /**
   * `| undefined` added explicitly (`exactOptionalPropertyTypes`):
   * `BaseController.ts`'s `baseGetAll` passes each of these as
   * `cond ? value : undefined`, a real "no value given" state — a plain
   * `?:` (which under this flag means "may be omitted, but if present
   * must be the real type, never `undefined` itself") no longer accepts
   * that.
   */
  lang?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  sort?: string | undefined;
}

// Pagination hard cap — a caller cannot request more than this many documents per page regardless of what `limit` it passes.
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

export const baseFindDocument = async <T extends CrudDocument>(props: baseProp<T>) => {
  const { model: MODEL, fields = { _id: '' }, findOne = true, lang = DEFAULT_LANG, page, limit, sort } = props;

  if (!MODEL || !fields || !Object.keys(fields).length) return formatReturnFailed(t('common.notFoundData', lang));

  const idQuerySafe = (await import('@/utils/querySafe')).idQuerySafe;
  /**
   * Soft-delete: exclude documents that have been soft-deleted
   * by default. `fields` can never override this key (safeQuery only ever
   * merges keys from its own allow-list into the base query), so every
   * existing caller keeps working unchanged — they just stop seeing
   * soft-deleted rows.
   */
  const safeFields = idQuerySafe.safeQuery({ deletedAt: null }, fields);

  if (findOne) {
    const find = await MODEL.findOne(safeFields).exec();
    return formatReturn({ success: true, data: find, message: '', errors: null });
  }

  let query = MODEL.find(safeFields);
  if (sort) query = query.sort(sort);

  /**
   * Pagination is opt-in: it only kicks in when the caller
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

// `lang?: string | undefined` (`exactOptionalPropertyTypes`): BaseController.ts passes `req.lang`, itself `string | undefined`.
export const baseDeleteDocument = async <T extends CrudDocument>(props: { model: Model<T>; _id: string; name: string; userID: string; lang?: string | undefined }) => {
  const { model: MODEL, _id: __id, userID, lang = DEFAULT_LANG } = props;

  const { isExist, message: _mess, document } = await _baseHelper().baseCheckDocumentById({ MODEL, _id: __id, lang });
  if (!isExist) throw new NotFoundError(_mess);

  const { _id, candidateId = '' } = document;

  if (candidateId.toString() !== userID) throw new AuthorizationError(t('common.deleteNotYours', lang));

  /**
   * Soft-delete: mark deletedAt instead of removing the document, so it
   * can be recovered via baseRestoreDocument. A driver error propagates to
   * errorsMiddleware, which logs it and hides its text in production.
   */
  const { modifiedCount = 0 } = await MODEL.updateOne({ _id }, { deletedAt: Date.now() }).exec();
  if (!modifiedCount) throw new NotFoundError(t('common.deleteFailed', lang));

  return formatReturn({ success: true, message: t('common.deleteSuccess', lang) });
};

// `lang?: string | undefined` (`exactOptionalPropertyTypes`): BaseController.ts passes `req.lang`, itself `string | undefined`.
export const baseRestoreDocument = async <T extends CrudDocument>(props: { model: Model<T>; _id: string; name: string; userID: string; lang?: string | undefined }) => {
  const { model: MODEL, _id: __id, userID, lang = DEFAULT_LANG } = props;

  // `baseCheckDocumentById` doesn't filter on `deletedAt`, so it finds the document whether it's currently soft-deleted or not.
  const { isExist, message: _mess, document } = await _baseHelper().baseCheckDocumentById({ MODEL, _id: __id, lang });
  if (!isExist) throw new NotFoundError(_mess);

  const { _id, candidateId = '' } = document;

  if (candidateId.toString() !== userID) throw new AuthorizationError(t('common.restoreNotYours', lang));

  // Nothing modified = the document wasn't soft-deleted, so there is nothing to restore.
  const { modifiedCount = 0 } = await MODEL.updateOne({ _id }, { deletedAt: null }).exec();
  if (!modifiedCount) throw new NotFoundError(t('common.restoreFailed', lang));

  return formatReturn({ success: true, message: t('common.restoreSuccess', lang) });
};

export const baseUpdateDocument = async <T extends CrudDocument>(props: {
  document: Record<string, unknown> & { _id?: string };
  model: Model<T>;
  /**
   * `| undefined` (`exactOptionalPropertyTypes`): `BaseService.ts`'s
   * `handlerUpdate(item, userID?, lang)` forwards its own optional
   * `userID` param straight through — when the caller omits it, that's a
   * real, intentional `undefined`, not an accidental one.
   */
  userID?: string | undefined;
  lang?: string;
  hookHasErrors?: (props: { err: unknown }) => void;
}) => {
  const { document, model: MODEL, userID, lang = DEFAULT_LANG } = props;

  const _valueUpdate = { ...document };
  const { _id } = _valueUpdate;

  // Exclude soft-deleted documents — don't allow updating an already-deleted record.
  const { isExist, message: _mess, document: _existing } = await _baseHelper().baseCheckDocumentById({
    MODEL,
    _id,
    lang,
    opts: { excludeDeleted: true },
  });
  if (!isExist) throw new NotFoundError(_mess);

  /**
   * Checked against the owner of the EXISTING document, not the
   * `candidateId` sent in the payload — otherwise an update could "steal"
   * someone else's document by including their own `candidateId`.
   */
  if (userID !== undefined && _existing?.candidateId !== undefined && _existing.candidateId.toString() !== userID) {
    throw new AuthorizationError(t('common.updateNotYours', lang));
  }

  const modelValid = await _baseHelper().modelValidate(MODEL, { ..._valueUpdate });
  if (!modelValid.success) throw new ValidationError(t('validation.hasErrors', lang), modelValid.errors);

  try {
    await MODEL.updateOne({ _id }, _valueUpdate).exec();
    const data = await _baseHelper().getDocumentUpdated(_id, { model: MODEL, select: getSelectFields(_valueUpdate) });
    return formatReturn({ success: true, message: t('common.updateSuccess', lang), errors: {}, data });
  } catch (err) {
    props?.hookHasErrors?.({ err });
    throw err;
  }
};

export const baseCreateDocument = async <T extends CrudDocument>(props: {
  document: Record<string, unknown>;
  model: Model<T>;
  name: string;
  lang?: string;
  hookHasErrors?: (p: { err: unknown }) => Promise<void> | void;
  hookAfterSave?: (document: Record<string, unknown>, prop: BaseReturn) => Promise<unknown> | unknown;
}) => {
  const { document, model: MODEL, lang = DEFAULT_LANG } = props;

  delete document['_id'];

  if (!document['candidateId']) throw new BadRequestError(t('common.createFailed', lang));

  const modelValid = await _baseHelper().modelValidate(MODEL, { ...document });
  if (!modelValid.success) throw new ValidationError(t('validation.hasErrors', lang), modelValid.errors);

  const _message = t('common.createSuccess', lang);

  try {
    let _data: unknown = await MODEL.create({ _id: null, ...document });
    /**
     * If the hook returns something (not `undefined`), use that instead of
     * `_data` — the hook used to receive `data` by-value destructuring, so
     * reassigning inside the hook never actually updated `_data` here,
     * which meant the response always returned `MODEL.create()`'s raw
     * result (Mongoose keeps `_id: null` as passed, not the real id
     * MongoDB assigns on save) instead of the freshly-refetched list.
     */
    if (props?.hookAfterSave) {
      const replacement = await props.hookAfterSave(document, { success: true, message: _message, data: _data });
      if (replacement !== undefined) _data = replacement;
    }
    return formatReturn({ success: true, message: _message, errors: {}, data: _data });
  } catch (err) {
    props?.hookHasErrors?.({ err });
    throw err;
  }
};

export const basePatchDocument = async <T extends CrudDocument>(props: {
  document: Record<string, unknown> & { _id?: string };
  model: Model<T>;
  lang?: string;
}) => {
  const { document, model: MODEL, lang = DEFAULT_LANG } = props;

  const { _id } = document;

  // Exclude soft-deleted documents — don't allow patching an already-deleted record.
  const { isExist, message: _mess } = await _baseHelper().baseCheckDocumentById({
    MODEL,
    _id,
    lang,
    opts: { excludeDeleted: true },
  });
  if (!isExist) throw new NotFoundError(_mess);

  const modelValid = await _baseHelper().modelValidate(MODEL, { ...document });
  if (!modelValid.success) throw new ValidationError(t('validation.hasErrors', lang), modelValid.errors);

  await MODEL.updateOne({ _id }, document).exec();
  const data = await _baseHelper().getDocumentUpdated(_id, { model: MODEL, select: getSelectFields(document) });
  return { success: true, message: t('common.updateSuccess', lang), errors: {}, data: data ? data : null };
};

const _baseHelper = () => {
  return {
    getDocumentUpdated: async <T extends CrudDocument>(_id: string | undefined, props: { model: Model<T>; select: string }) => {
      const { model: MODEL } = props;
      const find = MODEL.findById(_id);
      const record = await find.exec();
      return record;
    },
    modelValidate: async <T extends CrudDocument>(model: Model<T>, value: Record<string, unknown>) => {
      let message = '',
        success = true;
      let errors: null | string[] = null;

      try {
        await model.validate(value);
      } catch (err) {
        const errs = [];
        if (err instanceof mongoose.Error.ValidationError) {
          const { errors: _errs } = err;
          for (const k of Object.keys(_errs)) {
            errs.push(k);
          }
        }

        success = false;
        message = '';
        errors = errs;
      }
      return { success, message, errors };
    },
    baseCheckDocumentById: async <T extends CrudDocument>({
      MODEL,
      _id,
      lang = DEFAULT_LANG,
      opts = {},
    }: {
      MODEL: Model<T>;
      _id: string | undefined;
      lang?: string;
      opts?: { excludeDeleted?: boolean };
    }) => {
      const message = t('common.idNotFound', lang);

      /**
       * A real discriminated union (literal `true`/`false` on `isExist`)
       * instead of a shared `{isExist: boolean; document: T | null}` shape —
       * callers' `if (!isExist) return ...;` guard now actually narrows
       * `document` to non-null afterward. Before this generic pass, `MODEL`
       * (and therefore `document`) was `any`, which silently hid that every
       * caller was accessing `.candidateId`/`._id` on a value TS could not
       * prove was non-null.
       */
      if (!_id) return { isExist: false as const, message, document: null };

      const idQuerySafe = (await import('@/utils/querySafe')).idQuerySafe;
      /**
       * Soft-delete excludes deletedAt-set docs from reads by
       * default (baseFindDocument), but this shared existence check was
       * never updated — update/patch could still find and mutate a
       * soft-deleted document. `excludeDeleted` is opt-in per caller:
       * baseRestoreDocument (and baseDeleteDocument) must still find a
       * document regardless of its deletedAt state.
       */
      const baseQuery = opts.excludeDeleted ? { deletedAt: null } : {};
      const _find = await MODEL.findOne(idQuerySafe.safeQuery(baseQuery, { _id })).exec();
      if (!_find) return { isExist: false as const, message, document: null };

      return { isExist: true as const, message: '', document: _find };
    },
  };
};

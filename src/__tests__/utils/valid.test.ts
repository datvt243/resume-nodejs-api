import Joi from 'joi';
import { validateSchema, formatValidateError } from '@/utils/valid';

describe('validateSchema', () => {
  const schema = Joi.object({
    email: Joi.string().min(3).required(),
    password: Joi.string().min(6).pattern(/[a-z]/).required(),
  });

  test('✅ Dữ liệu hợp lệ - Trả về isValidated = true', () => {
    const validData = { email: 'testuser@example.com', password: 'test123' };
    const result = validateSchema({ schema, item: validData });

    expect(result.isValidated).toBe(true);
    expect(result.value).toEqual(validData);
    expect(result.message).toBe('');
  });

  test('❌ Dữ liệu không hợp lệ - Trả về lỗi', () => {
    const invalidData = { email: 'ab', password: '123' };
    const result = validateSchema({ schema, item: invalidData });

    expect(result.isValidated).toBe(false);
    expect(result.message).toBe('Dữ liệu không hợp lệ');
    expect(result.errors).toBeDefined();
  });

  test('❌ Thiếu schema - Trả về lỗi "Schema không hợp lệ"', () => {
    const result = validateSchema({ schema: null as unknown as Joi.Schema, item: { email: 'test' } });

    expect(result.isValidated).toBe(false);
    expect(result.message).toBe('Schema không hợp lệ');
  });

  test('✅ Truyền `item = {}` nhưng schema không yêu cầu field - Vẫn hợp lệ', () => {
    const emptySchema = Joi.object({});
    const result = validateSchema({ schema: emptySchema, item: {} });

    expect(result.isValidated).toBe(true);
    expect(result.value).toEqual({});
  });
});

/**
 * Regression coverage for issue #160 — the generic Joi-error-translation
 * system (`translateJoiDetail` in utils/valid.ts) that replaced every
 * per-schema hardcoded `.messages()` call. The known pitfall: a naive
 * dot-path key walker misparses a Joi error `type` string that itself
 * contains a dot (e.g. "any.required" read as 3 nested levels instead of
 * one literal key). `tErrorType` already has its own unit test for this
 * in i18n.test.ts — these tests prove the real end-to-end pipeline
 * (`formatValidateError` -> `translateJoiDetail` -> `tErrorType` +
 * `fieldLabels`) resolves correctly in both languages, using the real
 * `education.validate.ts` schema whose hardcoded `.messages()` was
 * removed in this same change because this generic system already
 * superseded it.
 */
describe('formatValidateError — generic i18n templates (issue #160)', () => {
  const educationSchema = Joi.object({
    school: Joi.string().min(10).max(255).required(),
  });

  test('a missing required field resolves via tErrorType (not a dot-path walk) in vi', () => {
    const { error } = educationSchema.validate({}, { abortEarly: false });
    const messages = formatValidateError(error as Joi.ValidationError, 'vi');
    expect(messages).toEqual([{ field: 'school', message: 'Tên trường là bắt buộc' }]);
  });

  test('the same case in en uses the English field label + template', () => {
    const { error } = educationSchema.validate({}, { abortEarly: false });
    const messages = formatValidateError(error as Joi.ValidationError, 'en');
    expect(messages).toEqual([{ field: 'school', message: 'School name is required' }]);
  });

  test('a string.min violation interpolates both the field label and the limit', () => {
    const { error } = educationSchema.validate({ school: 'short' }, { abortEarly: false });
    const messages = formatValidateError(error as Joi.ValidationError, 'en');
    expect(messages).toEqual([{ field: 'school', message: 'School name must be at least 10 characters' }]);
  });

  test('a nested error carries its full dotted path, so sibling items never collide', () => {
    const schema = Joi.object({ items: Joi.array().items(Joi.object({ company: Joi.string().required() })) });
    const { error } = schema.validate({ items: [{ company: 'A' }, {}, {}] }, { abortEarly: false });
    const messages = formatValidateError(error as Joi.ValidationError, 'en');
    expect(messages.map((d) => d.field)).toEqual(['items.1.company', 'items.2.company']);
  });

  test('a field with no fieldLabels entry falls back to the raw field name', () => {
    const schema = Joi.object({ unmappedField: Joi.string().required() });
    const { error } = schema.validate({}, { abortEarly: false });
    const messages = formatValidateError(error as Joi.ValidationError, 'en');
    expect(messages).toEqual([{ field: 'unmappedField', message: 'unmappedField is required' }]);
  });
});

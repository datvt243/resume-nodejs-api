/**
 * Tests for utils/helper.ts::handleError
 */

import { NextFunction } from 'express';
import mongoose from 'mongoose';
import { handleError } from '@/utils/helper';
import { BadRequestError, ConflictError, ValidationError } from '@/errors';

describe('handleError', () => {
  it('converts a Mongo duplicate-key error on `slug` into a ConflictError (issue #120)', () => {
    // Same shape MongoDB throws when `Candidate.updateOne` hits the new
    // unique index on `slug` (candidate.model.ts) — e.g. PATCH
    // /api/v1/candidate/update with a slug another candidate already owns.
    const duplicateSlugError = { code: 11000, keyValue: { slug: 'jane-doe-ab12' } };
    const next = jest.fn() as NextFunction;

    handleError({ err: duplicateSlugError, next });

    expect(next).toHaveBeenCalledTimes(1);
    const passedError = (next as jest.Mock).mock.calls[0][0];
    expect(passedError).toBeInstanceOf(ConflictError);
    expect(passedError.statusCode).toBe(409);
    expect(passedError.message).toContain('slug');
  });

  it('converts a Mongoose CastError into a 400 BadRequestError', () => {
    const next = jest.fn() as NextFunction;

    handleError({ err: new mongoose.Error.CastError('ObjectId', 'nope', '_id'), next, lang: 'en' });

    const passedError = (next as jest.Mock).mock.calls[0][0];
    expect(passedError).toBeInstanceOf(BadRequestError);
    expect(passedError).toMatchObject({ statusCode: 400, errorCode: 'BAD_REQUEST', message: 'Invalid ID format' });
  });

  it('still converts a duplicate-key error on `email` the same way (regression check)', () => {
    const duplicateEmailError = { code: 11000, keyValue: { email: 'existing@example.com' } };
    const next = jest.fn() as NextFunction;

    handleError({ err: duplicateEmailError, next });

    const passedError = (next as jest.Mock).mock.calls[0][0];
    expect(passedError).toBeInstanceOf(ConflictError);
    expect(passedError.message).toContain('email');
  });

  /**
   * Regression for issue #160, scope item 2: Mongoose `required` errors
   * must resolve through the same `tErrorType` + `fieldLabels` i18n
   * system as Joi (see utils/valid.ts), in both vi and en — previously
   * untested here.
   */
  it('translates a Mongoose "required" validation error via tErrorType, in vi and en (issue #160)', () => {
    const buildRequiredError = () => {
      const err = new mongoose.Error.ValidationError();
      err.errors['birthday'] = new mongoose.Error.ValidatorError({ type: 'required', path: 'birthday' });
      return err;
    };

    const nextVi = jest.fn() as NextFunction;
    handleError({ err: buildRequiredError(), next: nextVi, lang: 'vi' });
    const viError = (nextVi as jest.Mock).mock.calls[0][0];
    expect(viError).toBeInstanceOf(ValidationError);
    expect(viError.errors).toEqual(['Ngày sinh là bắt buộc']);

    const nextEn = jest.fn() as NextFunction;
    handleError({ err: buildRequiredError(), next: nextEn, lang: 'en' });
    const enError = (nextEn as jest.Mock).mock.calls[0][0];
    expect(enError.errors).toEqual(['Date of birth is required']);
  });
});

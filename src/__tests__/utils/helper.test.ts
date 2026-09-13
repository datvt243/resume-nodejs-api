/**
 * Tests for utils/helper.ts::handleError
 */

import { NextFunction } from 'express';
import { handleError } from '@/utils/helper';
import { ConflictError } from '@/errors';

describe('handleError', () => {
  it('converts a Mongo duplicate-key error on `slug` into a ConflictError (issue #120)', () => {
    // Same shape MongoDB throws when `Candidate.updateOne` hits the new
    // unique index on `slug` (candidate.model.ts) — e.g. PATCH
    // /api/v1/candidate/update with a slug another candidate already owns.
    const duplicateSlugError = { code: 11000, keyValue: { slug: 'jane-doe-ab12' } };
    const next = jest.fn() as NextFunction;

    handleError(duplicateSlugError, next);

    expect(next).toHaveBeenCalledTimes(1);
    const passedError = (next as jest.Mock).mock.calls[0][0];
    expect(passedError).toBeInstanceOf(ConflictError);
    expect(passedError.statusCode).toBe(409);
    expect(passedError.message).toContain('slug');
  });

  it('still converts a duplicate-key error on `email` the same way (regression check)', () => {
    const duplicateEmailError = { code: 11000, keyValue: { email: 'existing@example.com' } };
    const next = jest.fn() as NextFunction;

    handleError(duplicateEmailError, next);

    const passedError = (next as jest.Mock).mock.calls[0][0];
    expect(passedError).toBeInstanceOf(ConflictError);
    expect(passedError.message).toContain('email');
  });
});

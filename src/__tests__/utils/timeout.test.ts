/**
 * A DB/Redis timeout answers 503 SERVICE_UNAVAILABLE, and the CRUD factory
 * no longer turns it into a `{ success:false }` 400.
 */
import type { Model } from 'mongoose';
import { withTimeout } from '@/utils/timeout';
import { AppError, ERROR_STATUS, ErrorCode } from '@/errors';
import { createCrudService } from '@/candidate_profile/BaseService';
import * as services from '@/services';

jest.mock('@/services', () => ({ ...jest.requireActual('@/services'), baseUpdateDocument: jest.fn() }));

const never = () => new Promise<never>(() => {});

describe('withTimeout', () => {
  afterEach(() => jest.useRealTimers());

  it('rejects with a 503 SERVICE_UNAVAILABLE AppError', async () => {
    await expect(withTimeout({ promise: never(), ms: 5 })).rejects.toMatchObject({ statusCode: 503, errorCode: ErrorCode.SERVICE_UNAVAILABLE });
  });

  it('propagates a DB timeout out of the CRUD factory instead of answering success:false', async () => {
    jest.useFakeTimers();
    jest.mocked(services.baseUpdateDocument).mockReturnValue(never());
    const { handlerUpdate } = createCrudService({ model: {} as Model<services.CrudDocument> });

    const pending = handlerUpdate({ item: { _id: '1' }, userID: 'c1' });
    jest.advanceTimersByTime(5000);

    await expect(pending).rejects.toMatchObject({ statusCode: 503 });
  });
});

describe('ERROR_STATUS', () => {
  it('is the only source of an AppError status', () => {
    for (const code of Object.values(ErrorCode)) {
      expect(new AppError({ message: 'x', errorCode: code }).statusCode).toBe(ERROR_STATUS[code]);
    }
    expect(ERROR_STATUS[ErrorCode.NOT_FOUND]).toBe(404);
    expect(ERROR_STATUS[ErrorCode.FORBIDDEN]).toBe(403);
    expect(ERROR_STATUS[ErrorCode.SERVICE_UNAVAILABLE]).toBe(503);
    expect(ERROR_STATUS[ErrorCode.EMAIL_EXISTS]).toBe(409);
  });
});

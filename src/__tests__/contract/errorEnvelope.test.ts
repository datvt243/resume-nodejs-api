/**
 * Contract: every way the API writes an error produces
 * `{ success:false, error:{ code, message, details? } }` and nothing else,
 * and every success body is `{ success:true, message, data, meta? }`.
 */
import Joi from 'joi';
import { formatReturn, sendError } from '@/utils/helper';
import { ok } from '@/utils/response';
import { AppError, ErrorCode } from '@/errors';
import { createRateLimiter, memStore } from '@/middlewares/rateLimit.middleware';
import { createCrudController } from '@/candidate_profile/BaseController';
import { errorsMiddleware } from '@/middlewares/errors.middleware';

jest.mock('@/services/redis', () => ({ isRedisAvailable: jest.fn(() => false), getRedisClient: jest.fn(() => null) }));

const mockRes = () => {
  const json = jest.fn();
  const res: any = { status: jest.fn().mockReturnValue({ json }), setHeader: jest.fn() };
  return { res, json, body: () => json.mock.calls[0][0], status: () => res.status.mock.calls[0][0] };
};

const expectEnvelope = (body: any, code: string) => {
  expect(Object.keys(body).sort()).toEqual(['error', 'success']);
  expect(body.success).toBe(false);
  expect(body.error.code).toBe(code);
  expect(typeof body.error.message).toBe('string');
  for (const key of Object.keys(body.error)) expect(['code', 'message', 'details']).toContain(key);
  if (body.error.details) for (const d of body.error.details) expect(Object.keys(d).sort()).toEqual(['field', 'message']);
};

describe('error envelope', () => {
  it.each([
    [400, undefined, undefined, 'BAD_REQUEST'],
    [400, [{ field: 'name', message: 'Name is required' }], undefined, 'VALIDATION_ERROR'],
    [401, undefined, ErrorCode.NO_TOKEN, 'NO_TOKEN'],
    [400, undefined, ErrorCode.FILE_INVALID_TYPE, 'FILE_INVALID_TYPE'],
    [403, undefined, undefined, 'FORBIDDEN'],
    [404, undefined, undefined, 'NOT_FOUND'],
    [409, undefined, undefined, 'CONFLICT'],
  ])('formatReturn failure %i (details %j, code %s) → %s envelope', (statusCode, errors, errorCode, code) => {
    const { res, body, status } = mockRes();
    formatReturn(res, { success: false, statusCode, message: 'm', errors: errors ?? null, ...(errorCode && { errorCode }) });
    expect(status()).toBe(statusCode);
    expectEnvelope(body(), code);
    if (errors) expect(body().error.details).toEqual(errors);
  });

  it('a thrown AppError and an unexpected Error go through the same writer', () => {
    const known = mockRes();
    sendError(known.res, new AppError({ message: 'gone', errorCode: ErrorCode.NOT_FOUND }), 'en');
    expectEnvelope(known.body(), 'NOT_FOUND');

    const unknown = mockRes();
    sendError(unknown.res, new Error('driver text'), 'en');
    expect(unknown.status()).toBe(500);
    expectEnvelope(unknown.body(), 'INTERNAL_SERVER_ERROR');
    expect(unknown.body().error.message).not.toContain('driver text');
  });

  it('429 from the rate limiter → RATE_LIMITED envelope', async () => {
    memStore.clear();
    const limiter = createRateLimiter({ max: 0, windowMs: 60_000, keyPrefix: 'contract' });
    const { res, body, status } = mockRes();
    // The limiter is typed as a plain RequestHandler but is async underneath.
    await Promise.resolve(limiter({ ip: '9.9.9.9', socket: {}, path: '/x', lang: 'en' } as any, res, jest.fn()));
    expect(status()).toBe(429);
    expectEnvelope(body(), 'RATE_LIMITED');
  });

  it('nested Joi validation → VALIDATION_ERROR with the full dotted field path', async () => {
    const schema = Joi.object({ candidateId: Joi.string(), items: Joi.array().items(Joi.object({ company: Joi.string().required() })) });
    const { fnCreate } = createCrudController({ schema, service: { handlerCreate: jest.fn(), handlerUpdate: jest.fn() } });
    const { res, body, status } = mockRes();
    const next = jest.fn();
    await fnCreate({ body: { candidateId: 'c1', items: [{ company: 'A' }, {}, {}, {}] }, lang: 'en' } as any, res, next);
    if (next.mock.calls[0]) errorsMiddleware(next.mock.calls[0][0], {} as any, res, jest.fn());

    expect(status()).toBe(400);
    expectEnvelope(body(), 'VALIDATION_ERROR');
    expect(body().error.details.map((d: any) => d.field)).toEqual(['items.1.company', 'items.2.company', 'items.3.company']);
  });
});

describe('success envelope', () => {
  it('formatReturn success carries only success, message and data', () => {
    const { res, body } = mockRes();
    formatReturn(res, { success: true, message: 'ok', data: { a: 1 } });
    expect(body()).toEqual({ success: true, message: 'ok', data: { a: 1 } });
  });

  it('ok() with meta adds meta and nothing else', () => {
    const { res, body } = mockRes();
    const meta = { page: 1, limit: 0, total: 0, totalPages: 1 };
    ok(res, [], '', meta);
    expect(body()).toEqual({ success: true, message: '', data: [], meta });
  });
});

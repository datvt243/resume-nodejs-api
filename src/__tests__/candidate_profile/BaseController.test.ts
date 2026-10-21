/**
 * Tests for candidate_profile/BaseController.ts's baseGetAll — specifically
 * the page/limit/sort query-string parsing added for issue #73. Also covers
 * createCrudController's fnBulkCreate (issue #161).
 */
import Joi from 'joi';
import { baseGetAll, createCrudController } from '@/candidate_profile/BaseController';
import * as services from '@/services';
import { BadRequestError } from '@/errors';

jest.mock('@/services');

const mockedBaseFindDocument = services.baseFindDocument as jest.MockedFunction<typeof services.baseFindDocument>;

function createMocks(query: Record<string, any> = {}) {
  const req: any = { body: { candidateId: 'c1', collection: 'experiences' }, query };
  const json = jest.fn();
  const res: any = { status: jest.fn().mockReturnValue({ json }), json };
  const next = jest.fn();
  return { req, res, next };
}

describe('baseGetAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBaseFindDocument.mockResolvedValue({ success: true, message: '', errors: null, data: [] });
  });

  it('passes page/limit/sort through as numbers/string when present', async () => {
    const { req, res, next } = createMocks({ page: '2', limit: '10', sort: '-createdAt' });
    await baseGetAll(req, res, next);

    expect(mockedBaseFindDocument).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10, sort: '-createdAt' }),
    );
  });

  it('omits page/limit/sort when the query string has none (backward compatible)', async () => {
    const { req, res, next } = createMocks();
    await baseGetAll(req, res, next);

    expect(mockedBaseFindDocument).toHaveBeenCalledWith(
      expect.objectContaining({ page: undefined, limit: undefined, sort: undefined }),
    );
  });

  it('silently drops a sort value that could smuggle a Mongo operator', async () => {
    const { req, res, next } = createMocks({ sort: '$where' });
    await baseGetAll(req, res, next);

    expect(mockedBaseFindDocument).toHaveBeenCalledWith(expect.objectContaining({ sort: undefined }));
  });

  it('accepts a leading "-" in sort for descending order', async () => {
    const { req, res, next } = createMocks({ sort: '-startDate' });
    await baseGetAll(req, res, next);

    expect(mockedBaseFindDocument).toHaveBeenCalledWith(expect.objectContaining({ sort: '-startDate' }));
  });
});

describe('createCrudController -> fnBulkCreate (issue #161)', () => {
  const schema = Joi.object({
    _id: Joi.string().optional(),
    name: Joi.string().min(2).required(),
    candidateId: Joi.string().required(),
  });

  function createBulkMocks(body: Record<string, any>, userId = 'user-1') {
    const req: any = { body, user: { _id: userId }, lang: 'en' };
    const json = jest.fn();
    const res: any = { status: jest.fn().mockReturnValue({ json }), json };
    const next = jest.fn();
    return { req, res, next, json };
  }

  it('rejects with 400 when items is missing or not an array', async () => {
    const handlerCreate = jest.fn();
    const { fnBulkCreate } = createCrudController({ schema, service: { handlerCreate, handlerUpdate: jest.fn() } });
    const { req, res, next, json } = createBulkMocks({});

    await fnBulkCreate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(handlerCreate).not.toHaveBeenCalled();
  });

  it('rejects with 400 when items exceeds the 100-item cap', async () => {
    const handlerCreate = jest.fn();
    const { fnBulkCreate } = createCrudController({ schema, service: { handlerCreate, handlerUpdate: jest.fn() } });
    const items = Array.from({ length: 101 }, (_, i) => ({ name: `item-${i}` }));
    const { req, res, next } = createBulkMocks({ items });

    await fnBulkCreate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(handlerCreate).not.toHaveBeenCalled();
  });

  it('forces candidateId from the authenticated user onto every item, ignoring a client-supplied value (IDOR-safe)', async () => {
    const handlerCreate = jest.fn().mockResolvedValue({ success: true, message: 'ok', data: { _id: 'new1' } });
    const { fnBulkCreate } = createCrudController({ schema, service: { handlerCreate, handlerUpdate: jest.fn() } });
    const { req, res, next } = createBulkMocks({ items: [{ name: 'Valid Name', candidateId: 'someone-elses-id' }] }, 'real-user');

    await fnBulkCreate(req, res, next);

    expect(handlerCreate).toHaveBeenCalledWith(expect.objectContaining({ candidateId: 'real-user' }), 'en');
  });

  it('is best-effort: one invalid item does not block the others, and results/summary are still returned on partial failure', async () => {
    const handlerCreate = jest.fn().mockResolvedValue({ success: true, message: 'ok', data: { _id: 'created' } });
    const { fnBulkCreate } = createCrudController({ schema, service: { handlerCreate, handlerUpdate: jest.fn() } });
    const items = [{ name: 'Valid Name' }, { name: 'x' }]; // 'x' fails min(2)
    const { req, res, next, json } = createBulkMocks({ items });

    await fnBulkCreate(req, res, next);

    expect(handlerCreate).toHaveBeenCalledTimes(1); // only the valid item reaches the service
    expect(res.status).toHaveBeenCalledWith(201);
    const payload = json.mock.calls[0][0];
    // Envelope success stays true on partial failure so `data` isn't nulled
    // out by formatResponse() (utils/helper.ts) — see the comment on
    // fnBulkCreate itself for why.
    expect(payload.success).toBe(true);
    expect(payload.data.summary).toEqual({ total: 2, succeeded: 1, failed: 1 });
    expect(payload.data.results[0]).toEqual(expect.objectContaining({ index: 0, success: true }));
    expect(payload.data.results[1]).toEqual(expect.objectContaining({ index: 1, success: false }));
  });

  it('reports summary.failed: 0 when every item succeeds', async () => {
    const handlerCreate = jest.fn().mockResolvedValue({ success: true, message: 'ok', data: { _id: 'created' } });
    const { fnBulkCreate } = createCrudController({ schema, service: { handlerCreate, handlerUpdate: jest.fn() } });
    const items = [{ name: 'Alpha' }, { name: 'Beta' }];
    const { req, res, next, json } = createBulkMocks({ items });

    await fnBulkCreate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    const payload = json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.data.summary).toEqual({ total: 2, succeeded: 2, failed: 0 });
  });
});

describe('createCrudController status codes', () => {
  const schema = Joi.object({ name: Joi.string().min(2).required(), candidateId: Joi.string().required() });

  function createMocks(body: Record<string, any>) {
    const req: any = { body, user: { _id: 'user-1' }, lang: 'en' };
    const json = jest.fn();
    const res: any = { status: jest.fn().mockReturnValue({ json }), json };
    return { req, res, next: jest.fn(), json };
  }

  it('fnCreate never answers 2xx for a failed create: the thrown AppError goes to errorsMiddleware', async () => {
    const failure = new BadRequestError('Create failed');
    const handlerCreate = jest.fn().mockRejectedValue(failure);
    const { fnCreate } = createCrudController({ schema, service: { handlerCreate, handlerUpdate: jest.fn() } });
    const { req, res, next } = createMocks({ name: 'Valid Name', candidateId: 'user-1' });

    await fnCreate(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(failure);
    expect(failure.statusCode).toBe(400);
  });

  it('fnCreate still answers a successful create with 201', async () => {
    const handlerCreate = jest.fn().mockResolvedValue({ success: true, message: 'ok', data: { _id: 'created' } });
    const { fnCreate } = createCrudController({ schema, service: { handlerCreate, handlerUpdate: jest.fn() } });
    const { req, res, next } = createMocks({ name: 'Valid Name', candidateId: 'user-1' });

    await fnCreate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('fnBulkCreate answers 400 with success:false when every item fails, keeping results/summary', async () => {
    const handlerCreate = jest.fn().mockRejectedValue(new BadRequestError('Create failed'));
    const { fnBulkCreate } = createCrudController({ schema, service: { handlerCreate, handlerUpdate: jest.fn() } });
    const { req, res, next, json } = createMocks({ items: [{ name: 'x' }, { name: 'Valid Name' }] }); // 'x' fails validation, the other fails in the service

    await fnBulkCreate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const payload = json.mock.calls[0][0];
    expect(Object.keys(payload).sort()).toEqual(['data', 'errors', 'message', 'success']);
    expect(payload.success).toBe(false);
    expect(payload.data.summary).toEqual({ total: 2, succeeded: 0, failed: 2 });
    expect(payload.data.results.map((r: any) => r.success)).toEqual([false, false]);
    expect(payload.data.results[1].message).toBe('Create failed');
  });

  it("fnBulkCreate keeps going after an item throws, and hides an unexpected error's text", async () => {
    const handlerCreate = jest
      .fn()
      .mockRejectedValueOnce(new Error('connection reset by peer'))
      .mockResolvedValueOnce({ success: true, message: 'ok', data: { _id: 'created' } });
    const { fnBulkCreate } = createCrudController({ schema, service: { handlerCreate, handlerUpdate: jest.fn() } });
    const { req, res, next, json } = createMocks({ items: [{ name: 'Valid Name' }, { name: 'Valid Name' }] });

    await fnBulkCreate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    const { results, summary } = json.mock.calls[0][0].data;
    expect(summary).toEqual({ total: 2, succeeded: 1, failed: 1 });
    expect(results[0]).toMatchObject({ index: 0, success: false });
    expect(results[0].message).not.toContain('connection reset');
    expect(next).not.toHaveBeenCalled();
  });
});

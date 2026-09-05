/**
 * Tests for services/index.ts's baseFindDocument — specifically the
 * pagination/sort support added for issue #73. Uses a fake Mongoose-shaped
 * model instead of jest.mock('@/utils/querySafe') since QuerySafe has no
 * side effects worth mocking out.
 */
import { baseFindDocument } from '@/services';

function createFakeModel(docs: Record<string, any>[]) {
  const query: any = {
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    exec: jest.fn().mockResolvedValue(docs),
  };
  // chainable: each call returns the same query object
  query.sort.mockReturnValue(query);
  query.skip.mockReturnValue(query);
  query.limit.mockReturnValue(query);

  return {
    find: jest.fn().mockReturnValue(query),
    findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(docs[0] ?? null) }),
    countDocuments: jest.fn().mockResolvedValue(docs.length),
    __query: query,
  };
}

describe('baseFindDocument', () => {
  it('fails fast when fields is empty', async () => {
    const model = createFakeModel([]);
    const result = await baseFindDocument({ model, fields: {}, findOne: false });
    expect(result.success).toBe(false);
    expect(model.find).not.toHaveBeenCalled();
  });

  it('findOne: true returns a single document via MODEL.findOne, untouched by pagination', async () => {
    const model = createFakeModel([{ _id: '1', candidateId: 'c1' }]);
    const result = await baseFindDocument({ model, fields: { candidateId: 'c1' }, findOne: true });

    expect(model.findOne).toHaveBeenCalledWith({ candidateId: 'c1' });
    expect(result).toEqual({ success: true, message: '', errors: null, data: { _id: '1', candidateId: 'c1' } });
  });

  it('findOne: false, no limit -> returns the full array unchanged (backward compatible)', async () => {
    const docs = [{ _id: '1' }, { _id: '2' }];
    const model = createFakeModel(docs);

    const result = await baseFindDocument({ model, fields: { candidateId: 'c1' }, findOne: false });

    expect(model.find).toHaveBeenCalledWith({ candidateId: 'c1' });
    expect(model.__query.skip).not.toHaveBeenCalled();
    expect(model.__query.limit).not.toHaveBeenCalled();
    expect(model.countDocuments).not.toHaveBeenCalled();
    expect(result.data).toEqual(docs);
  });

  it('findOne: false, with a valid limit -> paginates and wraps data as { items, pagination }', async () => {
    const docs = [{ _id: '1' }, { _id: '2' }];
    const model = createFakeModel(docs);

    const result = await baseFindDocument({ model, fields: { candidateId: 'c1' }, findOne: false, page: 2, limit: 2 });

    expect(model.__query.skip).toHaveBeenCalledWith(2); // (page 2 - 1) * limit 2
    expect(model.__query.limit).toHaveBeenCalledWith(2);
    expect(model.countDocuments).toHaveBeenCalledWith({ candidateId: 'c1' });
    expect(result.data).toEqual({
      items: docs,
      pagination: { page: 2, limit: 2, total: 2, totalPages: 1 },
    });
  });

  it('clamps limit to the max page size', async () => {
    const model = createFakeModel([]);
    await baseFindDocument({ model, fields: { candidateId: 'c1' }, findOne: false, limit: 9999 });

    expect(model.__query.limit).toHaveBeenCalledWith(100);
  });

  it('defaults page to 1 when page is missing or invalid', async () => {
    const model = createFakeModel([]);
    await baseFindDocument({ model, fields: { candidateId: 'c1' }, findOne: false, limit: 10, page: 0 });

    expect(model.__query.skip).toHaveBeenCalledWith(0);
  });

  it('applies sort when given, with or without pagination', async () => {
    const model = createFakeModel([]);
    await baseFindDocument({ model, fields: { candidateId: 'c1' }, findOne: false, sort: '-createdAt' });

    expect(model.__query.sort).toHaveBeenCalledWith('-createdAt');
  });
});

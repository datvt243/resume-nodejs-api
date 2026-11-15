/**
 * Manual display order for education/project: the shared sort rule, the
 * owner list using it, the reorder write path, and `order` being ignored
 * on create/update.
 */
import type { Model } from 'mongoose';
import { baseFindDocument, baseReorderDocuments, byManualOrder, CrudDocument } from '@/services';
import { baseReorder } from '@/candidate_profile/BaseController';
import { schemaEducation } from '@/candidate_profile/education/education.validate';
import { schemaProject } from '@/candidate_profile/project/project.validate';
import educationRouter from '@/routers/api/v1/education.route';
import projectRouter from '@/routers/api/v1/project.route';
import experienceRouter from '@/routers/api/v1/experience.route';

const A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const C = 'cccccccccccccccccccccccc';

const asModel = (m: unknown) => m as Model<CrudDocument>;

function createFakeModel(docs: Record<string, any>[]) {
  const query: any = { sort: jest.fn(), skip: jest.fn(), limit: jest.fn(), exec: jest.fn().mockImplementation(() => Promise.resolve([...docs])) };
  query.sort.mockReturnValue(query);
  query.skip.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return {
    find: jest.fn().mockReturnValue(query),
    countDocuments: jest.fn().mockResolvedValue(docs.length),
    updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }) }),
    __query: query,
  };
}

describe('byManualOrder', () => {
  it('puts ordered entries first ascending, then the rest by startDate newest first', () => {
    const list = [
      { _id: 'old', startDate: 100 },
      { _id: 'second', order: 1, startDate: 1 },
      { _id: 'new', startDate: 300 },
      { _id: 'first', order: 0, startDate: 2 },
      { _id: 'noDate' },
    ];
    expect(list.sort(byManualOrder).map((e) => e._id)).toEqual(['first', 'second', 'new', 'old', 'noDate']);
  });

  it('breaks a tie on order by startDate newest first', () => {
    const list = [
      { _id: 'older', order: 0, startDate: 1 },
      { _id: 'newer', order: 0, startDate: 2 },
    ];
    expect(list.sort(byManualOrder).map((e) => e._id)).toEqual(['newer', 'older']);
  });

  it('treats a null order (never reordered) like a missing one', () => {
    const list = [{ _id: 'none', order: null, startDate: 9 }, { _id: 'ordered', order: 3 }];
    expect(list.sort(byManualOrder).map((e) => e._id)).toEqual(['ordered', 'none']);
  });
});

describe('baseFindDocument with manualOrder', () => {
  const docs = [
    { _id: 'x', startDate: 1 },
    { _id: 'b', order: 0 },
    { _id: 'a', order: 1 },
  ];

  it('without limit, returns every entry in display order', async () => {
    const model = createFakeModel(docs);
    const result = await baseFindDocument({ model: asModel(model), fields: { candidateId: 'c1' }, findOne: false, manualOrder: true });
    expect((result.data as any[]).map((d) => d._id)).toEqual(['b', 'a', 'x']);
    expect(model.__query.sort).not.toHaveBeenCalled();
  });

  it('with limit, pages over the display order and counts every entry', async () => {
    const model = createFakeModel(docs);
    const result = await baseFindDocument({ model: asModel(model), fields: { candidateId: 'c1' }, findOne: false, manualOrder: true, page: 2, limit: 2 });
    expect((result.data as any[]).map((d) => d._id)).toEqual(['x']);
    expect('meta' in result && result.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('an explicit sort still wins', async () => {
    const model = createFakeModel(docs);
    const result = await baseFindDocument({ model: asModel(model), fields: { candidateId: 'c1' }, findOne: false, manualOrder: true, sort: 'startDate' });
    expect(model.__query.sort).toHaveBeenCalledWith('startDate');
    expect((result.data as any[]).map((d) => d._id)).toEqual(['x', 'b', 'a']);
  });
});

describe('baseReorderDocuments', () => {
  const owned = (ids: string[]) => createFakeModel(ids.map((_id) => ({ _id: { toString: () => _id } })));

  it('stores position i as order = i, scoped to the caller\'s non-deleted entries', async () => {
    const model = owned([A, B]);
    const result = await baseReorderDocuments({ model: asModel(model), ids: [B, A], userID: 'c1' });

    expect(result.success).toBe(true);
    expect(model.find).toHaveBeenCalledWith({ deletedAt: null, candidateId: 'c1' }, '_id');
    expect(model.updateOne).toHaveBeenCalledWith({ _id: B }, { order: 0 });
    expect(model.updateOne).toHaveBeenCalledWith({ _id: A }, { order: 1 });
  });

  it('rejects an id that is not one of the caller\'s entries at ids.<i>, writing nothing', async () => {
    const model = owned([A]);
    await expect(baseReorderDocuments({ model: asModel(model), ids: [C], userID: 'c1' })).rejects.toMatchObject({
      statusCode: 400,
      errors: [{ field: 'ids.0', message: expect.any(String) }],
    });
    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it('rejects a list missing one of the caller\'s entries on ids, writing nothing', async () => {
    const model = owned([A, B, C]);
    await expect(baseReorderDocuments({ model: asModel(model), ids: [B, A], userID: 'c1' })).rejects.toMatchObject({
      statusCode: 400,
      errors: [{ field: 'ids', message: expect.any(String) }],
    });
    expect(model.updateOne).not.toHaveBeenCalled();
  });
});

describe('baseReorder', () => {
  function createMocks(collection: string, ids: unknown) {
    const req: any = { params: { collection }, body: { candidateId: 'c1', ids }, user: { _id: 'c1' }, lang: 'en' };
    const json = jest.fn();
    const res: any = { status: jest.fn().mockReturnValue({ json }), json };
    return { req, res, next: jest.fn(), json };
  }

  it('answers 404 for experience, which has no manual order', async () => {
    const { req, res, next } = createMocks('experiences', [A]);
    await baseReorder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it.each([
    ['empty', []],
    ['not an array', 'abc'],
    ['duplicate', [A, A]],
    ['not an ObjectId', ['nope']],
  ])('answers 400 for an %s ids list', async (_label, ids) => {
    const { req, res, next } = createMocks('educations', ids);
    await baseReorder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('reorder routes', () => {
  const hasPutReorder = (router: any) => router.stack.some((layer: any) => layer.route?.path === '/reorder' && layer.route.methods.put);

  it('exist for education and project only', () => {
    expect(hasPutReorder(educationRouter)).toBe(true);
    expect(hasPutReorder(projectRouter)).toBe(true);
    expect(hasPutReorder(experienceRouter)).toBe(false);
  });
});

describe('order on create/update is accepted and ignored', () => {
  it.each([
    ['education', schemaEducation, { _id: A, school: { vi: 'X', en: 'X' }, major: { vi: 'IT', en: 'IT' }, startDate: 1, order: 5 }],
    ['project', schemaProject, { _id: A, name: 'P', description: { vi: 'Mô tả', en: 'Description' }, position: 'Backend', startDate: 1, order: 5 }],
  ])('%s schema strips order without an error', (_label, schema, item) => {
    const { error, value } = schema.validate(item);
    expect(error).toBeUndefined();
    expect(value).not.toHaveProperty('order');
  });
});

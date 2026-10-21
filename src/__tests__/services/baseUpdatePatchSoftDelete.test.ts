/**
 * Tests for services/index.ts — issue #136. baseCheckDocumentById (shared
 * by baseUpdateDocument/basePatchDocument) previously had no `deletedAt`
 * filter, so a soft-deleted CV-section document (issue #121) could still
 * be found and edited via update/patch even though it's hidden from every
 * list/get endpoint. Fake Mongoose-shaped model mimics real Mongo
 * filtering: `findOne` returns null when queried with `deletedAt: null`
 * against a document that actually has `deletedAt` set.
 */
import type { Model } from 'mongoose';
import { baseUpdateDocument, basePatchDocument, CrudDocument } from '@/services';

// Both functions are generic over a real `Model<T>` (issue #181) — this
// fake only implements the methods it actually calls, so it's cast
// through `unknown` (relaxed test policy, tracking issue #177).
const asModel = (m: ReturnType<typeof createFakeModel>) => m as unknown as Model<CrudDocument>;

function createFakeModel(doc: Record<string, any> | null) {
  return {
    findOne: jest.fn((query: any = {}) => ({
      exec: jest.fn().mockResolvedValue(query.deletedAt === null && doc?.['deletedAt'] ? null : doc),
    })),
    findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) }),
    updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }) }),
    validate: jest.fn().mockResolvedValue(undefined),
  };
}

describe('baseUpdateDocument excludes soft-deleted documents (issue #136)', () => {
  it('fails without touching the document when it has been soft-deleted', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: Date.now() });

    await expect(baseUpdateDocument({ document: { _id: '1', name: 'x' }, model: asModel(model), userID: 'c1' })).rejects.toMatchObject({ statusCode: 404, errorCode: 'NOT_FOUND' });

    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it('still updates a normal (non-deleted) document (regression check)', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: null });

    const result = await baseUpdateDocument({ document: { _id: '1', name: 'x' }, model: asModel(model), userID: 'c1' });

    expect(model.updateOne).toHaveBeenCalledWith({ _id: '1' }, { _id: '1', name: 'x' });
    expect(result.success).toBe(true);
  });

  it("answers 403 without touching another candidate's document", async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: null });

    await expect(baseUpdateDocument({ document: { _id: '1', name: 'x' }, model: asModel(model), userID: 'someone-else' })).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'FORBIDDEN',
    });

    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it('answers 404 for an id that does not exist', async () => {
    const model = createFakeModel(null);

    await expect(baseUpdateDocument({ document: { _id: 'missing', name: 'x' }, model: asModel(model), userID: 'c1' })).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('basePatchDocument excludes soft-deleted documents (issue #136)', () => {
  it('fails without touching the document when it has been soft-deleted', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: Date.now() });

    await expect(basePatchDocument({ document: { _id: '1', name: 'x' }, model: asModel(model) })).rejects.toMatchObject({ statusCode: 404, errorCode: 'NOT_FOUND' });

    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it('still patches a normal (non-deleted) document (regression check)', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: null });

    const result = await basePatchDocument({ document: { _id: '1', name: 'x' }, model: asModel(model) });

    expect(model.updateOne).toHaveBeenCalledWith({ _id: '1' }, { _id: '1', name: 'x' });
    expect(result.success).toBe(true);
  });
});

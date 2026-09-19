/**
 * Tests for services/index.ts — issue #136. baseCheckDocumentById (shared
 * by baseUpdateDocument/basePatchDocument) previously had no `deletedAt`
 * filter, so a soft-deleted CV-section document (issue #121) could still
 * be found and edited via update/patch even though it's hidden from every
 * list/get endpoint. Fake Mongoose-shaped model mimics real Mongo
 * filtering: `findOne` returns null when queried with `deletedAt: null`
 * against a document that actually has `deletedAt` set.
 */
import { baseUpdateDocument, basePatchDocument } from '@/services';

function createFakeModel(doc: Record<string, any> | null) {
  return {
    findOne: jest.fn((query: any = {}) => ({
      exec: jest.fn().mockResolvedValue(query.deletedAt === null && doc?.deletedAt ? null : doc),
    })),
    findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) }),
    updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }) }),
    validate: jest.fn().mockResolvedValue(undefined),
  };
}

describe('baseUpdateDocument excludes soft-deleted documents (issue #136)', () => {
  it('fails without touching the document when it has been soft-deleted', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: Date.now() });

    const result = await baseUpdateDocument({ document: { _id: '1', name: 'x' }, model, userID: 'c1' });

    expect(model.updateOne).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  it('still updates a normal (non-deleted) document (regression check)', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: null });

    const result = await baseUpdateDocument({ document: { _id: '1', name: 'x' }, model, userID: 'c1' });

    expect(model.updateOne).toHaveBeenCalledWith({ _id: '1' }, { _id: '1', name: 'x' });
    expect(result.success).toBe(true);
  });
});

describe('basePatchDocument excludes soft-deleted documents (issue #136)', () => {
  it('fails without touching the document when it has been soft-deleted', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: Date.now() });

    const result = await basePatchDocument({ document: { _id: '1', name: 'x' }, model });

    expect(model.updateOne).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  it('still patches a normal (non-deleted) document (regression check)', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: null });

    const result = await basePatchDocument({ document: { _id: '1', name: 'x' }, model });

    expect(model.updateOne).toHaveBeenCalledWith({ _id: '1' }, { _id: '1', name: 'x' });
    expect(result.success).toBe(true);
  });
});

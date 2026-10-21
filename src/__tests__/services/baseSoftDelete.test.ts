/**
 * Tests for services/index.ts's soft-delete + restore pair added for
 * issue #121 — baseDeleteDocument now marks `deletedAt` instead of hard
 * deleting, and baseRestoreDocument reverses it. Uses a fake
 * Mongoose-shaped model, same style as baseFindDocument.test.ts.
 */
import type { Model } from 'mongoose';
import { baseDeleteDocument, baseRestoreDocument, CrudDocument } from '@/services';

// Both functions are generic over a real `Model<T>` (issue #181) — this
// fake only implements the 2 methods it actually calls, so it's cast
// through `unknown` (relaxed test policy, tracking issue #177).
const asModel = (m: ReturnType<typeof createFakeModel>) => m as unknown as Model<CrudDocument>;

function createFakeModel(existingDoc: Record<string, any> | null, updateResult: Record<string, any> = { modifiedCount: 1 }) {
  return {
    findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(existingDoc) }),
    updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(updateResult) }),
  };
}

describe('baseDeleteDocument (soft-delete, issue #121)', () => {
  it('sets deletedAt instead of removing the document, when the owner matches', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1' });

    const result = await baseDeleteDocument({ model: asModel(model), _id: '1', name: '', userID: 'c1' });

    expect(model.updateOne).toHaveBeenCalledWith({ _id: '1' }, { deletedAt: expect.any(Number) });
    expect(result.success).toBe(true);
  });

  it('fails without touching the document when the caller is not the owner', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1' });

    await expect(baseDeleteDocument({ model: asModel(model), _id: '1', name: '', userID: 'someone-else' })).rejects.toMatchObject({ statusCode: 403, errorCode: 'FORBIDDEN' });

    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it('fails when the document does not exist', async () => {
    const model = createFakeModel(null);

    await expect(baseDeleteDocument({ model: asModel(model), _id: 'missing', name: '', userID: 'c1' })).rejects.toMatchObject({ statusCode: 404, errorCode: 'NOT_FOUND' });

    expect(model.updateOne).not.toHaveBeenCalled();
  });
});

describe('baseRestoreDocument (issue #121)', () => {
  it('clears deletedAt when the owner matches, even for an already soft-deleted document', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: Date.now() });

    const result = await baseRestoreDocument({ model: asModel(model), _id: '1', name: '', userID: 'c1' });

    expect(model.updateOne).toHaveBeenCalledWith({ _id: '1' }, { deletedAt: null });
    expect(result.success).toBe(true);
  });

  it('fails without touching the document when the caller is not the owner', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: Date.now() });

    await expect(baseRestoreDocument({ model: asModel(model), _id: '1', name: '', userID: 'someone-else' })).rejects.toMatchObject({ statusCode: 403, errorCode: 'FORBIDDEN' });

    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it('fails when the document does not exist', async () => {
    const model = createFakeModel(null);

    await expect(baseRestoreDocument({ model: asModel(model), _id: 'missing', name: '', userID: 'c1' })).rejects.toMatchObject({ statusCode: 404, errorCode: 'NOT_FOUND' });

    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it('answers 404, never a "restored successfully" message, when the document was not soft-deleted', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: null }, { modifiedCount: 0 });

    await expect(baseRestoreDocument({ model: asModel(model), _id: '1', name: '', userID: 'c1' })).rejects.toMatchObject({ statusCode: 404 });
  });
});

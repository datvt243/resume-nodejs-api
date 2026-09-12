/**
 * Tests for services/index.ts's soft-delete + restore pair added for
 * issue #121 — baseDeleteDocument now marks `deletedAt` instead of hard
 * deleting, and baseRestoreDocument reverses it. Uses a fake
 * Mongoose-shaped model, same style as baseFindDocument.test.ts.
 */
import { baseDeleteDocument, baseRestoreDocument } from '@/services';

function createFakeModel(existingDoc: Record<string, any> | null, updateResult: Record<string, any> = { modifiedCount: 1 }) {
  return {
    findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(existingDoc) }),
    updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(updateResult) }),
  };
}

describe('baseDeleteDocument (soft-delete, issue #121)', () => {
  it('sets deletedAt instead of removing the document, when the owner matches', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1' });

    const result = await baseDeleteDocument({ model, _id: '1', name: '', userID: 'c1' });

    expect(model.updateOne).toHaveBeenCalledWith({ _id: '1' }, { deletedAt: expect.any(Number) });
    expect(result.success).toBe(true);
  });

  it('fails without touching the document when the caller is not the owner', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1' });

    const result = await baseDeleteDocument({ model, _id: '1', name: '', userID: 'someone-else' });

    expect(model.updateOne).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  it('fails when the document does not exist', async () => {
    const model = createFakeModel(null);

    const result = await baseDeleteDocument({ model, _id: 'missing', name: '', userID: 'c1' });

    expect(model.updateOne).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });
});

describe('baseRestoreDocument (issue #121)', () => {
  it('clears deletedAt when the owner matches, even for an already soft-deleted document', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: Date.now() });

    const result = await baseRestoreDocument({ model, _id: '1', name: '', userID: 'c1' });

    expect(model.updateOne).toHaveBeenCalledWith({ _id: '1' }, { deletedAt: null });
    expect(result.success).toBe(true);
  });

  it('fails without touching the document when the caller is not the owner', async () => {
    const model = createFakeModel({ _id: '1', candidateId: 'c1', deletedAt: Date.now() });

    const result = await baseRestoreDocument({ model, _id: '1', name: '', userID: 'someone-else' });

    expect(model.updateOne).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  it('fails when the document does not exist', async () => {
    const model = createFakeModel(null);

    const result = await baseRestoreDocument({ model, _id: 'missing', name: '', userID: 'c1' });

    expect(model.updateOne).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });
});

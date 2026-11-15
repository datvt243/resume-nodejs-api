/**
 * Tests for candidate_profile/profile/profile.service.ts's ensureDefaultProfile
 * (issue #133) — the "default profile = all existing data, no data loss"
 * synthesis logic. The generic CRUD handlers (handlerGet/Create/Update/Delete)
 * come from createCrudService, already covered generically elsewhere
 * (BaseController.test.ts, services/*.test.ts) — not retested per-section.
 */

import { Types } from 'mongoose';
import ProfileModel from '@/models/profile.model';
import * as MODELS from '@/models';
import { ensureDefaultProfile, handlerCreate, handlerUpdate } from '@/candidate_profile/profile/profile.service';
import { ValidationError } from '@/errors';

const mockCrudCreate = jest.fn();
const mockCrudUpdate = jest.fn();
jest.mock('@/candidate_profile/BaseService', () => ({
  createCrudService: () => ({ handlerGet: jest.fn(), handlerDelete: jest.fn(), handlerCreate: (...a: unknown[]) => mockCrudCreate(...a), handlerUpdate: (...a: unknown[]) => mockCrudUpdate(...a) }),
}));

jest.mock('@/models/profile.model', () => ({
  countDocuments: jest.fn(),
  create: jest.fn(),
}));

jest.mock('@/models', () => ({
  Education: { find: jest.fn() },
  Experience: { find: jest.fn() },
  Project: { find: jest.fn() },
  Certificate: { find: jest.fn() },
  Award: { find: jest.fn() },
  Reference: { find: jest.fn() },
}));

describe('profile.service.ts ensureDefaultProfile (issue #133)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when the candidate already has a profile', async () => {
    (ProfileModel.countDocuments as jest.Mock).mockResolvedValue(1);

    await ensureDefaultProfile('cand1');

    expect(ProfileModel.create).not.toHaveBeenCalled();
    expect(MODELS.Education.find).not.toHaveBeenCalled();
  });

  it('synthesizes a "Tổng hợp" profile from every existing section item when none exists yet', async () => {
    (ProfileModel.countDocuments as jest.Mock).mockResolvedValue(0);

    const mockFind = (ids: string[]) => ({ exec: jest.fn().mockResolvedValue(ids.map((_id) => ({ _id }))) });
    (MODELS.Education.find as jest.Mock).mockReturnValue(mockFind(['edu1']));
    (MODELS.Experience.find as jest.Mock).mockReturnValue(mockFind(['exp1', 'exp2']));
    (MODELS.Project.find as jest.Mock).mockReturnValue(mockFind([]));
    (MODELS.Certificate.find as jest.Mock).mockReturnValue(mockFind([]));
    (MODELS.Award.find as jest.Mock).mockReturnValue(mockFind([]));
    (MODELS.Reference.find as jest.Mock).mockReturnValue(mockFind(['ref1']));

    await ensureDefaultProfile('cand1');

    expect(MODELS.Education.find).toHaveBeenCalledWith({ candidateId: 'cand1', deletedAt: null }, '_id');
    expect(ProfileModel.create).toHaveBeenCalledWith({
      _id: expect.any(Types.ObjectId),
      candidateId: 'cand1',
      name: 'Tổng hợp',
      educationIds: ['edu1'],
      experienceIds: ['exp1', 'exp2'],
      projectIds: [],
      certificateIds: [],
      awardIds: [],
      referenceIds: ['ref1'],
    });
  });

  it('passes a document the real Profile schema accepts with an _id (issue #224)', async () => {
    (ProfileModel.countDocuments as jest.Mock).mockResolvedValue(0);
    const mockFind = { exec: jest.fn().mockResolvedValue([]) };
    [MODELS.Education, MODELS.Experience, MODELS.Project, MODELS.Certificate, MODELS.Award, MODELS.Reference].forEach((model) =>
      (model.find as jest.Mock).mockReturnValue(mockFind),
    );

    await ensureDefaultProfile(new Types.ObjectId().toString());

    // the real model redeclares `_id: ObjectId` (no auto-generation) — a
    // doc built from these args without an _id fails on save()
    const RealProfile = jest.requireActual<{ default: typeof ProfileModel }>('@/models/profile.model').default;
    const [args] = (ProfileModel.create as jest.Mock).mock.calls[0] as [Record<string, unknown>];
    const doc = new RealProfile(args);
    expect(doc._id).toBeInstanceOf(Types.ObjectId);
    expect(doc.validateSync()).toBeUndefined();
  });
});

describe('profile.service.ts section-id ownership check (issue #405)', () => {
  const candidateId = new Types.ObjectId().toString();
  const owned = new Types.ObjectId().toString();
  const foreign = new Types.ObjectId().toString();
  const empty = { educationIds: [], experienceIds: [], projectIds: [], certificateIds: [], awardIds: [], referenceIds: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    // every section only ever owns `owned`; the query filter decides nothing in a mock, so filter by $in here
    [MODELS.Education, MODELS.Experience, MODELS.Project, MODELS.Certificate, MODELS.Award, MODELS.Reference].forEach((model) =>
      (model.find as jest.Mock).mockImplementation((query: { _id: { $in: string[] } }) => ({
        exec: jest.fn().mockResolvedValue(query._id.$in.filter((id) => id.toLowerCase() === owned).map((id) => ({ _id: new Types.ObjectId(id) }))),
      })),
    );
  });

  it('creates when every listed id is an owned, non-deleted entry', async () => {
    mockCrudCreate.mockResolvedValue({ data: {} });
    const item = { ...empty, name: 'x', candidateId, educationIds: [owned], awardIds: [owned.toUpperCase()] };

    await handlerCreate(item);

    expect((MODELS.Education.find as jest.Mock).mock.calls).toEqual([[{ candidateId, _id: { $in: [owned] }, deletedAt: null }, '_id']]);
    expect((MODELS.Project.find as jest.Mock).mock.calls).toHaveLength(0);
    expect(mockCrudCreate).toHaveBeenCalledWith(item, 'vi');
  });

  it('rejects unknown/foreign/deleted ids with 400 details per field.index, never creating', async () => {
    const item = { ...empty, name: 'x', candidateId, educationIds: [owned, foreign], referenceIds: [foreign] };

    const err = await handlerCreate(item).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).statusCode).toBe(400);
    expect((err as ValidationError).errors).toEqual([
      { field: 'educationIds.1', message: expect.any(String) },
      { field: 'referenceIds.0', message: expect.any(String) },
    ]);
    expect(mockCrudCreate).not.toHaveBeenCalled();
  });

  it('applies the same check on update', async () => {
    const item = { ...empty, _id: new Types.ObjectId().toString(), name: 'x', candidateId, projectIds: [foreign] };

    await expect(handlerUpdate({ item, userID: candidateId })).rejects.toBeInstanceOf(ValidationError);
    expect(mockCrudUpdate).not.toHaveBeenCalled();

    mockCrudUpdate.mockResolvedValue({ data: {} });
    await handlerUpdate({ item: { ...item, projectIds: [owned] }, userID: candidateId });
    expect(mockCrudUpdate).toHaveBeenCalled();
  });
});

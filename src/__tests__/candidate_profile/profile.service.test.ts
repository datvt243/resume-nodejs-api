/**
 * Tests for candidate_profile/profile/profile.service.ts's ensureDefaultProfile
 * (issue #133) — the "default profile = all existing data, no data loss"
 * synthesis logic. The generic CRUD handlers (handlerGet/Create/Update/Delete)
 * come from createCrudService, already covered generically elsewhere
 * (BaseController.test.ts, services/*.test.ts) — not retested per-section.
 */

import ProfileModel from '@/models/profile.model';
import * as MODELS from '@/models';
import { ensureDefaultProfile } from '@/candidate_profile/profile/profile.service';

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
});

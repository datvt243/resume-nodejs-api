/**
 * Regression coverage for issue #152 — GET /api/v1/candidate/:email and
 * PUT/PATCH /candidate/update used to leak the raw bcrypt password hash.
 * Root cause was 2 independent bugs in src/candidate/candidate.service.ts:
 * handlerGetInformationByEmail had no .select() at all, and
 * handlerGetInformationById double-wrapped an already-whitelisted,
 * space-joined select string in candidateQuerySafe.whitelistSelect([select])
 * (treating the whole string as one field name, which never matched the
 * allow-list, silently making the select a no-op). Both were already fixed
 * on `staging` (commit f355e2f, 2026-08-21) — this just closes the missing
 * regression-test gap.
 */
import fs from 'fs';
import * as MODELS from '@/models';
import { invalidateAllSessions } from '@/utils/sessionRevocation';
import { handlerGetInformationByEmail, handlerGetInformationById, handlerDelete, handlerDeleteVisits, handlerGetVisits } from '@/candidate/candidate.service';

jest.mock('@/models', () => ({
  Candidate: { findOne: jest.fn(), findById: jest.fn(), deleteOne: jest.fn() },
  generalInformation: { deleteMany: jest.fn() },
  Experience: { deleteMany: jest.fn() },
  Education: { deleteMany: jest.fn() },
  Reference: { deleteMany: jest.fn() },
  Project: { deleteMany: jest.fn(), find: jest.fn() },
  Certificate: { deleteMany: jest.fn(), find: jest.fn() },
  Award: { deleteMany: jest.fn(), find: jest.fn() },
  Application: { deleteMany: jest.fn() },
  Profile: { deleteMany: jest.fn() },
  Visit: { deleteMany: jest.fn(), find: jest.fn(), countDocuments: jest.fn() },
}));

jest.mock('@/utils/sessionRevocation', () => ({ invalidateAllSessions: jest.fn().mockResolvedValue(true) }));

describe('candidate.service.ts password exclusion (issue #152)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handlerGetInformationByEmail', () => {
    it('always excludes the password field via .select(\'-password\')', async () => {
      const select = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1', email: 'a@b.com' }) });
      (MODELS.Candidate.findOne as jest.Mock).mockReturnValue({ select });

      await handlerGetInformationByEmail('a@b.com');

      expect(select).toHaveBeenCalledWith('-password');
    });

    it.each(['a$b@x.com', '   '])('returns null without querying when safeQuery drops the email %p (#380)', async (email) => {
      await expect(handlerGetInformationByEmail(email)).resolves.toBeNull();
      expect((MODELS.Candidate.findOne as jest.Mock).mock.calls).toHaveLength(0);
    });
  });

  describe('handlerGetInformationById', () => {
    it('defaults to excluding password when no explicit select is given', async () => {
      const select = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
      (MODELS.Candidate.findById as jest.Mock).mockReturnValue({ select });

      await handlerGetInformationById('1');

      expect(select).toHaveBeenCalledWith('-password');
    });

    it('uses the given whitelisted select string as-is, without re-wrapping it (no more double-wrap no-op)', async () => {
      const select = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
      (MODELS.Candidate.findById as jest.Mock).mockReturnValue({ select });

      await handlerGetInformationById('1', { select: 'firstName lastName phone' });

      expect(select).toHaveBeenCalledWith('firstName lastName phone');
    });
  });
});

/**
 * Regression coverage for issue #158 — candidate self-delete cascade. The
 * feature itself (DELETE /api/v1/candidate -> fnDelete -> handlerDelete)
 * was already live since commit 32953ed ("add DELETE /api/v1/candidate for
 * self-service account deletion") with no matching diagram node/evidence
 * note at the time (bookkeeping-gap backfill, same pattern as
 * fix-idor-broken-access-control/fix-candidate-password-leak) — this closes
 * the missing regression-test gap called out in the issue's own 4th
 * acceptance criterion ("Regression test covers the cascade across all
 * section models").
 */
const CV_SECTION_MODEL_KEYS = [
  'generalInformation',
  'Experience',
  'Education',
  'Reference',
  'Project',
  'Certificate',
  'Award',
  'Application',
  'Profile',
] as const;

describe('candidate.service.ts handlerDelete (issue #158)', () => {
  // jest.mock('fs') (module-level, hoisted above imports) would auto-mock
  // fs BEFORE bcrypt's own node-pre-gyp native-binding resolution runs at
  // import time (candidate.service.ts -> utils/index.ts -> utils/bcrypt.ts
  // -> bcrypt) -- broke the whole suite with "package.json does not
  // exist" the first time this was tried. jest.spyOn (a real statement,
  // not hoisted) runs after imports already resolved, so it's safe.
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
    for (const key of CV_SECTION_MODEL_KEYS) {
      (MODELS as any)[key].deleteMany.mockResolvedValue({ deletedCount: 1 });
    }
    (MODELS.Project.find as jest.Mock).mockResolvedValue([]);
    (MODELS.Certificate.find as jest.Mock).mockResolvedValue([]);
    (MODELS.Award.find as jest.Mock).mockResolvedValue([]);
    (MODELS.Candidate.deleteOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
    (MODELS.Visit.deleteMany as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 0 }) });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns idNotFound and deletes nothing when the candidate does not exist', async () => {
    (MODELS.Candidate.findById as jest.Mock).mockResolvedValue(null);

    const result = await handlerDelete('missing-id');

    expect(result.success).toBe(false);
    expect(MODELS.Candidate.deleteOne).not.toHaveBeenCalled();
    for (const key of CV_SECTION_MODEL_KEYS) {
      expect((MODELS as any)[key].deleteMany).not.toHaveBeenCalled();
    }
    expect((MODELS as any).Visit.deleteMany).not.toHaveBeenCalled();
    expect(invalidateAllSessions).not.toHaveBeenCalled();
  });

  it("hard-deletes the candidate's visits and revokes every session", async () => {
    (MODELS.Candidate.findById as jest.Mock).mockResolvedValue({ _id: 'cand5' });

    await handlerDelete('cand5');

    expect((MODELS as any).Visit.deleteMany).toHaveBeenCalledWith({ candidateId: 'cand5' });
    expect(invalidateAllSessions).toHaveBeenCalledWith('cand5');
  });

  it('cascades deleteMany({candidateId}) across every CV section model, then deletes the candidate document itself', async () => {
    (MODELS.Candidate.findById as jest.Mock).mockResolvedValue({ _id: 'cand1' });
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const result = await handlerDelete('cand1');

    for (const key of CV_SECTION_MODEL_KEYS) {
      expect((MODELS as any)[key].deleteMany).toHaveBeenCalledWith({ candidateId: 'cand1' });
    }
    expect(MODELS.Candidate.deleteOne).toHaveBeenCalledWith({ _id: 'cand1' });
    expect(result.success).toBe(true);
  });

  it("removes the candidate's uploaded CV file from disk when one exists", async () => {
    (MODELS.Candidate.findById as jest.Mock).mockResolvedValue({ _id: 'cand2' });
    (fs.existsSync as jest.Mock).mockImplementation((p: string) => p.includes('cand2-cv.pdf'));

    await handlerDelete('cand2');

    expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('cand2-cv.pdf'));
  });

  it('never calls unlinkSync for a CV file that does not exist on disk', async () => {
    (MODELS.Candidate.findById as jest.Mock).mockResolvedValue({ _id: 'cand3' });
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await handlerDelete('cand3');

    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it('removes every project/certificate/award image file from disk, collected before those documents are deleted', async () => {
    (MODELS.Candidate.findById as jest.Mock).mockResolvedValue({ _id: 'cand4' });
    (MODELS.Project.find as jest.Mock).mockResolvedValue([{ images: ['/uploads/images/proj1.png'] }]);
    (MODELS.Certificate.find as jest.Mock).mockResolvedValue([{ images: ['/uploads/images/cert1.png', '/uploads/images/cert2.png'] }]);
    (MODELS.Award.find as jest.Mock).mockResolvedValue([]);
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    await handlerDelete('cand4');

    expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('proj1.png'));
    expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('cert1.png'));
    expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('cert2.png'));
    // Only the 3 real image-bearing models are queried for images, not
    // every CV section model.
    expect(MODELS.Project.find).toHaveBeenCalledWith({ candidateId: 'cand4' }, { images: 1 });
    expect(MODELS.Certificate.find).toHaveBeenCalledWith({ candidateId: 'cand4' }, { images: 1 });
    expect(MODELS.Award.find).toHaveBeenCalledWith({ candidateId: 'cand4' }, { images: 1 });
  });

  describe('handlerDeleteVisits', () => {
    it("hard-deletes every visit of the candidate and returns the count", async () => {
      (MODELS.Visit.deleteMany as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 3 }) });

      const result = await handlerDeleteVisits('cand1');

      expect((MODELS.Visit.deleteMany as jest.Mock).mock.calls).toEqual([[{ candidateId: 'cand1' }]]);
      expect(result).toMatchObject({ success: true, data: { deletedCount: 3 } });
    });
  });

  describe('handlerGetVisits', () => {
    it('returns one newest-first page of the candidate\'s visits with list meta over all of them', async () => {
      const query = { sort: jest.fn(), skip: jest.fn(), limit: jest.fn(), exec: jest.fn().mockResolvedValue([{ _id: 'v3' }, { _id: 'v4' }]) };
      query.sort.mockReturnValue(query);
      query.skip.mockReturnValue(query);
      query.limit.mockReturnValue(query);
      (MODELS.Visit.find as jest.Mock).mockReturnValue(query);
      (MODELS.Visit.countDocuments as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(5) });

      const result = await handlerGetVisits('cand1', { page: 2, limit: 2 });

      expect((MODELS.Visit.find as jest.Mock).mock.calls).toEqual([[{ candidateId: 'cand1' }]]);
      expect((MODELS.Visit.countDocuments as jest.Mock).mock.calls).toEqual([[{ candidateId: 'cand1' }]]);
      expect(query.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
      expect(query.skip).toHaveBeenCalledWith(2);
      expect(query.limit).toHaveBeenCalledWith(2);
      expect(result).toMatchObject({ success: true, data: [{ _id: 'v3' }, { _id: 'v4' }], meta: { page: 2, limit: 2, total: 5, totalPages: 3 } });
    });
  });
});

/**
 * Tests for candidate_me/index.ts — issue #135 regression coverage.
 *
 * QuerySafe.safeQuery silently DROPS a rejected value (e.g. containing "$")
 * instead of throwing. Before the fix, that made the resulting Mongo filter
 * collapse to {} and match an arbitrary candidate instead of failing.
 *
 * Also covers issue #153 (see bottom describe block) — a sibling instance
 * of the same "value silently dropped by QuerySafe" bug class, but at the
 * candidateId field instead of the identifier lookup: `_id` from a raw
 * Mongoose document is an ObjectId instance, not a string, and
 * QuerySafe.safeQuery only accepts string values.
 */

import * as MODEL from '@/models';
import { handlerGetAboutMe, handlerRecordVisit, normalizeReferrer } from '@/candidate_me';

jest.mock('@/models', () => ({
  Candidate: { findOne: jest.fn() },
  Visit: { create: jest.fn() },
  Profile: { findOne: jest.fn() },
  generalInformation: { find: jest.fn() },
  Experience: { find: jest.fn() },
  Education: { find: jest.fn() },
  Reference: { find: jest.fn() },
  Project: { find: jest.fn() },
  Certificate: { find: jest.fn() },
  Award: { find: jest.fn() },
}));

describe('candidate_me/index.ts (issue #135)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handlerGetAboutMe', () => {
    it('fails closed and never queries the DB when the identifier is rejected by QuerySafe', async () => {
      const result = await handlerGetAboutMe({ identifier: '$where:1', lang: 'vi' });

      expect(result.success).toBe(false);
      expect(MODEL.Candidate.findOne).not.toHaveBeenCalled();
    });

    it('still looks up a valid identifier normally (regression check)', async () => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const result = await handlerGetAboutMe({ identifier: 'votan.it@gmail.com', lang: 'vi' });

      expect(result.success).toBe(false);
      expect(MODEL.Candidate.findOne).toHaveBeenCalledTimes(2); // slug attempt, then email fallback
    });
  });

  describe('handlerRecordVisit', () => {
    it('fails closed and never queries the DB when the email is rejected by QuerySafe', async () => {
      const result = await handlerRecordVisit('$where:1', { ip: '1.2.3.4', socket: {} } as any);

      expect(result.success).toBe(false);
      expect(MODEL.Candidate.findOne).not.toHaveBeenCalled();
      expect(MODEL.Visit.create).not.toHaveBeenCalled();
    });

    it('stores only the normalized referrer hostname from the body, ignoring the Referer header', async () => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ select: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) });
      const req = { ip: '', socket: {}, headers: { referer: 'https://datvt243.github.io/' }, body: { referrer: 'https://www.LinkedIn.com/feed/?trk=abc' } };

      const result = await handlerRecordVisit('votan.it@gmail.com', req as any);

      expect(result.success).toBe(true);
      expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({ candidateId: 'c1', referrer: 'linkedin.com' }));
    });

    it('still records the visit with a null referrer when the body has none', async () => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ select: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) });

      const result = await handlerRecordVisit('votan.it@gmail.com', { ip: '', socket: {} } as any);

      expect(result.success).toBe(true);
      expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({ referrer: null }));
    });

    const ownProfileId = '64b7f0c2a1b2c3d4e5f60799';
    const candidateFound = () =>
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ select: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) });
    const profileLookupResolving = (doc: unknown) =>
      (MODEL.Profile.findOne as jest.Mock).mockReturnValue({ select: () => ({ exec: jest.fn().mockResolvedValue(doc) }) });

    it('stores the body profile id when it is a non-deleted profile of the visited candidate', async () => {
      candidateFound();
      profileLookupResolving({ _id: ownProfileId });

      const result = await handlerRecordVisit('votan.it@gmail.com', { ip: '', socket: {}, body: { profile: ownProfileId } } as any);

      expect(result.success).toBe(true);
      expect(jest.mocked(MODEL.Profile).findOne).toHaveBeenCalledWith({ _id: ownProfileId, candidateId: 'c1', deletedAt: null });
      expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({ profileId: ownProfileId }));
    });

    it('stores null, without failing the visit, for a foreign or deleted profile id', async () => {
      candidateFound();
      profileLookupResolving(null);

      const result = await handlerRecordVisit('votan.it@gmail.com', { ip: '', socket: {}, body: { profile: ownProfileId } } as any);

      expect(result.success).toBe(true);
      expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({ profileId: null }));
    });

    it.each([undefined, '', 'abc', '$gt', `${ownProfileId}0`, { $ne: null }, [ownProfileId], 42])(
      'stores null and never queries Profile for %p',
      async (profile) => {
        candidateFound();

        const result = await handlerRecordVisit('votan.it@gmail.com', { ip: '', socket: {}, body: { profile } } as any);

        expect(result.success).toBe(true);
        expect(jest.mocked(MODEL.Profile).findOne).not.toHaveBeenCalled();
        expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({ profileId: null }));
      },
    );
  });

  describe('normalizeReferrer', () => {
    it.each([
      ['https://www.linkedin.com/in/someone?trk=x', 'linkedin.com'],
      ['https://m.facebook.com/', 'facebook.com'],
      ['http://L.Facebook.com/l.php?u=x', 'l.facebook.com'],
      ['https://lnkd.in/abc', 'lnkd.in'],
      ['https://www.google.com.vn/', 'google.com.vn'],
    ])('%s -> %s', (raw, expected) => {
      expect(normalizeReferrer(raw)).toBe(expected);
    });

    it.each([[undefined], [null], [''], [42], [{ href: 'https://x.com' }], ['not a url'], ['linkedin.com'], ['android-app://com.linkedin.android/'], ['javascript:alert(1)']])(
      'returns null for %p',
      (raw) => {
        expect(normalizeReferrer(raw)).toBeNull();
      },
    );

    it('returns null for a value over the 2048-char cap', () => {
      expect(normalizeReferrer(`https://a.com/${'x'.repeat(2048)}`)).toBeNull();
    });
  });

  describe('handlerGetAboutMe — profile filtering (issue #133)', () => {
    const candidateId = '507f1f77bcf86cd799439000';
    const candidateDoc = { _id: candidateId, email: 'votan.it@gmail.com' };

    beforeEach(() => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(candidateDoc) });
      const emptyFind = { exec: jest.fn().mockResolvedValue([]) };
      (MODEL.generalInformation.find as jest.Mock).mockReturnValue(emptyFind);
      (MODEL.Experience.find as jest.Mock).mockReturnValue(emptyFind);
      (MODEL.Education.find as jest.Mock).mockReturnValue(emptyFind);
      (MODEL.Reference.find as jest.Mock).mockReturnValue(emptyFind);
      (MODEL.Project.find as jest.Mock).mockReturnValue(emptyFind);
      (MODEL.Certificate.find as jest.Mock).mockReturnValue(emptyFind);
      (MODEL.Award.find as jest.Mock).mockReturnValue(emptyFind);
    });

    it('never queries Profile when no profile param is given (existing share-links unaffected)', async () => {
      await handlerGetAboutMe({ identifier: 'votan.it@gmail.com', lang: 'vi' });

      expect(MODEL.Profile.findOne).not.toHaveBeenCalled();
      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }), expect.anything());
    });

    it('filters each section by the resolved profile\'s id lists', async () => {
      const educationIds = ['507f1f77bcf86cd799439012'];
      (MODEL.Profile.findOne as jest.Mock).mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ educationIds, experienceIds: [], projectIds: [], certificateIds: [], awardIds: [], referenceIds: [] }),
      });

      await handlerGetAboutMe({ identifier: 'votan.it@gmail.com', lang: 'vi', profileId: '507f1f77bcf86cd799439099' });

      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.objectContaining({ _id: { $in: educationIds } }), expect.anything());
      expect(MODEL.Experience.find).toHaveBeenCalledWith(expect.objectContaining({ _id: { $in: [] } }), expect.anything());
      // generalInformation has no id list on Profile — must stay unfiltered.
      expect(MODEL.generalInformation.find).toHaveBeenCalledWith(
        expect.not.objectContaining({ _id: expect.anything() }),
        expect.anything(),
      );
    });

    it('falls back to unfiltered data when the given profile id does not resolve for this candidate', async () => {
      (MODEL.Profile.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await handlerGetAboutMe({ identifier: 'votan.it@gmail.com', lang: 'vi', profileId: '507f1f77bcf86cd799439099' });

      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }), expect.anything());
    });

    it('never queries Profile when the given id is rejected by QuerySafe (e.g. contains "$")', async () => {
      await handlerGetAboutMe({ identifier: 'votan.it@gmail.com', lang: 'vi', profileId: '$where:1' });

      expect(MODEL.Profile.findOne).not.toHaveBeenCalled();
      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }), expect.anything());
    });

    it.each(['abc', '507f1f77bcf86cd79943909', '507f1f77bcf86cd799439099z'])(
      'treats a malformed profile id (%s) like no profile, without querying Profile',
      async (profileId) => {
        const result = await handlerGetAboutMe({ identifier: 'votan.it@gmail.com', lang: 'vi', profileId });

        expect(result.success).toBe(true);
        expect(jest.mocked(MODEL.Profile).findOne).not.toHaveBeenCalled();
        expect(jest.mocked(MODEL.Education).find).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }), expect.anything());
      },
    );

    it('excludes soft-deleted entries from every section, with or without a profile filter', async () => {
      const models = [MODEL.generalInformation, MODEL.Experience, MODEL.Education, MODEL.Reference, MODEL.Project, MODEL.Certificate, MODEL.Award];

      await handlerGetAboutMe({ identifier: 'votan.it@gmail.com', lang: 'vi' });
      for (const model of models) expect(jest.mocked(model).find).toHaveBeenLastCalledWith(expect.objectContaining({ deletedAt: null }), expect.anything());

      (MODEL.Profile.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({ educationIds: [], experienceIds: [], projectIds: [], certificateIds: [], awardIds: [], referenceIds: [] }),
      });
      await handlerGetAboutMe({ identifier: 'votan.it@gmail.com', lang: 'vi', profileId: '507f1f77bcf86cd799439099' });
      for (const model of models) expect(jest.mocked(model).find).toHaveBeenLastCalledWith(expect.objectContaining({ deletedAt: null }), expect.anything());
    });
  });
});

describe('handlerGetAboutMe — candidateId filter with an ObjectId _id (issue #153)', () => {
  // Mirrors a real Mongoose document: _id is an ObjectId instance (has a
  // .toString() method), never a plain string. Before the fix,
  // idQuerySafe.safeQuery({}, { candidateId: _id }) silently dropped the
  // whole candidateId key (QuerySafe.safeQuery only accepts
  // typeof value === 'string'), collapsing every CV-section query's filter
  // to {} — every candidate's data came back mixed together.
  const objectIdLike = {
    toString: () => '507f1f77bcf86cd799439011',
  };
  const candidateDoc = { _id: objectIdLike, email: 'votan.it@gmail.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(candidateDoc) });
    const emptyFind = { exec: jest.fn().mockResolvedValue([]) };
    (MODEL.generalInformation.find as jest.Mock).mockReturnValue(emptyFind);
    (MODEL.Experience.find as jest.Mock).mockReturnValue(emptyFind);
    (MODEL.Education.find as jest.Mock).mockReturnValue(emptyFind);
    (MODEL.Reference.find as jest.Mock).mockReturnValue(emptyFind);
    (MODEL.Project.find as jest.Mock).mockReturnValue(emptyFind);
    (MODEL.Certificate.find as jest.Mock).mockReturnValue(emptyFind);
    (MODEL.Award.find as jest.Mock).mockReturnValue(emptyFind);
  });

  it('stringifies an ObjectId _id before filtering, instead of dropping candidateId entirely', async () => {
    await handlerGetAboutMe({ identifier: 'votan.it@gmail.com', lang: 'vi' });

    expect(MODEL.Education.find).toHaveBeenCalledWith(
      expect.objectContaining({ candidateId: '507f1f77bcf86cd799439011' }),
      expect.anything(),
    );
    expect(MODEL.Experience.find).toHaveBeenCalledWith(
      expect.objectContaining({ candidateId: '507f1f77bcf86cd799439011' }),
      expect.anything(),
    );
    // Never the raw object itself, and never silently dropped ({} filter).
    expect(MODEL.Education.find).not.toHaveBeenCalledWith(expect.objectContaining({ candidateId: objectIdLike }), expect.anything());
    expect(MODEL.Education.find).not.toHaveBeenCalledWith({}, expect.anything());
  });
});

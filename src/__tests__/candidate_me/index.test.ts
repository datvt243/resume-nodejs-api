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

import geoip from 'geoip-lite';
import * as MODEL from '@/models';
import { fnExportPDF, fnGetAboutMe, handlerGetAboutMe, handlerRecordVisit, normalizeReferrer, profileNotFound } from '@/candidate_me';
import { fnAtsCheck } from '@/candidate_me/ats-check';
import { errorsMiddleware } from '@/middlewares/errors.middleware';

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
      await expect(handlerGetAboutMe({ identifier: '$where:1', lang: 'vi' })).rejects.toMatchObject({ statusCode: 404, errorCode: 'NOT_FOUND' });

      expect(MODEL.Candidate.findOne).not.toHaveBeenCalled();
    });

    it('still looks up a valid identifier normally (regression check)', async () => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(handlerGetAboutMe({ identifier: 'votan.it@gmail.com', lang: 'vi' })).rejects.toMatchObject({ statusCode: 404 });

      expect(MODEL.Candidate.findOne).toHaveBeenCalledTimes(2); // slug attempt, then email fallback
    });
  });

  describe('handlerRecordVisit', () => {
    it('fails closed and never queries the DB when the email is rejected by QuerySafe', async () => {
      await expect(handlerRecordVisit('$where:1', { ip: '1.2.3.4', socket: {}, headers: {} } as any)).rejects.toMatchObject({ statusCode: 404 });

      expect(MODEL.Candidate.findOne).not.toHaveBeenCalled();
      expect(MODEL.Visit.create).not.toHaveBeenCalled();
    });

    it('records a visit addressed by vanity slug, looked up by slug first', async () => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ select: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) });

      const result = await handlerRecordVisit('vo-tan-dat', { ip: '', socket: {}, headers: {} } as any);

      expect(result.success).toBe(true);
      expect(jest.mocked(MODEL.Candidate).findOne).toHaveBeenCalledTimes(1);
      expect(jest.mocked(MODEL.Candidate).findOne).toHaveBeenCalledWith({ slug: 'vo-tan-dat' });
      expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({ candidateId: 'c1' }));
    });

    it('falls back to email when no slug matches', async () => {
      (MODEL.Candidate.findOne as jest.Mock)
        .mockReturnValueOnce({ select: () => ({ exec: jest.fn().mockResolvedValue(null) }) })
        .mockReturnValueOnce({ select: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) });

      await handlerRecordVisit('votan.it@gmail.com', { ip: '', socket: {}, headers: {} } as any);

      expect(jest.mocked(MODEL.Candidate).findOne).toHaveBeenNthCalledWith(2, { email: 'votan.it@gmail.com' });
      expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({ candidateId: 'c1' }));
    });

    it('404s a private profile (isPublic: false) with the unknown-profile message, recording nothing', async () => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ select: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1', isPublic: false }) }) });

      const unknown = { statusCode: 404, message: profileNotFound('en').message };
      await expect(handlerRecordVisit('vo-tan-dat', { ip: '', socket: {}, headers: {}, lang: 'en' } as any)).rejects.toMatchObject(unknown);

      expect(jest.mocked(MODEL.Visit).create).not.toHaveBeenCalled();
    });

    it('404s an unknown identifier after trying slug and email, recording nothing', async () => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ select: () => ({ exec: jest.fn().mockResolvedValue(null) }) });

      await expect(handlerRecordVisit('no-such-slug', { ip: '', socket: {}, headers: {} } as any)).rejects.toMatchObject({ statusCode: 404 });

      expect(jest.mocked(MODEL.Candidate).findOne).toHaveBeenCalledTimes(2);
      expect(jest.mocked(MODEL.Visit).create).not.toHaveBeenCalled();
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

      const result = await handlerRecordVisit('votan.it@gmail.com', { ip: '', socket: {}, headers: {} } as any);

      expect(result.success).toBe(true);
      expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({ referrer: null }));
    });

    it('stores the leftmost X-Forwarded-For IP and its geo location, not the proxy address', async () => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ select: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) });
      const lookup = jest.spyOn(geoip, 'lookup').mockReturnValue({ city: 'Hanoi', region: 'HN', country: 'VN' } as any);
      const req = { ip: '10.0.0.1', socket: {}, headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.2' } };

      await handlerRecordVisit('votan.it@gmail.com', req as any);

      expect(lookup).toHaveBeenCalledWith('203.0.113.7');
      expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({ ip: '203.0.113.7', location: 'Hanoi, HN, VN' }));
      lookup.mockRestore();
    });

    it('falls back to req.ip when X-Forwarded-For is not an IP', async () => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ select: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) });
      const req = { ip: '10.0.0.1', socket: {}, headers: { 'x-forwarded-for': '<script>, 1.2.3.4' } };

      await handlerRecordVisit('votan.it@gmail.com', req as any);

      expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({ ip: '10.0.0.1' }));
    });

    const ownProfileId = '64b7f0c2a1b2c3d4e5f60799';
    const candidateFound = () =>
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ select: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) });
    const profileLookupResolving = (doc: unknown) =>
      (MODEL.Profile.findOne as jest.Mock).mockReturnValue({ select: () => ({ exec: jest.fn().mockResolvedValue(doc) }) });

    it('stores the body profile id when it is a non-deleted profile of the visited candidate', async () => {
      candidateFound();
      profileLookupResolving({ _id: ownProfileId });

      const result = await handlerRecordVisit('votan.it@gmail.com', { ip: '', socket: {}, headers: {}, body: { profile: ownProfileId } } as any);

      expect(result.success).toBe(true);
      expect(jest.mocked(MODEL.Profile).findOne).toHaveBeenCalledWith({ _id: ownProfileId, candidateId: 'c1', deletedAt: null });
      expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({ profileId: ownProfileId }));
    });

    it('stores null, without failing the visit, for a foreign or deleted profile id', async () => {
      candidateFound();
      profileLookupResolving(null);

      const result = await handlerRecordVisit('votan.it@gmail.com', { ip: '', socket: {}, headers: {}, body: { profile: ownProfileId } } as any);

      expect(result.success).toBe(true);
      expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({ profileId: null }));
    });

    it.each([undefined, '', 'abc', '$gt', `${ownProfileId}0`, { $ne: null }, [ownProfileId], 42])(
      'stores null and never queries Profile for %p',
      async (profile) => {
        candidateFound();

        const result = await handlerRecordVisit('votan.it@gmail.com', { ip: '', socket: {}, headers: {}, body: { profile } } as any);

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

    it('GET /api/me/:email answers a private profile with the same 404 body as an unknown one', async () => {
      const respond = async () => {
        const json = jest.fn();
        const res: any = { status: jest.fn().mockReturnValue({ json }) };
        const req: any = { params: { email: 'votan.it@gmail.com' }, query: {}, lang: 'vi' };
        const next = jest.fn();
        await fnGetAboutMe(req, res, next);
        errorsMiddleware(next.mock.calls[0][0], req, res, jest.fn());
        return { status: res.status.mock.calls, body: json.mock.calls };
      };
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      const unknown = await respond();
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ ...candidateDoc, isPublic: false }) });
      const privateProfile = await respond();

      expect(unknown.status).toEqual([[404]]);
      expect(unknown.body[0][0]).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
      expect(privateProfile).toEqual(unknown);
    });

    it('GET /api/me/:email returns only the public whitelist of candidate fields', async () => {
      const fullDoc = {
        ...candidateDoc,
        firstName: 'Dat',
        lastName: 'Vo',
        phone: '0900000000',
        address: 'HCM',
        slug: 'dat-vo',
        socialMedia: { github: 'x' },
        introduction: { vi: 'xin chao', en: 'hi' },
        birthday: 1,
        gender: true,
        marital: false,
        cvFile: { originalName: 'cv.pdf' },
        cvFileName: 'my-cv',
        emailVerified: true,
        isPublic: true,
      };
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(fullDoc) });
      const json = jest.fn();
      const res: any = { status: jest.fn().mockReturnValue({ json }) };

      await fnGetAboutMe({ params: { email: 'dat-vo' }, query: {}, lang: 'vi' } as any, res, jest.fn());

      expect(Object.keys(json.mock.calls[0][0].data).sort()).toEqual(
        [
          'address', 'awards', 'certificates', 'educations', 'email', 'experiences', 'firstName',
          'generalInformation', 'introduction', 'lastName', 'phone', 'projects', 'references', 'slug', 'socialMedia',
        ],
      );
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

describe('own-CV endpoints when the candidate no longer exists', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['GET /api/v1/download-pdf', fnExportPDF],
    ['POST /api/v1/cv/ats-check', fnAtsCheck],
  ])('%s answers 404 NOT_FOUND, not 400', async (_label, handler) => {
    (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    const json = jest.fn();
    const res: any = { status: jest.fn().mockReturnValue({ json }) };
    const req: any = { user: { _id: '507f1f77bcf86cd799439011' }, query: {}, body: {}, lang: 'en' };
    const next = jest.fn();

    await handler(req, res, next);
    errorsMiddleware(next.mock.calls[0][0], req, res, jest.fn());

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(json.mock.calls[0][0]).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });
});

describe('handlerGetAboutMe — localized education school/major', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011', email: 'a@b.co' }) });
    const emptyFind = { exec: jest.fn().mockResolvedValue([]) };
    for (const model of [MODEL.generalInformation, MODEL.Experience, MODEL.Reference, MODEL.Project, MODEL.Certificate, MODEL.Award]) {
      (model.find as jest.Mock).mockReturnValue(emptyFind);
    }
    (MODEL.Education.find as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue([{ school: { vi: 'ĐH Bách Khoa', en: 'HCMUT' }, major: { vi: 'Khoa học máy tính', en: '' }, description: { vi: 'Mô tả', en: '' } }]),
    });
  });

  it('resolves school/major to the requested language', async () => {
    const result = await handlerGetAboutMe({ identifier: 'a@b.co', lang: 'en' });
    expect(result.data.educations[0]).toMatchObject({ school: 'HCMUT' });
  });

  it('falls back to vi when the requested language is empty', async () => {
    const result = await handlerGetAboutMe({ identifier: 'a@b.co', lang: 'en' });
    expect(result.data.educations[0]).toMatchObject({ major: 'Khoa học máy tính', description: 'Mô tả' });
  });
});

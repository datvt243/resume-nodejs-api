/**
 * Tests for candidate_me/index.ts — issue #135 regression coverage.
 *
 * QuerySafe.safeQuery silently DROPS a rejected value (e.g. containing "$")
 * instead of throwing. Before the fix, that made the resulting Mongo filter
 * collapse to {} and match an arbitrary candidate instead of failing.
 */

import * as MODEL from '@/models';
import { handlerGetAboutMe, handlerRecordVisit } from '@/candidate_me';

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
      const result = await handlerGetAboutMe('$where:1', 'vi');

      expect(result.success).toBe(false);
      expect(MODEL.Candidate.findOne).not.toHaveBeenCalled();
    });

    it('still looks up a valid identifier normally (regression check)', async () => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const result = await handlerGetAboutMe('votan.it@gmail.com', 'vi');

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
      await handlerGetAboutMe('votan.it@gmail.com', 'vi');

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

      await handlerGetAboutMe('votan.it@gmail.com', 'vi', '507f1f77bcf86cd799439099');

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

      await handlerGetAboutMe('votan.it@gmail.com', 'vi', '507f1f77bcf86cd799439099');

      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }), expect.anything());
    });

    it('never queries Profile when the given id is rejected by QuerySafe (e.g. contains "$")', async () => {
      await handlerGetAboutMe('votan.it@gmail.com', 'vi', '$where:1');

      expect(MODEL.Profile.findOne).not.toHaveBeenCalled();
      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }), expect.anything());
    });
  });
});

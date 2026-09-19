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
});

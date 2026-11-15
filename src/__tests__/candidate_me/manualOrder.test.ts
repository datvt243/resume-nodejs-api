/**
 * The CV aggregation (public profile, public PDF, owner export, ATS check)
 * lists education and project in manual display order; experience keeps
 * its stored order.
 */
import * as MODEL from '@/models';
import { handlerGetAboutMe } from '@/candidate_me';

jest.mock('@/models', () => ({
  Candidate: { findOne: jest.fn() },
  Profile: { findOne: jest.fn() },
  generalInformation: { find: jest.fn() },
  Experience: { find: jest.fn() },
  Education: { find: jest.fn() },
  Reference: { find: jest.fn() },
  Project: { find: jest.fn() },
  Certificate: { find: jest.fn() },
  Award: { find: jest.fn() },
}));

const rows = (list: Record<string, unknown>[]) => ({ exec: jest.fn().mockResolvedValue(list) });

describe('handlerGetAboutMe manual order', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'c1', email: 'a@b.com' }) });
    for (const m of [MODEL.generalInformation, MODEL.Reference, MODEL.Certificate, MODEL.Award]) (m.find as jest.Mock).mockReturnValue(rows([]));
  });

  it('sorts educations and projects by order, then startDate desc, and leaves experiences alone', async () => {
    (MODEL.Education.find as jest.Mock).mockReturnValue(
      rows([
        { school: { vi: 'A' }, startDate: 1, order: 1 },
        { school: { vi: 'Unordered' }, startDate: 5 },
        { school: { vi: 'B' }, startDate: 2, order: 0 },
      ]),
    );
    (MODEL.Project.find as jest.Mock).mockReturnValue(rows([{ name: 'old', startDate: 1 }, { name: 'new', startDate: 9 }, { name: 'first', order: 0 }]));
    (MODEL.Experience.find as jest.Mock).mockReturnValue(rows([{ company: 'early', startDate: 1 }, { company: 'late', startDate: 9 }]));

    const { data } = await handlerGetAboutMe({ identifier: 'a@b.com', lang: 'vi' });
    const d = data as Record<string, any>;

    expect(d['educations'].map((e: any) => e.school)).toEqual(['B', 'A', 'Unordered']);
    expect(d['projects'].map((p: any) => p.name)).toEqual(['first', 'new', 'old']);
    expect(d['experiences'].map((e: any) => e.company)).toEqual(['early', 'late']);
  });
});

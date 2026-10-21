/**
 * Tests for candidate_me/search.ts — public profile keyword search. Models
 * are mocked (no in-memory Mongo in this repo), so the privacy guarantees
 * are asserted twice: on the filter sent to Mongo, and on the rows the
 * handler returns when the mocked DB hands back rows that filter should
 * have excluded.
 */

import { StatusCodes } from 'http-status-codes';
import { fnSearchPublicProfiles, handlerSearchPublicProfiles } from '@/candidate_me/search';

// Standalone mocks rather than model-method references, so assertions don't trip `unbound-method`.
const mockCandidateFind = jest.fn();
const mockCandidateCount = jest.fn();
const mockGeneralDistinct = jest.fn();
const mockGeneralFind = jest.fn();
const mockExperienceDistinct = jest.fn();
const mockEducationDistinct = jest.fn();

jest.mock('@/models', () => ({
  Candidate: { find: (...args: unknown[]) => mockCandidateFind(...args), countDocuments: (...args: unknown[]) => mockCandidateCount(...args) },
  generalInformation: { distinct: (...args: unknown[]) => mockGeneralDistinct(...args), find: (...args: unknown[]) => mockGeneralFind(...args) },
  Experience: { distinct: (...args: unknown[]) => mockExperienceDistinct(...args) },
  Education: { distinct: (...args: unknown[]) => mockEducationDistinct(...args) },
}));

const execResolving = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

const chainResolving = (value: unknown) => {
  const chain: any = {};
  for (const method of ['select', 'sort', 'skip', 'limit', 'lean']) chain[method] = jest.fn().mockReturnValue(chain);
  chain.exec = jest.fn().mockResolvedValue(value);
  return chain;
};

interface MockDbOptions {
  generalIds?: unknown[];
  experienceIds?: unknown[];
  educationIds?: unknown[];
  candidates?: unknown[];
  total?: number;
  generalInfos?: unknown[];
}

const mockDb = ({ generalIds = [], experienceIds = [], educationIds = [], candidates = [], total, generalInfos = [] }: MockDbOptions = {}) => {
  mockGeneralDistinct.mockReturnValue(execResolving(generalIds));
  mockExperienceDistinct.mockReturnValue(execResolving(experienceIds));
  mockEducationDistinct.mockReturnValue(execResolving(educationIds));
  const candidateChain = chainResolving(candidates);
  mockCandidateFind.mockReturnValue(candidateChain);
  mockCandidateCount.mockReturnValue(execResolving(total ?? candidates.length));
  mockGeneralFind.mockReturnValue(chainResolving(generalInfos));
  return { candidateChain };
};

describe('handlerSearchPublicProfiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('only ever asks Mongo for public candidates that have a slug, among the matched ids', async () => {
    mockDb({ generalIds: ['a'], experienceIds: ['b', 'a'], educationIds: ['c'] });

    await handlerSearchPublicProfiles({ query: 'node', page: 1, limit: 20 });

    const filter = mockCandidateFind.mock.calls[0][0];
    expect(filter).toEqual({ _id: { $in: ['a', 'b', 'a', 'c'] }, isPublic: { $ne: false }, slug: { $nin: [null, ''] } });
    expect(mockCandidateCount).toHaveBeenCalledWith(filter);
  });

  it('never returns a non-public or slug-less candidate, even if the DB hands one back', async () => {
    mockDb({
      generalIds: ['pub', 'priv', 'noslug', 'emptyslug'],
      candidates: [
        { _id: 'pub', slug: 'jane-doe', firstName: 'Jane', lastName: 'Doe', isPublic: true },
        { _id: 'priv', slug: 'secret', firstName: 'Pri', lastName: 'Vate', isPublic: false },
        { _id: 'noslug', firstName: 'No', lastName: 'Slug', isPublic: true },
        { _id: 'emptyslug', slug: '', firstName: 'Empty', lastName: 'Slug' },
      ],
    });

    const result = await handlerSearchPublicProfiles({ query: 'engineer', page: 1, limit: 20 });

    expect(result.items.map((item) => item.slug)).toEqual(['jane-doe']);
  });

  it('treats a document without isPublic as public (schema default is read-side only)', async () => {
    mockDb({ candidates: [{ _id: 'old', slug: 'old-timer', firstName: 'Old', lastName: 'Timer' }] });

    const result = await handlerSearchPublicProfiles({ query: 'node', page: 1, limit: 20 });

    expect(result.items).toHaveLength(1);
  });

  it('returns only whitelisted public fields — never email or password', async () => {
    mockDb({
      candidates: [{ _id: 'pub', slug: 'jane-doe', firstName: 'Jane', lastName: 'Doe', isPublic: true, email: 'jane@example.com', password: 'hash' }],
      generalInfos: [{ candidateId: 'pub', positionDesired: 'Backend Engineer' }],
    });

    const result = await handlerSearchPublicProfiles({ query: 'node', page: 1, limit: 20 });

    expect(result.items).toEqual([{ slug: 'jane-doe', firstName: 'Jane', lastName: 'Doe', positionDesired: 'Backend Engineer' }]);
    expect(mockCandidateFind.mock.results[0]?.value.select).toHaveBeenCalledWith({ _id: 1, slug: 1, firstName: 1, lastName: 1, isPublic: 1 });
  });

  it('matches the query as an escaped, case-insensitive substring on the agreed fields only', async () => {
    mockDb();

    await handlerSearchPublicProfiles({ query: 'C++ (senior)', page: 1, limit: 20 });

    const pattern = /C\+\+ \(senior\)/i;
    expect(mockGeneralDistinct).toHaveBeenCalledWith('candidateId', {
      deletedAt: null,
      $or: [{ positionDesired: pattern }, { 'professionalSkills.name': pattern }],
    });
    expect(mockExperienceDistinct).toHaveBeenCalledWith('candidateId', { deletedAt: null, $or: [{ company: pattern }, { position: pattern }, { skills: pattern }] });
    expect(mockEducationDistinct).toHaveBeenCalledWith('candidateId', { deletedAt: null, $or: [{ school: pattern }, { major: pattern }] });

    const used = mockExperienceDistinct.mock.calls[0][1].$or[0].company as RegExp;
    expect(used.test('Senior C++ (Senior) dev')).toBe(true);
    expect(used.test('C senior')).toBe(false);
  });

  it('keeps operator-looking input as literal text, never as a filter key', async () => {
    mockDb();

    await handlerSearchPublicProfiles({ query: '{"$gt": ""}', page: 1, limit: 20 });

    const filter = mockEducationDistinct.mock.calls[0][1];
    expect(Object.keys(filter)).toEqual(['deletedAt', '$or']);
    expect(filter.$or[0].school).toEqual(/\{"\$gt": ""\}/i);
  });

  it('paginates with the { items, meta } shape', async () => {
    const { candidateChain } = mockDb({ total: 45 });

    const result = await handlerSearchPublicProfiles({ query: 'node', page: 3, limit: 20 });

    expect(candidateChain.skip).toHaveBeenCalledWith(40);
    expect(candidateChain.limit).toHaveBeenCalledWith(20);
    expect(result.meta).toEqual({ page: 3, limit: 20, total: 45, totalPages: 3 });
  });
});

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('fnSearchPublicProfiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['missing', undefined],
    ['too short', 'a'],
    ['only whitespace', '   '],
    ['too long', 'x'.repeat(101)],
    ['not a string', ['node', 'vue']],
  ])('returns 400 without querying when q is %s', async (_label, q) => {
    const req: any = { query: { q }, lang: 'en' };
    const res = mockRes();

    await fnSearchPublicProfiles(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'Search query must be between 2 and 100 characters' }) }));
    expect(mockCandidateFind).not.toHaveBeenCalled();
  });

  it('defaults page/limit, caps limit at 100, and trims the query', async () => {
    const { candidateChain } = mockDb();
    const res = mockRes();

    await fnSearchPublicProfiles({ query: { q: '  node  ', limit: '500', page: 'abc' }, lang: 'en' } as any, res, jest.fn());

    expect(candidateChain.skip).toHaveBeenCalledWith(0);
    expect(candidateChain.limit).toHaveBeenCalledWith(100);
    expect(mockEducationDistinct.mock.calls[0][1].$or[0].school).toEqual(/node/i);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: '', data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 1 } });
  });

  it('forwards an unexpected DB error to the global error handler', async () => {
    mockGeneralDistinct.mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error('db down')) });
    mockExperienceDistinct.mockReturnValue(execResolving([]));
    mockEducationDistinct.mockReturnValue(execResolving([]));
    const res = mockRes();
    const next = jest.fn();

    await fnSearchPublicProfiles({ query: { q: 'node' }, lang: 'en' } as any, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});

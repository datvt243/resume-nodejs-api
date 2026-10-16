/**
 * Tests for candidate/visitStats.service.ts and fnGetVisitStats — query
 * validation/defaults, time-zone bucket boundaries, ISO-week labels and
 * zero-fill, with `Visit.aggregate` mocked (the pipeline itself was run
 * against a real mongod while implementing; this repo has no in-memory
 * Mongo for CI).
 */

import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { handlerGetVisitStats, resolveVisitStatsQuery, type VisitStatsQuery } from '@/candidate/visitStats.service';
import { fnGetVisitStats } from '@/candidate/candidate.controller';

const mockAggregate = jest.fn();

jest.mock('@/models', () => ({
  Visit: { aggregate: (...args: unknown[]) => mockAggregate(...args) },
  Profile: { collection: { name: 'profiles' } },
}));

const aggregateResolving = (facets: unknown) => mockAggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([facets]) });

const candidateId = '64b7f0c2a1b2c3d4e5f60718';
// 2026-10-09T18:30Z is already 2026-10-10 01:30 in Asia/Ho_Chi_Minh (UTC+7).
const NOW = Date.UTC(2026, 9, 9, 18, 30);

const resolved = (raw: Parameters<typeof resolveVisitStatsQuery>[0]): VisitStatsQuery => {
  const query = resolveVisitStatsQuery(raw, NOW);
  if (!query) throw new Error('expected a valid query');
  return query;
};

describe('resolveVisitStatsQuery', () => {
  it('defaults to daily buckets over the last 30 days ending today in Asia/Ho_Chi_Minh', () => {
    expect(resolveVisitStatsQuery({}, NOW)).toEqual({
      interval: 'day',
      tz: 'Asia/Ho_Chi_Minh',
      from: { year: 2026, month: 9, day: 11 },
      to: { year: 2026, month: 10, day: 10 },
    });
  });

  it('takes "today" from the requested time zone', () => {
    expect(resolveVisitStatsQuery({ tz: 'UTC' }, NOW)?.to).toEqual({ year: 2026, month: 10, day: 9 });
  });

  it('accepts explicit interval/from/to', () => {
    expect(resolveVisitStatsQuery({ interval: 'month', from: '2025-11-01', to: '2026-10-10' }, NOW)).toEqual({
      interval: 'month',
      tz: 'Asia/Ho_Chi_Minh',
      from: { year: 2025, month: 11, day: 1 },
      to: { year: 2026, month: 10, day: 10 },
    });
  });

  it.each([
    ['unknown interval', { interval: 'year' }],
    ['impossible date', { from: '2026-02-30' }],
    ['malformed date', { to: '10/10/2026' }],
    ['from after to', { from: '2026-10-10', to: '2026-10-01' }],
    ['unknown time zone', { tz: 'Mars/Olympus_Mons' }],
    ['array value', { interval: ['day', 'week'] }],
    ['more than 400 day buckets', { from: '2025-01-01', to: '2026-02-05' }],
  ])('rejects %s', (_label, raw) => {
    expect(resolveVisitStatsQuery(raw, NOW)).toBeNull();
  });

  it('allows a long range when the interval keeps it under 400 buckets', () => {
    expect(resolveVisitStatsQuery({ interval: 'month', from: '2016-01-01', to: '2026-10-10' }, NOW)).not.toBeNull();
  });
});

describe('handlerGetVisitStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matches only this candidate (cast to ObjectId) between local midnights of from and the day after to', async () => {
    aggregateResolving({ series: [], countries: [] });

    await handlerGetVisitStats(candidateId, resolved({ from: '2026-10-01', to: '2026-10-03' }));

    const [match, facet] = mockAggregate.mock.calls[0][0];
    expect(match.$match.candidateId).toBeInstanceOf(Types.ObjectId);
    expect(String(match.$match.candidateId)).toBe(candidateId);
    expect(match.$match.createdAt).toEqual({ $gte: new Date('2026-09-30T17:00:00.000Z'), $lt: new Date('2026-10-03T17:00:00.000Z') });
    expect(facet.$facet.series[0].$group._id).toEqual({ $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } });
  });

  it('gets local midnight right across a DST change', async () => {
    aggregateResolving({ series: [], countries: [] });

    // US DST starts 2026-03-08 at 02:00: that day starts at 05:00Z (EST), the next at 04:00Z (EDT).
    await handlerGetVisitStats(candidateId, resolved({ from: '2026-03-08', to: '2026-03-08', tz: 'America/New_York' }));

    expect(mockAggregate.mock.calls[0][0][0].$match.createdAt).toEqual({
      $gte: new Date('2026-03-08T05:00:00.000Z'),
      $lt: new Date('2026-03-09T04:00:00.000Z'),
    });
  });

  it('zero-fills every day in range and totals the counts', async () => {
    aggregateResolving({
      series: [{ _id: '2026-10-02', count: 3 }],
      countries: [{ _id: 'VN', count: 2 }, { _id: null, count: 1 }],
      sources: [{ _id: 'linkedin.com', count: 2 }, { _id: null, count: 1 }],
    });

    const stats = await handlerGetVisitStats(candidateId, resolved({ from: '2026-10-01', to: '2026-10-03' }));

    expect(stats).toEqual({
      interval: 'day',
      tz: 'Asia/Ho_Chi_Minh',
      from: '2026-10-01',
      to: '2026-10-03',
      total: 3,
      series: [
        { bucket: '2026-10-01', count: 0 },
        { bucket: '2026-10-02', count: 3 },
        { bucket: '2026-10-03', count: 0 },
      ],
      countries: [
        { country: 'VN', count: 2 },
        { country: null, count: 1 },
      ],
      sources: [
        { source: 'linkedin.com', count: 2 },
        { source: null, count: 1 },
      ],
      profiles: [],
    });
  });

  it('labels ISO weeks across a 53-week year boundary', async () => {
    aggregateResolving({ series: [{ _id: '2027-W01', count: 1 }], countries: [] });

    const stats = await handlerGetVisitStats(candidateId, resolved({ interval: 'week', from: '2026-12-28', to: '2027-01-10' }));

    expect(mockAggregate.mock.calls[0][0][1].$facet.series[0].$group._id.$dateToString.format).toBe('%G-W%V');
    expect(stats.series).toEqual([
      { bucket: '2026-W53', count: 0 },
      { bucket: '2027-W01', count: 1 },
    ]);
  });

  it('labels months', async () => {
    aggregateResolving({ series: [], countries: [] });

    const stats = await handlerGetVisitStats(candidateId, resolved({ interval: 'month', from: '2026-08-15', to: '2026-10-10' }));

    expect(stats.series.map((row) => row.bucket)).toEqual(['2026-08', '2026-09', '2026-10']);
  });

  it('groups countries on the last comma part of location, empty as null', async () => {
    aggregateResolving({ series: [], countries: [] });

    await handlerGetVisitStats(candidateId, resolved({}));

    const countryGroup = mockAggregate.mock.calls[0][0][1].$facet.countries;
    expect(countryGroup[0].$group._id.$let.vars.last.$trim.input).toEqual({ $arrayElemAt: [{ $split: [{ $ifNull: ['$location', ''] }, ','] }, -1] });
    expect(countryGroup[1]).toEqual({ $sort: { count: -1, _id: 1 } });
  });

  it('groups sources on the stored referrer hostname, missing as null', async () => {
    aggregateResolving({ series: [], countries: [] });

    const stats = await handlerGetVisitStats(candidateId, resolved({}));

    expect(mockAggregate.mock.calls[0][0][1].$facet.sources).toEqual([{ $group: { _id: '$referrer', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]);
    expect(stats.sources).toEqual([]);
  });

  it('groups profiles on the stored profileId and looks up each name', async () => {
    aggregateResolving({ series: [], countries: [] });

    const stats = await handlerGetVisitStats(candidateId, resolved({}));

    const profilesStages = mockAggregate.mock.calls[0][0][1].$facet.profiles;
    expect(profilesStages.slice(0, 3)).toEqual([
      { $group: { _id: '$profileId', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $lookup: { from: 'profiles', localField: '_id', foreignField: '_id', as: 'profile' } },
    ]);
    expect(stats.profiles).toEqual([]);
  });

  it('maps profiles to id/name/deleted, keeping soft-deleted and missing profiles on their own row', async () => {
    const live = new Types.ObjectId();
    const softDeleted = new Types.ObjectId();
    const missing = new Types.ObjectId();
    aggregateResolving({
      series: [],
      countries: [],
      profiles: [
        { _id: live, count: 4, found: true, name: 'Frontend', deletedAt: null },
        { _id: null, count: 3, found: false },
        { _id: softDeleted, count: 2, found: true, name: 'Old', deletedAt: 1760000000000 },
        { _id: missing, count: 1, found: false },
      ],
    });

    const stats = await handlerGetVisitStats(candidateId, resolved({}));

    expect(stats.profiles).toEqual([
      { profileId: String(live), name: 'Frontend', deleted: false, count: 4 },
      { profileId: null, name: null, deleted: false, count: 3 },
      { profileId: String(softDeleted), name: 'Old', deleted: true, count: 2 },
      { profileId: String(missing), name: null, deleted: true, count: 1 },
    ]);
  });
});

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('fnGetVisitStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 without querying on an invalid query', async () => {
    const res = mockRes();

    await fnGetVisitStats({ user: { _id: candidateId }, query: { interval: 'year' }, lang: 'en' } as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(mockAggregate).not.toHaveBeenCalled();
  });

  it('always uses the authenticated id, never a client-supplied candidateId', async () => {
    aggregateResolving({ series: [], countries: [] });
    const res = mockRes();

    await fnGetVisitStats({ user: { _id: candidateId }, query: { candidateId: '000000000000000000000001' }, body: { candidateId: '000000000000000000000002' }, lang: 'en' } as any, res, jest.fn());

    expect(String(mockAggregate.mock.calls[0][0][0].$match.candidateId)).toBe(candidateId);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'Visit stats fetched successfully' }));
  });

  it('forwards a 401 when there is no authenticated user', async () => {
    const res = mockRes();
    const next = jest.fn();

    await fnGetVisitStats({ query: {}, lang: 'en' } as any, res, next);

    expect(mockAggregate).not.toHaveBeenCalled();
    expect(next.mock.calls[0][0].statusCode).toBe(StatusCodes.UNAUTHORIZED);
  });
});

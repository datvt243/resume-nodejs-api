/**
 * Aggregated public-profile visit stats for the authenticated candidate —
 * time-bucketed counts (zero-filled, so a chart needs no gap handling)
 * plus country, referrer-source and CV-profile breakdowns, computed with
 * one aggregation over the `Visit` collection.
 *
 * Bucket boundaries follow the caller's IANA time zone (default
 * Asia/Ho_Chi_Minh): a visit at 00:30 local belongs to that local day,
 * not to the previous UTC day. `from`/`to` are inclusive local dates.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { Types } from 'mongoose';
import * as MODELS from '@/models';

export type VisitStatsInterval = 'day' | 'week' | 'month';

export const VISIT_STATS_DEFAULT_TZ = 'Asia/Ho_Chi_Minh';
export const VISIT_STATS_DEFAULT_DAYS = 30;
// Bounds the zero-filled series a single request can ask for.
export const VISIT_STATS_MAX_BUCKETS = 400;

const DAY_MS = 24 * 60 * 60 * 1000;
const INTERVALS: VisitStatsInterval[] = ['day', 'week', 'month'];

/** `$dateToString` formats — `%G-W%V` is the ISO week (Monday start), matched by `bucketLabel` below. */
const BUCKET_FORMATS: Record<VisitStatsInterval, string> = { day: '%Y-%m-%d', week: '%G-W%V', month: '%Y-%m' };

interface LocalDate {
  year: number;
  month: number;
  day: number;
}

export interface VisitStatsQuery {
  interval: VisitStatsInterval;
  from: LocalDate;
  to: LocalDate;
  tz: string;
}

export interface VisitStats {
  interval: VisitStatsInterval;
  tz: string;
  from: string;
  to: string;
  total: number;
  series: { bucket: string; count: number }[];
  countries: { country: string | null; count: number }[];
  sources: { source: string | null; count: number }[];
  profiles: { profileId: string | null; name: string | null; deleted: boolean; count: number }[];
}

const pad = (value: number, length = 2): string => String(value).padStart(length, '0');

const formatLocalDate = ({ year, month, day }: LocalDate): string => `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

const toUtcDay = ({ year, month, day }: LocalDate): number => Date.UTC(year, month - 1, day);

const fromUtcDay = (utcDay: number): LocalDate => {
  const date = new Date(utcDay);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
};

const addDays = (date: LocalDate, days: number): LocalDate => fromUtcDay(toUtcDay(date) + days * DAY_MS);

/** Strict `YYYY-MM-DD` that must round-trip, so `2026-02-30` is rejected rather than rolled over. */
const parseLocalDate = (raw: string): LocalDate | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return formatLocalDate(fromUtcDay(toUtcDay(date))) === raw ? date : null;
};

export const isValidTimeZone = (tz: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const zonedParts = (tz: string, utcMs: number): Record<string, number> => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
};

const todayIn = (tz: string, nowMs: number): LocalDate => {
  const { year = 1970, month = 1, day = 1 } = zonedParts(tz, nowMs);
  return { year, month, day };
};

/** How far `tz`'s wall clock is ahead of UTC at the instant `utcMs`. */
const tzOffsetMs = (tz: string, utcMs: number): number => {
  const { year = 1970, month = 1, day = 1, hour = 0, minute = 0, second = 0 } = zonedParts(tz, utcMs);
  return Date.UTC(year, month - 1, day, hour, minute, second) - Math.floor(utcMs / 1000) * 1000;
};

/** UTC instant at which `date` starts in `tz`; offset taken twice so a DST change on that day is still exact. */
const localMidnightUtc = (date: LocalDate, tz: string): number => {
  const wallClock = toUtcDay(date);
  const firstGuess = wallClock - tzOffsetMs(tz, wallClock);
  return wallClock - tzOffsetMs(tz, firstGuess);
};

/** JS mirror of `BUCKET_FORMATS`, used to zero-fill buckets the aggregation returns no row for. */
const bucketLabel = (date: LocalDate, interval: VisitStatsInterval): string => {
  if (interval === 'day') return formatLocalDate(date);
  if (interval === 'month') return `${pad(date.year, 4)}-${pad(date.month)}`;

  const utcDay = toUtcDay(date);
  const mondayBased = (new Date(utcDay).getUTCDay() + 6) % 7;
  const thursday = utcDay + (3 - mondayBased) * DAY_MS;
  const isoYear = new Date(thursday).getUTCFullYear();
  const week = Math.floor((thursday - Date.UTC(isoYear, 0, 1)) / DAY_MS / 7) + 1;
  return `${pad(isoYear, 4)}-W${pad(week)}`;
};

const bucketLabels = (query: VisitStatsQuery): string[] => {
  const labels: string[] = [];
  for (let date = query.from; toUtcDay(date) <= toUtcDay(query.to); date = addDays(date, 1)) {
    const label = bucketLabel(date, query.interval);
    if (labels[labels.length - 1] !== label) labels.push(label);
  }
  return labels;
};

/**
 * Validates and fills defaults for the raw query string values. Returns
 * null for anything invalid: unknown interval, malformed/impossible
 * date, `from` after `to`, unknown time zone, or a range that would
 * produce more than VISIT_STATS_MAX_BUCKETS buckets.
 */
export const resolveVisitStatsQuery = (
  raw: { interval?: unknown; from?: unknown; to?: unknown; tz?: unknown },
  nowMs: number = Date.now(),
): VisitStatsQuery | null => {
  const interval = raw.interval === undefined ? 'day' : INTERVALS.find((value) => value === raw.interval);
  const tz = raw.tz === undefined ? VISIT_STATS_DEFAULT_TZ : raw.tz;
  if (!interval || typeof tz !== 'string' || !isValidTimeZone(tz)) return null;

  const parseOptional = (value: unknown): LocalDate | null | undefined => {
    if (value === undefined) return undefined;
    return typeof value === 'string' ? parseLocalDate(value) : null;
  };
  const fromInput = parseOptional(raw.from);
  const toInput = parseOptional(raw.to);
  if (fromInput === null || toInput === null) return null;

  const to = toInput ?? todayIn(tz, nowMs);
  const from = fromInput ?? addDays(to, -(VISIT_STATS_DEFAULT_DAYS - 1));
  if (toUtcDay(from) > toUtcDay(to)) return null;
  // Cheap upper bound before building labels: no interval packs more than 31 days into one bucket.
  if ((toUtcDay(to) - toUtcDay(from)) / DAY_MS + 1 > VISIT_STATS_MAX_BUCKETS * 31) return null;

  const query = { interval, from, to, tz };
  return bucketLabels(query).length > VISIT_STATS_MAX_BUCKETS ? null : query;
};

/**
 * `location` is written as "city, region, country" by geoip-lite (any
 * part may be missing), so the country is its last comma-separated
 * part; an empty location groups under null.
 */
const COUNTRY_EXPRESSION = {
  $let: {
    vars: { last: { $trim: { input: { $arrayElemAt: [{ $split: [{ $ifNull: ['$location', ''] }, ','] }, -1] } } } },
    in: { $cond: [{ $eq: ['$$last', ''] }, null, '$$last'] },
  },
};

interface FacetResult {
  series: { _id: string; count: number }[];
  countries: { _id: string | null; count: number }[];
  sources: { _id: string | null; count: number }[];
  profiles: { _id: Types.ObjectId | null; count: number; found: boolean; name?: string; deletedAt?: number | null }[];
}

/**
 * `candidateId` is always req.user._id from the verified JWT. It is cast
 * explicitly: unlike `find`, `aggregate` does not cast a string to
 * ObjectId, and an uncast id would silently match no visits.
 */
export const handlerGetVisitStats = async (candidateId: string, query: VisitStatsQuery): Promise<VisitStats> => {
  const { interval, from, to, tz } = query;
  const [facets] = await MODELS.Visit.aggregate<FacetResult>([
    {
      $match: {
        candidateId: new Types.ObjectId(candidateId),
        createdAt: { $gte: new Date(localMidnightUtc(from, tz)), $lt: new Date(localMidnightUtc(addDays(to, 1), tz)) },
      },
    },
    {
      $facet: {
        series: [{ $group: { _id: { $dateToString: { format: BUCKET_FORMATS[interval], date: '$createdAt', timezone: tz } }, count: { $sum: 1 } } }],
        countries: [{ $group: { _id: COUNTRY_EXPRESSION, count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }],
        // `$group` buckets a missing field as null, so visits recorded before `referrer` existed land there.
        sources: [{ $group: { _id: '$referrer', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }],
        /**
         * The name is looked up by `_id` alone: a stored `profileId` was
         * ownership-checked when the visit was recorded. A soft-deleted
         * (or since-removed) profile keeps its own row rather than folding
         * into null, so restoring it doesn't shift the history.
         */
        profiles: [
          { $group: { _id: '$profileId', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $lookup: { from: MODELS.Profile.collection.name, localField: '_id', foreignField: '_id', as: 'profile' } },
          {
            $project: {
              count: 1,
              found: { $gt: [{ $size: '$profile' }, 0] },
              name: { $arrayElemAt: ['$profile.name', 0] },
              deletedAt: { $arrayElemAt: ['$profile.deletedAt', 0] },
            },
          },
        ],
      },
    },
  ]).exec();

  const countsByBucket = new Map((facets?.series ?? []).map((row) => [row._id, row.count]));
  const series = bucketLabels(query).map((bucket) => ({ bucket, count: countsByBucket.get(bucket) ?? 0 }));

  return {
    interval,
    tz,
    from: formatLocalDate(from),
    to: formatLocalDate(to),
    total: series.reduce((sum, row) => sum + row.count, 0),
    series,
    countries: (facets?.countries ?? []).map((row) => ({ country: row._id, count: row.count })),
    sources: (facets?.sources ?? []).map((row) => ({ source: row._id, count: row.count })),
    profiles: (facets?.profiles ?? []).map((row) => ({
      profileId: row._id ? String(row._id) : null,
      name: row.name ?? null,
      deleted: row._id !== null && (!row.found || row.deletedAt != null),
      count: row.count,
    })),
  };
};

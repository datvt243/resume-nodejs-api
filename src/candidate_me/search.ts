/**
 * GET /api/me/search — unauthenticated keyword search over public
 * candidate profiles. The query is matched as a case-insensitive
 * substring (so "vue" finds "Vue.js") against GeneralInformation
 * `positionDesired`/`professionalSkills.name`, Experience
 * `company`/`position`/`skills`, and Education `school`/`major`.
 *
 * Only candidates whose profile is public AND who have a vanity slug are
 * ever returned: the slug is the result's only identifier, so a
 * candidate's email is never exposed, and every result links to
 * `/api/me/<slug>`.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { formatReturn, handleError, ok } from '@/utils';
import { listMeta } from '@/services';
import type { ListMeta } from '@/utils/response';
import { t } from '@/utils/i18n';
import * as MODEL from '@/models';

export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 100;
const DEFAULT_LIMIT = 20;
// Same hard cap as baseFindDocument's MAX_PAGE_LIMIT.
const MAX_LIMIT = 100;

export interface PublicSearchItem {
  slug: string;
  firstName: string;
  lastName: string;
  positionDesired: string;
}

export interface PublicSearchResult {
  items: PublicSearchItem[];
  meta: ListMeta;
}

/**
 * The user's text only ever becomes the source of an escaped RegExp
 * value — never a filter key or operator — so no NoSQL operator can be
 * injected through it (the same guarantee QuerySafe gives other paths).
 */
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePositiveInt = (value: unknown): number | null => {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const handlerSearchPublicProfiles = async ({ query, page, limit }: { query: string; page: number; limit: number }): Promise<PublicSearchResult> => {
  const pattern = new RegExp(escapeRegex(query), 'i');

  const matchedIds = await Promise.all([
    MODEL.generalInformation.distinct('candidateId', { deletedAt: null, $or: [{ positionDesired: pattern }, { 'professionalSkills.name': pattern }] }).exec(),
    MODEL.Experience.distinct('candidateId', { deletedAt: null, $or: [{ company: pattern }, { position: pattern }, { skills: pattern }] }).exec(),
    MODEL.Education.distinct('candidateId', { deletedAt: null, $or: [{ school: pattern }, { major: pattern }] }).exec(),
  ]);

  /**
   * `isPublic: { $ne: false }` rather than `true`: the schema default
   * only applies when a document is read, so an older document without
   * the field is still public — the same rule `fnGetAboutMe` applies with
   * its `=== false` check. `$nin: [null, '']` also excludes a missing slug.
   */
  const filter = { _id: { $in: matchedIds.flat() }, isPublic: { $ne: false }, slug: { $nin: [null, ''] } };
  const [candidates, total] = await Promise.all([
    MODEL.Candidate.find(filter)
      .select({ _id: 1, slug: 1, firstName: 1, lastName: 1, isPublic: 1 })
      .sort({ _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec(),
    MODEL.Candidate.countDocuments(filter).exec(),
  ]);

  // Re-checked on the returned rows too, so a filter regression can't leak a private profile into a public listing.
  const visible = candidates.filter((candidate) => candidate.isPublic !== false && typeof candidate.slug === 'string' && candidate.slug !== '');

  const generalInfos = await MODEL.generalInformation
    .find({ candidateId: { $in: visible.map((candidate) => candidate._id) }, deletedAt: null })
    .select({ candidateId: 1, positionDesired: 1 })
    .lean()
    .exec();
  const positionByCandidate = new Map(generalInfos.map((info) => [String(info.candidateId), info.positionDesired ?? '']));

  return {
    items: visible.map((candidate) => ({
      slug: candidate.slug ?? '',
      firstName: candidate.firstName ?? '',
      lastName: candidate.lastName ?? '',
      positionDesired: positionByCandidate.get(String(candidate._id)) ?? '',
    })),
    meta: listMeta(total, page, limit),
  };
};

export const fnSearchPublicProfiles = async (req: Request, res: Response, next: NextFunction) => {
  const query = typeof req.query['q'] === 'string' ? req.query['q'].trim() : '';
  if (query.length < SEARCH_QUERY_MIN_LENGTH || query.length > SEARCH_QUERY_MAX_LENGTH) {
    return formatReturn(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: t('publicSearch.invalidQuery', req.lang),
    });
  }

  const page = parsePositiveInt(req.query['page']) ?? 1;
  const limit = Math.min(parsePositiveInt(req.query['limit']) ?? DEFAULT_LIMIT, MAX_LIMIT);

  try {
    const { items, meta } = await handlerSearchPublicProfiles({ query, page, limit });
    return ok(res, items, '', meta);
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

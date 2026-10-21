/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { Model, Types } from 'mongoose';
import geoip from 'geoip-lite';

import { formatReturn, handleError } from '@/utils';
import { formatReturnFailed } from '@/services';
import { NotFoundError } from '@/errors';
import { createCV } from '@/services/createPDF';
import { createCVAts } from '@/services/createPDF.ats';
import { createCVDocx } from '@/services/createDocx';
import * as MODEL from '@/models';

// One message for unknown and private profiles, so a private profile can't be told apart from a missing one.
export const PROFILE_NOT_FOUND = 'Email không tồn tại';

/**
 * Localized ({vi, en}) fields get resolved down to a single string for
 * public-facing reads (profile view, PDF export) — the owner's own
 * authenticated CRUD endpoints (candidate_profile/*) still return the
 * full {vi, en} object so they can edit both languages.
 */
const resolveLocalizedText = (value: unknown, lang: string): string => {
  if (typeof value === 'string') return value; // defensive: pre-migration data shape
  if (!value || typeof value !== 'object') return '';
  const localized = value as Record<string, unknown>;
  const resolved = localized[lang] ?? localized['vi'] ?? localized['en'] ?? '';
  return typeof resolved === 'string' ? resolved : '';
};

export const fnGetAboutMe = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.params;
  const lang = req.query['lang'] === 'en' ? 'en' : 'vi';
  /**
   * Optional CV profile filter — a named subset of the candidate's own
   * Education/Experience/Project/Certificate/Award/Reference entries.
   * Omitted -> unchanged behavior (everything), so existing share-links
   * keep working.
   */
  const profileId = typeof req.query['profile'] === 'string' ? req.query['profile'] : undefined;
  if (!email) {
    res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Không tìm thấy Email'));
    return;
  }

  try {
    const _me = await handlerGetAboutMe({ identifier: email, lang, profileId });
    /**
     * Private profile — same response shape as "email not found" so a
     * private profile isn't distinguishable from a
     * non-existent one. Only gates this public route; the authenticated
     * self-export path (fnExportPDF) calls handlerGetAboutMe directly
     * and is unaffected — a candidate can always see/export their own
     * data regardless of this flag.
     */
    if (_me.data?.isPublic === false) return next(new NotFoundError(PROFILE_NOT_FOUND));
    return formatReturn(res, _me);
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

/**
 * Maps a CV-section collection name to the array field on a Profile
 * document that lists which of that section's ids belong to it.
 * generalInformation has no entry — it's a single document per candidate,
 * not a selectable list.
 */
const PROFILE_ID_FIELDS: Record<string, string> = {
  experiences: 'experienceIds',
  educations: 'educationIds',
  references: 'referenceIds',
  projects: 'projectIds',
  certificates: 'certificateIds',
  awards: 'awardIds',
};

export const handlerGetAboutMe = async ({
  identifier,
  lang = 'vi',
  profileId,
}: {
  identifier: string;
  lang?: string | undefined;
  profileId?: string | undefined;
}) => {
  const removeFields = { __v: 0, createdAt: 0, updatedAt: 0, candidateId: 0 };

  const { candidateQuerySafe } = await import('@/utils/querySafe');
  /**
   * Slug-first — a slug is a non-PII, shareable identifier; email lookup
   * stays as a fallback so existing shared links keep working. QuerySafe
   * silently DROPS a rejected value (e.g. containing "$") instead of
   * throwing — checking the key survived sanitization keeps a rejected
   * identifier from collapsing the query to {} and matching an arbitrary
   * candidate.
   */
  const safeSlugQuery = candidateQuerySafe.safeQuery({}, { slug: identifier });
  let document = 'slug' in safeSlugQuery ? await MODEL.Candidate.findOne(safeSlugQuery, { ...removeFields }).exec() : null;
  if (!document) {
    const safeEmailQuery = candidateQuerySafe.safeQuery({}, { email: identifier });
    document = 'email' in safeEmailQuery ? await MODEL.Candidate.findOne(safeEmailQuery, { ...removeFields }).exec() : null;
  }
  if (!document) throw new NotFoundError(PROFILE_NOT_FOUND);

  const { _id } = document;

  /**
   * Resolve the optional profile filter — must belong to this same
   * candidate; an invalid/foreign/deleted profile id is treated the same
   * as "no profile given" (falls back to unfiltered) rather than
   * erroring, since this is a public, unauthenticated route.
   */
  let profileDoc: Awaited<ReturnType<typeof MODEL.Profile.findOne>> = null;
  // A non-ObjectId value would make Mongoose throw a CastError (500) instead of falling back.
  if (profileId && /^[a-f\d]{24}$/i.test(profileId)) {
    const { idQuerySafe: profileIdQuerySafe } = await import('@/utils/querySafe');
    const safeProfileIdQuery = profileIdQuerySafe.safeQuery({}, { _id: profileId });
    profileDoc =
      '_id' in safeProfileIdQuery
        ? await MODEL.Profile.findOne({ ...safeProfileIdQuery, candidateId: _id, deletedAt: null }).exec()
        : null;
  }

  /**
   * `Model<SectionDocument>` instead of `any` — same justified, narrow
   * cast pattern as `BaseController.ts`'s `modelObject`: Mongoose's
   * `Model<T>` is invariant enough that none of these 7 differently-
   * shaped concrete models can be assigned directly to a fixed
   * `Model<SectionDocument>`-typed slot without a cast. Self-contained
   * here rather than importing `CrudDocument` to avoid a cross-module
   * dependency for one local type.
   */
  interface SectionDocument {
    candidateId?: unknown;
  }
  const getMoreInfo: { collection: string; model: Model<SectionDocument> }[] = [
    { collection: 'generalInformation', model: MODEL.generalInformation as unknown as Model<SectionDocument> },
    { collection: 'experiences', model: MODEL.Experience as unknown as Model<SectionDocument> },
    { collection: 'educations', model: MODEL.Education as unknown as Model<SectionDocument> },
    { collection: 'references', model: MODEL.Reference as unknown as Model<SectionDocument> },
    { collection: 'projects', model: MODEL.Project as unknown as Model<SectionDocument> },
    { collection: 'certificates', model: MODEL.Certificate as unknown as Model<SectionDocument> },
    { collection: 'awards', model: MODEL.Award as unknown as Model<SectionDocument> },
  ];

  const dataResult = JSON.parse(JSON.stringify(document));
  delete dataResult.password;

  for (const { collection, model } of getMoreInfo) {
    dataResult[collection] = [];
    const { idQuerySafe } = await import('@/utils/querySafe');
    /**
     * _id here is a Mongoose ObjectId instance (from the raw document,
     * destructured before the JSON.parse/stringify flatten above), not a
     * string. QuerySafe.safeQuery only accepts string values (typeof
     * check) — passing the ObjectId directly made it silently drop the
     * candidateId filter, so this query returned EVERY candidate's CV
     * section data unfiltered.
     */
    const safeCandidateQuery = idQuerySafe.safeQuery({}, { candidateId: _id?.toString() || '' });
    // Profile filter: the id list comes from the already ownership-checked `profileDoc` above (server-derived), so it's safe to merge in directly rather than through QuerySafe.
    const profileIdsField = PROFILE_ID_FIELDS[collection];
    /**
     * Dynamic per-collection field lookup (`experienceIds`/`educationIds`/...)
     * on the real Profile document — genuinely needs a cast since the real
     * document type has no string index signature (its fields are named
     * explicitly in the schema), but `profileIdsField` is only known at
     * runtime. Narrowed to exactly the shape read here.
     */
    const profileIds = profileDoc && profileIdsField ? (profileDoc as unknown as Record<string, unknown[]>)[profileIdsField] : undefined;
    const baseQuery = { ...safeCandidateQuery, deletedAt: null };
    const sectionQuery = profileDoc && profileIdsField ? { ...baseQuery, _id: { $in: profileIds || [] } } : baseQuery;
    // Real hydrated Mongoose documents — immediately flattened via JSON.parse(JSON.stringify(...)) below, so the exact document shape isn't needed here.
    const _find = await model.find(sectionQuery, { _id: 0, ...removeFields }).exec();
    if (!_find) continue;
    /**
     * Flatten Mongoose documents to plain objects immediately (same as
     * `document` above) — spreading a live Mongoose document later (for
     * the language-resolution step) only copies its internal bookkeeping
     * properties ($__, _doc, ...), not the clean schema fields, since
     * those are only reachable via getters that a plain object spread
     * doesn't invoke.
     */
    dataResult[collection] = JSON.parse(JSON.stringify(_find));
  }

  dataResult['generalInformation'] = ((data: Record<string, unknown>[]) => {
    if (!data.length) return {};
    return data[0];
  })(dataResult['generalInformation']);

  /**
   * Resolve localized ({vi, en}) fields down to a single string for this
   * language, falling back to whichever variant is non-empty.
   */
  dataResult.introduction = resolveLocalizedText(dataResult.introduction, lang);
  for (const key of ['educations', 'experiences', 'awards', 'certificates', 'projects']) {
    dataResult[key] = (dataResult[key] || []).map((item: Record<string, unknown>) => ({
      ...item,
      description: resolveLocalizedText(item['description'], lang),
    }));
  }
  if (dataResult.generalInformation && Object.keys(dataResult.generalInformation).length) {
    /**
     * Spread into a new plain object rather than mutating in place —
     * generalInformation still holds a live Mongoose document here (only
     * the top-level Candidate doc went through JSON.parse(JSON.stringify)
     * above), so assigning a plain string onto a subdocument path would
     * route through Mongoose's own setter/caster instead of just
     * overwriting the value in the response payload.
     */
    dataResult.generalInformation = {
      ...dataResult.generalInformation,
      career: resolveLocalizedText(dataResult.generalInformation.career, lang),
      careerGoal: resolveLocalizedText(dataResult.generalInformation.careerGoal, lang),
    };
  }

  return {
    success: true,
    data: dataResult,
    message: 'Lấy thông tin ứng viên thành công',
  };
};

export const fnRecordVisit = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.params;
  if (!email) {
    res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Không tìm thấy Email'));
    return;
  }

  try {
    const _result = await handlerRecordVisit(email, req);
    return formatReturn(res, _result);
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

export const handlerRecordVisit = async (email: string, req: Request) => {
  const { candidateQuerySafe } = await import('@/utils/querySafe');
  // Same fail-closed check as handlerGetAboutMe above — a rejected
  // email must not fall through to an unfiltered findOne({}).
  const safeEmailQuery = candidateQuerySafe.safeQuery({}, { email });
  const candidate = 'email' in safeEmailQuery ? await MODEL.Candidate.findOne(safeEmailQuery).select('_id').exec() : null;
  // Same 404 as handlerGetAboutMe above for an unknown email.
  if (!candidate) throw new NotFoundError(PROFILE_NOT_FOUND);

  /**
   * Same IP-extraction pattern already used by rateLimit.middleware.ts —
   * no `trust proxy` is configured on the Express app, so behind a
   * reverse proxy (e.g. Render) this may resolve to the proxy's address
   * rather than the real client IP; out of scope to fix here.
   */
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const geo = ip && ip !== 'unknown' ? geoip.lookup(ip) : null;
  const location = geo ? [geo.city, geo.region, geo.country].filter(Boolean).join(', ') : '';

  const body = req.body as { referrer?: unknown; profile?: unknown } | undefined;
  const referrer = normalizeReferrer(body?.referrer);
  const profileId = await resolveVisitProfileId(body?.profile, candidate._id);

  await MODEL.Visit.create({ candidateId: candidate._id, ip, location, referrer, profileId });

  return { success: true, message: 'Ghi nhận lượt ghé thăm thành công', data: null };
};

/**
 * The visited candidate's own non-deleted profile id, or null for
 * anything else (absent, malformed, foreign, deleted). The visit POST is
 * public, so a visitor must not be able to plant an arbitrary or another
 * candidate's id in someone's stats — and a bad value must never fail
 * the visit. Malformed ids are rejected before the query because
 * Mongoose would throw a CastError on them.
 */
export const resolveVisitProfileId = async (raw: unknown, candidateId: Types.ObjectId | null): Promise<Types.ObjectId | null> => {
  if (!candidateId || typeof raw !== 'string' || !/^[a-f\d]{24}$/i.test(raw)) return null;
  const { idQuerySafe } = await import('@/utils/querySafe');
  const safeProfileIdQuery = idQuerySafe.safeQuery({}, { _id: raw });
  if (!('_id' in safeProfileIdQuery)) return null;
  const profile = await MODEL.Profile.findOne({ ...safeProfileIdQuery, candidateId, deletedAt: null }).select('_id').exec();
  return profile?._id ?? null;
};

const REFERRER_MAX_LENGTH = 2048;

/**
 * Reduces the client-forwarded `document.referrer` to a bare hostname
 * (lowercased, leading `www.`/`m.` stripped), or null for anything
 * missing, malformed, oversized or not http(s) — a bad value must never
 * fail the visit. Read from the body, not the `Referer` header: the visit
 * POST is an XHR from the profile page, so its own header names the CV
 * site rather than where the visitor came from.
 */
export const normalizeReferrer = (raw: unknown): string | null => {
  if (typeof raw !== 'string' || !raw || raw.length > REFERRER_MAX_LENGTH) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  return url.hostname.replace(/^(www|m)\./, '') || null;
};

export const fnExportPDF = async (req: Request, res: Response, next: NextFunction) => {
  // Use the authenticated user's own id — never a client-supplied one, or any authenticated user could export another candidate's PDF.
  const _id = req.user?._id;
  if (!_id) {
    res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('CandidateId not found'));
    return;
  }

  const { idQuerySafe } = await import('@/utils/querySafe');
  const find = await MODEL.Candidate.findOne(idQuerySafe.safeQuery({}, { _id })).exec();
  if (!find) return next(new NotFoundError('Candidate not found'));

  const { email } = find;
  if (!email) {
    res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Email not found'));
    return;
  }

  try {
    const lang = req.query['lang'] === 'en' ? 'en' : 'vi';
    const { success, message, data } = await handlerGetAboutMe({ identifier: email, lang });

    // ?format=json reuses the same aggregated data already assembled for
    // the PDF path — no new dependency, no new data-fetch.
    if (req.query['format'] === 'json') {
      formatReturn(res, { success, message, data });
      return;
    }

    /**
     * `template=modern` (issue #162) is a visual-style choice, not an
     * ATS-compatibility one — applies to both the `pdf` (default) and
     * `docx` formats. `template=classic` (the default, unchanged) keeps
     * every existing client on the pre-existing visual template/style.
     */
    const theme = req.query['template'] === 'modern' ? 'modern' : 'classic';

    // ?format=docx — same aggregated data, packed as a .docx instead of
    // rendered to PDF.
    if (req.query['format'] === 'docx') {
      await createCVDocx(data, res, theme);
      return;
    }

    // ?template=ats — ATS-optimized template, same aggregated data.
    if (req.query['template'] === 'ats') {
      await createCVAts({ data, res, options: { lang } });
      return;
    }

    await createCV(data, res, { theme });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

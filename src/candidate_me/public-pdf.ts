/**
 * GET /api/me/:identifier/download-pdf — unauthenticated ATS PDF of a
 * public profile, so the public portfolio can proxy it instead of keeping
 * its own copy of the template. Same data path as GET /api/me/:identifier
 * and the same renderer as the owner's download-pdf?template=ats.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { createHash } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { handleError } from '@/utils';
import { NotFoundError } from '@/errors';
import { formatReturnFailed } from '@/services';
import { handlerGetAboutMe, PROFILE_NOT_FOUND } from '@/candidate_me/index';
import { atsPdfFilename, renderAtsPdfBuffer, type AtsContent } from '@/services/createPDF.ats';
import type { AggregatedCandidateData } from '@/types/candidate.type';
import type { SupportedLang } from '@/utils/i18n';

export const PUBLIC_PDF_CACHE_TTL_MS = 60 * 60 * 1000;
export const PUBLIC_PDF_CACHE_MAX_ENTRIES = 50;

interface RenderedPdf {
  buffer: Buffer;
  content: AtsContent;
}

/**
 * Keyed by a hash of the exact data being rendered (plus lang), so any
 * edit to the CV produces a new key and no write path needs an
 * invalidation hook. Holds the render promise rather than the buffer, so
 * concurrent identical requests share one Puppeteer launch.
 */
const cache = new Map<string, { expiresAt: number; pdf: Promise<RenderedPdf> }>();

export const clearPublicPdfCache = (): void => cache.clear();

const renderCached = (data: AggregatedCandidateData, lang: SupportedLang): Promise<RenderedPdf> => {
  const now = Date.now();
  const key = createHash('sha256').update(lang).update(JSON.stringify(data)).digest('hex');
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.pdf;

  for (const [staleKey, entry] of cache) if (entry.expiresAt <= now) cache.delete(staleKey);
  // Map iterates in insertion order, so the first key is the oldest entry.
  for (const oldestKey of cache.keys()) {
    if (cache.size < PUBLIC_PDF_CACHE_MAX_ENTRIES) break;
    cache.delete(oldestKey);
  }

  const pdf = renderAtsPdfBuffer(data, { lang });
  cache.set(key, { expiresAt: now + PUBLIC_PDF_CACHE_TTL_MS, pdf });
  // A failed render must not be served from the cache for the rest of the TTL.
  pdf.catch(() => {
    if (cache.get(key)?.pdf === pdf) cache.delete(key);
  });
  return pdf;
};

export const fnDownloadPublicPdf = async (req: Request, res: Response, next: NextFunction) => {
  const { identifier } = req.params;
  // Only the ATS template is public: the classic renderer also writes the file under public/.
  if (req.query['template'] !== undefined && req.query['template'] !== 'ats') {
    res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Chỉ hỗ trợ template=ats'));
    return;
  }
  if (!identifier) {
    res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Không tìm thấy Email'));
    return;
  }
  const lang: SupportedLang = req.query['lang'] === 'en' ? 'en' : 'vi';
  const profileId = typeof req.query['profile'] === 'string' ? req.query['profile'] : undefined;

  try {
    const _me = await handlerGetAboutMe({ identifier, lang, profileId });
    const data = _me.data as (AggregatedCandidateData & { isPublic?: boolean }) | null;
    // Private profile answers exactly like an unknown one, same as fnGetAboutMe.
    if (!data || data.isPublic === false) return next(new NotFoundError(PROFILE_NOT_FOUND));

    const { buffer, content } = await renderCached(data, lang);
    res.setHeader('Content-Disposition', `attachment; filename="${atsPdfFilename(content)}"`);
    res.contentType('application/pdf');
    res.send(buffer);
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

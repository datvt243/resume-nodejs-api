/**
 * POST /api/v1/cv/ats-check — renders the authenticated candidate's own
 * CV in memory (same aggregated data as `download-pdf`), extracts the
 * real text back out of the rendered PDF, and scores it against the ATS
 * check suite. See `doctrine/standards/pdf-export-standard.md`.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { NextFunction, Request, Response } from 'express';

import { formatReturn, handleError } from '@/utils';
import { BadRequestError, NotFoundError } from '@/errors';
import { t } from '@/utils/i18n';
import { handlerGetAboutMe } from '@/candidate_me/index';
import { renderAtsPdfBuffer, buildAtsContent } from '@/services/createPDF.ats';
import { renderPdfBuffer } from '@/services/createPDF';
import { extractPdfText } from '@/services/atsExtract';
import { runAtsChecks, scoreChecks, type AtsCheckInput } from '@/services/atsChecks';
import { matchKeywords } from '@/services/keywordMatcher';
import type { SupportedLang } from '@/utils/i18n';
import type { AggregatedCandidateData } from '@/types/candidate.type';
import * as MODEL from '@/models';

export const fnAtsCheck = async (req: Request, res: Response, next: NextFunction) => {
  const _id = req.user?._id;
  if (!_id) {
    return next(new BadRequestError(t('candidate.userNotFound', req.lang)));
  }

  try {
    const { idQuerySafe } = await import('@/utils/querySafe');
    const find = await MODEL.Candidate.findOne(idQuerySafe.safeQuery({}, { _id })).exec();
    if (!find?.email) return next(new NotFoundError(t('candidate.userNotFound', req.lang)));

    const lang: SupportedLang = req.body?.['lang'] === 'en' ? 'en' : 'vi';
    const template: 'ats' | 'classic' = req.body?.['template'] === 'classic' ? 'classic' : 'ats';
    const jobDescription: string | undefined = typeof req.body?.['jobDescription'] === 'string' ? req.body['jobDescription'] : undefined;

    const { data } = await handlerGetAboutMe({ identifier: find.email, lang });

    const candidateData = data as AggregatedCandidateData;

    let buffer: Buffer;
    let sectionHeadings: string[] = [];
    let metadataTitle: string | undefined;
    let metadataAuthor: string | undefined;

    if (template === 'classic') {
      /**
       * The classic template hardcodes Vietnamese section labels (not
       * localized) and sets no PDF metadata — both correctly surface as
       * failures below (standard-headings/metadata), not bugs in this
       * check: pdf-export-standard.md rule 8's single-column/no-letter-
       * spacing invariants only bind on a template claiming ATS-safety,
       * which `classic` never has.
       */
      buffer = await renderPdfBuffer(candidateData);
    } else {
      const atsResult = await renderAtsPdfBuffer(candidateData, { lang });
      buffer = atsResult.buffer;
      sectionHeadings = atsResult.content.sections.map((s) => s.heading);
      metadataTitle = `${atsResult.content.fullName} - ${atsResult.content.headline || 'CV'} CV`;
      metadataAuthor = atsResult.content.fullName;
    }

    const { text, pages } = await extractPdfText(buffer);
    const facts = buildAtsContent({ RECORD: candidateData, lang });

    const checkInput: AtsCheckInput = {
      text,
      pages,
      lang,
      fullName: facts.fullName,
      email: facts.contact.email,
      phone: facts.contact.phone,
      sectionHeadings,
      experienceStartDates: facts.experienceStartDates,
      metadataTitle,
      metadataAuthor,
    };

    const checks = runAtsChecks(checkInput);
    const score = scoreChecks(checks);
    const keywordMatch = jobDescription ? matchKeywords(jobDescription, text) : undefined;

    formatReturn(res, {
      success: true,
      message: 'ATS self-check completed',
      data: {
        score,
        pages,
        checks,
        extractedText: text,
        ...(keywordMatch ? { keywordMatch } : {}),
      },
    });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

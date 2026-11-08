/**
 * The 10 ATS-safety checks run against a PDF's extracted text
 * (`atsExtract.ts`) by `POST /api/v1/cv/ats-check`. Each check is a pure
 * function over already-extracted data — no Puppeteer/pdf-parse calls in
 * here — so each one is independently unit-testable with a plain text
 * fixture. See `doctrine/standards/pdf-export-standard.md` for the
 * invariants these enforce.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { t } from '@/utils/i18n';
import type { SupportedLang } from '@/utils/i18n';

export type AtsCheckSeverity = 'error' | 'warning';

export interface AtsCheckResult {
  id: string;
  passed: boolean;
  severity: AtsCheckSeverity;
  message: string;
  /** `false` when the check can't be judged for this template; it is then left out of the score. */
  applicable?: false;
}

export interface AtsCheckInput {
  /** `classic` renders no PDF metadata and no section-heading list, so those two checks don't apply. */
  template?: 'ats' | 'classic' | undefined;
  text: string;
  pages: number;
  lang: SupportedLang;
  fullName: string;
  email?: string | undefined;
  phone?: string | undefined;
  /** Localized section headings actually rendered, in render order. */
  sectionHeadings: string[];
  /** Experience entries' start dates (ms epoch), in rendered order. */
  experienceStartDates: number[];
  metadataTitle?: string | undefined;
  metadataAuthor?: string | undefined;
}

const MIN_EXTRACTABLE_LENGTH = 200;

/**
 * A run of 5+ single letters each separated by a single space — the
 * classic symptom of `letter-spacing` turning "FRONTEND" into "F R O N
 * T E N D" in extracted text. Covers Vietnamese letters too.
 */
const SPACED_LETTERS_PATTERN = /\b(?:[A-Za-zÀ-ỹ] ){4,}[A-Za-zÀ-ỹ]\b/;

// A date token with a single-digit month (e.g. "9/2024") — the exact
// shape of the `formatDate` padding bug this standard exists to catch.
const UNPADDED_MONTH_DATE_PATTERN = /\b\d\/\d{4}\b/;

const STANDARD_HEADING_KEYS = ['cv.summary', 'cv.skills', 'cv.experience', 'cv.projects', 'cv.education', 'cv.certifications', 'cv.awards', 'cv.languages'];

const FORBIDDEN_FIELD_PHRASES = [
  'date of birth',
  'gender',
  'marital status',
  'ngày sinh',
  'giới tính',
  'tình trạng hôn nhân',
];

const notApplicable = (id: string, input: AtsCheckInput): AtsCheckResult => ({
  id,
  passed: true,
  severity: 'error',
  message: t('atsCheck.notApplicableClassic', input.lang),
  applicable: false,
});

const getNonEmptyLines = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

export const checkTextExtractable = (input: AtsCheckInput): AtsCheckResult => {
  const length = input.text.trim().length;
  return {
    id: 'text-extractable',
    passed: length > MIN_EXTRACTABLE_LENGTH,
    severity: 'error',
    message: length > MIN_EXTRACTABLE_LENGTH ? `Extracted ${length} characters of text.` : `Only ${length} characters extracted — the PDF may be image-based, not real text.`,
  };
};

export const checkReadingOrder = (input: AtsCheckInput): AtsCheckResult => {
  const lines = getNonEmptyLines(input.text);
  const firstLine = (lines[0] || '').toLowerCase();
  const nameFirst = input.fullName.trim().length > 0 && firstLine.includes(input.fullName.trim().toLowerCase());

  /**
   * Case-insensitive: the ATS template's `.heading` CSS applies
   * `text-transform: uppercase` (allowed on headings — pdf-export-standard.md
   * rule 3's note), which Chromium renders as actual uppercase glyphs, so
   * real extracted text has e.g. "SKILLS" while the locale string is
   * "Skills" — comparing exact case here would false-fail on every real
   * PDF, not just a visually-broken one.
   */
  const lowerText = input.text.toLowerCase();
  let headingsInOrder = true;
  let searchFrom = 0;
  for (const heading of input.sectionHeadings) {
    const idx = lowerText.indexOf(heading.toLowerCase(), searchFrom);
    if (idx === -1 || idx < searchFrom) {
      headingsInOrder = false;
      break;
    }
    searchFrom = idx + heading.length;
  }

  const passed = nameFirst && headingsInOrder;
  return {
    id: 'reading-order',
    passed,
    severity: 'error',
    message: passed ? 'Name appears first; section headings appear in the expected order.' : !nameFirst ? 'The candidate name was not found on the first line of extracted text.' : 'Section headings do not appear in the expected reverse-chronological reading order.',
  };
};

export const checkNoSpacedLetters = (input: AtsCheckInput): AtsCheckResult => {
  const match = SPACED_LETTERS_PATTERN.test(input.text);
  return {
    id: 'no-spaced-letters',
    passed: !match,
    severity: 'error',
    message: match ? 'Found letters separated by single spaces (likely CSS letter-spacing) — keywords become unmatchable.' : 'No spaced-out letter sequences found.',
  };
};

export const checkContactInBody = (input: AtsCheckInput): AtsCheckResult => {
  const firstLines = getNonEmptyLines(input.text).slice(0, 10).join(' ');
  const hasEmail = !!input.email && firstLines.includes(input.email);
  const hasPhone = !!input.phone && firstLines.includes(input.phone);
  const passed = hasEmail && hasPhone;
  return {
    id: 'contact-in-body',
    passed,
    severity: 'error',
    message: passed ? 'Email and phone both found near the top of the document body.' : 'Email and/or phone not found in the first ~10 lines of the document body.',
  };
};

export const checkStandardHeadings = (input: AtsCheckInput): AtsCheckResult => {
  if (input.template === 'classic') return notApplicable('standard-headings', input);
  const standardHeadings = new Set(STANDARD_HEADING_KEYS.map((key) => t(key, input.lang)));
  const nonStandard = input.sectionHeadings.filter((heading) => !standardHeadings.has(heading));
  return {
    id: 'standard-headings',
    passed: nonStandard.length === 0,
    severity: 'error',
    message: nonStandard.length === 0 ? 'Every rendered section uses a standard heading name.' : `Non-standard heading(s) found: ${nonStandard.join(', ')}.`,
  };
};

export const checkDateFormat = (input: AtsCheckInput): AtsCheckResult => {
  const hasUnpaddedMonth = UNPADDED_MONTH_DATE_PATTERN.test(input.text);
  return {
    id: 'date-format',
    passed: !hasUnpaddedMonth,
    severity: 'error',
    message: hasUnpaddedMonth ? 'Found a date with an unpadded single-digit month (e.g. "9/2024" instead of "09/2024").' : 'All dates use zero-padded MM/YYYY.',
  };
};

export const checkReverseChronological = (input: AtsCheckInput): AtsCheckResult => {
  const dates = input.experienceStartDates;
  let descending = true;
  for (let i = 1; i < dates.length; i++) {
    const prev = dates[i - 1];
    const curr = dates[i];
    if (prev !== undefined && curr !== undefined && curr > prev) {
      descending = false;
      break;
    }
  }
  return {
    id: 'reverse-chronological',
    passed: descending,
    severity: 'error',
    message: descending ? 'Experience entries are sorted reverse-chronologically.' : 'Experience entries are not sorted with the most recent start date first.',
  };
};

export const checkNoForbiddenFields = (input: AtsCheckInput): AtsCheckResult => {
  const lower = input.text.toLowerCase();
  const found = FORBIDDEN_FIELD_PHRASES.filter((phrase) => lower.includes(phrase));
  return {
    id: 'no-forbidden-fields',
    passed: found.length === 0,
    severity: 'error',
    message: found.length === 0 ? 'No date of birth, gender, or marital status found.' : `Found forbidden field(s): ${found.join(', ')}.`,
  };
};

export const checkPageCount = (input: AtsCheckInput): AtsCheckResult => {
  const passed = input.pages <= 2;
  return {
    id: 'page-count',
    passed,
    severity: 'warning',
    message: passed ? `${input.pages} page(s) — within the 2-page target.` : `${input.pages} pages — longer than the 2-page target for ≤10 years of experience.`,
  };
};

export const checkMetadata = (input: AtsCheckInput): AtsCheckResult => {
  if (input.template === 'classic') return notApplicable('metadata', input);
  const passed = !!input.metadataTitle && !!input.metadataAuthor;
  return {
    id: 'metadata',
    passed,
    severity: 'error',
    message: passed ? 'PDF Title and Author metadata are set.' : 'PDF Title and/or Author metadata is missing.',
  };
};

export const runAtsChecks = (input: AtsCheckInput): AtsCheckResult[] => [
  checkTextExtractable(input),
  checkReadingOrder(input),
  checkNoSpacedLetters(input),
  checkContactInBody(input),
  checkStandardHeadings(input),
  checkDateFormat(input),
  checkReverseChronological(input),
  checkNoForbiddenFields(input),
  checkPageCount(input),
  checkMetadata(input),
];

/**
 * Weighted pass rate: an `error`-severity check counts for 2 points, a
 * `warning` for 1 — a single failed error (e.g. spaced letters) drags the
 * score down harder than a 3rd page warning, since errors are the checks
 * that actually break keyword matching, not just length.
 */
const SEVERITY_WEIGHT: Record<AtsCheckSeverity, number> = { error: 2, warning: 1 };

export const scoreChecks = (checks: AtsCheckResult[]): number => {
  let earned = 0;
  let total = 0;
  for (const check of checks) {
    if (check.applicable === false) continue;
    const weight = SEVERITY_WEIGHT[check.severity];
    total += weight;
    if (check.passed) earned += weight;
  }
  return total === 0 ? 100 : Math.round((earned / total) * 100);
};

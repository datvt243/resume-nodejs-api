/**
 * Best-effort PDF CV parser — reads the PDF's text layer via
 * `extractPdfText`, then splits it into Education/Experience entries by
 * section headings (vi + en) and date ranges. Returns the same
 * `ParsedEducation`/`ParsedExperience` shapes as the LinkedIn export
 * parser so the frontend reuses one review-before-save flow. Stateless:
 * never touches disk or DB.
 *
 * Accuracy depends on the input layout — single-column CVs with standard
 * headings parse best; multi-column/designed CVs parse poorly and
 * image-only (scanned) PDFs yield no text at all (OCR is out of scope).
 * `extractedText` is returned alongside so the user can copy from it by
 * hand when the heuristic finds little.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { extractPdfText } from '@/services/atsExtract';
import { localized, parsedDates, type ParsedEducation, type ParsedExperience } from '@/candidate/parseLinkedInExport.service';

type SectionKind = 'education' | 'experience' | 'other';

export interface ParsedCvText {
  educations: ParsedEducation[];
  experiences: ParsedExperience[];
}

export interface ParsedCvPdf extends ParsedCvText {
  extractedText: string;
}

interface DateRange {
  startDate: number | null;
  endDate: number | null;
  isCurrent: boolean;
  /** The line with the date range cut out — non-empty when title and dates share one line. */
  rest: string;
}

interface RawEntry {
  title: string;
  startDate: number | null;
  endDate: number | null;
  isCurrent: boolean;
  description: string;
}

/**
 * Matched against a whole line only (see `headingKind`), never a
 * substring — so a sentence like "Experience with Node.js" is not
 * mistaken for a section heading. `other` headings only end the current
 * Education/Experience section.
 */
const SECTION_HEADINGS: Record<SectionKind, string[]> = {
  education: ['education', 'academic background', 'học vấn', 'trình độ học vấn', 'quá trình học tập', 'học tập'],
  experience: [
    'experience',
    'work experience',
    'professional experience',
    'employment',
    'employment history',
    'work history',
    'kinh nghiệm',
    'kinh nghiệm làm việc',
    'quá trình làm việc',
    'quá trình công tác',
  ],
  other: [
    'summary',
    'profile',
    'objective',
    'about me',
    'skills',
    'technical skills',
    'projects',
    'certifications',
    'certificates',
    'awards',
    'languages',
    'references',
    'interests',
    'hobbies',
    'activities',
    'contact',
    'personal information',
    'tóm tắt',
    'giới thiệu',
    'mục tiêu nghề nghiệp',
    'kỹ năng',
    'dự án',
    'chứng chỉ',
    'giải thưởng',
    'ngoại ngữ',
    'người tham chiếu',
    'sở thích',
    'hoạt động',
    'thông tin cá nhân',
    'liên hệ',
  ],
};

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// `(?<!\d)`/`(?!\d)` keep a 4-digit run inside a longer number (e.g. a phone number) from reading as a year.
const DATE = String.raw`(?<!\d)(?:\d{1,2}[/.-]\d{4}|(?:${MONTH_NAMES.join('|')})[a-z]*\.?\s+\d{4}|\d{4})(?!\d)`;
const PRESENT = String.raw`(?:present|current|now|hiện tại|đến nay|nay)`;
const RANGE_RE = new RegExp(String.raw`(${DATE})\s*(?:[-–—~]|to|đến)\s*(${DATE}|${PRESENT})`, 'i');
const SINGLE_DATE_LINE_RE = new RegExp(String.raw`^(${DATE})$`, 'i');
const PRESENT_RE = new RegExp(String.raw`^${PRESENT}$`, 'i');

const TITLE_SEPARATORS = [' — ', ' – ', ' | ', ' - ', ' at ', ' tại ', ', '];
const COMPANY_HINT = /\b(co\.?|company|corp\.?|corporation|inc\.?|ltd\.?|llc|jsc|group|bank|technolog(?:y|ies)|software|solutions?)\b|công ty|tập đoàn|ngân hàng/i;
const SCHOOL_HINT = /\b(university|college|school|institute|academy)\b|đại học|trường|học viện|cao đẳng/i;

const normalizeHeading = (line: string): string =>
  line
    .toLowerCase()
    .replace(/[:：]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

const headingKind = (line: string): SectionKind | null => {
  const normalized = normalizeHeading(line);
  for (const kind of Object.keys(SECTION_HEADINGS) as SectionKind[]) {
    if (SECTION_HEADINGS[kind].some((heading) => heading.normalize('NFC') === normalized)) return kind;
  }
  return null;
};

/** Local-time month start — the same clock the ATS template formats `MM/YYYY` with, so a round-trip keeps the month. */
const parseDate = (raw: string): number | null => {
  const value = raw.trim().toLowerCase();
  let month = 1;
  let year: number;

  const numeric = /^(\d{1,2})[/.-](\d{4})$/.exec(value);
  const named = /^([a-z]{3})[a-z]*\.?\s+(\d{4})$/.exec(value);
  if (numeric) {
    month = Number(numeric[1]);
    year = Number(numeric[2]);
  } else if (named) {
    month = MONTH_NAMES.indexOf(named[1] ?? '') + 1;
    year = Number(named[2]);
  } else {
    year = Number(value);
  }

  if (month < 1 || month > 12 || year < 1950 || year > 2100) return null;
  return new Date(year, month - 1, 1).getTime();
};

const stripSeparators = (text: string): string => text.replace(/^[\s|,:()–—-]+|[\s|,:()–—-]+$/g, '');

const findDateRange = (line: string): DateRange | null => {
  const range = RANGE_RE.exec(line);
  if (range) {
    const startDate = parseDate(range[1] ?? '');
    if (startDate === null) return null;
    const endRaw = (range[2] ?? '').trim();
    const isCurrent = PRESENT_RE.test(endRaw);
    return {
      startDate,
      endDate: isCurrent ? null : parseDate(endRaw),
      isCurrent,
      rest: stripSeparators(line.replace(range[0], ' ')),
    };
  }

  const single = SINGLE_DATE_LINE_RE.exec(line);
  const startDate = single ? parseDate(single[1] ?? '') : null;
  return startDate === null ? null : { startDate, endDate: null, isCurrent: false, rest: '' };
};

const splitTitle = (title: string): string[] => {
  const lower = title.toLowerCase();
  for (const separator of TITLE_SEPARATORS) {
    const index = lower.indexOf(separator);
    if (index > 0) return [title.slice(0, index).trim(), title.slice(index + separator.length).trim()];
  }
  return [title.trim()];
};

const splitSections = (lines: string[]): { kind: SectionKind; lines: string[] }[] => {
  const sections: { kind: SectionKind; lines: string[] }[] = [];
  let current: { kind: SectionKind; lines: string[] } | null = null;
  for (const line of lines) {
    const kind = headingKind(line);
    if (kind) {
      current = { kind, lines: [] };
      sections.push(current);
    } else {
      current?.lines.push(line);
    }
  }
  return sections;
};

/**
 * One entry per line carrying a date range. The title is the rest of that
 * line when it has text besides the dates; otherwise the line before it —
 * or the line after it, when the section opens with a bare date line
 * (dates-first layout). Everything up to the next entry's title is its
 * description.
 */
const extractEntries = (lines: string[]): RawEntry[] => {
  const dated = lines.flatMap((line, index) => {
    const range = findDateRange(line);
    return range ? [{ index, range }] : [];
  });
  const first = dated[0];
  if (!first) return [];

  const isDateLine = (index: number) => dated.some((d) => d.index === index);
  const titleAfterDate = first.index === 0 && !first.range.rest;

  return dated.map(({ index, range }, k) => {
    const next = dated[k + 1];
    let title = range.rest;
    let bodyStart = index + 1;
    if (!title && titleAfterDate && !isDateLine(index + 1)) {
      title = lines[index + 1] ?? '';
      bodyStart = index + 2;
    } else if (!title && !titleAfterDate && !isDateLine(index - 1)) {
      title = lines[index - 1] ?? '';
    }

    let bodyEnd = next ? next.index : lines.length;
    if (next && !next.range.rest && !titleAfterDate && !isDateLine(next.index - 1)) bodyEnd = next.index - 1;

    return {
      title,
      startDate: range.startDate,
      endDate: range.endDate,
      isCurrent: range.isCurrent,
      description: lines.slice(bodyStart, Math.max(bodyStart, bodyEnd)).join('\n'),
    };
  });
};

const toExperience = (entry: RawEntry): ParsedExperience => {
  const [first = '', second] = splitTitle(entry.title);
  let position = second === undefined ? '' : first;
  let company = second ?? first;
  // Default is "Position — Company" (the ATS template's order, and "X at Y"); swap when only the first half looks like a company.
  if (second !== undefined && COMPANY_HINT.test(first) && !COMPANY_HINT.test(second)) {
    position = second;
    company = first;
  }
  return { ...parsedDates(entry.startDate, entry.endDate, entry.isCurrent), company, position, description: localized(entry.description) };
};

const toEducation = (entry: RawEntry): ParsedEducation => {
  const [first = '', second] = splitTitle(entry.title);
  let major = second === undefined ? '' : first;
  let school = second ?? first;
  if (second !== undefined && SCHOOL_HINT.test(first) && !SCHOOL_HINT.test(second)) {
    major = second;
    school = first;
  }
  return { ...parsedDates(entry.startDate, entry.endDate, entry.isCurrent), school: localized(school), major: localized(major), description: localized(entry.description) };
};

export const parseCvText = (text: string): ParsedCvText => {
  const lines = text
    .normalize('NFC')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const educations: ParsedEducation[] = [];
  const experiences: ParsedExperience[] = [];
  for (const section of splitSections(lines)) {
    if (section.kind === 'education') educations.push(...extractEntries(section.lines).map(toEducation));
    if (section.kind === 'experience') experiences.push(...extractEntries(section.lines).map(toExperience));
  }

  return {
    educations: educations.filter((education) => education.school.vi),
    experiences: experiences.filter((experience) => experience.company),
  };
};

export const parseCvPdf = async (buffer: Buffer): Promise<ParsedCvPdf> => {
  let text: string;
  try {
    ({ text } = await extractPdfText(buffer));
  } catch {
    throw new Error('INVALID_PDF');
  }
  return { ...parseCvText(text), extractedText: text };
};

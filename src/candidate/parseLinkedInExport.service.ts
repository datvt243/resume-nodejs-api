/**
 * Best-effort LinkedIn "Data export" (ZIP of CSVs) parser — pulls
 * Education.csv/Positions.csv into this API's own Education/Experience
 * shapes. Pure, no I/O beyond the already-uploaded buffer, never
 * touches the DB: a stateless parse-and-return helper, the frontend
 * maps the result into its existing create forms for the user to
 * review/edit before saving.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import path from 'path';
import AdmZip from 'adm-zip';
import { parse as parseCsv } from 'csv-parse/sync';

export interface LocalizedText {
  vi: string;
  en: string;
}

/**
 * Parsed entries are shaped to post to `/education/bulk` / `/experience/bulk`
 * unchanged: `_id: null` like a create form, localized text, and no
 * `endDate` when it is unknown (the schema rejects `null`).
 */
interface ParsedDates {
  _id: null;
  startDate: number | null;
  endDate?: number;
  isCurrent: boolean;
}

export interface ParsedEducation extends ParsedDates {
  school: LocalizedText;
  major: LocalizedText;
  description: LocalizedText;
}

export interface ParsedExperience extends ParsedDates {
  company: string;
  position: string;
  description: LocalizedText;
}

// The source language is unknown, so both slots get the text; vi must be non-empty for education.
export const localized = (text: string): LocalizedText => ({ vi: text, en: text });

export const parsedDates = (startDate: number | null, endDate: number | null, isCurrent: boolean): ParsedDates => ({
  _id: null,
  startDate,
  ...(endDate === null ? {} : { endDate }),
  isCurrent,
});

const EDUCATION_FILENAME = 'education.csv';
const POSITIONS_FILENAME = 'positions.csv';

// LinkedIn's export headers are matched case-insensitively, trimmed --
// the export tool has shifted casing/spacing slightly across versions,
// and this is best-effort by design.
const pickField = (row: Record<string, string>, candidates: string[]): string => {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const key = keys.find((k) => k.trim().toLowerCase() === candidate.toLowerCase());
    if (key && row[key] !== undefined) return row[key].trim();
  }
  return '';
};

/**
 * LinkedIn's date columns are free text like "Sep 2020" or "2020", empty
 * for an ongoing entry -- Date.parse handles "Sep 2020" directly; "2020"
 * alone needs a day prefixed first. Unparseable -> null, never throws.
 */
const parseLinkedInDate = (raw: string): number | null => {
  const value = raw.trim();
  if (!value || /present/i.test(value)) return null;
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;
  const withDay = Date.parse(`1 ${value}`);
  return Number.isNaN(withDay) ? null : withDay;
};

// Ongoing = the CSV cell is blank or says "Present"; a present-but-unparseable date is a finished entry with an unknown end.
const isOngoing = (raw: string): boolean => !raw.trim() || /present/i.test(raw);

const findEntry = (entries: AdmZip.IZipEntry[], filename: string) =>
  entries.find((entry) => !entry.isDirectory && path.basename(entry.entryName).toLowerCase() === filename);

const readCsvRows = (entries: AdmZip.IZipEntry[], filename: string): Record<string, string>[] => {
  const entry = findEntry(entries, filename);
  if (!entry) return [];

  try {
    const content = entry.getData().toString('utf-8');
    return parseCsv(content, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true }) as Record<string, string>[];
  } catch {
    // Malformed CSV inside an otherwise-valid zip -- best-effort, skip
    // this file rather than failing the whole parse.
    return [];
  }
};

export const parseLinkedInExportZip = (buffer: Buffer): { educations: ParsedEducation[]; experiences: ParsedExperience[] } => {
  let entries: AdmZip.IZipEntry[];
  try {
    entries = new AdmZip(buffer).getEntries();
  } catch {
    throw new Error('INVALID_ZIP');
  }

  const educations = readCsvRows(entries, EDUCATION_FILENAME)
    .map((row) => {
      const startDate = parseLinkedInDate(pickField(row, ['Start Date']));
      const rawEndDate = pickField(row, ['End Date']);
      const endDate = parseLinkedInDate(rawEndDate);
      const education: ParsedEducation = {
        ...parsedDates(startDate, endDate, isOngoing(rawEndDate)),
        school: localized(pickField(row, ['School Name'])),
        major: localized(pickField(row, ['Field Of Study']) || pickField(row, ['Degree Name'])),
        description: localized(pickField(row, ['Notes'])),
      };
      return education;
    })
    .filter((education) => education.school.vi);

  const experiences = readCsvRows(entries, POSITIONS_FILENAME)
    .map((row) => {
      const startDate = parseLinkedInDate(pickField(row, ['Started On']));
      const rawEndDate = pickField(row, ['Finished On']);
      const endDate = parseLinkedInDate(rawEndDate);
      const experience: ParsedExperience = {
        ...parsedDates(startDate, endDate, isOngoing(rawEndDate)),
        company: pickField(row, ['Company Name']),
        position: pickField(row, ['Title']),
        description: localized(pickField(row, ['Description'])),
      };
      return experience;
    })
    .filter((experience) => experience.company);

  return { educations, experiences };
};

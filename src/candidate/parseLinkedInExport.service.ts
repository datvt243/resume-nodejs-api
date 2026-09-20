/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Best-effort LinkedIn "Data export" (ZIP of CSVs) parser
 *   (issue #141) — pulls Education.csv/Positions.csv into this API's own
 *   Education/Experience shapes. Pure, no I/O beyond the already-uploaded
 *   buffer, never touches the DB: this is a stateless parse-and-return
 *   helper, the frontend maps the result into its existing create forms
 *   for the user to review/edit before saving.
 */
import path from 'path';
import AdmZip from 'adm-zip';
import { parse as parseCsv } from 'csv-parse/sync';

export interface ParsedEducation {
  school: string;
  major: string;
  startDate: number | null;
  endDate: number | null;
  isCurrent: boolean;
  description: string;
}

export interface ParsedExperience {
  company: string;
  position: string;
  startDate: number | null;
  endDate: number | null;
  isCurrent: boolean;
  description: string;
}

const EDUCATION_FILENAME = 'education.csv';
const POSITIONS_FILENAME = 'positions.csv';

// LinkedIn's export headers are matched case-insensitively, trimmed --
// the export tool has shifted casing/spacing slightly across versions,
// and this is best-effort by design (issue #141's own accuracy caveat).
const pickField = (row: Record<string, string>, candidates: string[]): string => {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const key = keys.find((k) => k.trim().toLowerCase() === candidate.toLowerCase());
    if (key && row[key] !== undefined) return row[key].trim();
  }
  return '';
};

// LinkedIn's date columns are free text like "Sep 2020" or "2020", empty
// for an ongoing entry -- Date.parse handles "Sep 2020" directly; "2020"
// alone needs a day prefixed first. Unparseable -> null, never throws.
const parseLinkedInDate = (raw: string): number | null => {
  const value = raw.trim();
  if (!value || /present/i.test(value)) return null;
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;
  const withDay = Date.parse(`1 ${value}`);
  return Number.isNaN(withDay) ? null : withDay;
};

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
      const endDate = parseLinkedInDate(pickField(row, ['End Date']));
      const education: ParsedEducation = {
        school: pickField(row, ['School Name']),
        major: pickField(row, ['Field Of Study']) || pickField(row, ['Degree Name']),
        startDate,
        endDate,
        isCurrent: !endDate,
        description: pickField(row, ['Notes']),
      };
      return education;
    })
    .filter((education) => education.school);

  const experiences = readCsvRows(entries, POSITIONS_FILENAME)
    .map((row) => {
      const startDate = parseLinkedInDate(pickField(row, ['Started On']));
      const endDate = parseLinkedInDate(pickField(row, ['Finished On']));
      const experience: ParsedExperience = {
        company: pickField(row, ['Company Name']),
        position: pickField(row, ['Title']),
        startDate,
        endDate,
        isCurrent: !endDate,
        description: pickField(row, ['Description']),
      };
      return experience;
    })
    .filter((experience) => experience.company);

  return { educations, experiences };
};

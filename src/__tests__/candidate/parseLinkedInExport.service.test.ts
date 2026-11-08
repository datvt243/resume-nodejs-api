/**
 * Tests for candidate/parseLinkedInExport.service.ts (issue #141) — pure
 * parsing logic, no mocks needed. Builds real in-memory ZIP fixtures with
 * AdmZip itself (the same library the implementation uses to read them).
 */

import AdmZip from 'adm-zip';
import { parseLinkedInExportZip } from '@/candidate/parseLinkedInExport.service';

const buildZip = (files: Record<string, string>): Buffer => {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) {
    zip.addFile(name, Buffer.from(content, 'utf-8'));
  }
  return zip.toBuffer();
};

const EDUCATION_CSV = [
  'School Name,Start Date,End Date,Notes,Degree Name,Activities,Field Of Study',
  '"Some University","Sep 2016","Jun 2020","Deans list","Bachelor","Chess club","Computer Science"',
  '"Night School","Jan 2021","","","","","Continuing Studies"',
  ',,,,,,', // blank row (no school name) -- must be filtered out
].join('\n');

const POSITIONS_CSV = [
  'Company Name,Title,Description,Location,Started On,Finished On',
  '"Acme Corp","Backend Engineer","Built things","Remote","Sep 2020","Jun 2023"',
  '"Current Co","Senior Engineer","Still here","Remote","Jul 2023","Present"',
  ',,,,,', // blank row (no company name) -- must be filtered out
].join('\n');

describe('parseLinkedInExportZip (issue #141)', () => {
  it('parses Education.csv and Positions.csv into the expected shapes', () => {
    const zip = buildZip({ 'Education.csv': EDUCATION_CSV, 'Positions.csv': POSITIONS_CSV });

    const { educations, experiences } = parseLinkedInExportZip(zip);

    expect(educations).toHaveLength(2);
    // The bulk-create shape: `_id: null`, text in both languages.
    expect(educations[0]).toEqual({
      _id: null,
      school: { vi: 'Some University', en: 'Some University' },
      major: { vi: 'Computer Science', en: 'Computer Science' },
      startDate: Date.parse('Sep 2016'),
      endDate: Date.parse('Jun 2020'),
      isCurrent: false,
      description: { vi: 'Deans list', en: 'Deans list' },
    });
    // No End Date -> isCurrent true, no endDate key at all.
    expect(educations[1]).toMatchObject({ school: { vi: 'Night School', en: 'Night School' }, isCurrent: true });
    expect(educations[1]).not.toHaveProperty('endDate');

    expect(experiences).toHaveLength(2);
    expect(experiences[0]).toEqual({
      _id: null,
      company: 'Acme Corp',
      position: 'Backend Engineer',
      startDate: Date.parse('Sep 2020'),
      endDate: Date.parse('Jun 2023'),
      isCurrent: false,
      description: { vi: 'Built things', en: 'Built things' },
    });
    // "Present" -> treated the same as an empty end date.
    expect(experiences[1]).toMatchObject({ company: 'Current Co', isCurrent: true });
    expect(experiences[1]).not.toHaveProperty('endDate');
  });

  it('finds the CSVs even when nested inside a folder in the zip (real LinkedIn export shape)', () => {
    const zip = buildZip({
      'Basic_LinkedInDataExport_09-20-2026/Education.csv': EDUCATION_CSV,
      'Basic_LinkedInDataExport_09-20-2026/Positions.csv': POSITIONS_CSV,
    });

    const { educations, experiences } = parseLinkedInExportZip(zip);

    expect(educations).toHaveLength(2);
    expect(experiences).toHaveLength(2);
  });

  it('an end date that is present but unparseable is a finished entry: no endDate, isCurrent false', () => {
    const zip = buildZip({
      'Education.csv': ['School Name,Start Date,End Date,Field Of Study', '"Odd Uni","2015","sometime","Art"'].join('\n'),
      'Positions.csv': ['Company Name,Title,Started On,Finished On', '"Odd Co","Dev","2018","not a date"'].join('\n'),
    });

    const { educations, experiences } = parseLinkedInExportZip(zip);

    expect(educations[0]).toMatchObject({ school: { vi: 'Odd Uni', en: 'Odd Uni' }, isCurrent: false });
    expect(experiences[0]).toMatchObject({ company: 'Odd Co', isCurrent: false });
    expect(educations[0]).not.toHaveProperty('endDate');
    expect(experiences[0]).not.toHaveProperty('endDate');
  });

  it('matches headers case-insensitively', () => {
    const csv = ['school name,start date,end date,notes,degree name,activities,field of study', '"Lowercase Uni","2019","2023","","","","Math"'].join(
      '\n',
    );
    const zip = buildZip({ 'Education.csv': csv });

    const { educations } = parseLinkedInExportZip(zip);

    expect(educations).toEqual([
      {
        _id: null,
        school: { vi: 'Lowercase Uni', en: 'Lowercase Uni' },
        major: { vi: 'Math', en: 'Math' },
        startDate: Date.parse('2019'),
        endDate: Date.parse('2023'),
        isCurrent: false,
        description: { vi: '', en: '' },
      },
    ]);
  });

  it('returns empty arrays, does not throw, when neither CSV is present in an otherwise valid zip', () => {
    const zip = buildZip({ 'ReadMe.txt': 'not the files we want' });

    const result = parseLinkedInExportZip(zip);

    expect(result).toEqual({ educations: [], experiences: [] });
  });

  it('throws INVALID_ZIP for a buffer that is not a real zip', () => {
    expect(() => parseLinkedInExportZip(Buffer.from('not a zip file at all'))).toThrow('INVALID_ZIP');
  });
});

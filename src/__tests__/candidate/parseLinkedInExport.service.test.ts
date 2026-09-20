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
    expect(educations[0]).toEqual({
      school: 'Some University',
      major: 'Computer Science',
      startDate: Date.parse('Sep 2016'),
      endDate: Date.parse('Jun 2020'),
      isCurrent: false,
      description: 'Deans list',
    });
    // No End Date -> isCurrent true, endDate null.
    expect(educations[1]).toMatchObject({ school: 'Night School', endDate: null, isCurrent: true });

    expect(experiences).toHaveLength(2);
    expect(experiences[0]).toEqual({
      company: 'Acme Corp',
      position: 'Backend Engineer',
      startDate: Date.parse('Sep 2020'),
      endDate: Date.parse('Jun 2023'),
      isCurrent: false,
      description: 'Built things',
    });
    // "Present" -> treated the same as an empty end date.
    expect(experiences[1]).toMatchObject({ company: 'Current Co', endDate: null, isCurrent: true });
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

  it('matches headers case-insensitively', () => {
    const csv = ['school name,start date,end date,notes,degree name,activities,field of study', '"Lowercase Uni","2019","2023","","","","Math"'].join(
      '\n',
    );
    const zip = buildZip({ 'Education.csv': csv });

    const { educations } = parseLinkedInExportZip(zip);

    expect(educations).toEqual([
      { school: 'Lowercase Uni', major: 'Math', startDate: Date.parse('2019'), endDate: Date.parse('2023'), isCurrent: false, description: '' },
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

/**
 * Parsed import entries must post to `/education/bulk` / `/experience/bulk`
 * unchanged — validated here against the same schemas fnBulkCreate uses
 * (it only adds `candidateId` from the token).
 */
import AdmZip from 'adm-zip';
import { parseLinkedInExportZip } from '@/candidate/parseLinkedInExport.service';
import { parseCvText } from '@/candidate/parseCvPdf.service';
import { schemaEducation } from '@/candidate_profile/education/education.validate';
import { schemaExperience } from '@/candidate_profile/experience/experience.validate';

const candidateId = '64b7f0c2a1b2c3d4e5f60799';
const errorsOf = (schema: typeof schemaEducation, item: object) => schema.validate({ ...item, candidateId }, { abortEarly: false }).error?.message;

const zip = new AdmZip();
zip.addFile(
  'Education.csv',
  Buffer.from(['School Name,Start Date,End Date,Notes,Field Of Study', '"Some University","Sep 2016","Jun 2020","Deans list","Computer Science"', '"Night School","Jan 2021","","","Continuing Studies"'].join('\n')),
);
zip.addFile(
  'Positions.csv',
  Buffer.from(['Company Name,Title,Description,Started On,Finished On', '"Acme Corp","Backend Engineer","Built things","Sep 2020","Jun 2023"', '"Current Co","Senior Engineer","Still here","Jul 2023","Present"'].join('\n')),
);

const cvText = ['Jane Doe', 'EXPERIENCE', 'Senior Backend Engineer — New Co', '09/2021 – Present', 'Led the API team', 'EDUCATION', 'Computer Science — State University', '01/2015 – 01/2019'].join('\n');

describe('parsed import entries pass the bulk-create schemas unchanged', () => {
  const linkedIn = parseLinkedInExportZip(zip.toBuffer());
  const pdf = parseCvText(cvText);

  it.each([
    ['LinkedIn', linkedIn],
    ['PDF CV', pdf],
  ])('%s: every education and experience, finished and ongoing', (_label, { educations, experiences }) => {
    expect(educations.length + experiences.length).toBeGreaterThanOrEqual(2);
    expect(experiences.some((e) => e.isCurrent)).toBe(true);
    for (const education of educations) expect(errorsOf(schemaEducation, education)).toBeUndefined();
    for (const experience of experiences) expect(errorsOf(schemaExperience, experience)).toBeUndefined();
  });
});

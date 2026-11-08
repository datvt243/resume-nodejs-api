/**
 * End-to-end ATS integration test: renders a real PDF via Puppeteer
 * (no mocking), extracts its text with `pdf-parse`, and asserts the full
 * ATS check suite passes for a realistic fixture candidate, and that the
 * PDF CV import parser (`parseCvPdf`) recovers the fixture's
 * educations/experiences from it. Skipped when
 * `CI_NO_CHROME` is set (no Chrome/Chromium available in that
 * environment) — every other test file for this feature mocks Puppeteer
 * out; this is the one place that doesn't, by design.
 */
import { renderAtsPdfBuffer } from '@/services/createPDF.ats';
import { extractPdfText } from '@/services/atsExtract';
import { runAtsChecks, scoreChecks, type AtsCheckInput } from '@/services/atsChecks';
import { matchKeywords } from '@/services/keywordMatcher';
import { parseCvPdf } from '@/candidate/parseCvPdf.service';
import type { AggregatedCandidateData } from '@/types/candidate.type';

const fixture: AggregatedCandidateData = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '0901234567',
  address: 'Ho Chi Minh City',
  introduction: 'Senior backend engineer with 6 years of experience building Node.js and TypeScript APIs.',
  socialMedia: {
    github: 'https://github.com/janedoe',
    linkedin: 'https://linkedin.com/in/janedoe',
    website: 'https://janedoe.dev',
  },
  generalInformation: {
    career: 'Senior Backend Engineer',
    professionalSkillsGroup: ['Languages', 'Frameworks'],
    professionalSkills: [
      { name: 'TypeScript', group: 'Languages' },
      { name: 'Node.js', group: 'Frameworks' },
      { name: 'Docker' },
    ],
    personalSkills: [{ name: 'Communication' }],
    foreignLanguages: [{ language: 'English', level: 'Fluent' }],
  },
  experiences: [
    {
      company: 'Old Co',
      position: 'Backend Developer',
      startDate: new Date(2019, 0, 1).getTime(),
      endDate: new Date(2021, 5, 1).getTime(),
      isCurrent: false,
      description: '<p>Built REST APIs serving 1M+ requests/day.</p>',
      skills: ['Node.js'],
    },
    {
      company: 'New Co',
      position: 'Senior Backend Engineer',
      startDate: new Date(2021, 8, 1).getTime(),
      endDate: null,
      isCurrent: true,
      description: '<ul><li>Led the API team</li><li>Migrated the monolith to microservices</li></ul>',
      skills: ['TypeScript', 'Docker'],
    },
  ],
  projects: [
    {
      name: 'Resume API',
      position: 'Maintainer',
      startDate: new Date(2022, 0, 1).getTime(),
      endDate: null,
      isWorking: true,
      description: 'Backend API for resumes.',
      technology: ['Express', 'MongoDB'],
    },
  ],
  educations: [
    {
      school: 'State University',
      major: 'Computer Science',
      startDate: new Date(2015, 0, 1).getTime(),
      endDate: new Date(2019, 0, 1).getTime(),
      isCurrent: false,
      description: '',
    },
  ],
  certificates: [],
  awards: [],
  references: [],
};

const describeOrSkip = process.env['CI_NO_CHROME'] ? describe.skip : describe;

describeOrSkip('ATS PDF integration (real Puppeteer + pdf-parse)', () => {
  jest.setTimeout(30000);

  it('renders a real PDF whose extracted text passes the full ATS check suite', async () => {
    const { buffer, content } = await renderAtsPdfBuffer(fixture, { lang: 'en' });
    const { text, pages } = await extractPdfText(buffer);

    expect(text.length).toBeGreaterThan(0);
    expect(pages).toBeGreaterThanOrEqual(1);

    const checkInput: AtsCheckInput = {
      text,
      pages,
      lang: 'en',
      fullName: content.fullName,
      email: content.contact.email,
      phone: content.contact.phone,
      sectionHeadings: content.sections.map((s) => s.heading),
      experienceStartDates: content.experienceStartDates,
      metadataTitle: `${content.fullName} - ${content.headline} CV`,
      metadataAuthor: content.fullName,
    };

    const checks = runAtsChecks(checkInput);
    const failed = checks.filter((c) => !c.passed);

    expect(failed).toEqual([]);
    expect(scoreChecks(checks)).toBeGreaterThanOrEqual(90);
  });

  it('reports keyword coverage against a sample job description', async () => {
    const { buffer } = await renderAtsPdfBuffer(fixture, { lang: 'en' });
    const { text } = await extractPdfText(buffer);

    const jobDescription = 'Looking for a Node.js engineer with TypeScript, Docker, and Vitest experience.';
    const result = matchKeywords(jobDescription, text);

    expect(result.matched).toEqual(expect.arrayContaining(['typescript', 'docker']));
    expect(result.missing).toContain('vitest');
  });

  it.each(['en', 'vi'] as const)('round-trips the %s ATS PDF through the PDF CV import parser', async (lang) => {
    const { buffer } = await renderAtsPdfBuffer(fixture, { lang });
    const result = await parseCvPdf(buffer);

    expect(result.extractedText).toContain('State University');
    expect(result.experiences.map(({ company, position, startDate, endDate, isCurrent }) => ({ company, position, startDate, endDate, isCurrent }))).toEqual([
      { company: 'New Co', position: 'Senior Backend Engineer', startDate: new Date(2021, 8, 1).getTime(), endDate: undefined, isCurrent: true },
      { company: 'Old Co', position: 'Backend Developer', startDate: new Date(2019, 0, 1).getTime(), endDate: new Date(2021, 5, 1).getTime(), isCurrent: false },
    ]);
    expect(result.experiences[1]?.description.vi).toContain('Built REST APIs serving 1M+ requests/day.');
    expect(result.educations).toEqual([
      {
        _id: null,
        school: { vi: 'State University', en: 'State University' },
        major: { vi: 'Computer Science', en: 'Computer Science' },
        startDate: new Date(2015, 0, 1).getTime(),
        endDate: new Date(2019, 0, 1).getTime(),
        isCurrent: false,
        description: { vi: '', en: '' },
      },
    ]);
  });
});

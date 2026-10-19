/**
 * Tests for services/createPDF.ats.ts's pure HTML-building functions —
 * no Puppeteer involved. Verifies the ATS template actually holds the
 * invariants in doctrine/standards/pdf-export-standard.md: no
 * letter-spacing, no images, single column (no flex/grid layout), real
 * localized headings, sanitized free-text, no forbidden fields.
 */
import { buildAtsContent, renderAtsHtml, pageRenderAts, renderAtsPdfBuffer, createCVAts } from '@/services/createPDF.ats';
import puppeteer from 'puppeteer';
import { logger } from '@/logger';
import type { AggregatedCandidateData } from '@/types/candidate.type';

const fixture: AggregatedCandidateData = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '0901234567',
  address: 'Ho Chi Minh City',
  introduction: 'Senior backend engineer with 6 years of experience.',
  socialMedia: {
    github: 'https://github.com/janedoe',
    linkedin: 'https://linkedin.com/in/janedoe',
    website: 'https://janedoe.dev',
  },
  generalInformation: {
    career: 'Senior Backend Engineer',
    careerGoal: 'Trở thành Tech Lead',
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
      description: '<p>Built APIs</p><script>alert(1)</script>',
      skills: ['Node.js'],
    },
    {
      company: 'New Co',
      position: 'Senior Backend Engineer',
      startDate: new Date(2021, 8, 1).getTime(), // September 2021
      endDate: null,
      isCurrent: true,
      description: '<ul><li>Led the API team</li></ul>',
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
  references: [{ fullName: 'John Smith', phone: '0909999999', company: 'Old Co', position: 'Manager' }],
};

describe('buildAtsContent', () => {
  it('builds the full content model with headline, contact, summary', () => {
    const content = buildAtsContent({ RECORD: fixture, lang: 'en' });

    expect(content.fullName).toBe('Jane Doe');
    expect(content.headline).toBe('Senior Backend Engineer');
    expect(content.contact.email).toBe('jane.doe@example.com');
    expect(content.contact.phone).toBe('0901234567');
    expect(content.contact.city).toBe('Ho Chi Minh City');
    expect(content.summary).toBe('Senior backend engineer with 6 years of experience.');
  });

  it('sorts experience entries reverse-chronologically (most recent first)', () => {
    const content = buildAtsContent({ RECORD: fixture, lang: 'en' });
    expect(content.experienceStartDates).toEqual([...content.experienceStartDates].sort((a, b) => b - a));
    expect(content.experienceStartDates[0]).toBeGreaterThan(content.experienceStartDates[1] as number);
  });

  it('skips personalSkills by default and includes them only when opted in', () => {
    const withoutPersonal = buildAtsContent({ RECORD: fixture, lang: 'en' });
    const skillsSection = withoutPersonal.sections.find((s) => s.id === 'skills');
    expect(skillsSection?.bodyHtml).not.toContain('Communication');

    const withPersonal = buildAtsContent({ RECORD: fixture, lang: 'en', options: { includePersonalSkills: true } });
    const skillsSectionWithPersonal = withPersonal.sections.find((s) => s.id === 'skills');
    expect(skillsSectionWithPersonal?.bodyHtml).toContain('Communication');
  });

  it('groups professional skills by professionalSkillsGroup, ungrouped skills fall under "Other"', () => {
    const content = buildAtsContent({ RECORD: fixture, lang: 'en' });
    const skillsSection = content.sections.find((s) => s.id === 'skills');
    expect(skillsSection?.bodyHtml).toContain('Languages: TypeScript');
    expect(skillsSection?.bodyHtml).toContain('Frameworks: Node.js');
    expect(skillsSection?.bodyHtml).toContain('Other: Docker');
  });

  it('omits the References section by default (not part of the ATS section list)', () => {
    const content = buildAtsContent({ RECORD: fixture, lang: 'en' });
    expect(content.sections.find((s) => s.id === 'references')).toBeUndefined();
  });

  it('never surfaces date of birth, gender, or marital status', () => {
    const { html } = pageRenderAts({ RECORD: fixture, lang: 'en' });
    const lower = html.toLowerCase();
    expect(lower).not.toContain('date of birth');
    expect(lower).not.toContain('gender');
    expect(lower).not.toContain('marital');
  });
});

describe('renderAtsHtml — ATS-safety invariants (doctrine/standards/pdf-export-standard.md)', () => {
  it.each(['en', 'vi'] as const)('holds for lang=%s', (lang) => {
    const { html } = pageRenderAts({ RECORD: fixture, lang });

    // Rule 1: no letter-spacing on real text.
    expect(html).not.toMatch(/letter-spacing:\s*\.?\d/);

    // Rule 8: single column — no layout grid/flex/float/absolute positioning.
    expect(html).not.toMatch(/display:\s*(flex|grid)/);
    expect(html).not.toMatch(/float:\s*(left|right)/);
    expect(html).not.toMatch(/position:\s*absolute/);
    expect(html).not.toContain('<table');

    // Rule 8: no images/icons.
    expect(html).not.toContain('<img');

    // Rule 2: local system font stack, no network font.
    expect(html).toContain('Arial, Helvetica, "Liberation Sans", sans-serif');
    expect(html).not.toContain('fonts.googleapis.com');

    // Rule 7: script injection sanitized out of free-text description.
    expect(html).not.toContain('<script>');

    // lang attribute follows the requested language.
    expect(html).toContain(`<html lang="${lang}">`);
  });

  it('renders standard localized headings in the expected order (en)', () => {
    const { html } = pageRenderAts({ RECORD: fixture, lang: 'en' });
    const order = ['>Skills<', '>Experience<', '>Projects<', '>Education<', '>Languages<'];
    const indices = order.map((heading) => html.indexOf(heading));
    expect(indices.every((i) => i !== -1)).toBe(true);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it('renders standard localized headings in Vietnamese', () => {
    const { html } = pageRenderAts({ RECORD: fixture, lang: 'vi' });
    expect(html).toContain('>Kỹ năng<');
    expect(html).toContain('>Kinh nghiệm làm việc<');
    expect(html).toContain('>Dự án<');
    expect(html).toContain('>Học vấn<');
    expect(html).toContain('>Ngoại ngữ<');
  });

  it('uses zero-padded MM/YYYY dates, including September', () => {
    const { html } = pageRenderAts({ RECORD: fixture, lang: 'en' });
    expect(html).toContain('09/2021');
    expect(html).not.toMatch(/[^0]9\/2021/);
  });

  it('marks the current role as Present / Hiện tại', () => {
    const en = pageRenderAts({ RECORD: fixture, lang: 'en' }).html;
    const vi = pageRenderAts({ RECORD: fixture, lang: 'vi' }).html;
    expect(en).toContain('Present');
    expect(vi).toContain('Hiện tại');
  });
});

describe('renderAtsHtml output is a function of buildAtsContent (separately testable)', () => {
  it('produces the same html via pageRenderAts and via the two-step build+render', () => {
    const content = buildAtsContent({ RECORD: fixture, lang: 'en' });
    const htmlDirect = renderAtsHtml(content, 'en');
    const { html: htmlViaPageRender } = pageRenderAts({ RECORD: fixture, lang: 'en' });
    expect(htmlViaPageRender).toBe(htmlDirect);
  });
});

// issue #225 — Puppeteer mocked for these only; the rest of this file never launches it
jest.mock('puppeteer', () => ({ launch: jest.fn() }));

describe('ATS PDF failure handling (issue #225)', () => {
  afterEach(() => jest.clearAllMocks());

  it('renderAtsPdfBuffer closes the browser and rethrows when rendering fails', async () => {
    const browser = { newPage: jest.fn().mockRejectedValue(new Error('Target closed')), close: jest.fn().mockResolvedValue(undefined) };
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

    await expect(renderAtsPdfBuffer(fixture)).rejects.toThrow('Target closed');
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it('createCVAts logs the real error and answers 500 without echoing it', async () => {
    (puppeteer.launch as jest.Mock).mockRejectedValue(new Error('Failed to launch the browser process'));
    const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    const res = { status: jest.fn(), send: jest.fn(), setHeader: jest.fn(), contentType: jest.fn() };
    res.status.mockReturnValue(res);

    await createCVAts({ data: fixture, res: res as any });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('createCVAts'), expect.objectContaining({ error: 'Failed to launch the browser process' }));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(expect.not.objectContaining({ error: expect.anything() }));
  });

  it('renderAtsPdfBuffer passes --disable-dev-shm-usage alongside the existing sandbox flags (Render free-tier /dev/shm crash)', async () => {
    // Only the launch-args contract is under test here — not a full
    // success-path render (that needs a real pdf-lib-parseable buffer for
    // applyPdfMetadata, covered by the real-Puppeteer integration test
    // instead). `puppeteer.launch` is called unconditionally before any
    // later step, so a downstream failure is safe to swallow.
    const page = { setContent: jest.fn(), evaluate: jest.fn().mockResolvedValue(undefined), pdf: jest.fn().mockResolvedValue(Buffer.from('')) };
    const browser = { newPage: jest.fn().mockResolvedValue(page), close: jest.fn().mockResolvedValue(undefined) };
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

    await renderAtsPdfBuffer(fixture).catch(() => undefined);

    expect(puppeteer.launch).toHaveBeenCalledWith(
      expect.objectContaining({ args: expect.arrayContaining(['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']) }),
    );
  });
});

describe('career break entries (#267)', () => {
  const withBreak: AggregatedCandidateData = {
    ...fixture,
    experiences: [
      ...(fixture.experiences ?? []),
      {
        company: '',
        position: '',
        startDate: new Date(2021, 5, 1).getTime(),
        endDate: new Date(2021, 8, 1).getTime(),
        isCurrent: false,
        description: '',
        isCareerBreak: true,
        careerBreakType: 'caregiving',
      },
    ],
  };

  it.each([
    ['en', 'Career break — Caregiving'],
    ['vi', 'Nghỉ việc tạm thời — Chăm sóc người thân'],
  ] as const)('renders a localized career-break title (%s), not "position — company"', (lang, title) => {
    const { html } = pageRenderAts({ RECORD: withBreak, lang });
    expect(html).toContain(`<p class="entry-title">${title}</p>`);
    expect(html).not.toContain('<p class="entry-title"> — </p>');
  });
});

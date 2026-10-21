/**
 * Tests for services/createPDF.ts's pageRender — pure HTML-building
 * function, no Puppeteer involved, so it's safe/fast to test directly.
 *
 * Also covers issue #154 (see bottom describe block) — createCV's
 * executable-path resolution for Puppeteer's Chrome/Chromium launch.
 */

import { pageRender, createCV, renderPdfBuffer } from '@/services/createPDF';
import puppeteer from 'puppeteer';

describe('pageRender', () => {
  it('renders career and careerGoal into the PDF content (issue #87)', () => {
    const { html } = pageRender({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      generalInformation: {
        career: 'Backend Developer',
        careerGoal: 'Trở thành Tech Lead trong 3 năm tới',
        personalSkills: [],
        professionalSkills: [],
      },
    });

    expect(html).toContain('Backend Developer');
    expect(html).toContain('Trở thành Tech Lead trong 3 năm tới');
    // _boxContent() uppercases its title heading — match the real output.
    expect(html).toContain('ĐỊNH HƯỚNG NGHỀ NGHIỆP');
  });

  it('omits the career box entirely when both fields are empty', () => {
    const { html } = pageRender({
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      generalInformation: {
        career: '',
        careerGoal: '',
        personalSkills: [],
        professionalSkills: [],
      },
    });

    expect(html).not.toContain('ĐỊNH HƯỚNG NGHỀ NGHIỆP');
  });

  it('renders only whichever of career/careerGoal is present', () => {
    const { html } = pageRender({
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      generalInformation: {
        career: 'QA Engineer',
        careerGoal: '',
        personalSkills: [],
        professionalSkills: [],
      },
    });

    expect(html).toContain('QA Engineer');
    expect(html).toContain('ĐỊNH HƯỚNG NGHỀ NGHIỆP');
    expect(html).not.toContain('Mục tiêu nghề nghiệp');
  });
});

describe('formatDate padding regression (doctrine/standards/pdf-export-standard.md rule 4)', () => {
  it('zero-pads September (month 9) as "09/YYYY", not "9/YYYY"', () => {
    const septemberStart = new Date(2024, 8, 1).getTime(); // month index 8 = September
    const { html } = pageRender({
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      experiences: [
        {
          company: 'Acme',
          position: 'Engineer',
          startDate: septemberStart,
          endDate: null,
          isCurrent: true,
          description: '',
        },
      ],
    });

    expect(html).toContain('<div class="time">09/2024</div>');
  });

  it('still renders double-digit months correctly (e.g. December)', () => {
    const decemberStart = new Date(2024, 11, 1).getTime();
    const { html } = pageRender({
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      experiences: [
        {
          company: 'Acme',
          position: 'Engineer',
          startDate: decemberStart,
          endDate: null,
          isCurrent: true,
          description: '',
        },
      ],
    });

    expect(html).toContain('<div class="time">12/2024</div>');
  });
});

describe('getSkills rendering regression (issue #188)', () => {
  it("renders an experience entry's skills when present", () => {
    const { html } = pageRender({
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      experiences: [
        {
          company: 'Acme',
          position: 'Engineer',
          startDate: new Date(2023, 0, 1).getTime(),
          endDate: null,
          isCurrent: true,
          description: '',
          skills: ['Node.js', 'TypeScript'],
        },
      ],
    });

    expect(html).toContain('<div class="skills">Node.js, TypeScript</div>');
  });

  it('renders no skills div when the entry has no skills', () => {
    const { html } = pageRender({
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      experiences: [
        {
          company: 'Acme',
          position: 'Engineer',
          startDate: new Date(2023, 0, 1).getTime(),
          endDate: null,
          isCurrent: true,
          description: '',
          skills: [],
        },
      ],
    });

    expect(html).not.toContain('class="skills"');
  });
});

// Puppeteer's own `launch()` is mocked out entirely — no real browser is
// spawned, keeping this fast/safe to run anywhere (no Chrome install
// required in the test environment). Only the executablePath resolution
// logic (the part issue #154 is about) is under test.
jest.mock('puppeteer', () => ({ launch: jest.fn() }));

function createFakeBrowser() {
  return {
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf-bytes')),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

function createFakeRes() {
  const res = { contentType: jest.fn(), send: jest.fn(), status: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe('createCV executablePath resolution (issue #154)', () => {
  const ORIGINAL_ENV = process.env['PUPPETEER_EXECUTABLE_PATH'];

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete process.env['PUPPETEER_EXECUTABLE_PATH'];
    else process.env['PUPPETEER_EXECUTABLE_PATH'] = ORIGINAL_ENV;
    jest.clearAllMocks();
  });

  it('launches with no hardcoded executablePath when PUPPETEER_EXECUTABLE_PATH is unset (Puppeteer resolves its own bundled Chromium)', async () => {
    delete process.env['PUPPETEER_EXECUTABLE_PATH'];
    (puppeteer.launch as jest.Mock).mockResolvedValue(createFakeBrowser());

    await createCV({ email: 'a@b.com' }, createFakeRes() as any);

    expect(puppeteer.launch).toHaveBeenCalledWith(expect.not.objectContaining({ executablePath: expect.anything() }));
  });

  it('launches with the given executablePath when PUPPETEER_EXECUTABLE_PATH is set (CI/Docker override)', async () => {
    process.env['PUPPETEER_EXECUTABLE_PATH'] = '/usr/bin/chromium';
    (puppeteer.launch as jest.Mock).mockResolvedValue(createFakeBrowser());

    await createCV({ email: 'a@b.com' }, createFakeRes() as any);

    expect(puppeteer.launch).toHaveBeenCalledWith(expect.objectContaining({ executablePath: '/usr/bin/chromium' }));
  });
});

describe('Puppeteer launch args (issue #225 — Render free-tier /dev/shm crash)', () => {
  afterEach(() => jest.clearAllMocks());

  it('createCV passes --disable-dev-shm-usage alongside the existing sandbox flags', async () => {
    (puppeteer.launch as jest.Mock).mockResolvedValue(createFakeBrowser());

    await createCV({ email: 'a@b.com' }, createFakeRes() as any);

    expect(puppeteer.launch).toHaveBeenCalledWith(
      expect.objectContaining({ args: expect.arrayContaining(['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']) }),
    );
  });

  it('renderPdfBuffer passes --disable-dev-shm-usage alongside the existing sandbox flags', async () => {
    (puppeteer.launch as jest.Mock).mockResolvedValue(createFakeBrowser());

    await renderPdfBuffer({ email: 'a@b.com' });

    expect(puppeteer.launch).toHaveBeenCalledWith(
      expect.objectContaining({ args: expect.arrayContaining(['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']) }),
    );
  });
});

describe('createCV failure handling (issue #225)', () => {
  afterEach(() => jest.clearAllMocks());

  // The failure propagates to errorsMiddleware, which logs it and answers with the error envelope.
  it('closes the browser and rethrows when rendering fails after launch, writing no response', async () => {
    const browser = createFakeBrowser();
    browser.newPage.mockRejectedValue(new Error('Target closed'));
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const res = createFakeRes();

    await expect(createCV({ email: 'a@b.com' }, res as any)).rejects.toThrow('Target closed');

    expect(browser.close).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it('rethrows the launch error when Chromium fails to start', async () => {
    (puppeteer.launch as jest.Mock).mockRejectedValue(new Error('Failed to launch the browser process'));
    const res = createFakeRes();

    await expect(createCV({ email: 'a@b.com' }, res as any)).rejects.toThrow('Failed to launch the browser process');
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('renderPdfBuffer failure handling (issue #225)', () => {
  afterEach(() => jest.clearAllMocks());

  it('closes the browser and rethrows when rendering fails', async () => {
    const browser = createFakeBrowser();
    browser.newPage.mockRejectedValue(new Error('Target closed'));
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

    await expect(renderPdfBuffer({ email: 'a@b.com' } as any)).rejects.toThrow('Target closed');
    expect(browser.close).toHaveBeenCalledTimes(1);
  });
});

describe('modern theme (issue #162)', () => {
  const sampleData = {
    email: 'test@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    generalInformation: {
      career: 'Backend Developer',
      personalSkills: [],
      professionalSkills: [],
    },
    experiences: [
      { company: 'Acme', position: 'Engineer', startDate: new Date(2024, 8, 1).getTime(), endDate: null, isCurrent: true, description: 'Built APIs', skills: ['Node.js'] },
    ],
  };

  it('defaults to the classic theme when no theme is passed (backward compatible)', () => {
    const { html: defaultHtml } = pageRender(sampleData);
    const { html: classicHtml } = pageRender(sampleData, 'classic');
    expect(defaultHtml).toBe(classicHtml);
  });

  it('renders the same content under the modern theme', () => {
    const { html } = pageRender(sampleData, 'modern');
    expect(html).toContain('Backend Developer');
    expect(html).toContain('Acme');
    expect(html).toContain('09/2024');
  });

  it('has zero letter-spacing anywhere in the generated CSS (pdf-export-standard.md rule 1)', () => {
    const { html } = pageRender(sampleData, 'modern');
    expect(html).not.toMatch(/letter-spacing/);
  });
});


describe('career break entries', () => {
  it('renders a career break with the localized label + type, not an empty position/company', () => {
    const { html } = pageRender({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      experiences: [
        { position: '', company: '', startDate: 1600000000000, endDate: 1700000000000, isCurrent: false, description: '', isCareerBreak: true, careerBreakType: 'gapYear' },
      ],
    });
    expect(html).toContain('Nghỉ việc tạm thời');
    expect(html).toContain('Năm nghỉ (gap year)');
  });
});

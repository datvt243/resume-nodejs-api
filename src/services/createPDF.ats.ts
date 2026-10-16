/**
 * ATS-optimized CV PDF export — single column, no letter-spacing, system
 * font stack, sanitized free-text, localized standard section headings.
 * Sibling to `createPDF.ts` (the pre-existing "classic" visual template,
 * left unchanged) and `createDocx.ts`. See
 * `doctrine/standards/pdf-export-standard.md` for the invariants this
 * file exists to satisfy, and `GET /api/v1/download-pdf?template=ats`
 * for how it's wired up.
 *
 * Split the same way as `createDocx.ts`: `buildAtsContent` is a pure,
 * framework-agnostic content model (no HTML/Puppeteer types) built from
 * the same aggregated candidate data `handlerGetAboutMe` assembles —
 * independently unit-testable. `renderAtsHtml` turns that model into the
 * actual HTML string Puppeteer prints. `createCVAts` is the thin I/O
 * wrapper: launches Puppeteer, awaits font readiness, prints, applies
 * PDF metadata, and sends the response.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import puppeteer from 'puppeteer';
import { logger } from '@/logger';
import { filterXSS, type IFilterXSSOptions } from 'xss';
import { Response } from 'express';
import { t, type SupportedLang } from '@/utils/i18n';
import { applyPdfMetadata } from '@/services/pdfMetadata';
import type { AggregatedCandidateData, GeneralInformationData, Skill, EducationData, ExperienceData, ProjectData, Award, Certificate, Language } from '@/types/candidate.type';

/**
 * `sanitize-html`'s latest major pulls in `htmlparser2@12` (ESM-only, no
 * CJS export condition) which this CommonJS project's Jest runner can't
 * `require()` — `xss` gives the same allow-list sanitization with a
 * plain-CJS dependency tree. See pdf-export-standard.md rule 6.
 */
const SANITIZE_OPTIONS: IFilterXSSOptions = {
  whiteList: { p: [], ul: [], ol: [], li: [], strong: [], em: [], br: [], a: ['href'] },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

const sanitizeDescription = (html: string | undefined | null): string => (html ? filterXSS(html, SANITIZE_OPTIONS) : '');

/** Zero-padded `MM/YYYY` — the exact fix for the classic template's September-padding bug (pdf-export-standard.md rule 4). */
const formatMonthYear = (val: number | null | undefined): string => {
  if (!val) return '';
  const date = new Date(val);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${month}/${date.getFullYear()}`;
};

const formatDateRange = ({
  startDate,
  endDate,
  isCurrent,
  lang,
}: {
  startDate: number | null | undefined;
  endDate: number | null | undefined;
  isCurrent: boolean;
  lang: SupportedLang;
}): string => {
  const start = formatMonthYear(startDate);
  if (!endDate && !isCurrent) return start;
  const end = isCurrent ? t('cv.present', lang) : formatMonthYear(endDate);
  return `${start} – ${end}`;
};

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface AtsContactInfo {
  city?: string;
  phone?: string;
  email?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface AtsSection {
  id: string;
  heading: string;
  bodyHtml: string;
}

export interface AtsContent {
  email: string;
  fullName: string;
  headline: string;
  contact: AtsContactInfo;
  summary: string;
  sections: AtsSection[];
  /** Start dates (ms epoch) of every rendered experience entry, in render order — feeds the `reverse-chronological` ATS check. */
  experienceStartDates: number[];
  /** Top skills, used as PDF Keywords metadata. */
  keywords: string[];
}

export interface AtsContentOptions {
  /** Include personalSkills (soft skills) alongside professional skills. Off by default (pdf-export-standard.md spec). */
  includePersonalSkills?: boolean;
}

const buildContactLine = (contact: AtsContactInfo): string => {
  const parts: string[] = [];
  if (contact.city) parts.push(escapeHtml(contact.city));
  if (contact.phone) parts.push(`<a href="tel:${escapeHtml(contact.phone)}">${escapeHtml(contact.phone)}</a>`);
  if (contact.email) parts.push(`<a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>`);
  if (contact.linkedin) parts.push(`<a href="${escapeHtml(contact.linkedin)}">${escapeHtml(contact.linkedin)}</a>`);
  if (contact.github) parts.push(`<a href="${escapeHtml(contact.github)}">${escapeHtml(contact.github)}</a>`);
  if (contact.website) parts.push(`<a href="${escapeHtml(contact.website)}">${escapeHtml(contact.website)}</a>`);
  return parts.join(' &middot; ');
};

const buildSkillsSection = ({
  generalInformation,
  lang,
  includePersonalSkills,
}: {
  generalInformation: GeneralInformationData;
  lang: SupportedLang;
  includePersonalSkills: boolean;
}): AtsSection | null => {
  const { professionalSkills = [], professionalSkillsGroup = [], personalSkills = [] } = generalInformation;
  if (!professionalSkills.length && !(includePersonalSkills && personalSkills.length)) return null;

  const lines: string[] = [];
  const otherLabel = t('cv.otherSkillsGroup', lang);

  if (professionalSkillsGroup.length) {
    for (const group of professionalSkillsGroup) {
      const groupSkills = professionalSkills.filter((s) => s.group === group);
      if (groupSkills.length) lines.push(`<li>${escapeHtml(group)}: ${groupSkills.map((s) => escapeHtml(s.name)).join(', ')}</li>`);
    }
    const ungrouped = professionalSkills.filter((s) => !s.group || !professionalSkillsGroup.includes(s.group));
    if (ungrouped.length) lines.push(`<li>${otherLabel}: ${ungrouped.map((s) => escapeHtml(s.name)).join(', ')}</li>`);
  } else if (professionalSkills.length) {
    lines.push(`<li>${otherLabel}: ${professionalSkills.map((s: Skill) => escapeHtml(s.name)).join(', ')}</li>`);
  }

  if (includePersonalSkills && personalSkills.length) {
    lines.push(`<li>${otherLabel}: ${personalSkills.map((s: Skill) => escapeHtml(s.name)).join(', ')}</li>`);
  }

  return { id: 'skills', heading: t('cv.skills', lang), bodyHtml: `<ul>${lines.join('')}</ul>` };
};

const buildExperienceSection = (list: ExperienceData[], lang: SupportedLang): { section: AtsSection | null; startDates: number[] } => {
  if (!list.length) return { section: null, startDates: [] };

  const sorted = [...list].sort((a, b) => b.startDate - a.startDate);
  const entries = sorted
    .map((e) => {
      const range = formatDateRange({ startDate: e.startDate, endDate: e.endDate, isCurrent: e.isCurrent, lang });
      const stack = e.skills && e.skills.length ? `<p class="entry-stack">${t('cv.stackLabel', lang)}: ${e.skills.map(escapeHtml).join(', ')}</p>` : '';
      return `
        <div class="entry">
          <p class="entry-title">${escapeHtml(e.position)} — ${escapeHtml(e.company)}</p>
          <p class="entry-meta">${range}</p>
          <div class="entry-body">${sanitizeDescription(e.description)}</div>
          ${stack}
        </div>`;
    })
    .join('');

  return {
    section: { id: 'experience', heading: t('cv.experience', lang), bodyHtml: entries },
    startDates: sorted.map((e) => e.startDate),
  };
};

const buildProjectsSection = (list: ProjectData[], lang: SupportedLang): AtsSection | null => {
  if (!list.length) return null;
  const entries = list
    .map((p) => {
      const range = formatDateRange({ startDate: p.startDate, endDate: p.endDate, isCurrent: p.isWorking, lang });
      const stack = p.technology && p.technology.length ? `<p class="entry-stack">${t('cv.stackLabel', lang)}: ${p.technology.map(escapeHtml).join(', ')}</p>` : '';
      return `
        <div class="entry">
          <p class="entry-title">${escapeHtml(p.name)}${p.position ? ` — ${escapeHtml(p.position)}` : ''}</p>
          <p class="entry-meta">${range}</p>
          <div class="entry-body">${sanitizeDescription(p.description)}</div>
          ${stack}
        </div>`;
    })
    .join('');
  return { id: 'projects', heading: t('cv.projects', lang), bodyHtml: entries };
};

const buildEducationSection = (list: EducationData[], lang: SupportedLang): AtsSection | null => {
  if (!list.length) return null;
  const entries = list
    .map((e) => {
      const range = formatDateRange({ startDate: e.startDate, endDate: e.endDate, isCurrent: e.isCurrent, lang });
      return `
        <div class="entry">
          <p class="entry-title">${escapeHtml(e.major)} — ${escapeHtml(e.school)}</p>
          <p class="entry-meta">${range}</p>
          <div class="entry-body">${sanitizeDescription(e.description)}</div>
        </div>`;
    })
    .join('');
  return { id: 'education', heading: t('cv.education', lang), bodyHtml: entries };
};

const buildCertificatesSection = (list: Certificate[], lang: SupportedLang): AtsSection | null => {
  if (!list.length) return null;
  const entries = list
    .map((c) => {
      const range = formatDateRange({ startDate: c.startDate, endDate: c.isNoExpiration ? null : c.endDate, isCurrent: c.isNoExpiration, lang });
      return `
        <div class="entry">
          <p class="entry-title">${escapeHtml(c.name)} — ${escapeHtml(c.organization)}</p>
          <p class="entry-meta">${range}</p>
          <div class="entry-body">${sanitizeDescription(c.description)}</div>
        </div>`;
    })
    .join('');
  return { id: 'certifications', heading: t('cv.certifications', lang), bodyHtml: entries };
};

const buildAwardsSection = (list: Award[], lang: SupportedLang): AtsSection | null => {
  if (!list.length) return null;
  const entries = list
    .map((a) => {
      const range = formatMonthYear(a.issueDate);
      return `
        <div class="entry">
          <p class="entry-title">${escapeHtml(a.name)} — ${escapeHtml(a.organization)}</p>
          <p class="entry-meta">${range}</p>
          <div class="entry-body">${sanitizeDescription(a.description)}</div>
        </div>`;
    })
    .join('');
  return { id: 'awards', heading: t('cv.awards', lang), bodyHtml: entries };
};

const buildLanguagesSection = (list: Language[], lang: SupportedLang): AtsSection | null => {
  if (!list.length) return null;
  const items = list.map((l) => `<li>${escapeHtml(l.language)} (${escapeHtml(l.level)})</li>`).join('');
  return { id: 'languages', heading: t('cv.languages', lang), bodyHtml: `<ul>${items}</ul>` };
};

export const buildAtsContent = ({
  RECORD = {},
  lang = 'vi',
  options = {},
}: {
  RECORD?: AggregatedCandidateData;
  lang?: SupportedLang;
  options?: AtsContentOptions;
}): AtsContent => {
  const { includePersonalSkills = false } = options;
  const {
    firstName = '',
    lastName = '',
    phone = '',
    email = '',
    address = '',
    introduction = '',
    socialMedia = {},
    generalInformation: generalInformationRaw,
    educations = [],
    experiences = [],
    projects = [],
    certificates = [],
    awards = [],
  } = RECORD;

  const generalInformation: GeneralInformationData = Array.isArray(generalInformationRaw) ? generalInformationRaw[0] || {} : generalInformationRaw || {};
  const { github = '', linkedin = '', website = '' } = socialMedia;

  const contact: AtsContactInfo = {
    ...(address ? { city: address } : {}),
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
    ...(linkedin ? { linkedin } : {}),
    ...(github ? { github } : {}),
    ...(website ? { website } : {}),
  };

  const sections: AtsSection[] = [];
  const skillsSection = buildSkillsSection({ generalInformation, lang, includePersonalSkills });
  if (skillsSection) sections.push(skillsSection);

  const { section: experienceSection, startDates } = buildExperienceSection(experiences, lang);
  if (experienceSection) sections.push(experienceSection);

  const projectsSection = buildProjectsSection(projects, lang);
  if (projectsSection) sections.push(projectsSection);

  const educationSection = buildEducationSection(educations, lang);
  if (educationSection) sections.push(educationSection);

  const certificatesSection = buildCertificatesSection(certificates, lang);
  if (certificatesSection) sections.push(certificatesSection);

  const awardsSection = buildAwardsSection(awards, lang);
  if (awardsSection) sections.push(awardsSection);

  const languagesSection = buildLanguagesSection(generalInformation.foreignLanguages || [], lang);
  if (languagesSection) sections.push(languagesSection);

  const keywords = (generalInformation.professionalSkills || []).slice(0, 15).map((s) => s.name);

  return {
    email: email || 'resume',
    fullName: `${firstName} ${lastName}`.trim(),
    headline: generalInformation.career || '',
    contact,
    summary: introduction || '',
    sections,
    experienceStartDates: startDates,
    keywords,
  };
};

export const renderAtsHtml = (content: AtsContent, lang: SupportedLang = 'vi'): string => {
  const sectionsHtml = content.sections
    .map((section) => `<section class="section"><h2 class="heading">${escapeHtml(section.heading)}</h2>${section.bodyHtml}</section>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(content.fullName)} CV</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, "Liberation Sans", sans-serif;
    font-size: 10.5pt;
    line-height: 1.4;
    color: #000;
    margin: 0;
  }
  h1, h2, p, ul, ol, li { margin: 0 0 6pt 0; padding: 0; letter-spacing: normal; }
  .name { font-size: 20pt; font-weight: bold; }
  .headline { font-size: 12pt; margin-top: 2pt; }
  .contact { font-size: 10pt; margin-top: 4pt; }
  .summary { margin-top: 10pt; }
  .section { margin-top: 12pt; }
  .heading { font-size: 12pt; font-weight: bold; text-transform: uppercase; border-bottom: 1pt solid #000; padding-bottom: 2pt; }
  .entry { margin-bottom: 8pt; break-inside: avoid; }
  .entry-title { font-weight: bold; break-after: avoid; }
  .entry-meta { font-style: italic; font-size: 10pt; break-after: avoid; }
  .entry-body p, .entry-body li { margin-bottom: 3pt; }
  .entry-stack { font-size: 10pt; }
  ul, ol { padding-left: 16pt; }
  a { color: #000; text-decoration: underline; }
</style>
</head>
<body>
  <h1 class="name">${escapeHtml(content.fullName)}</h1>
  ${content.headline ? `<p class="headline">${escapeHtml(content.headline)}</p>` : ''}
  <p class="contact">${buildContactLine(content.contact)}</p>
  ${content.summary ? `<section class="section"><h2 class="heading">${escapeHtml(t('cv.summary', lang))}</h2><p class="summary">${escapeHtml(content.summary)}</p></section>` : ''}
  ${sectionsHtml}
</body>
</html>`;
};

export const pageRenderAts = ({
  RECORD,
  lang = 'vi',
  options = {},
}: {
  RECORD: AggregatedCandidateData;
  lang?: SupportedLang;
  options?: AtsContentOptions | undefined;
}): { email: string; html: string; content: AtsContent } => {
  const content = buildAtsContent({ RECORD, lang, options });
  const html = renderAtsHtml(content, lang);
  return { email: content.email, html, content };
};

const slugifyFilename = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'CV';

/** Attachment filename for an ATS PDF — names only, never the email. */
export const atsPdfFilename = (content: AtsContent): string => `${slugifyFilename(content.fullName)}_${slugifyFilename(content.headline || 'CV')}_CV.pdf`;

export interface CreateCVAtsOptions {
  lang?: SupportedLang;
  pageFormat?: 'A4' | 'Letter';
  contentOptions?: AtsContentOptions;
}

/**
 * Renders the ATS template to a PDF buffer with real metadata applied —
 * the shared core used both by the download endpoint (`createCVAts`,
 * below) and by `POST /api/v1/cv/ats-check` (`candidate_me/ats-check.ts`),
 * which needs the raw buffer (to extract text back out) rather than an
 * HTTP response.
 */
export const renderAtsPdfBuffer = async (data: AggregatedCandidateData, options: CreateCVAtsOptions = {}): Promise<{ buffer: Buffer; content: AtsContent }> => {
  const { lang = 'vi', pageFormat = 'A4' } = options;
  const { content, html } = pageRenderAts({ RECORD: data, lang, options: options.contentOptions });

  const executablePath = process.env['PUPPETEER_EXECUTABLE_PATH'];
  const browser = await puppeteer.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  let buffer: Buffer;
  // Close in `finally`, or each failed render leaks a Chromium process
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    // Local system font stack only, but await readiness anyway —
    // pdf-export-standard.md rule 2: never print before fonts settle.
    await page.evaluate(() => document.fonts.ready);

    const mm = '15mm';
    buffer = Buffer.from(
      await page.pdf({
        format: pageFormat,
        printBackground: false,
        margin: { top: mm, right: mm, bottom: mm, left: mm },
        tagged: true,
        outline: true,
      }),
    );
  } finally {
    await browser.close().catch(() => undefined);
  }

  buffer = await applyPdfMetadata(buffer, {
    title: `${content.fullName} - ${content.headline || 'CV'} CV`,
    author: content.fullName,
    subject: content.headline || 'CV',
    keywords: content.keywords,
    creator: 'Resume API',
    language: lang,
  });

  return { buffer, content };
};

/**
 * Renders the ATS PDF via Puppeteer and sends it — no disk persistence
 * unless `PERSIST_EXPORTED_PDF` is set (pdf-export-standard.md rule 10:
 * no PII in on-disk paths by default).
 */
export const createCVAts = async ({
  data,
  res,
  options = {},
}: {
  data: AggregatedCandidateData;
  res: Response;
  options?: CreateCVAtsOptions;
}): Promise<void> => {
  try {
    const { buffer, content } = await renderAtsPdfBuffer(data, options);

    if (process.env['PERSIST_EXPORTED_PDF']) {
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.join(__dirname, '..', 'public', 'pdf');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${slugifyFilename(content.email)}-ats.pdf`), buffer);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${atsPdfFilename(content)}"`);
    res.contentType('application/pdf');
    res.send(buffer);
  } catch (error) {
    // An Error serializes to `{}` — log the real cause
    // server-side instead of echoing an empty object to the client
    logger.error('[createCVAts] PDF generation failed', { error: (error as Error).message, stack: (error as Error).stack });
    res.status(500).send({
      status: false,
      message: 'Xảy ra lỗi, không thể tạo file PDF (ATS)',
    });
  }
};

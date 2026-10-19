/**
 * DOCX CV export — see createPDF.ts's `createCV`/`pageRender` for the
 * sibling PDF path this mirrors.
 *
 *   Split the same way as createPDF.ts: `buildDocxContent` is a pure,
 *   framework-agnostic content model (no `docx` library types) built from
 *   the same aggregated candidate data `handlerGetAboutMe` already
 *   assembles — unit-testable on its own, same as `pageRender`.
 *   `renderDocxDocument` turns that plain model into an actual `docx`
 *   `Document`. `createCVDocx` is the thin I/O wrapper that packs it to a
 *   buffer and sends it.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { Response } from 'express';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, BorderStyle } from 'docx';
import { t } from '@/utils/i18n';
import { AggregatedCandidateData, GeneralInformationData, Skill, EducationData, ExperienceData, ProjectData, Award, Certificate, Reference, Language } from '@/types/candidate.type';

export interface DocxSection {
  heading: string;
  lines: string[];
}

export interface DocxContent {
  email: string;
  fullName: string;
  contactLine: string;
  introduction: string;
  sections: DocxSection[];
}

const formatDate = (val: number | null | undefined): string => {
  if (!val) return '';
  const date = new Date(val);
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${m < 10 ? `0${m}` : m}/${y}`;
};

const formatRange = ({
  startDate,
  endDate,
  isCurrent,
}: {
  startDate: number;
  endDate: number | null;
  isCurrent: boolean;
}): string => {
  const start = formatDate(startDate);
  if (!endDate) return start;
  const end = isCurrent ? 'Hiện tại' : formatDate(endDate);
  return `${start} - ${end}`;
};

/**
 * Pure content-model builder — same input shape as
 * `createPDF.ts`'s `getDataCandidate`/`pageRender` (the aggregated
 * candidate record `handlerGetAboutMe` produces).
 */
export const buildDocxContent = (RECORD: AggregatedCandidateData = {}): DocxContent => {
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
    references = [],
    certificates = [],
    awards = [],
  } = RECORD;

  const generalInformation: GeneralInformationData = Array.isArray(generalInformationRaw)
    ? generalInformationRaw[0] || {}
    : generalInformationRaw || {};
  const { github = '', linkedin = '', website = '' } = socialMedia;

  const contactLine = [address, email, phone].filter(Boolean).join(' - ');
  const sections: DocxSection[] = [];

  // Career / career goal
  const { career = '', careerGoal = '' } = generalInformation;
  if (career || careerGoal) {
    const lines: string[] = [];
    if (career) lines.push(`Nghề nghiệp: ${career}`);
    if (careerGoal) lines.push(`Mục tiêu nghề nghiệp: ${careerGoal}`);
    sections.push({ heading: 'Định hướng nghề nghiệp', lines });
  }

  // Skills
  const { personalSkills = [], professionalSkills = [] } = generalInformation;
  if (personalSkills.length || professionalSkills.length) {
    const lines: string[] = [];
    if (professionalSkills.length) lines.push(`Kỹ năng chuyên môn: ${professionalSkills.map((s: Skill) => s.name).join(', ')}`);
    if (personalSkills.length) lines.push(`Kỹ năng cá nhân: ${personalSkills.map((s: Skill) => s.name).join(', ')}`);
    sections.push({ heading: 'Kỹ năng', lines });
  }

  // Experience
  if (experiences.length) {
    sections.push({
      heading: 'Kinh nghiệm làm việc',
      lines: experiences.map((e: ExperienceData) => {
        const range = formatRange({ startDate: e.startDate, endDate: e.endDate, isCurrent: e.isCurrent });
        const title = e.isCareerBreak
          ? `${t('cv.careerBreak', 'vi')} — ${t(`cv.careerBreakTypes.${e.careerBreakType ?? ''}`, 'vi')}`
          : `${e.position} — ${e.company}`;
        return `${title} (${range})${e.description ? `: ${e.description}` : ''}`;
      }),
    });
  }

  // Projects
  if (projects.length) {
    sections.push({
      heading: 'Dự án',
      lines: projects.map((p: ProjectData) => {
        const range = formatRange({ startDate: p.startDate, endDate: p.endDate, isCurrent: p.isWorking });
        return `${p.name} — ${p.position || ''} (${range})${p.description ? `: ${p.description}` : ''}`;
      }),
    });
  }

  // Education
  if (educations.length) {
    sections.push({
      heading: 'Học vấn',
      lines: educations.map((e: EducationData) => {
        const range = formatRange({ startDate: e.startDate, endDate: e.endDate, isCurrent: e.isCurrent });
        return `${e.major} — Trường: ${e.school} (${range})${e.description ? `: ${e.description}` : ''}`;
      }),
    });
  }

  // Awards
  if (awards.length) {
    sections.push({
      heading: 'Giải thưởng',
      lines: awards.map((a: Award) => `${a.name} — Đơn vị: ${a.organization} (${formatDate(a.issueDate)})${a.description ? `: ${a.description}` : ''}`),
    });
  }

  // Certificates
  if (certificates.length) {
    sections.push({
      heading: 'Chứng chỉ',
      lines: certificates.map((c: Certificate) => {
        const range = formatRange({ startDate: c.startDate, endDate: c.endDate, isCurrent: c.isNoExpiration });
        return `${c.name} — Nơi cấp: ${c.organization} (${range})${c.description ? `: ${c.description}` : ''}`;
      }),
    });
  }

  // Foreign languages
  const foreignLanguages = generalInformation.foreignLanguages || [];
  if (foreignLanguages.length) {
    sections.push({
      heading: 'Ngoại ngữ',
      lines: [foreignLanguages.map((l: Language) => `${l.language} (${l.level})`).join(', ')],
    });
  }

  // References
  if (references.length) {
    sections.push({
      heading: 'Người tham khảo',
      lines: references.map((r: Reference) => `${r.fullName} — ${r.position} tại ${r.company} — Tel: ${r.phone}`),
    });
  }

  const website_ = [github, linkedin, website].filter(Boolean).join(' - ');
  if (website_) {
    sections.unshift({ heading: '', lines: [website_] });
  }

  return {
    email: email || 'resume',
    fullName: `${firstName} ${lastName}`.trim(),
    contactLine,
    introduction,
    sections,
  };
};

/** `classic` is the pre-existing style; `modern` applies an accent color + bottom-border headings (issue #162). */
export type DocxTheme = 'classic' | 'modern';

const MODERN_ACCENT_COLOR = '2563EB';

/** Turns the plain content model into an actual `docx` `Document`. */
export const renderDocxDocument = (content: DocxContent, theme: DocxTheme = 'classic'): Document => {
  const isModern = theme === 'modern';
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: content.fullName.toUpperCase(), bold: true, ...(isModern ? { color: MODERN_ACCENT_COLOR } : {}) })],
    }),
  );
  if (content.contactLine) children.push(new Paragraph({ text: content.contactLine }));
  if (content.introduction) children.push(new Paragraph({ text: content.introduction, spacing: { after: 200 } }));

  for (const section of content.sections) {
    if (section.heading) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: section.heading.toUpperCase(), ...(isModern ? { color: MODERN_ACCENT_COLOR } : {}) })],
          spacing: { before: 200 },
          // `exactOptionalPropertyTypes`: omit `border` entirely for
          // classic instead of passing `border: undefined`.
          ...(isModern ? { border: { bottom: { style: BorderStyle.SINGLE, color: MODERN_ACCENT_COLOR, size: 6, space: 2 } } } : {}),
        }),
      );
    }
    for (const line of section.lines) {
      // `exactOptionalPropertyTypes`: `docx`'s own
      // `IParagraphOptions.bullet` is a third-party type we can't widen
      // to accept an explicit `undefined` — omit the key entirely
      // instead of passing `bullet: undefined` when there's no heading.
      children.push(new Paragraph({ text: line, ...(section.heading ? { bullet: { level: 0 } } : {}) }));
    }
  }

  return new Document({ sections: [{ children }] });
};

/** I/O wrapper: builds the content model, renders it, packs to a buffer, sends it. */
export const createCVDocx = async (data: AggregatedCandidateData, res: Response, theme: DocxTheme = 'classic') => {
  try {
    const content = buildDocxContent(data);
    const doc = renderDocxDocument(content, theme);
    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Disposition', `attachment; filename="${content.email}.docx"`);
    res.contentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    res.status(500).send({
      status: false,
      message: 'Xảy ra lỗi, không thể tạo file DOCX',
      error,
    });
  }
};

/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: DOCX CV export (issue #76, remainder after JSON export
 *   shipped separately — see createPDF.ts's `createCV`/`pageRender` for
 *   the sibling PDF path this mirrors).
 *
 *   Split the same way as createPDF.ts: `buildDocxContent` is a pure,
 *   framework-agnostic content model (no `docx` library types) built from
 *   the same aggregated candidate data `handlerGetAboutMe` already
 *   assembles — unit-testable on its own, same as `pageRender`.
 *   `renderDocxDocument` turns that plain model into an actual `docx`
 *   `Document`. `createCVDocx` is the thin I/O wrapper that packs it to a
 *   buffer and sends it.
 */
import { Response } from 'express';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

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

const formatRange = (startDate: number, endDate: number | null, isCurrent: boolean): string => {
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
export const buildDocxContent = (RECORD: Record<string, any> = {}): DocxContent => {
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

  const generalInformation = Array.isArray(generalInformationRaw) ? generalInformationRaw[0] || {} : generalInformationRaw || {};
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
    if (professionalSkills.length) lines.push(`Kỹ năng chuyên môn: ${professionalSkills.map((s: any) => s.name).join(', ')}`);
    if (personalSkills.length) lines.push(`Kỹ năng cá nhân: ${personalSkills.map((s: any) => s.name).join(', ')}`);
    sections.push({ heading: 'Kỹ năng', lines });
  }

  // Experience
  if (experiences.length) {
    sections.push({
      heading: 'Kinh nghiệm làm việc',
      lines: experiences.map((e: any) => {
        const range = formatRange(e.startDate, e.endDate, e.isCurrent);
        return `${e.position} — ${e.company} (${range})${e.description ? `: ${e.description}` : ''}`;
      }),
    });
  }

  // Projects
  if (projects.length) {
    sections.push({
      heading: 'Dự án',
      lines: projects.map((p: any) => {
        const range = formatRange(p.startDate, p.endDate, p.isWorking);
        return `${p.name} — ${p.position || ''} (${range})${p.description ? `: ${p.description}` : ''}`;
      }),
    });
  }

  // Education
  if (educations.length) {
    sections.push({
      heading: 'Học vấn',
      lines: educations.map((e: any) => {
        const range = formatRange(e.startDate, e.endDate, e.isCurrent);
        return `${e.major} — Trường: ${e.school} (${range})${e.description ? `: ${e.description}` : ''}`;
      }),
    });
  }

  // Awards
  if (awards.length) {
    sections.push({
      heading: 'Giải thưởng',
      lines: awards.map((a: any) => `${a.name} — Đơn vị: ${a.organization} (${formatDate(a.issueDate)})${a.description ? `: ${a.description}` : ''}`),
    });
  }

  // Certificates
  if (certificates.length) {
    sections.push({
      heading: 'Chứng chỉ',
      lines: certificates.map((c: any) => {
        const range = formatRange(c.startDate, c.endDate, c.isNoExpiration);
        return `${c.name} — Nơi cấp: ${c.organization} (${range})${c.description ? `: ${c.description}` : ''}`;
      }),
    });
  }

  // Foreign languages
  const foreignLanguages = generalInformation.foreignLanguages || [];
  if (foreignLanguages.length) {
    sections.push({
      heading: 'Ngoại ngữ',
      lines: [foreignLanguages.map((l: any) => `${l.language} (${l.level})`).join(', ')],
    });
  }

  // References
  if (references.length) {
    sections.push({
      heading: 'Người tham khảo',
      lines: references.map((r: any) => `${r.fullName} — ${r.position} tại ${r.company} — Tel: ${r.phone}`),
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

/** Turns the plain content model into an actual `docx` `Document`. */
export const renderDocxDocument = (content: DocxContent): Document => {
  const children: Paragraph[] = [];

  children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: content.fullName.toUpperCase(), bold: true })] }));
  if (content.contactLine) children.push(new Paragraph({ text: content.contactLine }));
  if (content.introduction) children.push(new Paragraph({ text: content.introduction, spacing: { after: 200 } }));

  for (const section of content.sections) {
    if (section.heading) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: section.heading.toUpperCase(), spacing: { before: 200 } }));
    }
    for (const line of section.lines) {
      children.push(new Paragraph({ text: line, bullet: section.heading ? { level: 0 } : undefined }));
    }
  }

  return new Document({ sections: [{ children }] });
};

/** I/O wrapper: builds the content model, renders it, packs to a buffer, sends it. */
export const createCVDocx = async (data: Record<string, any>, res: Response) => {
  try {
    const content = buildDocxContent(data);
    const doc = renderDocxDocument(content);
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

/**
 * Tests for services/createDocx.ts — issue #76 (DOCX export).
 *
 * `buildDocxContent` is pure (no `docx` library types), same testing
 * approach as `createPDF.test.ts`'s `pageRender`. `renderDocxDocument` +
 * `Packer.toBuffer` are also exercised directly (no mocking needed —
 * unlike Puppeteer, `docx` does no I/O, so this is a real, fast check
 * that the actual library wiring produces a valid .docx).
 */
import { Packer } from 'docx';
import { buildDocxContent, renderDocxDocument } from '@/services/createDocx';

describe('buildDocxContent', () => {
  it('builds contact line, introduction, and section content from aggregated candidate data', () => {
    const content = buildDocxContent({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '0900000000',
      address: 'HCMC',
      introduction: 'Backend developer',
      generalInformation: {
        career: 'Backend Developer',
        careerGoal: 'Trở thành Tech Lead trong 3 năm tới',
        professionalSkills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
        personalSkills: [{ name: 'Teamwork' }],
      },
      experiences: [
        { position: 'Backend Engineer', company: 'Acme', startDate: 1600000000000, endDate: null, isCurrent: true, description: 'Built APIs' },
      ],
      educations: [],
      projects: [],
      certificates: [],
      awards: [],
      references: [],
    });

    expect(content.fullName).toBe('John Doe');
    expect(content.contactLine).toContain('john@example.com');
    expect(content.contactLine).toContain('0900000000');
    expect(content.introduction).toBe('Backend developer');

    const careerSection = content.sections.find((s) => s.heading === 'Định hướng nghề nghiệp');
    expect(careerSection?.lines).toEqual(['Nghề nghiệp: Backend Developer', 'Mục tiêu nghề nghiệp: Trở thành Tech Lead trong 3 năm tới']);

    const skillsSection = content.sections.find((s) => s.heading === 'Kỹ năng');
    expect(skillsSection?.lines.join(' | ')).toContain('Node.js, TypeScript');
    expect(skillsSection?.lines.join(' | ')).toContain('Teamwork');

    const expSection = content.sections.find((s) => s.heading === 'Kinh nghiệm làm việc');
    expect(expSection?.lines[0]).toContain('Backend Engineer');
    expect(expSection?.lines[0]).toContain('Acme');
    // No endDate -> just the start month/year, regardless of isCurrent —
    // same `formatRange`/PDF-sibling `_layoutItem`'s `getTime` behavior:
    // `isCurrent` only matters once endDate is actually present.
    expect(expSection?.lines[0]).toContain('Built APIs');
  });

  it('renders "Hiện tại" for an ongoing item when both startDate and endDate are set', () => {
    const content = buildDocxContent({
      firstName: 'A',
      lastName: 'B',
      experiences: [{ position: 'Engineer', company: 'Acme', startDate: 1600000000000, endDate: 1700000000000, isCurrent: true, description: '' }],
    });
    const expSection = content.sections.find((s) => s.heading === 'Kinh nghiệm làm việc');
    expect(expSection?.lines[0]).toContain('Hiện tại');
  });

  it('omits every section that has no data (empty CV)', () => {
    const content = buildDocxContent({ firstName: 'Jane', lastName: 'Roe', email: 'jane@example.com' });

    expect(content.fullName).toBe('Jane Roe');
    expect(content.sections).toEqual([]);
  });

  it('handles generalInformation given as an array (raw Mongoose find() shape)', () => {
    const content = buildDocxContent({
      firstName: 'A',
      lastName: 'B',
      generalInformation: [{ career: 'Tester' }],
    });

    const careerSection = content.sections.find((s) => s.heading === 'Định hướng nghề nghiệp');
    expect(careerSection?.lines).toEqual(['Nghề nghiệp: Tester']);
  });
});

describe('renderDocxDocument + Packer (real .docx generation, no mocks)', () => {
  it('produces a real, non-empty .docx (zip) buffer for a populated CV', async () => {
    const content = buildDocxContent({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      introduction: 'Backend developer',
      experiences: [{ position: 'Engineer', company: 'Acme', startDate: 1600000000000, endDate: 1700000000000, isCurrent: false, description: 'Did things' }],
    });
    const doc = renderDocxDocument(content);
    const buffer = await Packer.toBuffer(doc);

    expect(buffer.length).toBeGreaterThan(0);
    // .docx is a zip archive — real zip files start with the "PK" magic bytes.
    expect(buffer.subarray(0, 2).toString('ascii')).toBe('PK');
  });

  it('produces a valid .docx even for an empty CV (no sections)', async () => {
    const content = buildDocxContent({ firstName: 'Jane', lastName: 'Roe' });
    const doc = renderDocxDocument(content);
    const buffer = await Packer.toBuffer(doc);

    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 2).toString('ascii')).toBe('PK');
  });
});

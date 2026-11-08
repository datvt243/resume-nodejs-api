/**
 * Tests for candidate/parseCvPdf.service.ts — the section/date heuristics
 * run on plain fixture text (vi + en, no mocks). The real render-then-parse
 * round-trip lives in atsPdfIntegration.test.ts, the one suite that
 * launches a real browser.
 */

import { parseCvText, parseCvPdf } from '@/candidate/parseCvPdf.service';

const monthStart = (year: number, month: number) => new Date(year, month - 1, 1).getTime();

// Expected entries are written as plain text; the parser returns the bulk-create shape (see parseLinkedInExport.service.test.ts).
const both = (text: string) => ({ vi: text, en: text });
const postable = ({ endDate, school, major, description, ...rest }: Record<string, any>) => ({
  _id: null,
  ...rest,
  ...(endDate === null ? {} : { endDate }),
  ...(school === undefined ? {} : { school: both(school), major: both(major) }),
  description: both(description),
});

describe('parseCvText — section + date-range heuristics', () => {
  it('parses an English CV laid out as title line, date line, description (ATS template layout)', () => {
    const text = [
      'Jane Doe',
      'Senior Backend Engineer',
      'SUMMARY',
      'Backend engineer since 2019.',
      'EXPERIENCE',
      'Senior Backend Engineer — New Co',
      '09/2021 – Present',
      'Led the API team',
      'Backend Developer — Old Co',
      '01/2019 – 06/2021',
      'Built REST APIs.',
      'Stack: Node.js',
      'PROJECTS',
      'Resume API — Maintainer',
      '01/2022 – Present',
      'EDUCATION',
      'Computer Science — State University',
      '01/2015 – 01/2019',
      'LANGUAGES',
      'English (Fluent)',
    ].join('\n');

    const { experiences, educations } = parseCvText(text);

    expect(experiences).toEqual([
      postable({ company: 'New Co', position: 'Senior Backend Engineer', startDate: monthStart(2021, 9), endDate: null, isCurrent: true, description: 'Led the API team' }),
      postable({
        company: 'Old Co',
        position: 'Backend Developer',
        startDate: monthStart(2019, 1),
        endDate: monthStart(2021, 6),
        isCurrent: false,
        description: 'Built REST APIs.\nStack: Node.js',
      }),
    ]);
    // The PROJECTS section's date range must not leak into experiences or educations.
    expect(educations).toEqual([
      postable({ school: 'State University', major: 'Computer Science', startDate: monthStart(2015, 1), endDate: monthStart(2019, 1), isCurrent: false, description: '' }),
    ]);
  });

  it('parses Vietnamese headings and "Hiện tại"/"đến nay" as an ongoing entry', () => {
    const text = [
      'KINH NGHIỆM LÀM VIỆC',
      'Lập trình viên — Công ty ABC',
      '03/2020 – Hiện tại',
      'Phát triển API',
      'Thực tập sinh - Công ty XYZ',
      '2018 - 2019',
      'HỌC VẤN',
      'Công nghệ thông tin — Đại học Bách Khoa',
      '2014 đến nay',
      'KỸ NĂNG',
      'TypeScript',
    ].join('\n');

    const { experiences, educations } = parseCvText(text);

    expect(experiences).toEqual([
      postable({ company: 'Công ty ABC', position: 'Lập trình viên', startDate: monthStart(2020, 3), endDate: null, isCurrent: true, description: 'Phát triển API' }),
      postable({ company: 'Công ty XYZ', position: 'Thực tập sinh', startDate: monthStart(2018, 1), endDate: monthStart(2019, 1), isCurrent: false, description: '' }),
    ]);
    expect(educations).toEqual([
      postable({ school: 'Đại học Bách Khoa', major: 'Công nghệ thông tin', startDate: monthStart(2014, 1), endDate: null, isCurrent: true, description: '' }),
    ]);
  });

  it('matches decomposed (NFD) Vietnamese headings the same as composed ones', () => {
    const text = ['Học vấn:'.normalize('NFD'), 'Đại học Bách Khoa', '2014 - 2018'].join('\n');

    expect(parseCvText(text).educations).toEqual([
      postable({ school: 'Đại học Bách Khoa', major: '', startDate: monthStart(2014, 1), endDate: monthStart(2018, 1), isCurrent: false, description: '' }),
    ]);
  });

  it('handles title and dates on the same line, month-name dates, and a company-first title', () => {
    const text = ['Work Experience:', 'Acme Corp | Backend Engineer | Sep 2020 - Jun 2023', 'Built things', 'Globex Ltd — Intern  Jan 2019 – Aug 2019'].join('\n');

    expect(parseCvText(text).experiences).toEqual([
      postable({ company: 'Acme Corp', position: 'Backend Engineer', startDate: monthStart(2020, 9), endDate: monthStart(2023, 6), isCurrent: false, description: 'Built things' }),
      postable({ company: 'Globex Ltd', position: 'Intern', startDate: monthStart(2019, 1), endDate: monthStart(2019, 8), isCurrent: false, description: '' }),
    ]);
  });

  it('handles a dates-first layout (bare date line, title on the next line)', () => {
    const text = ['Education', '2015 - 2019', 'State University, Computer Science', 'GPA 3.5', '2019 - 2020', 'Night College', 'Experience', 'none'].join('\n');

    expect(parseCvText(text).educations).toEqual([
      postable({ school: 'State University', major: 'Computer Science', startDate: monthStart(2015, 1), endDate: monthStart(2019, 1), isCurrent: false, description: 'GPA 3.5' }),
      postable({ school: 'Night College', major: '', startDate: monthStart(2019, 1), endDate: monthStart(2020, 1), isCurrent: false, description: '' }),
    ]);
  });

  it('does not treat a sentence containing a heading word as a heading', () => {
    const text = ['Summary', 'Experience with Node.js since 2015 - 2020 at several companies'].join('\n');

    expect(parseCvText(text)).toEqual({ educations: [], experiences: [] });
  });

  it('does not read a year out of a longer number such as a phone number', () => {
    const text = ['Experience', 'Phone 0901-234567', 'Contact 12019 - 20201'].join('\n');

    expect(parseCvText(text).experiences).toEqual([]);
  });

  it('returns empty arrays (not an error) when no sections are recognized', () => {
    expect(parseCvText('Just some text\nwith no headings at all\n2019 - 2020')).toEqual({ educations: [], experiences: [] });
    expect(parseCvText('')).toEqual({ educations: [], experiences: [] });
  });
});

describe('parseCvPdf', () => {
  it('rejects an unreadable/corrupt PDF with INVALID_PDF', async () => {
    await expect(parseCvPdf(Buffer.from('this is not a pdf'))).rejects.toThrow('INVALID_PDF');
  });
});

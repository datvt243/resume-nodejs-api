/**
 * Tests for services/createPDF.ts's pageRender — pure HTML-building
 * function, no Puppeteer involved, so it's safe/fast to test directly.
 */

import { pageRender } from '@/services/createPDF';

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

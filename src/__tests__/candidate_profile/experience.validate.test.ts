/**
 * schemaExperience — LinkedIn-style career break: a break has no
 * employer, so company/position may be empty but a known type is required.
 */
import { schemaExperience } from '@/candidate_profile/experience/experience.validate';

const base = {
  _id: '507f1f77bcf86cd799439011',
  startDate: new Date(2022, 0, 1).getTime(),
  endDate: new Date(2023, 0, 1).getTime(),
  description: { vi: '', en: '' },
};

describe('schemaExperience — career break', () => {
  it('accepts a career break with empty company/position and a known type', () => {
    const { error } = schemaExperience.validate({ ...base, company: '', position: '', isCareerBreak: true, careerBreakType: 'caregiving' });
    expect(error).toBeUndefined();
  });

  it('accepts a career break that omits company/position entirely', () => {
    const { error } = schemaExperience.validate({ ...base, isCareerBreak: true, careerBreakType: 'travel' });
    expect(error).toBeUndefined();
  });

  it('rejects a career break without a type', () => {
    expect(schemaExperience.validate({ ...base, isCareerBreak: true }).error).toBeDefined();
    expect(schemaExperience.validate({ ...base, isCareerBreak: true, careerBreakType: '' }).error).toBeDefined();
  });

  it('rejects an unknown career break type', () => {
    const { error } = schemaExperience.validate({ ...base, isCareerBreak: true, careerBreakType: 'vacation' });
    expect(error).toBeDefined();
  });

  it('still requires company/position keys for a regular job', () => {
    expect(schemaExperience.validate({ ...base, position: 'Dev' }).error).toBeDefined();
    expect(schemaExperience.validate({ ...base, company: 'Co', isCareerBreak: false }).error).toBeDefined();
  });

  it('accepts a regular job with the model default careerBreakType ""', () => {
    const { error } = schemaExperience.validate({ ...base, company: 'Co', position: 'Dev', isCareerBreak: false, careerBreakType: '' });
    expect(error).toBeUndefined();
  });
});

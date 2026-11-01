// Real school names are often short acronyms or abbreviations.
import { schemaEducation } from '@/candidate_profile/education/education.validate';

const base = {
  _id: '507f1f77bcf86cd799439011',
  major: 'Computer Science',
  startDate: new Date(2018, 0, 1).getTime(),
  endDate: new Date(2022, 0, 1).getTime(),
};

describe('schemaEducation — school', () => {
  it.each(['MIT', 'RMIT', 'FPT', 'ĐH Huế'])('accepts %s', (school) => {
    expect(schemaEducation.validate({ ...base, school }).error).toBeUndefined();
  });

  it('trims surrounding spaces from school and major', () => {
    const { error, value } = schemaEducation.validate({ ...base, school: ' MIT ', major: ' Computer Science ' });
    expect(error).toBeUndefined();
    expect(value).toMatchObject({ school: 'MIT', major: 'Computer Science' });
  });
});

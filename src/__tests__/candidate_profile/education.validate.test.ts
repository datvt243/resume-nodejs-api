// Real school names are often short acronyms or abbreviations.
import { schemaEducation } from '@/candidate_profile/education/education.validate';

const base = {
  _id: '507f1f77bcf86cd799439011',
  major: { vi: 'Khoa học máy tính', en: 'Computer Science' },
  startDate: new Date(2018, 0, 1).getTime(),
  endDate: new Date(2022, 0, 1).getTime(),
};

describe('schemaEducation — school', () => {
  it.each(['MIT', 'RMIT', 'FPT', 'ĐH Huế'])('accepts %s', (vi) => {
    expect(schemaEducation.validate({ ...base, school: { vi, en: '' } }).error).toBeUndefined();
  });

  it('trims surrounding spaces from both languages of school and major', () => {
    const { error, value } = schemaEducation.validate({
      ...base,
      school: { vi: ' ĐH Bách Khoa ', en: ' HCMUT ' },
      major: { vi: ' Khoa học máy tính ', en: ' Computer Science ' },
    });
    expect(error).toBeUndefined();
    expect(value).toMatchObject({ school: { vi: 'ĐH Bách Khoa', en: 'HCMUT' }, major: { vi: 'Khoa học máy tính', en: 'Computer Science' } });
  });

  it('accepts a missing en variant', () => {
    expect(schemaEducation.validate({ ...base, school: { vi: 'FPT' }, major: { vi: 'CNTT' } }).error).toBeUndefined();
  });

  it.each([
    ['school as a plain string', { school: 'MIT' }, 'school'],
    ['school without vi', { school: { en: 'MIT' } }, 'school.vi'],
    ['major vi shorter than 3', { school: { vi: 'MIT' }, major: { vi: 'IT' } }, 'major.vi'],
  ])('rejects %s', (_label, patch, path) => {
    const { error } = schemaEducation.validate({ ...base, ...patch });
    expect(error?.details[0]?.path.join('.')).toBe(path);
  });
});

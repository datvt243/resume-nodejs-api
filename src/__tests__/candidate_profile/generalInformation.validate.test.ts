import { schemaGeneralInformation, schemaGeneralInformationPatch } from '@/candidate_profile/general_information/generalInformation.validate';
import generalInformation from '@/models/generalInformation.model';

const _id = '507f1f77bcf86cd799439011';
const skills = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `Skill ${i}` }));

describe('schemaGeneralInformationPatch — mainSkills', () => {
  it('accepts up to 5 main skills', () => {
    expect(schemaGeneralInformationPatch.validate({ _id, mainSkills: skills(5) }).error).toBeUndefined();
  });

  it('rejects more than 5 main skills', () => {
    const { error } = schemaGeneralInformationPatch.validate({ _id, mainSkills: skills(6) });
    expect(error?.details[0]?.path).toEqual(['mainSkills']);
  });
});

describe('schemaGeneralInformationPatch — familiarSkills', () => {
  it('accepts any number of familiar skills', () => {
    expect(schemaGeneralInformationPatch.validate({ _id, familiarSkills: skills(20) }).error).toBeUndefined();
  });
});

describe('schemaGeneralInformation — desired salary range', () => {
  const full = {
    _id,
    positionDesired: 'Developer',
    career: { vi: 'Phần mềm', en: 'Software' },
    levelCurrent: 'Senior',
    levelDesired: 'Lead',
    education: 'University',
    workLocation: 'Hanoi',
    workForm: 'Remote',
    careerGoal: { vi: 'Phát triển', en: 'Grow' },
    yearsOfExperience: 2,
  };

  it.each([
    [{ salaryDesiredFrom: 1000, salaryDesiredTo: 2000 }],
    [{ salaryDesiredFrom: 1000, salaryDesiredTo: 1000 }],
    [{ salaryDesiredFrom: 1000 }],
    [{ salaryDesiredTo: 2000 }],
    [{ salaryDesiredFrom: null, salaryDesiredTo: 2000 }],
    [{}],
  ])('accepts %p', (range) => {
    const { error, value } = schemaGeneralInformation.validate({ ...full, ...range });
    expect(error).toBeUndefined();
    expect(value).toMatchObject(range);
  });

  it.each([
    ['To below From', { salaryDesiredFrom: 2000, salaryDesiredTo: 1000 }, 'salaryDesiredTo'],
    ['a negative From', { salaryDesiredFrom: -1 }, 'salaryDesiredFrom'],
    ['a negative To', { salaryDesiredTo: -1 }, 'salaryDesiredTo'],
  ])('rejects %s', (_label, range, field) => {
    const { error } = schemaGeneralInformation.validate({ ...full, ...range }, { abortEarly: false });
    expect(error?.details.map((d) => d.path.join('.'))).toEqual([field]);
  });

  it('reads a legacy single salaryDesired as From = To and drops it', () => {
    const { error, value } = schemaGeneralInformation.validate({ ...full, salaryDesired: 1500 });
    expect(error).toBeUndefined();
    expect(value).toMatchObject({ salaryDesiredFrom: 1500, salaryDesiredTo: 1500 });
    expect(value).not.toHaveProperty('salaryDesired');
  });

  it('prefers the range when both the range and legacy salaryDesired are sent', () => {
    const { value } = schemaGeneralInformation.validate({ ...full, salaryDesired: 1500, salaryDesiredFrom: 1000 });
    expect(value).toMatchObject({ salaryDesiredFrom: 1000 });
    expect(value).not.toHaveProperty('salaryDesiredTo');
    expect(value).not.toHaveProperty('salaryDesired');
  });
});

describe('generalInformation model — legacy salaryDesired', () => {
  const candidateId = '507f1f77bcf86cd799439012';

  it('hydrates a document with only salaryDesired as an exact range', () => {
    const doc = generalInformation.hydrate({ _id, candidateId, salaryDesired: 1500 });
    expect(doc.toObject()).toMatchObject({ salaryDesiredFrom: 1500, salaryDesiredTo: 1500 });
  });

  it('keeps a stored range as is', () => {
    const doc = generalInformation.hydrate({ _id, candidateId, salaryDesired: 1500, salaryDesiredFrom: 1000, salaryDesiredTo: 3000 });
    expect(doc.toObject()).toMatchObject({ salaryDesiredFrom: 1000, salaryDesiredTo: 3000 });
  });

  it('defaults both ends to null when nothing is stored', () => {
    const doc = generalInformation.hydrate({ _id, candidateId });
    expect(doc.toObject()).toMatchObject({ salaryDesiredFrom: null, salaryDesiredTo: null });
  });
});

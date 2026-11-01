import { schemaGeneralInformationPatch } from '@/candidate_profile/general_information/generalInformation.validate';

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

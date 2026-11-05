// Many projects (company ones especially) have no public link.
import { schemaProject } from '@/candidate_profile/project/project.validate';

const base = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Resume API',
  description: { vi: 'Mô tả', en: 'Description' },
  position: 'Backend',
  startDate: new Date(2022, 0, 1).getTime(),
};

describe('schemaProject — link', () => {
  it('accepts a missing link', () => {
    expect(schemaProject.validate(base).error).toBeUndefined();
  });

  it.each(['', '   ', 'https://github.com/datvt243'])('accepts link %p', (link) => {
    expect(schemaProject.validate({ ...base, link }).error).toBeUndefined();
  });

  it('rejects a link longer than 100 characters', () => {
    const { error } = schemaProject.validate({ ...base, link: `https://x.io/${'a'.repeat(100)}` });
    expect(error?.details[0]?.path.join('.')).toBe('link');
  });
});

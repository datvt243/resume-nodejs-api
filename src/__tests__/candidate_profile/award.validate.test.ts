import { schemaAward } from '@/candidate_profile/awards/award.validate';

const base = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Best Paper',
  organization: 'IEEE',
  issueDate: new Date(2022, 0, 1).getTime(),
  description: { vi: 'Giải thưởng', en: 'Award' },
};

describe('schemaAward — link', () => {
  it.each([
    ['missing', {}],
    ['empty', { link: '' }],
    ['an https URL', { link: 'https://example.com/award' }],
    ['an http URL', { link: 'http://example.com' }],
  ])('accepts a link that is %s', (_label, patch) => {
    expect(schemaAward.validate({ ...base, ...patch }).error).toBeUndefined();
  });

  it.each([
    ['not a URL', 'not a url'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['longer than 100 chars', `https://example.com/${'a'.repeat(90)}`],
  ])('rejects a link that is %s', (_label, link) => {
    const { error } = schemaAward.validate({ ...base, link });
    expect(error?.details[0]?.path.join('.')).toBe('link');
  });
});

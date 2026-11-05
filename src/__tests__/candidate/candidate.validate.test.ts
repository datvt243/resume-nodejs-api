import { schemaCandidatePatch } from '@/candidate/candidate.validate';

const _id = '507f1f77bcf86cd799439011';

describe('schemaCandidatePatch — cvFileName', () => {
  it.each(['', 'Võ Tấn Đạt - CV 2026', 'cv_v2.final', 'a'.repeat(100)])('accepts %p', (cvFileName) => {
    expect(schemaCandidatePatch.validate({ _id, cvFileName }).error).toBeUndefined();
  });

  it.each([
    ['a slash', '../etc/passwd'],
    ['a backslash', '..\\windows'],
    ['a double quote', 'cv"; filename="evil.exe'],
    ['CR/LF', 'cv\r\nX-Injected: 1'],
    ['more than 100 characters', 'a'.repeat(101)],
  ])('rejects %s', (_label, cvFileName) => {
    const { error } = schemaCandidatePatch.validate({ _id, cvFileName });
    expect(error?.details[0]?.path).toEqual(['cvFileName']);
  });
});

// `lastName` is the given name (Tên), which can be 1–2 characters (An, Vy).
import { lastName } from '@/config/joi.config';

describe('lastName', () => {
  it.each(['An', 'Vy', 'Hà', 'Tú', 'Nguyễn'])('accepts %s', (value) => {
    expect(lastName.validate(value).error).toBeUndefined();
  });

  it('rejects an empty string', () => {
    expect(lastName.validate('').error).toBeDefined();
  });
});

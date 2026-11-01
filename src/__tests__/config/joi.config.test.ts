// `lastName` is the given name (Tên), which can be 1–2 characters (An, Vy).
import { lastName } from '@/config/joi.config';

describe('lastName', () => {
  it.each(['An', 'Vy', 'Hà', 'Tú', 'Nguyễn'])('accepts %s', (value) => {
    expect(lastName.validate(value).error).toBeUndefined();
  });

  it('rejects an empty string', () => {
    expect(lastName.validate('').error).toBeDefined();
  });

  it('trims surrounding spaces instead of rejecting them', () => {
    expect(lastName.validate(' An ')).toEqual({ value: 'An' });
  });

  it.each([123, '   '])('still rejects %p', (value) => {
    expect(lastName.validate(value).error).toBeDefined();
  });
});

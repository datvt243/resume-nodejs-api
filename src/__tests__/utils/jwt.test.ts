import jwt from 'jsonwebtoken';
import { jwtSign } from '@/utils/jwt';

describe('jwtSign', () => {
  it('gives every token its own jti, so the same payload signed in the same second never repeats', () => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 10, 18, 9, 0, 0));
    const a = jwtSign({ data: { _id: 'u1' }, secretKey: 'secret' });
    const b = jwtSign({ data: { _id: 'u1' }, secretKey: 'secret' });
    jest.restoreAllMocks();

    expect(a).not.toBe(b);
    const decodedA = jwt.decode(a) as { _id: string; jti: string; iat: number };
    const decodedB = jwt.decode(b) as { jti: string; iat: number };
    expect(decodedA._id).toBe('u1');
    expect(decodedA.iat).toBe(decodedB.iat);
    expect(decodedA.jti).toEqual(expect.any(String));
    expect(decodedA.jti).not.toBe(decodedB.jti);
  });
});

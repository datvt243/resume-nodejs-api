/**
 * JWT token utilities with secure secret key validation
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const jwtSign = ({
  data,
  secretKey,
  // Every real caller only ever passes `expiresIn` — confirmed via
  // grep, no other sign option is used anywhere in the codebase.
  props = { expiresIn: '1h' },
}: {
  data: Record<string, unknown>;
  secretKey: string | undefined;
  props?: { expiresIn: string };
}) => {
  if (!secretKey) {
    throw new Error('JWT secret key is missing. Check TOKEN_SECRET in .env file');
  }

  const { expiresIn = '1d' } = props;
  // Fresh `jti` on every token: two signed in the same second would otherwise be byte-identical, so logging out one session would revoke the other and an identical copy of a rotated refresh token would read as reuse.
  const token = jwt.sign(data, secretKey, { expiresIn, jwtid: crypto.randomUUID() });
  return token;
};

export const jwtVerify = (token: string, secretKey: string | undefined) => {
  if (!secretKey) {
    throw new Error('JWT secret key is missing. Check TOKEN_SECRET in .env file');
  }
  const decoded = jwt.verify(token, secretKey) as { _id: string };
  return decoded;
};

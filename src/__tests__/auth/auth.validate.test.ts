import { schemaAuthLogin, schemaAuthRegister } from '@/auth/auth.validate';
import { PASSWORD_MAX_LENGTH } from '@/config/joi.config';

describe('schemaAuthLogin password rule', () => {
  const email = 'user@example.com';

  it('accepts a short password that predates the current strength rules', () => {
    expect(schemaAuthLogin.validate({ email, password: 'abc123' }).error).toBeUndefined();
  });

  it('rejects a missing, empty or over-long password', () => {
    expect(schemaAuthLogin.validate({ email }).error).toBeDefined();
    expect(schemaAuthLogin.validate({ email, password: '' }).error).toBeDefined();
    expect(schemaAuthLogin.validate({ email, password: 'a'.repeat(PASSWORD_MAX_LENGTH + 1) }).error).toBeDefined();
  });

  it('register still enforces the strength rules', () => {
    expect(schemaAuthRegister.validate({ email, password: 'abc123', repassword: 'abc123' }).error).toBeDefined();
  });
});

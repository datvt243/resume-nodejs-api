import { schemaAuthLogin, schemaAuthRegister, schemaChangePassword, schemaChangeEmail } from '@/auth/auth.validate';
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

describe('change-password / change-email schemas', () => {
  const strong = 'NewPass123!xyz';
  const changePassword = { candidateId: 'user_id', currentPassword: 'old', password: strong, repassword: strong };

  it('accepts a valid change-password body, including the candidateId verifyToken injects', () => {
    expect(schemaChangePassword.validate(changePassword).error).toBeUndefined();
  });

  it('rejects a missing currentPassword, an 11-char password, a mismatched repassword and an extra key', () => {
    const { currentPassword: _omit, ...noCurrent } = changePassword;
    expect(schemaChangePassword.validate(noCurrent).error).toBeDefined();
    expect(schemaChangePassword.validate({ ...changePassword, password: 'Abcdefg12!x', repassword: 'Abcdefg12!x' }).error).toBeDefined();
    expect(schemaChangePassword.validate({ ...changePassword, repassword: `${strong}x` }).error).toBeDefined();
    expect(schemaChangePassword.validate({ ...changePassword, extra: 1 }).error).toBeDefined();
  });

  it('change-email accepts a register-valid email and rejects a non-whitelisted TLD or a missing currentPassword', () => {
    expect(schemaChangeEmail.validate({ candidateId: 'user_id', currentPassword: 'old', email: 'new@example.com' }).error).toBeUndefined();
    expect(schemaChangeEmail.validate({ currentPassword: 'old', email: 'a@b.io' }).error).toBeDefined();
    expect(schemaChangeEmail.validate({ email: 'new@example.com' }).error).toBeDefined();
  });
});

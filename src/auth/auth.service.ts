/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import crypto from 'crypto';
import CandidateModel from '@/models/candidate.model';
import { bcryptGenerateSalt, bcryptCompareHash, jwtSign } from '@/utils';
import { TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN, TOKEN_REFRESH_EXP_IN } from '@/config/process.config';
import { t, DEFAULT_LANG } from '@/utils/i18n';
import { createResetToken, consumeResetToken } from '@/utils/passwordReset';
import { createVerificationToken, consumeVerificationToken } from '@/utils/emailVerification';
import { generateUniqueCandidateSlug } from '@/utils/slug';
import { logger } from '@/logger';

interface Auth {
  email: string;
  password: string;
  repassword?: string;
}

export const isEmailAlreadyExists = async (email: string) => {
  const find = await CandidateModel.findOne({ email });
  return !!find;
};

export const handlerRegister = async (item: Auth, lang: string = DEFAULT_LANG) => {
  const { email, password } = item;

  const emailHasExits = await isEmailAlreadyExists(email);
  if (emailHasExits) return { success: false, message: t('auth.emailAlreadyExists', lang) };

  /**
   * TODO: validate data với mongo model.valid
   */

  const bcryptPwd = await bcryptGenerateSalt(password);
  // Vanity slug auto-generated here since no name is collected at
  // register time, only email/password; base comes from the email's
  // local-part.
  const slug = await generateUniqueCandidateSlug(email.split('@')[0] ?? email);
  await CandidateModel.create({
    _id: null,
    email: email,
    password: bcryptPwd,
    slug,
  });

  /**
   * STUB: no email-sending infra exists yet — log the verification link
   * instead of emailing it. Does NOT block
   * registration or login (product decision, operator-confirmed via
   * AskUserQuestion): `emailVerified` stays false until this link is
   * visited, but the account is usable immediately either way.
   *
   * Re-fetch by email instead of using CandidateModel.create()'s own
   * return value — passing `_id: null` explicitly (as above) makes
   * Mongoose keep `_id: null` on the returned in-memory document instead
   * of the real ObjectId MongoDB actually assigned on insert (confirmed
   * live: `document._id` was `null` right after `.create()` resolved,
   * while every subsequent `findOne` for the same email correctly
   * returns a real `_id`). Same root cause already documented in
   * `services/index.ts`'s `baseCreateDocument` comment and tracked as
   * the `fix-create-response-null-id` node — this is a second, separate
   * occurrence of it in `auth.service.ts`, not something introduced here.
   */
  const savedDocument = await CandidateModel.findOne({ email });
  if (savedDocument && savedDocument._id) {
    const verifyToken = await createVerificationToken(savedDocument._id.toString());
    logger.info(`[emailVerification] Verification link for ${email}: /verify-email?token=${verifyToken}`);
  }

  return { success: true, message: t('auth.registerSuccess', lang) };
};

/**
 * Chức năng Xác thực email: xác thực verification token (single-use) rồi
 * đánh dấu emailVerified = true. Không chặn login — chỉ cập nhật cờ để
 * frontend tự quyết định hiển thị (nhắc xác thực, giới hạn tính năng...).
 */
export const handlerVerifyEmail = async (token: string, lang: string = DEFAULT_LANG) => {
  const candidateId = await consumeVerificationToken(token);
  if (!candidateId) return { success: false, message: t('auth.verificationTokenInvalid', lang) };

  await CandidateModel.updateOne({ _id: candidateId }, { emailVerified: true });

  return { success: true, message: t('auth.emailVerifiedSuccess', lang) };
};

export const handlerLogin = async (data: Auth, lang: string = DEFAULT_LANG) => {
  const { email, password } = data;

  const _user = await CandidateModel.findOne({ email });
  if (!_user) return { success: false, message: t('auth.emailNotFound', lang) };

  const { _id, password: pwdHash } = _user;
  const comparePwd = await bcryptCompareHash(password, pwdHash);
  if (!comparePwd) return { success: false, message: t('auth.wrongPassword', lang) };

  const token = jwtSign({ data: { _id }, secretKey: TOKEN_SECRET, props: { expiresIn: TOKEN_EXP_IN || '1h' } });
  // `jti` keeps refresh tokens unique: two signed in the same second would otherwise be byte-identical, and an identical copy of a rotated token reads as reuse.
  const tokenRefresh = jwtSign({ data: { _id, jti: crypto.randomUUID() }, secretKey: TOKEN_REFRESH, props: { expiresIn: TOKEN_REFRESH_EXP_IN } });

  return {
    success: true,
    message: t('auth.loginSuccess', lang),
    data: {
      user: {
        email: _user.email,
        first_name: _user.firstName || '',
        last_name: _user.lastName || '',
        // Not blocking, just exposed so the frontend can decide what to
        // do (e.g. a "verify your email" banner).
        email_verified: _user.emailVerified || false,
      },
      token: token,
      tokenRefresh: tokenRefresh,
    },
    errors: null,
  };
};

/**
 * Chức năng Quên mật khẩu: tạo reset token cho email nếu tồn tại
 *
 * Luôn trả về message chung chung dù email có tồn tại hay không, để
 * tránh lộ thông tin email nào đã đăng ký (user enumeration).
 *
 * STUB: chưa có hạ tầng gửi email trong project — log link reset thay vì
 * gửi email thật. Thay bằng mailer thật khi chọn được provider.
 */
export const handlerForgotPassword = async (email: string, lang: string = DEFAULT_LANG) => {
  const user = await CandidateModel.findOne({ email });

  if (user && user._id) {
    const token = await createResetToken(user._id.toString());
    logger.info(`[passwordReset] Reset link for ${email}: /reset-password?token=${token}`);
  }

  return { success: true, message: t('auth.forgotPasswordRequested', lang) };
};

interface ResetPasswordInput {
  token: string;
  password: string;
}

/**
 * Chức năng Đặt lại mật khẩu: xác thực reset token (single-use) rồi
 * cập nhật mật khẩu mới (bcrypt hash).
 */
export const handlerResetPassword = async (data: ResetPasswordInput, lang: string = DEFAULT_LANG) => {
  const { token, password } = data;

  const candidateId = await consumeResetToken(token);
  if (!candidateId) return { success: false, message: t('auth.resetTokenInvalid', lang) };

  const bcryptPwd = await bcryptGenerateSalt(password);
  await CandidateModel.updateOne({ _id: candidateId }, { password: bcryptPwd });

  return { success: true, message: t('auth.resetPasswordSuccess', lang) };
};

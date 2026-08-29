/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import CandidateModel from '@/models/candidate.model';
import { bcryptGenerateSalt, bcryptCompareHash, jwtSign } from '@/utils';
import { TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN, TOKEN_REFRESH_EXP_IN } from '@/config/process.config';
import { t, DEFAULT_LANG } from '@/utils/i18n';
import { createResetToken, consumeResetToken } from '@/utils/passwordReset';
import { createVerificationToken, consumeVerificationToken } from '@/utils/emailVerification';
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
  /**
   * FLOW
   *  1. lấy thông tin input [email, pwd, re-pwd]
   *  2. validate thông tin
   *      2.1. 'false' -> return error
   *  3. mã hoá pwd
   *  4. lưu thông tin
   */
  const { email, password } = item;

  /**
   * check Email đã tồn tại chưa
   */
  const emailHasExits = await isEmailAlreadyExists(email);
  if (emailHasExits) return { success: false, message: t('auth.emailAlreadyExists', lang) };

  /**
   * TODO: validate data với mongo model.valid
   */

  const bcryptPwd = await bcryptGenerateSalt(password);
  await CandidateModel.create({
    _id: null,
    email: email,
    password: bcryptPwd,
  });

  // STUB (issue #71, same gap as #70): no email-sending infra exists yet
  // — log the verification link instead of emailing it. Does NOT block
  // registration or login (product decision, operator-confirmed via
  // AskUserQuestion): `emailVerified` stays false until this link is
  // visited, but the account is usable immediately either way.
  //
  // Re-fetch by email instead of using CandidateModel.create()'s own
  // return value — passing `_id: null` explicitly (as above) makes
  // Mongoose keep `_id: null` on the returned in-memory document instead
  // of the real ObjectId MongoDB actually assigned on insert (confirmed
  // live: `document._id` was `null` right after `.create()` resolved,
  // while every subsequent `findOne` for the same email correctly
  // returns a real `_id`). Same root cause already documented in
  // `services/index.ts`'s `baseCreateDocument` comment and tracked as
  // the `fix-create-response-null-id` node — this is a second, separate
  // occurrence of it in `auth.service.ts`, not something introduced here.
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
  /**
   * FLOW
   * 1. find user by email
   * 2. check
   *      2.1. ko tìm thấy return error
   *      2.2. tìm thấy -> lấy ra pwd (đã đc hash)
   * 3. compare pwd (input) và pwd (hash)
   *      3.1. 'false' -> return error
   *      3.2. 'true' -> return [token, user]
   */

  const { email, password } = data;

  const _user = await CandidateModel.findOne({ email });
  if (!_user) return { success: false, message: t('auth.emailNotFound', lang) };

  /**
   * so sánh Pwd với pwd trong database
   */
  const { _id, password: pwdHash } = _user;
  const comparePwd = await bcryptCompareHash(password, pwdHash);
  if (!comparePwd) return { success: false, message: t('auth.wrongPassword', lang) };

  /**
   * init token
   */
  const token = jwtSign({ _id }, TOKEN_SECRET, { expiresIn: TOKEN_EXP_IN || '1h' });
  const tokenRefresh = jwtSign({ _id }, TOKEN_REFRESH, { expiresIn: TOKEN_REFRESH_EXP_IN });

  return {
    success: true,
    message: t('auth.loginSuccess', lang),
    data: {
      user: {
        email: _user.email,
        first_name: _user.firstName || '',
        last_name: _user.lastName || '',
        // Issue #71 — not blocking, just exposed so the frontend can
        // decide what to do (e.g. a "verify your email" banner).
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
 * STUB (issue #70): chưa có hạ tầng gửi email trong project — log link
 * reset thay vì gửi email thật. Thay bằng mailer thật khi chọn được
 * provider.
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

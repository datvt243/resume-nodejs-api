/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import CandidateModel from '@/models/candidate.model';
import { bcryptGenerateSalt, bcryptCompareHash, jwtSign } from '@/utils';
import { TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN, TOKEN_REFRESH_EXP_IN } from '@/config/process.config';
import { t, DEFAULT_LANG } from '@/utils/i18n';
import { createResetToken, consumeResetToken } from '@/utils/passwordReset';
import { invalidateAllSessions, getSessionsInvalidatedAt, isSessionRevoked } from '@/utils/sessionRevocation';
import { createVerificationToken, consumeVerificationToken } from '@/utils/emailVerification';
import { createEmailChangeToken, consumeEmailChangeToken } from '@/utils/emailChange';
import { generateUniqueCandidateSlug } from '@/utils/slug';
import { sendAuthLinkEmail, AuthMailKind } from '@/services/mail';
import { logger } from '@/logger';
import { AppError, BadRequestError, ErrorCode, InvalidCredentialsError } from '@/errors';

interface Auth {
  email: string;
  password: string;
  repassword?: string;
}

/**
 * Fire-and-forget: awaiting the SMTP round-trip would make a registered
 * email answer measurably slower than an unknown one, and a failed send must
 * not change the response either — so it is only logged, by message alone,
 * since the mail options carry the token.
 */
const emailAuthLink = (email: string, kind: AuthMailKind, path: string, lang: string, params: Record<string, string> = {}): void => {
  sendAuthLinkEmail(email, kind, path, lang, params).catch((err: unknown) => {
    logger.error(`[mail] ${kind} email failed: ${err instanceof Error ? err.message : String(err)}`);
  });
};

export const isEmailAlreadyExists = async (email: string) => {
  const find = await CandidateModel.findOne({ email });
  return !!find;
};

export const handlerRegister = async (item: Auth, lang: string = DEFAULT_LANG) => {
  const { email, password } = item;

  const emailHasExits = await isEmailAlreadyExists(email);
  if (emailHasExits) throw new AppError({ message: t('auth.emailAlreadyExists', lang), errorCode: ErrorCode.EMAIL_EXISTS });

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
   * Verification is not required to log in: `emailVerified` stays false
   * until the emailed link is visited, but the account is usable at once.
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
    emailAuthLink(email, 'verifyEmail', `/verify-email?token=${verifyToken}`, lang);
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
  if (!candidateId) throw new BadRequestError(t('auth.verificationTokenInvalid', lang));

  await CandidateModel.updateOne({ _id: candidateId }, { emailVerified: true });

  return { success: true, message: t('auth.emailVerifiedSuccess', lang) };
};

export const handlerLogin = async (data: Auth, lang: string = DEFAULT_LANG) => {
  const { email, password } = data;

  const _user = await CandidateModel.findOne({ email }).select('+password');
  // Same answer for an unknown email and a wrong password, so login can't be used to probe which emails are registered.
  if (!_user) throw new InvalidCredentialsError(t('auth.invalidCredentials', lang));

  const { _id, password: pwdHash } = _user;
  const comparePwd = await bcryptCompareHash(password, pwdHash);
  if (!comparePwd) throw new InvalidCredentialsError(t('auth.invalidCredentials', lang));

  const token = jwtSign({ data: { _id }, secretKey: TOKEN_SECRET, props: { expiresIn: TOKEN_EXP_IN || '1h' } });
  const tokenRefresh = jwtSign({ data: { _id }, secretKey: TOKEN_REFRESH, props: { expiresIn: TOKEN_REFRESH_EXP_IN } });

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
 */
export const handlerForgotPassword = async (email: string, lang: string = DEFAULT_LANG) => {
  const user = await CandidateModel.findOne({ email });

  if (user && user._id) {
    const candidateId = user._id.toString();
    const token = await createResetToken(candidateId);
    logger.info(`[passwordReset] Reset requested for candidate ${candidateId}`);
    emailAuthLink(email, 'resetPassword', `/reset-password?token=${token}`, lang);
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
  if (!candidateId) throw new BadRequestError(t('auth.resetTokenInvalid', lang));

  const bcryptPwd = await bcryptGenerateSalt(password);
  await CandidateModel.updateOne({ _id: candidateId }, { password: bcryptPwd });
  // A session stolen before the reset must not survive it, same as logout-all.
  await invalidateAllSessions(candidateId);

  return { success: true, message: t('auth.resetPasswordSuccess', lang) };
};

/** Loads the signed-in candidate with its password hash, after checking `currentPassword` against it. */
const findWithCurrentPassword = async (candidateId: string, currentPassword: string, lang: string) => {
  const candidate = await CandidateModel.findById(candidateId).select('+password');
  if (!candidate) throw new BadRequestError(t('common.idNotFound', lang));
  // 400, not 401: the session is valid, and a 401 would make the frontend log the user out.
  if (!(await bcryptCompareHash(currentPassword, candidate.password))) throw new BadRequestError(t('auth.currentPasswordInvalid', lang));
  return candidate;
};

interface ChangePasswordInput {
  currentPassword: string;
  password: string;
}

/**
 * Chức năng Đổi mật khẩu khi đã đăng nhập: thu hồi mọi phiên rồi cấp cặp
 * token mới cho chính người gọi, nên chỉ các thiết bị khác bị đăng xuất.
 */
export const handlerChangePassword = async (candidateId: string, data: ChangePasswordInput, lang: string = DEFAULT_LANG) => {
  const { currentPassword, password } = data;

  await findWithCurrentPassword(candidateId, currentPassword, lang);
  // currentPassword was just verified against the hash, so a plain comparison saves a second bcrypt round.
  if (password === currentPassword) throw new BadRequestError(t('auth.passwordUnchanged', lang));

  const bcryptPwd = await bcryptGenerateSalt(password);
  await CandidateModel.updateOne({ _id: candidateId }, { password: bcryptPwd });
  // Revocation rejects tokens issued strictly before this second, so the pair signed below stays valid.
  await invalidateAllSessions(candidateId);

  const token = jwtSign({ data: { _id: candidateId }, secretKey: TOKEN_SECRET, props: { expiresIn: TOKEN_EXP_IN || '1h' } });
  const tokenRefresh = jwtSign({ data: { _id: candidateId }, secretKey: TOKEN_REFRESH, props: { expiresIn: TOKEN_REFRESH_EXP_IN } });

  return { success: true, message: t('auth.changePasswordSuccess', lang), data: { token, tokenRefresh } };
};

interface ChangeEmailInput {
  currentPassword: string;
  email: string;
}

/**
 * Chức năng Đổi email: chỉ gửi link xác nhận tới email mới — email lưu
 * trong DB chưa đổi cho tới khi link được mở (handlerConfirmEmailChange).
 */
export const handlerChangeEmail = async (candidateId: string, data: ChangeEmailInput, lang: string = DEFAULT_LANG) => {
  const newEmail = data.email.toLowerCase();

  const candidate = await findWithCurrentPassword(candidateId, data.currentPassword, lang);
  if (newEmail === candidate.email.toLowerCase()) throw new BadRequestError(t('auth.emailUnchanged', lang));
  if (await isEmailAlreadyExists(newEmail)) throw new AppError({ message: t('auth.emailAlreadyExists', lang), errorCode: ErrorCode.EMAIL_EXISTS });

  const token = await createEmailChangeToken({ candidateId, newEmail });
  emailAuthLink(newEmail, 'confirmEmailChange', `/confirm-email-change?token=${token}`, lang);

  return { success: true, message: t('auth.changeEmailRequested', lang) };
};

/**
 * Chức năng Xác nhận đổi email: token single-use; email mới được kiểm tra
 * trùng lại vì có thể đã bị đăng ký trong lúc chờ xác nhận. Phiên đăng
 * nhập giữ nguyên (token chỉ mang candidate id).
 */
export const handlerConfirmEmailChange = async (token: string, lang: string = DEFAULT_LANG) => {
  const change = await consumeEmailChangeToken(token);
  if (!change) throw new BadRequestError(t('auth.emailChangeTokenInvalid', lang));
  const { candidateId, newEmail, issuedAt } = change;
  // A password reset/change or logout-all after the request cancels it, so a leaked password can't still move the email.
  if (isSessionRevoked(issuedAt, await getSessionsInvalidatedAt(candidateId))) throw new BadRequestError(t('auth.emailChangeTokenInvalid', lang));

  const candidate = await CandidateModel.findById(candidateId);
  if (!candidate) throw new BadRequestError(t('common.idNotFound', lang));
  if (await isEmailAlreadyExists(newEmail)) throw new AppError({ message: t('auth.emailAlreadyExists', lang), errorCode: ErrorCode.EMAIL_EXISTS });

  const oldEmail = candidate.email;
  await CandidateModel.updateOne({ _id: candidateId }, { email: newEmail, emailVerified: true });
  emailAuthLink(oldEmail, 'emailChanged', '', lang, { newEmail });

  return { success: true, message: t('auth.emailChangedSuccess', lang) };
};

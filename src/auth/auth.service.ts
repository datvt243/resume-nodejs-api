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
  const document = await CandidateModel.create({
    _id: null,
    email: email,
    password: bcryptPwd,
  });
  return { success: true, message: t('auth.registerSuccess', lang) };
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

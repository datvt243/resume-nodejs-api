/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

export const passwordRegex = new RegExp(
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+{}|;:,./<>?])[a-zA-Z0-9!@#$%^&*()_+{}|;:,./<>?]{5,}$',
);

export const phoneRegex = new RegExp('^[0-9]{10,11}$');

// URL-safe vanity slug (issue #120): lowercase alnum segments separated by
// single hyphens, no leading/trailing/double hyphens.
export const slugRegex = new RegExp('^[a-z0-9]+(-[a-z0-9]+)*$');

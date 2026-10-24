/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import type { HelmetOptions } from 'helmet';

/**
 * Helmet defaults, except Cross-Origin-Resource-Policy: the default
 * `same-origin` would stop the SPA (served from a different origin, see
 * `CORS_ORIGIN`) from embedding uploaded images/PDFs served from `public/`.
 */
export const helmetConfig = (): HelmetOptions => ({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

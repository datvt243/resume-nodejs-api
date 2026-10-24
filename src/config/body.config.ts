/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

/**
 * Max JSON / urlencoded request body. Sized for the largest legit body — a
 * 100-item education/experience bulk import with unbounded localized
 * descriptions, which can exceed body-parser's 100kb default. File uploads
 * go through multer with their own limits, not through this.
 */
export const REQUEST_BODY_LIMIT = '1mb';

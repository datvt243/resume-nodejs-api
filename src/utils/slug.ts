/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Vanity slug generation for public profiles (issue #120)
 */

import CandidateModel from '@/models/candidate.model';

const MAX_ATTEMPTS = 5;

/**
 * lowercase, ASCII alphanumeric + hyphens, diacritics stripped (đ/Đ handled
 * explicitly first — Vietnamese đ doesn't decompose under NFD the way
 * accented Latin letters do).
 */
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const randomSuffix = (): string => Math.random().toString(36).slice(2, 6);

/**
 * Auto-generated on register (no name is collected at register time, only
 * email/password — see `auth.service.ts::handlerRegister`), so the base
 * comes from the email's local-part. A random 4-char suffix keeps
 * collisions rare; bounded retries re-check the DB rather than looping
 * forever on a pathological base.
 */
export const generateUniqueCandidateSlug = async (base: string): Promise<string> => {
  const baseSlug = slugify(base) || 'user';
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = `${baseSlug}-${randomSuffix()}`;
    const exists = await CandidateModel.findOne({ slug: candidate }).select('_id').exec();
    if (!exists) return candidate;
  }
  // Astronomically unlikely to still collide after MAX_ATTEMPTS misses.
  return `${baseSlug}-${Date.now().toString(36)}`;
};

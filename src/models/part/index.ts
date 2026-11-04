/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const foreignLanguageSchema = new Schema(
  {
    language: { type: String, required: true },
    level: { type: String, required: true },
  },
  { _id: false },
);
export const professionalSkillsSchema = new Schema(
  {
    name: { type: String, required: true },
    exp: { type: Number, required: true },
    group: { type: String, required: false },
  },
  { _id: false },
);

export const personalSkills = new Schema(
  {
    name: { type: String, required: true },
  },
  { _id: false },
);
export const socialMediaSchema = new Schema(
  {
    name: { type: String, required: true },
    exp: { type: Number, required: true },
  },
  { _id: false },
);

/**
 * Free-text content (introduction/description-style fields, plus
 * Education school/major, whose names are commonly translated) stored
 * per language. Other proper-noun/label fields (company, position title,
 * etc.) stay plain String.
 */
export const localizedTextSchema = new Schema(
  {
    vi: { type: String, default: '' },
    en: { type: String, default: '' },
  },
  { _id: false },
);

/**
 * Mongoose drops a stored plain string at a single-nested path on hydrate
 * and applies the `{ vi: '', en: '' }` defaults, so a field converted to
 * `localizedTextSchema` reads back empty until its migration runs. Wrap the
 * legacy string as `vi` before casting instead. Global so a model that adds
 * a localized path later gets it without opting in; registered here because
 * every such model imports this file before compiling.
 */
mongoose.plugin((schema) => {
  const paths: string[] = [];
  schema.eachPath((path, type) => {
    if (type instanceof Schema.Types.Subdocument && type.schema === localizedTextSchema) paths.push(path);
  });
  if (paths.length === 0) return;

  // Mongoose's typings call the first arg `next`; a sync init hook really receives the raw stored doc.
  schema.pre('init', function (raw: unknown) {
    if (typeof raw !== 'object' || raw === null) return;
    for (const path of paths) {
      // eachPath gives dotted paths (`a.b`) but the raw doc is nested, so walk down to the parent object.
      const keys = path.split('.');
      const last = keys.pop() ?? path;
      let parent: unknown = raw;
      for (const key of keys) parent = typeof parent === 'object' && parent !== null ? (parent as Record<string, unknown>)[key] : undefined;
      if (typeof parent !== 'object' || parent === null) continue;

      const obj = parent as Record<string, unknown>;
      const value = obj[last];
      if (typeof value === 'string') obj[last] = { vi: value, en: '' };
    }
  });
});

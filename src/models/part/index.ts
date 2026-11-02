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

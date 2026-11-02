/**
 * One-off migration for the multi-language resume content feature.
 * Wraps existing plain-string values on the fields below into the new
 * { vi, en } shape, assuming existing content is Vietnamese (matches
 * the codebase's dominant language in validation messages/seed data).
 *
 * Idempotent: each update only matches documents where the field is
 * CURRENTLY a string (MongoDB $type check), so re-running this script
 * is a no-op once a document has already been migrated.
 *
 * MUST run against a database BEFORE deploying the schema change that
 * makes these fields { vi, en } objects — old plain-string documents
 * would otherwise fail to read/cast correctly under the new schema.
 *
 * Usage: npm run migrate:localize-text
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import dotenv from 'dotenv';
dotenv.config();

import { Model } from 'mongoose';
import connectMongo, { MongoDBConnection } from '@/database/mongo.db';
import * as MODELS from '@/models';
import { CrudDocument } from '@/services';

/**
 * { model, field } pairs — free-text description/introduction-style
 * fields plus Education school/major; other proper-noun/label fields
 * (company, position title, etc) stay plain strings.
 * `Model<CrudDocument>` + a narrow, justified cast per entry — same Mongoose `Model<T>` invariance pattern as elsewhere.
 * `CrudDocument`'s own fields are irrelevant here (this script only
 * ever calls `.updateMany()` with raw field-name strings, never typed
 * field access), it's just the minimal real `Model<T>` shape available
 * to reuse instead of a one-off local interface.
 */
const TARGETS: { name: string; model: Model<CrudDocument>; field: string }[] = [
  { name: 'Candidate.introduction', model: MODELS.Candidate as unknown as Model<CrudDocument>, field: 'introduction' },
  { name: 'Education.description', model: MODELS.Education as unknown as Model<CrudDocument>, field: 'description' },
  { name: 'Education.school', model: MODELS.Education as unknown as Model<CrudDocument>, field: 'school' },
  { name: 'Education.major', model: MODELS.Education as unknown as Model<CrudDocument>, field: 'major' },
  { name: 'Experience.description', model: MODELS.Experience as unknown as Model<CrudDocument>, field: 'description' },
  { name: 'Award.description', model: MODELS.Award as unknown as Model<CrudDocument>, field: 'description' },
  { name: 'Certificate.description', model: MODELS.Certificate as unknown as Model<CrudDocument>, field: 'description' },
  { name: 'Project.description', model: MODELS.Project as unknown as Model<CrudDocument>, field: 'description' },
  { name: 'generalInformation.career', model: MODELS.generalInformation as unknown as Model<CrudDocument>, field: 'career' },
  { name: 'generalInformation.careerGoal', model: MODELS.generalInformation as unknown as Model<CrudDocument>, field: 'careerGoal' },
];

const migrateField = async (model: Model<CrudDocument>, field: string) => {
  const result = await model.updateMany({ $expr: { $eq: [{ $type: `$${field}` }, 'string'] } }, [
    { $set: { [field]: { vi: `$${field}`, en: '' } } },
  ]);
  return result.modifiedCount ?? 0;
};

const run = async () => {
  const connected = await connectMongo();
  if (!connected) {
    console.error('[migrate] Failed to connect to MongoDB — aborting.');
    process.exitCode = 1;
    return;
  }

  console.log('[migrate] Localizing free-text fields to { vi, en }...');
  for (const { name, model, field } of TARGETS) {
    const count = await migrateField(model, field);
    console.log(`[migrate] ${name}: ${count} document(s) migrated`);
  }
  console.log('[migrate] Done.');

  await MongoDBConnection.getInstance().disconnect();
};

run().catch((err) => {
  console.error('[migrate] Unexpected error:', err);
  process.exitCode = 1;
});

import mongoose, { Schema, Types, type Model } from 'mongoose';
import { localizedTextSchema } from '@/models/part';
import Award from '@/models/award.model';
import Candidate from '@/models/candidate.model';
import Certificate from '@/models/certificate.model';
import Education from '@/models/education.model';
import Experience from '@/models/experience.model';
import GeneralInformation from '@/models/generalInformation.model';
import Project from '@/models/project.model';

// Hydrate = how every non-lean read builds a doc from stored data, no DB needed.
const cases: [string, Model<any>, string[]][] = [
  ['Education', Education, ['school', 'major', 'description']],
  ['Candidate', Candidate, ['introduction']],
  ['GeneralInformation', GeneralInformation, ['career', 'careerGoal']],
  ['Award', Award, ['description']],
  ['Certificate', Certificate, ['description']],
  ['Project', Project, ['description']],
  ['Experience', Experience, ['description']],
];

describe('localizedTextSchema legacy string cast', () => {
  it.each(cases)('%s keeps a stored plain string as vi', (_name, M, paths) => {
    const raw: Record<string, unknown> = { _id: new Types.ObjectId() };
    for (const p of paths) raw[p] = `old ${p}`;

    const doc = M.hydrate(raw);
    const json = doc.toJSON() as Record<string, unknown>;

    for (const p of paths) expect(json[p]).toEqual({ vi: `old ${p}`, en: '' });
    for (const p of paths) expect(doc.isModified(p)).toBe(false);
  });

  it('leaves an already-localized object unchanged', () => {
    const doc = Education.hydrate({ _id: new Types.ObjectId(), school: { vi: 'Cao Thắng', en: 'Cao Thang' } });
    expect(doc.toJSON().school).toEqual({ vi: 'Cao Thắng', en: 'Cao Thang' });
  });

  it('casts a legacy string at a nested path and inside an array of subdocuments', () => {
    const Nested = mongoose.model(
      'LocalizedNestedTest',
      new Schema({
        a: { b: { type: localizedTextSchema, default: () => ({}) } },
        arr: [new Schema({ d: { type: localizedTextSchema, default: () => ({}) } })],
      }),
    );
    const json = Nested.hydrate({ _id: new Types.ObjectId(), a: { b: 'nested' }, arr: [{ d: 'inarr' }] }).toJSON();

    expect(json.a?.b).toEqual({ vi: 'nested', en: '' });
    expect(json.arr[0]?.d).toEqual({ vi: 'inarr', en: '' });
  });

  it('casts a hydrated legacy doc without validation errors on its localized paths', () => {
    const doc = Education.hydrate({ _id: new Types.ObjectId(), school: 'Cao Thắng', major: 'CNTT' });
    const err = doc.validateSync(['school', 'major']);
    expect(err).toBeUndefined();
  });
});

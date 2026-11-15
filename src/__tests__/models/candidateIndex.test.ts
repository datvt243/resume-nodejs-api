import type { Model } from 'mongoose';
import Application from '@/models/application.model';
import Award from '@/models/award.model';
import Certificate from '@/models/certificate.model';
import Education from '@/models/education.model';
import Experience from '@/models/experience.model';
import Profile from '@/models/profile.model';
import Project from '@/models/project.model';
import Reference from '@/models/reference.modal';

const models: [string, Model<any>][] = [
  ['Application', Application],
  ['Award', Award],
  ['Certificate', Certificate],
  ['Education', Education],
  ['Experience', Experience],
  ['Profile', Profile],
  ['Project', Project],
  ['Reference', Reference],
];

describe.each(models)('%s indexes', (_name, model) => {
  it('has one { candidateId, deletedAt } compound index and no single-field candidateId index', () => {
    const keys = model.schema.indexes().map(([fields]) => fields);
    expect(keys).toContainEqual({ candidateId: 1, deletedAt: 1 });
    expect(keys).not.toContainEqual({ candidateId: 1 });
  });
});

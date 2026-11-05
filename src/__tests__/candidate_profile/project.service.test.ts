/**
 * Tests for classifying a project as company/personal and linking a company
 * project to an Experience: the `type`/`experienceId` rules in schemaProject,
 * the ownership check in project.service.ts (generic CRUD is mocked —
 * covered elsewhere), and the legacy-document default.
 */

import ExperienceModel from '@/models/experience.model';
import ProjectModel from '@/models/project.model';
import { schemaProject } from '@/candidate_profile/project/project.validate';
import { handlerCreate, handlerUpdate } from '@/candidate_profile/project/project.service';

const mockCrudCreate = jest.fn();
const mockCrudUpdate = jest.fn();

jest.mock('@/models/experience.model', () => ({ exists: jest.fn() }));
jest.mock('@/candidate_profile/BaseService', () => ({
  createCrudService: () => ({
    handlerGet: jest.fn(),
    handlerDelete: jest.fn(),
    handlerCreate: (...args: unknown[]) => mockCrudCreate(...args),
    handlerUpdate: (...args: unknown[]) => mockCrudUpdate(...args),
  }),
}));

const candidateId = '64b7f0c2a1b2c3d4e5f60718';
const experienceId = '64b7f0c2a1b2c3d4e5f60799';
const project = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Resume API',
  description: { vi: 'Mô tả', en: 'Description' },
  position: 'Backend',
  startDate: 1640995200000,
  candidateId,
};
const experienceExists = jest.mocked(ExperienceModel).exists;

describe('schemaProject type + experienceId', () => {
  it('defaults type to personal', () => {
    expect(schemaProject.validate(project).value.type).toBe('personal');
  });

  it.each([
    [{ type: 'company', experienceId }],
    [{ type: 'personal' }],
    [{ type: 'personal', experienceId: null }],
    [{ type: 'personal', experienceId: '' }],
  ])('accepts %p', (patch) => {
    expect(schemaProject.validate({ ...project, ...patch }).error).toBeUndefined();
  });

  it.each([
    ['company without experienceId', { type: 'company' }, 'experienceId'],
    ['company with a malformed id', { type: 'company', experienceId: '$ne' }, 'experienceId'],
    ['company with an operator object', { type: 'company', experienceId: { $ne: null } }, 'experienceId'],
    ['personal with an experienceId', { type: 'personal', experienceId }, 'experienceId'],
    ['an unknown type', { type: 'freelance' }, 'type'],
  ])('rejects %s', (_label, patch, path) => {
    const { error } = schemaProject.validate({ ...project, ...patch });
    expect(error?.details[0]?.path.join('.')).toBe(path);
  });
});

describe('project.service experience link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCrudCreate.mockResolvedValue({ success: true, data: [] });
    mockCrudUpdate.mockResolvedValue({ success: true, data: {} });
  });

  it('stores an id that is a non-deleted experience of the same candidate', async () => {
    experienceExists.mockResolvedValue({ _id: experienceId } as never);

    await handlerCreate({ ...project, type: 'company', experienceId }, 'en');

    expect(experienceExists).toHaveBeenCalledWith({ _id: experienceId, candidateId, deletedAt: null });
    expect(mockCrudCreate).toHaveBeenCalledWith({ ...project, type: 'company', experienceId }, 'en');
  });

  it.each([
    ['create', () => handlerCreate({ ...project, type: 'company', experienceId }, 'en')],
    ['update', () => handlerUpdate({ item: { ...project, type: 'company', experienceId }, userID: candidateId, lang: 'en' })],
  ])("rejects another candidate's, a deleted or a missing experience with 400 on %s, writing nothing", async (_label, run) => {
    experienceExists.mockResolvedValue(null);

    await expect(run()).rejects.toMatchObject({ statusCode: 400, errorCode: 'BAD_REQUEST', message: 'The selected work experience does not exist or has been deleted' });
    expect(mockCrudCreate).not.toHaveBeenCalled();
    expect(mockCrudUpdate).not.toHaveBeenCalled();
  });

  it('never queries Experience when the candidate id is rejected by QuerySafe', async () => {
    await expect(handlerCreate({ ...project, candidateId: '$where', type: 'company', experienceId }, 'en')).rejects.toMatchObject({ statusCode: 400 });

    expect(experienceExists).not.toHaveBeenCalled();
  });

  it.each(['', null, undefined])('stores null for a personal project (experienceId %p) without a lookup', async (value) => {
    await handlerUpdate({ item: { ...project, type: 'personal', experienceId: value }, userID: candidateId });

    expect(experienceExists).not.toHaveBeenCalled();
    expect(mockCrudUpdate).toHaveBeenCalledWith({ item: { ...project, type: 'personal', experienceId: null }, userID: candidateId });
  });
});

describe('Project model', () => {
  it('reads a legacy project without type back as personal', () => {
    const doc = ProjectModel.hydrate({ _id: project._id, name: 'Old', candidateId });
    expect(doc.toObject()).toMatchObject({ type: 'personal', experienceId: null });
  });
});

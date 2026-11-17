/**
 * Tests for linking an application to a CV profile: the `profileId` shape
 * accepted by schemaApplication, the ownership check in
 * application.service.ts (generic CRUD is mocked — covered elsewhere), and
 * that a rejected link surfaces as a 400 through the shared controller.
 * Also the status transition rules enforced on update.
 */

import ProfileModel from '@/models/profile.model';
import { schemaApplication } from '@/candidate_profile/application/application.validate';
import ApplicationModel from '@/models/application.model';
import { handlerCreate, handlerUpdate, isStatusTransitionAllowed } from '@/candidate_profile/application/application.service';
import { fnCreate } from '@/candidate_profile/application/application.controller';
import { errorsMiddleware } from '@/middlewares/errors.middleware';

const mockCrudCreate = jest.fn();
const mockCrudUpdate = jest.fn();

jest.mock('@/models/profile.model', () => ({ exists: jest.fn() }));
// withTimeout never clears its 5s timer, which would keep Jest alive after the run.
jest.mock('@/utils/timeout', () => ({ withDBTimeout: <T>(promise: Promise<T>) => promise }));
jest.mock('@/models/application.model', () => ({
  __esModule: true,
  APPLICATION_STATUSES: jest.requireActual<typeof import('@/models/application.model')>('@/models/application.model').APPLICATION_STATUSES,
  default: { findOne: jest.fn() },
}));
jest.mock('@/candidate_profile/BaseService', () => ({
  createCrudService: () => ({
    handlerGet: jest.fn(),
    handlerDelete: jest.fn(),
    handlerCreate: (...args: unknown[]) => mockCrudCreate(...args),
    handlerUpdate: (...args: unknown[]) => mockCrudUpdate(...args),
  }),
}));

const candidateId = '64b7f0c2a1b2c3d4e5f60718';
const ownProfileId = '64b7f0c2a1b2c3d4e5f60799';
const application = { _id: null, company: 'Acme', position: 'Dev', appliedDate: 1760000000000, status: 'applied', candidateId };
const profileExists = jest.mocked(ProfileModel).exists;
const applicationFindOne = jest.mocked(ApplicationModel).findOne;
const mockCurrentStatus = (status: string | null) => {
  const lean = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(status === null ? null : { status }) });
  applicationFindOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean }) } as never);
};

describe('schemaApplication profileId', () => {
  it.each([ownProfileId, null, ''])('accepts %p', (profileId) => {
    expect(schemaApplication.validate({ ...application, profileId }).error).toBeUndefined();
  });

  it('still accepts an application without profileId', () => {
    expect(schemaApplication.validate(application).error).toBeUndefined();
  });

  it.each(['abc', `${ownProfileId}0`, '$ne', 42, { $ne: null }, [ownProfileId]])('rejects %p', (profileId) => {
    expect(schemaApplication.validate({ ...application, profileId }).error).toBeDefined();
  });
});

describe('schemaApplication jobLink', () => {
  it.each(['', 'http://acme.com/jobs/1', 'https://acme.com/jobs?id=1'])('accepts %p', (jobLink) => {
    expect(schemaApplication.validate({ ...application, jobLink }).error).toBeUndefined();
  });

  it.each(['acme.com/jobs', 'ftp://acme.com/jobs', 'javascript:alert(1)', `https://acme.com/${'a'.repeat(500)}`])('rejects %p', (jobLink) => {
    expect(schemaApplication.validate({ ...application, jobLink }).error).toBeDefined();
  });
});

describe('application.service profile link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentStatus('applied');
    mockCrudCreate.mockResolvedValue({ success: true, data: [] });
    mockCrudUpdate.mockResolvedValue({ success: true, data: {} });
  });

  it('stores an id that is a non-deleted profile of the same candidate', async () => {
    profileExists.mockResolvedValue({ _id: ownProfileId } as never);

    const result = await handlerCreate({ ...application, profileId: ownProfileId }, 'en');

    expect(profileExists).toHaveBeenCalledWith({ _id: ownProfileId, candidateId, deletedAt: null });
    expect(mockCrudCreate).toHaveBeenCalledWith({ ...application, profileId: ownProfileId }, 'en');
    expect(result.success).toBe(true);
  });

  it.each([
    ['create', () => handlerCreate({ ...application, profileId: ownProfileId }, 'en')],
    ['update', () => handlerUpdate({ item: { ...application, _id: 'a1', profileId: ownProfileId }, userID: candidateId, lang: 'en' })],
  ])('rejects a foreign, deleted or missing profile with 400 on %s, writing nothing', async (_label, run) => {
    profileExists.mockResolvedValue(null);

    await expect(run()).rejects.toMatchObject({ statusCode: 400, errorCode: 'BAD_REQUEST', message: 'The selected CV profile does not exist or has been deleted' });
    expect(mockCrudCreate).not.toHaveBeenCalled();
    expect(mockCrudUpdate).not.toHaveBeenCalled();
  });

  it('never queries Profile when the candidate id is rejected by QuerySafe', async () => {
    await expect(handlerCreate({ ...application, candidateId: '$where', profileId: ownProfileId }, 'en')).rejects.toMatchObject({ statusCode: 400 });

    expect(profileExists).not.toHaveBeenCalled();
  });

  it("unlinks on null or '' without a Profile lookup", async () => {
    await handlerUpdate({ item: { _id: 'a1', candidateId, profileId: '' }, userID: candidateId });
    await handlerUpdate({ item: { _id: 'a1', candidateId, profileId: null }, userID: candidateId });

    expect(profileExists).not.toHaveBeenCalled();
    expect(mockCrudUpdate.mock.calls.map(([props]) => (props as { item: Record<string, unknown> }).item['profileId'])).toEqual([null, null]);
  });

  it('leaves the link untouched when an update omits profileId', async () => {
    await handlerUpdate({ item: { _id: 'a1', candidateId, note: 'x' }, userID: candidateId, lang: 'vi' });

    expect(profileExists).not.toHaveBeenCalled();
    expect(mockCrudUpdate).toHaveBeenCalledWith({ item: { _id: 'a1', candidateId, note: 'x' }, userID: candidateId, lang: 'vi' });
  });
});

describe('POST /application/create with an unowned profile', () => {
  it('answers 400 rather than the 201 used for a successful create', async () => {
    profileExists.mockResolvedValue(null);
    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };
    const req = { body: { ...application, profileId: ownProfileId }, lang: 'en' };

    const next = jest.fn();
    await fnCreate(req as never, res as never, next);
    errorsMiddleware(next.mock.calls[0][0], req as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'The selected CV profile does not exist or has been deleted' }) }));
  });
});

describe('POST /application/create with a non-http(s) jobLink', () => {
  it('answers 400 with jobLink in details', async () => {
    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };
    const req = { body: { ...application, jobLink: 'ftp://acme.com/jobs' }, lang: 'en' };

    await fnCreate(req as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: expect.objectContaining({ details: [expect.objectContaining({ field: 'jobLink' })] }) }));
    expect(mockCrudCreate).not.toHaveBeenCalled();
  });
});

describe('isStatusTransitionAllowed', () => {
  it.each([
    ['applied', 'applied'],
    ['applied', 'interview'],
    ['applied', 'offer'],
    ['interview', 'offer'],
    ['offer', 'accepted'],
    ['applied', 'rejected'],
    ['interview', 'rejected'],
    ['offer', 'rejected'],
    ['accepted', 'accepted'],
    ['rejected', 'rejected'],
  ])('allows %s → %s', (from, to) => {
    expect(isStatusTransitionAllowed(from, to)).toBe(true);
  });

  it.each([
    ['interview', 'applied'],
    ['offer', 'applied'],
    ['offer', 'interview'],
    ['applied', 'accepted'],
    ['interview', 'accepted'],
    ['accepted', 'rejected'],
    ['accepted', 'offer'],
    ['rejected', 'applied'],
    ['rejected', 'accepted'],
  ])('rejects %s → %s', (from, to) => {
    expect(isStatusTransitionAllowed(from, to)).toBe(false);
  });
});

describe('schemaApplication status', () => {
  it.each(['applied', 'interview', 'offer', 'accepted', 'rejected'])('accepts %p on create', (status) => {
    expect(schemaApplication.validate({ ...application, status }).error).toBeUndefined();
  });
});

describe('application.service status transitions', () => {
  const update = (item: Record<string, unknown>, lang = 'en') => handlerUpdate({ item: { _id: '64b7f0c2a1b2c3d4e5f607aa', candidateId, ...item }, userID: candidateId, lang });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCrudCreate.mockResolvedValue({ success: true, data: [] });
    mockCrudUpdate.mockResolvedValue({ success: true, data: {} });
  });

  it('creates at any status without reading the stored one', async () => {
    await handlerCreate({ ...application, status: 'accepted' }, 'en');

    expect(applicationFindOne).not.toHaveBeenCalled();
    expect(mockCrudCreate).toHaveBeenCalledTimes(1);
  });

  it('reads the current status scoped to the caller and non-deleted rows, then updates', async () => {
    mockCurrentStatus('applied');

    await update({ status: 'offer' });

    expect(applicationFindOne).toHaveBeenCalledWith({ _id: '64b7f0c2a1b2c3d4e5f607aa', candidateId, deletedAt: null });
    expect(mockCrudUpdate).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['offer', 'applied', 'en', 'This status change is not allowed: a status can only move forward, and accepted or rejected is final'],
    ['rejected', 'applied', 'vi', 'Không thể đổi sang trạng thái này: trạng thái chỉ được tiến lên, và accepted hoặc rejected là trạng thái cuối'],
  ])('answers 400 for %s → %s (%s) and writes nothing', async (from, to, lang, message) => {
    mockCurrentStatus(from);

    await expect(update({ status: to }, lang)).rejects.toMatchObject({ statusCode: 400, errorCode: 'BAD_REQUEST', message });
    expect(mockCrudUpdate).not.toHaveBeenCalled();
  });

  it('skips the check when the update has no status', async () => {
    await update({ note: 'x' });

    expect(applicationFindOne).not.toHaveBeenCalled();
    expect(mockCrudUpdate).toHaveBeenCalledTimes(1);
  });

  it('leaves a missing, deleted or foreign id to the base update (404/403)', async () => {
    mockCurrentStatus(null);

    await update({ status: 'applied' });

    expect(mockCrudUpdate).toHaveBeenCalledTimes(1);
  });
});

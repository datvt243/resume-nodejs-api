/**
 * Tests for linking an application to a CV profile: the `profileId` shape
 * accepted by schemaApplication, the ownership check in
 * application.service.ts (generic CRUD is mocked — covered elsewhere), and
 * that a rejected link surfaces as a 400 through the shared controller.
 */

import ProfileModel from '@/models/profile.model';
import { schemaApplication } from '@/candidate_profile/application/application.validate';
import { handlerCreate, handlerUpdate } from '@/candidate_profile/application/application.service';
import { fnCreate } from '@/candidate_profile/application/application.controller';

const mockCrudCreate = jest.fn();
const mockCrudUpdate = jest.fn();

jest.mock('@/models/profile.model', () => ({ exists: jest.fn() }));
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

describe('application.service profile link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    const result = await run();

    expect(result).toEqual({ success: false, statusCode: 400, message: 'The selected CV profile does not exist or has been deleted' });
    expect(mockCrudCreate).not.toHaveBeenCalled();
    expect(mockCrudUpdate).not.toHaveBeenCalled();
  });

  it('never queries Profile when the candidate id is rejected by QuerySafe', async () => {
    const result = await handlerCreate({ ...application, candidateId: '$where', profileId: ownProfileId }, 'en');

    expect(profileExists).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
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

    await fnCreate(req as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'The selected CV profile does not exist or has been deleted' }));
  });
});

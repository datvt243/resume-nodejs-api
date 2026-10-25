/**
 * Exercises createCrudService's real handlerCreate (BaseService.ts) through
 * the real, unmocked services/index.ts baseCreateDocument — the code path
 * every CV section's POST .../create uses. Only the Mongoose model is faked.
 * The response's `data` must be the one created document with its real id,
 * never null and never the candidate's whole list.
 */
import { Types, type Model } from 'mongoose';
import { createCrudService } from '@/candidate_profile/BaseService';
import { handlerCreate as generalInformationCreate } from '@/candidate_profile/general_information/generalInformation.service';
import GeneralInformation from '@/models/generalInformation.model';
import Award from '@/models/award.model';
import { baseCreateDocument, CrudDocument } from '@/services';

// createCrudService is generic over a real `Model<T>` — this fake only
// implements the methods it actually calls, so it's cast through `unknown`.
function createFakeModel() {
  const docs: Record<string, any>[] = [];
  return {
    docs,
    validate: jest.fn().mockResolvedValue(undefined),
    create: jest.fn((doc: Record<string, any>) => {
      docs.push(doc);
      return Promise.resolve(doc);
    }),
    find: jest.fn((query: Record<string, any>) => ({
      exec: jest.fn().mockResolvedValue(docs.filter((d) => d['candidateId'] === query['candidateId'])),
    })),
  };
}

describe('createCrudService handlerCreate', () => {
  it.each(['education', 'award'])('%s: returns the created document (not a list) with its persisted _id, also on a second create', async (name) => {
    const model = createFakeModel();
    const { handlerCreate } = createCrudService({ model: model as unknown as Model<CrudDocument>, name });

    await handlerCreate({ candidateId: 'c1', name: 'first' });
    const result: any = await handlerCreate({ candidateId: 'c1', name: 'second' });

    expect(Array.isArray(result.data)).toBe(false);
    expect(result.data.name).toBe('second');
    expect(result.data._id).toBeInstanceOf(Types.ObjectId);
    expect(result.data._id).toBe(model.docs[1]?.['_id']);
    expect(model.find).not.toHaveBeenCalled();
  });
});

describe('generalInformation handlerCreate', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns the created document, not a one-item array', async () => {
    const created = { _id: new Types.ObjectId(), candidateId: 'c1' };
    jest.spyOn(GeneralInformation, 'findOne').mockReturnValue({ exec: jest.fn().mockResolvedValue(null) } as any);
    jest.spyOn(GeneralInformation, 'validate').mockResolvedValue(undefined);
    jest.spyOn(GeneralInformation, 'create').mockResolvedValue(created as any);

    const result: any = await generalInformationCreate({ candidateId: 'c1' });

    expect(result.data).toBe(created);
  });
});

describe('baseCreateDocument with a real CV-section model', () => {
  afterEach(() => jest.restoreAllMocks());

  it('the Mongoose document create() builds carries a real ObjectId, not null', async () => {
    // Stand-in for the DB round-trip: build the real Mongoose document from what create() receives.
    jest.spyOn(Award, 'validate').mockResolvedValue(undefined);
    jest.spyOn(Award, 'create').mockImplementation(((doc: Record<string, unknown>) => Promise.resolve(new Award(doc))) as any);

    const result: any = await baseCreateDocument({
      document: { candidateId: new Types.ObjectId().toString(), name: 'Award' },
      model: Award as unknown as Model<CrudDocument>,
      name: 'award',
    });

    expect(result.data._id).toBeInstanceOf(Types.ObjectId);
  });
});

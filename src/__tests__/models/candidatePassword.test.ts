import CandidateModel from '@/models/candidate.model';

describe('Candidate password', () => {
  afterEach(() => jest.restoreAllMocks());

  it('is excluded from a plain findById() unless selected with +password', async () => {
    const findOne = jest.spyOn(CandidateModel.collection, 'findOne').mockResolvedValue(null);

    await CandidateModel.findById('507f1f77bcf86cd799439011').exec();
    expect(findOne.mock.calls[0]?.[1]).toMatchObject({ projection: { password: 0 } });

    await CandidateModel.findById('507f1f77bcf86cd799439011').select('+password').exec();
    expect(findOne.mock.calls[1]?.[1]?.projection ?? {}).not.toHaveProperty('password', 0);
  });
});

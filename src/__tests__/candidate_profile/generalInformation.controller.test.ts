/**
 * generalInformation has its own controller (not createCrudController), so
 * its create/update status codes are checked here: a failed create is never
 * 2xx and a validation failure is 400, never 401.
 */

import { fnCreate, fnUpdate, fnUpdateFields } from '@/candidate_profile/general_information/generalInformation.controller';
import { handlerCreate, handlerUpdate } from '@/candidate_profile/general_information/generalInformation.service';

jest.mock('@/candidate_profile/general_information/generalInformation.service');

const createMocks = (body: Record<string, unknown>, method = 'PUT') => {
  const req: any = { body, method, user: { _id: 'user-1' }, lang: 'en' };
  const json = jest.fn();
  const res: any = { status: jest.fn().mockReturnValue({ json }) };
  return { req, res, json };
};

describe('generalInformation controller status codes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('a failed create answers 400, never 201', async () => {
    jest.mocked(handlerCreate).mockResolvedValue({ success: false, message: 'Create failed', errors: null });
    const valid = {
      _id: '507f1f77bcf86cd799439012',
      positionDesired: 'Developer',
      career: { vi: 'Phần mềm', en: 'Software' },
      levelCurrent: 'Senior',
      levelDesired: 'Lead',
      salaryDesired: 1000,
      education: 'University',
      workLocation: 'Hanoi',
      workForm: 'Remote',
      careerGoal: { vi: 'Phát triển', en: 'Grow' },
      yearsOfExperience: 2,
      candidateId: '507f1f77bcf86cd799439011',
    };
    const { req, res, json } = createMocks(valid);

    await fnCreate(req, res, jest.fn());

    expect(handlerCreate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0][0]).toMatchObject({ success: false });
  });

  it.each([
    ['PUT /update', fnUpdate, {}, 'PUT'],
    ['PATCH /update', fnUpdateFields, { socialMedia: 'x' }, 'PATCH'],
  ])('%s validation failure answers 400, not 401', async (_label, handler, body, method) => {
    const { req, res, json } = createMocks(body, method);

    await handler(req, res, jest.fn());

    expect(handlerUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0][0]).toMatchObject({ success: false });
  });
});

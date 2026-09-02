/**
 * Tests for candidate_profile/BaseController.ts's baseGetAll — specifically
 * the page/limit/sort query-string parsing added for issue #73.
 */
import { baseGetAll } from '@/candidate_profile/BaseController';
import * as services from '@/services';

jest.mock('@/services');

const mockedBaseFindDocument = services.baseFindDocument as jest.MockedFunction<typeof services.baseFindDocument>;

function createMocks(query: Record<string, any> = {}) {
  const req: any = { body: { candidateId: 'c1', collection: 'experiences' }, query };
  const json = jest.fn();
  const res: any = { status: jest.fn().mockReturnValue({ json }), json };
  const next = jest.fn();
  return { req, res, next };
}

describe('baseGetAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBaseFindDocument.mockResolvedValue({ success: true, message: '', errors: null, data: [] });
  });

  it('passes page/limit/sort through as numbers/string when present', async () => {
    const { req, res, next } = createMocks({ page: '2', limit: '10', sort: '-createdAt' });
    await baseGetAll(req, res, next);

    expect(mockedBaseFindDocument).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10, sort: '-createdAt' }),
    );
  });

  it('omits page/limit/sort when the query string has none (backward compatible)', async () => {
    const { req, res, next } = createMocks();
    await baseGetAll(req, res, next);

    expect(mockedBaseFindDocument).toHaveBeenCalledWith(
      expect.objectContaining({ page: undefined, limit: undefined, sort: undefined }),
    );
  });

  it('silently drops a sort value that could smuggle a Mongo operator', async () => {
    const { req, res, next } = createMocks({ sort: '$where' });
    await baseGetAll(req, res, next);

    expect(mockedBaseFindDocument).toHaveBeenCalledWith(expect.objectContaining({ sort: undefined }));
  });

  it('accepts a leading "-" in sort for descending order', async () => {
    const { req, res, next } = createMocks({ sort: '-startDate' });
    await baseGetAll(req, res, next);

    expect(mockedBaseFindDocument).toHaveBeenCalledWith(expect.objectContaining({ sort: '-startDate' }));
  });
});

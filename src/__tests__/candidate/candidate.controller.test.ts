/**
 * Tests for candidate.controller.ts's fnParseLinkedInExport (issue #141) --
 * the only new controller logic added by this node (missing-file / invalid-
 * zip branches). The rest of candidate.controller.ts is thin wiring already
 * covered indirectly elsewhere, same precedent as every other controller
 * in this codebase (not unit-tested per-function).
 */

import { StatusCodes } from 'http-status-codes';
import { fnParseLinkedInExport } from '@/candidate/candidate.controller';
import * as parseService from '@/candidate/parseLinkedInExport.service';

jest.mock('@/candidate/parseLinkedInExport.service', () => ({
  parseLinkedInExportZip: jest.fn(),
}));

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('fnParseLinkedInExport (issue #141)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when no file was uploaded', async () => {
    const req: any = { lang: 'en' };
    const res = mockRes();
    const next = jest.fn();

    await fnParseLinkedInExport(req, res, next);

    expect(parseService.parseLinkedInExportZip).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'No file was uploaded' }));
  });

  it('returns the parsed educations/experiences on success, never persisting anything', async () => {
    const parsed = { educations: [{ school: 'Some Uni' }], experiences: [] };
    (parseService.parseLinkedInExportZip as jest.Mock).mockReturnValue(parsed);

    const req: any = { file: { buffer: Buffer.from('zip-bytes') }, lang: 'en' };
    const res = mockRes();
    const next = jest.fn();

    await fnParseLinkedInExport(req, res, next);

    expect(parseService.parseLinkedInExportZip).toHaveBeenCalledWith(req.file.buffer);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: parsed }));
  });

  it('returns 400 invalidZip when the service rejects a corrupt zip', async () => {
    (parseService.parseLinkedInExportZip as jest.Mock).mockImplementation(() => {
      throw new Error('INVALID_ZIP');
    });

    const req: any = { file: { buffer: Buffer.from('not a zip') }, lang: 'en' };
    const res = mockRes();
    const next = jest.fn();

    await fnParseLinkedInExport(req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'The ZIP file is invalid or corrupted' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards an unexpected (non-INVALID_ZIP) error to the global error handler instead of swallowing it', async () => {
    const boom = new Error('disk on fire');
    (parseService.parseLinkedInExportZip as jest.Mock).mockImplementation(() => {
      throw boom;
    });

    const req: any = { file: { buffer: Buffer.from('zip-bytes') }, lang: 'en' };
    const res = mockRes();
    const next = jest.fn();

    await fnParseLinkedInExport(req, res, next);

    // handleError wraps a plain, unrecognized Error into a 500 AppError
    // (see utils/helper.ts) rather than passing it through unchanged --
    // this must go through that path, not get swallowed/formatReturn'd
    // as a 400 the way INVALID_ZIP does above.
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    const forwarded = next.mock.calls[0][0];
    expect(forwarded).toBeInstanceOf(Error);
    expect(forwarded.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(forwarded.message).toBe('disk on fire');
  });
});

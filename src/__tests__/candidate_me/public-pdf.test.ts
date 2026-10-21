/**
 * Tests for candidate_me/public-pdf.ts — the unauthenticated ATS PDF
 * download. Data lookup and the Puppeteer render are mocked; the real
 * render path is covered by atsPdfIntegration.test.ts.
 */

import { StatusCodes } from 'http-status-codes';
import { clearPublicPdfCache, fnDownloadPublicPdf, PUBLIC_PDF_CACHE_MAX_ENTRIES, PUBLIC_PDF_CACHE_TTL_MS } from '@/candidate_me/public-pdf';
import { errorsMiddleware } from '@/middlewares/errors.middleware';
import { NotFoundError } from '@/errors';

const mockGetAboutMe = jest.fn();
const mockRenderAts = jest.fn();

jest.mock('@/candidate_me/index', () => ({
  handlerGetAboutMe: (...args: unknown[]) => mockGetAboutMe(...args),
  profileNotFound: (lang?: string) => new (jest.requireActual('@/errors').NotFoundError)(jest.requireActual('@/utils/i18n').t('publicProfile.notFound', lang)),
}));
jest.mock('@/services/createPDF.ats', () => ({
  ...jest.requireActual('@/services/createPDF.ats'),
  renderAtsPdfBuffer: (...args: unknown[]) => mockRenderAts(...args),
}));

const publicData = (overrides: Record<string, unknown> = {}) => ({ email: 'votan.it@gmail.com', firstName: 'Đạt', lastName: 'Võ', isPublic: true, ...overrides });
const rendered = { buffer: Buffer.from('%PDF-1.7 fake'), content: { fullName: 'Võ Tấn', headline: 'Frontend Developer', email: 'votan.it@gmail.com' } };

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.contentType = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const download = async (params: Record<string, string>, query: Record<string, unknown> = {}) => {
  const res = mockRes();
  const next = jest.fn();
  const req = { params, query, lang: 'vi' } as any;
  await fnDownloadPublicPdf(req, res, next);
  // Errors are written by errorsMiddleware, so run it to see the real response.
  if (next.mock.calls[0]) errorsMiddleware(next.mock.calls[0][0], req, res, jest.fn());
  return { res, next };
};

describe('fnDownloadPublicPdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    clearPublicPdfCache();
    mockGetAboutMe.mockResolvedValue({ success: true, data: publicData() });
    mockRenderAts.mockResolvedValue(rendered);
  });

  it('sends the ATS PDF as an attachment, resolving the identifier with lang and profile', async () => {
    const { res } = await download({ identifier: 'dat-vo' }, { template: 'ats', lang: 'en', profile: '64b7f0c2a1b2c3d4e5f60718' });

    expect(mockGetAboutMe).toHaveBeenCalledWith({ identifier: 'dat-vo', lang: 'en', profileId: '64b7f0c2a1b2c3d4e5f60718' });
    expect(mockRenderAts).toHaveBeenCalledWith(publicData(), { lang: 'en' });
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="Vo_Tan_Frontend_Developer_CV.pdf"');
    expect(res.contentType).toHaveBeenCalledWith('application/pdf');
    expect(res.send).toHaveBeenCalledWith(rendered.buffer);
  });

  it('defaults to the ats template and vi', async () => {
    await download({ identifier: 'dat-vo' });

    expect(mockRenderAts).toHaveBeenCalledWith(publicData(), { lang: 'vi' });
  });

  it('answers a private profile exactly like an unknown identifier, without rendering', async () => {
    mockGetAboutMe.mockRejectedValueOnce(new NotFoundError('Email không tồn tại'));
    const unknown = await download({ identifier: 'nobody' });
    mockGetAboutMe.mockResolvedValueOnce({ success: true, data: publicData({ isPublic: false }) });
    const privateProfile = await download({ identifier: 'dat-vo' });

    expect(privateProfile.res.status.mock.calls).toEqual(unknown.res.status.mock.calls);
    expect(privateProfile.res.json.mock.calls).toEqual(unknown.res.json.mock.calls);
    expect(unknown.res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(unknown.res.json.mock.calls[0][0]).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
    expect(privateProfile.res.send).not.toHaveBeenCalled();
    expect(mockRenderAts).not.toHaveBeenCalled();
  });

  it.each([['classic'], ['modern'], [['ats', 'classic']]])('rejects template=%p with 400 before any lookup', async (template) => {
    const { res } = await download({ identifier: 'dat-vo' }, { template });

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(mockGetAboutMe).not.toHaveBeenCalled();
    expect(mockRenderAts).not.toHaveBeenCalled();
  });

  it('serves a repeat request for unchanged data from the cache', async () => {
    await download({ identifier: 'dat-vo' });
    const { res } = await download({ identifier: 'votan.it@gmail.com' });

    expect(mockRenderAts).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(rendered.buffer);
  });

  it('renders again when the CV data or the language changes', async () => {
    await download({ identifier: 'dat-vo' });
    mockGetAboutMe.mockResolvedValue({ success: true, data: publicData({ firstName: 'Tấn Đạt' }) });
    await download({ identifier: 'dat-vo' });
    await download({ identifier: 'dat-vo' }, { lang: 'en' });

    expect(mockRenderAts).toHaveBeenCalledTimes(3);
  });

  it('shares one render between concurrent identical requests', async () => {
    let resolveRender: (value: typeof rendered) => void = () => undefined;
    mockRenderAts.mockReturnValueOnce(new Promise((resolve) => (resolveRender = resolve)));

    const first = download({ identifier: 'dat-vo' });
    const second = download({ identifier: 'dat-vo' });
    await new Promise((resolve) => setImmediate(resolve));
    resolveRender(rendered);
    const [a, b] = await Promise.all([first, second]);

    expect(mockRenderAts).toHaveBeenCalledTimes(1);
    expect(a.res.send).toHaveBeenCalledWith(rendered.buffer);
    expect(b.res.send).toHaveBeenCalledWith(rendered.buffer);
  });

  it('renders again once the TTL has passed', async () => {
    jest.useFakeTimers({ now: Date.UTC(2026, 9, 10) });
    await download({ identifier: 'dat-vo' });
    jest.setSystemTime(Date.UTC(2026, 9, 10) + PUBLIC_PDF_CACHE_TTL_MS + 1);
    await download({ identifier: 'dat-vo' });

    expect(mockRenderAts).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failed render', async () => {
    mockRenderAts.mockRejectedValueOnce(new Error('chromium crashed'));
    const failed = await download({ identifier: 'dat-vo' });
    const retried = await download({ identifier: 'dat-vo' });

    expect(failed.next).toHaveBeenCalled();
    expect(mockRenderAts).toHaveBeenCalledTimes(2);
    expect(retried.res.send).toHaveBeenCalledWith(rendered.buffer);
  });

  it('evicts the oldest entry once the cache is full', async () => {
    for (let i = 0; i <= PUBLIC_PDF_CACHE_MAX_ENTRIES; i++) {
      mockGetAboutMe.mockResolvedValueOnce({ success: true, data: publicData({ firstName: `n${i}` }) });
      await download({ identifier: 'dat-vo' });
    }
    mockGetAboutMe.mockResolvedValueOnce({ success: true, data: publicData({ firstName: `n${PUBLIC_PDF_CACHE_MAX_ENTRIES}` }) });
    await download({ identifier: 'dat-vo' });
    mockGetAboutMe.mockResolvedValueOnce({ success: true, data: publicData({ firstName: 'n0' }) });
    await download({ identifier: 'dat-vo' });

    // MAX + 1 distinct renders, newest is a hit, the evicted first one renders again.
    expect(mockRenderAts).toHaveBeenCalledTimes(PUBLIC_PDF_CACHE_MAX_ENTRIES + 2);
  });
});

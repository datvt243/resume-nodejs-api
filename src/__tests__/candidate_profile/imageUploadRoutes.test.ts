/**
 * Section image upload through the real award/certificate/project routers
 * over HTTP: ownership check, multer limits and response envelope together.
 * The models are spied on so no database is needed.
 */
import fs from 'fs';
import http from 'http';
import express from 'express';
import routeAward from '@/routers/api/v1/award.route';
import routeCertificate from '@/routers/api/v1/certificate.route';
import routeProject from '@/routers/api/v1/project.route';
import * as MODELS from '@/models';
import { IMAGE_UPLOAD_DIR } from '@/middlewares/uploadImages.middleware';
import { ErrorCode } from '@/errors';
import { t } from '@/utils/i18n';

const candidateId = 'owner-candidate';
const entryId = `test-img-routes-${process.pid}`;

describe.each([
  ['award', routeAward, MODELS.Award],
  ['certificate', routeCertificate, MODELS.Certificate],
  ['project', routeProject, MODELS.Project],
] as const)('POST /%s/:id/images', (section, router, model) => {
  let server: http.Server;
  let url: string;

  beforeAll((done) => {
    const app = express();
    // Stands in for verifyToken (covered by its own tests).
    app.use((req, _res, next) => {
      req.user = { _id: candidateId };
      next();
    });
    app.use(`/${section}`, router);
    server = app.listen(0, () => {
      const address = server.address();
      url = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/${section}/${entryId}/images`;
      done();
    });
  });

  const storedFiles = () => (fs.existsSync(IMAGE_UPLOAD_DIR) ? fs.readdirSync(IMAGE_UPLOAD_DIR).filter((name) => name.startsWith(`${entryId}-`)) : []);
  const cleanUp = () => storedFiles().forEach((name) => fs.rmSync(`${IMAGE_UPLOAD_DIR}/${name}`, { force: true }));

  beforeEach(() => {
    jest.restoreAllMocks();
    cleanUp();
  });

  afterAll((done) => {
    cleanUp();
    server.close(() => done());
  });

  const findReturns = (doc: unknown) => jest.spyOn(model, 'findById').mockResolvedValue(doc);
  const ownEntry = () => findReturns({ _id: entryId, candidateId, deletedAt: null, images: ['/uploads/images/old.png'] });
  const png = (name = 'photo.png', size = 10) => ({ body: Buffer.alloc(size, 'a'), type: 'image/png', name });
  const post = (files: { body: Buffer; type: string; name: string }[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('images', new Blob([f.body], { type: f.type }), f.name));
    if (!files.length) form.append('note', 'no file here');
    return fetch(url, { method: 'POST', body: form });
  };

  it('stores the images and answers 200 with existing + new URLs', async () => {
    ownEntry();
    const update = jest.spyOn(model, 'updateOne').mockResolvedValue({} as any);

    const res = await post([png('a.png'), png('b.jpg')]);

    expect(res.status).toBe(200);
    const { images } = (await res.json()).data;
    expect(images).toHaveLength(3);
    expect(images[0]).toBe('/uploads/images/old.png');
    expect(images[1]).toMatch(new RegExp(`^/uploads/images/${entryId}-\\d+-[0-9a-f]+\\.png$`));
    expect(images[2]).toMatch(/\.jpg$/);
    expect(storedFiles()).toHaveLength(2);
    expect(update).toHaveBeenCalledWith({ _id: entryId }, { images });
  });

  it.each([
    ['an unknown id', null],
    ['a soft-deleted entry', { _id: entryId, candidateId, deletedAt: 1000, images: [] }],
  ])('answers 404 for %s and writes nothing', async (_label, doc) => {
    findReturns(doc);
    const update = jest.spyOn(model, 'updateOne');

    const res = await post([png()]);

    expect(res.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
    expect(storedFiles()).toEqual([]);
  });

  it("answers 403 for another candidate's entry and writes nothing", async () => {
    findReturns({ _id: entryId, candidateId: 'someone-else', deletedAt: null, images: [] });
    const update = jest.spyOn(model, 'updateOne');

    const res = await post([png()]);

    expect(res.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
    expect(storedFiles()).toEqual([]);
  });

  it('answers 400 when the request carries no file', async () => {
    ownEntry();
    const update = jest.spyOn(model, 'updateOne');

    const res = await post([]);

    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toBe(t('images.noFilesUploaded'));
    expect(update).not.toHaveBeenCalled();
  });

  it('answers 400 for a file over 5MB', async () => {
    ownEntry();
    const update = jest.spyOn(model, 'updateOne');

    const res = await post([png('small.png'), png('big.png', 5 * 1024 * 1024 + 1)]);

    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toBe(t('images.fileTooLarge'));
    expect(update).not.toHaveBeenCalled();
    expect(storedFiles()).toEqual([]);
  });

  it('answers 400 for more than 5 files', async () => {
    ownEntry();
    const update = jest.spyOn(model, 'updateOne');

    const res = await post(Array.from({ length: 6 }, (_v, i) => png(`p${i}.png`)));

    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toBe(t('images.tooManyFiles'));
    expect(update).not.toHaveBeenCalled();
    expect(storedFiles()).toEqual([]);
  });

  it.each([
    ['a non-image mime type', { body: Buffer.from('a'), type: 'application/pdf', name: 'photo.png' }],
    ['a disallowed extension', { body: Buffer.from('a'), type: 'image/svg+xml', name: 'photo.svg' }],
  ])('answers 400 FILE_INVALID_TYPE for %s', async (_label, file) => {
    ownEntry();
    const update = jest.spyOn(model, 'updateOne');

    const res = await post([png('ok.png'), file]);

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe(ErrorCode.FILE_INVALID_TYPE);
    expect(update).not.toHaveBeenCalled();
    expect(storedFiles()).toEqual([]);
  });
});

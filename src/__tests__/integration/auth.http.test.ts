import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';

import { createApp } from '@/server';
import { isRedisAvailable } from '@/services/redis';
import { Candidate } from '@/models';
import Profile from '@/models/profile.model';
import { memStore } from '@/middlewares/rateLimit.middleware';
import { logger } from '@/logger';

jest.mock('@/logger');

const PASSWORD = 'Str0ng!Passw0rd';

let mongo: MongoMemoryServer;
let app: Express;

const register = (email: string) => request(app).post('/api/v1/auth/register').send({ email, password: PASSWORD, repassword: PASSWORD });

const login = async (email: string) => {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  return { token: res.body.data.token as string, tokenRefresh: res.body.data.tokenRefresh as string, cookies: res.headers['set-cookie'] as unknown as string[] };
};

const getProfiles = (token: string) => request(app).get('/api/v1/profile').set('Authorization', `Bearer ${token}`);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();

  // One user per flow, so one flow's logout or session revocation can't leak into another.
  const results = await Promise.all(['alice@example.com', 'bob@example.com', 'carol@example.com', 'dave@example.com', 'erin@example.com'].map(register));
  expect(results.map((r) => r.status)).toEqual([201, 201, 201, 201, 201]);
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

// Every request comes from 127.0.0.1, so without this the flows share one 10-request authLimiter bucket.
beforeEach(() => memStore.clear());

afterEach(() => jest.restoreAllMocks());

it('runs with Redis absent (in-memory blacklist/revocation fallback)', () => {
  expect(isRedisAvailable()).toBe(false);
});

it('register → login → authenticated GET → refresh → logout, then the logged-out token is rejected', async () => {
  const first = await login('alice@example.com');
  expect((await getProfiles(first.token)).status).toBe(200);

  const refreshed = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: first.tokenRefresh });
  expect(refreshed.status).toBe(200);
  const { token, tokenRefresh } = refreshed.body.data as { token: string; tokenRefresh: string };
  expect((await getProfiles(token)).status).toBe(200);

  const logout = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${token}`).send({ refreshToken: tokenRefresh });
  expect(logout.status).toBe(200);

  const after = await getProfiles(token);
  expect(after.status).toBe(401);
  expect(after.body.error.code).toBe('TOKEN_REVOKED');

  const refreshAfter = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: tokenRefresh });
  expect(refreshAfter.status).toBe(401);
  expect(refreshAfter.body.error.code).toBe('TOKEN_REVOKED');
});

it('reusing a rotated refresh token after the 10s grace window revokes every session', async () => {
  const session = await login('bob@example.com');
  const rotated = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: session.tokenRefresh });
  expect(rotated.status).toBe(200);
  const { token: newToken, tokenRefresh: newRefresh } = rotated.body.data as { token: string; tokenRefresh: string };

  const realNow = Date.now.bind(Date);
  jest.spyOn(Date, 'now').mockImplementation(() => realNow() + 11_000);

  const reuse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: session.tokenRefresh });
  expect(reuse.status).toBe(401);
  expect(reuse.body.error.code).toBe('TOKEN_REVOKED');

  // Both the original and the freshly rotated access token predate the revocation.
  expect((await getProfiles(session.token)).status).toBe(401);
  expect((await getProfiles(newToken)).status).toBe(401);

  const refreshWithRotated = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: newRefresh });
  expect(refreshWithRotated.status).toBe(401);
  expect(refreshWithRotated.body.error.code).toBe('TOKEN_REVOKED');
});

it('logging out one session leaves another session signed in the same second working', async () => {
  // Pin the clock only for the two logins, so both tokens get the same iat — the case where a jti-less payload would collide.
  const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.now());
  const phone = await login('erin@example.com');
  const laptop = await login('erin@example.com');
  clock.mockRestore();
  expect(laptop.token).not.toBe(phone.token);

  const logout = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${phone.token}`).send({ refreshToken: phone.tokenRefresh });
  expect(logout.status).toBe(200);

  expect((await getProfiles(phone.token)).status).toBe(401);
  expect((await getProfiles(laptop.token)).status).toBe(200);
});

it('rejects a cookie-only state-changing request without the CSRF header', async () => {
  const { cookies } = await login('carol@example.com');

  const res = await request(app).post('/api/v1/profile/create').set('Cookie', cookies).send({ _id: null, name: 'No CSRF' });
  expect(res.status).toBe(403);
  expect(res.body.error.code).toBe('CSRF_TOKEN_INVALID');
  expect(await Profile.countDocuments({ name: 'No CSRF' })).toBe(0);
});

it('ignores a client-supplied candidateId (IDOR)', async () => {
  const { token } = await login('dave@example.com');
  const dave = await Candidate.findOne({ email: 'dave@example.com' });
  const bob = await Candidate.findOne({ email: 'bob@example.com' });

  const res = await request(app)
    .post('/api/v1/profile/create')
    .set('Authorization', `Bearer ${token}`)
    .send({ _id: null, name: 'Spoofed owner', candidateId: String(bob?._id) });
  expect(res.status).toBe(201);

  const created = await Profile.findOne({ name: 'Spoofed owner' });
  expect(String(created?.candidateId)).toBe(String(dave?._id));
});

it('answers an unknown route with 404 in the standard error shape', async () => {
  const res = await request(app).get('/api/v1/does-not-exist');
  expect(res.status).toBe(404);
  expect(res.body).toEqual({ success: false, error: expect.objectContaining({ code: 'ROUTE_NOT_FOUND', message: expect.any(String) }) });
});

describe('account settings: change password / change email', () => {
  const NEW_PASSWORD = 'N3w!Passw0rdXyz';
  const authed = (path: string, token: string) => request(app).post(`/api/v1/auth/${path}`).set('Authorization', `Bearer ${token}`);

  it('rejects change-password and change-email without a token (401), confirm without a token (400)', async () => {
    expect((await request(app).post('/api/v1/auth/change-password').send({})).status).toBe(401);
    expect((await request(app).post('/api/v1/auth/change-email').send({})).status).toBe(401);
    expect((await request(app).get('/api/v1/auth/confirm-email-change')).status).toBe(400);
  });

  it('change-password logs other sessions out, keeps the caller signed in, and swaps the login password', async () => {
    expect((await register('frank@example.com')).status).toBe(201);
    const other = await login('frank@example.com');
    const caller = await login('frank@example.com');
    // Revocation is per whole second: move past the logins' iat so their tokens predate the change.
    const realNow = Date.now.bind(Date);
    jest.spyOn(Date, 'now').mockImplementation(() => realNow() + 2_000);

    expect((await authed('change-password', caller.token).send({ currentPassword: 'wrong', password: NEW_PASSWORD, repassword: NEW_PASSWORD })).status).toBe(400);
    const res = await authed('change-password', caller.token).send({ currentPassword: PASSWORD, password: NEW_PASSWORD, repassword: NEW_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringMatching(/^token=/), expect.stringMatching(/^refreshToken=/)]));

    expect((await getProfiles(other.token)).status).toBe(401);
    expect((await getProfiles(caller.token)).status).toBe(401);
    expect((await getProfiles(res.body.data.token)).status).toBe(200);
    expect((await request(app).post('/api/v1/auth/refresh').send({ refreshToken: other.tokenRefresh })).status).not.toBe(200);
    expect((await request(app).post('/api/v1/auth/refresh').send({ refreshToken: res.body.data.tokenRefresh })).status).toBe(200);

    expect((await request(app).post('/api/v1/auth/login').send({ email: 'frank@example.com', password: PASSWORD })).status).toBe(401);
    expect((await request(app).post('/api/v1/auth/login').send({ email: 'frank@example.com', password: NEW_PASSWORD })).status).toBe(200);
  });

  it('change-email only takes effect once the link sent to the new address is opened', async () => {
    expect((await register('gina@example.com')).status).toBe(201);
    const { token } = await login('gina@example.com');

    expect((await authed('change-email', token).send({ currentPassword: PASSWORD, email: 'alice@example.com' })).status).toBe(409);
    const res = await authed('change-email', token).send({ currentPassword: PASSWORD, email: 'Gina.New@example.com' });
    expect(res.status).toBe(200);
    expect(await Candidate.countDocuments({ email: 'gina@example.com' })).toBe(1);

    // Without SMTP configured, outside production the link is logged instead of sent.
    const logged = (logger.info as jest.Mock).mock.calls.map((call) => String(call[0])).find((line) => line.includes('confirmEmailChange link for gina.new@example.com'));
    const confirmToken = /token=([0-9a-f]{64})/.exec(logged ?? '')?.[1] ?? '';
    expect(confirmToken).toHaveLength(64);

    const confirm = await request(app).get('/api/v1/auth/confirm-email-change').query({ token: confirmToken });
    expect(confirm.status).toBe(200);
    expect(await Candidate.findOne({ email: 'gina.new@example.com' })).toMatchObject({ emailVerified: true });
    expect((await request(app).get('/api/v1/auth/confirm-email-change').query({ token: confirmToken })).status).toBe(400);

    // Sessions survive an email change; login moves to the new address.
    expect((await getProfiles(token)).status).toBe(200);
    expect((await request(app).post('/api/v1/auth/login').send({ email: 'gina@example.com', password: PASSWORD })).status).toBe(401);
    expect((await request(app).post('/api/v1/auth/login').send({ email: 'gina.new@example.com', password: PASSWORD })).status).toBe(200);
  });

  it('a password change cancels a pending email change', async () => {
    expect((await register('hank@example.com')).status).toBe(201);
    const { token } = await login('hank@example.com');
    expect((await authed('change-email', token).send({ currentPassword: PASSWORD, email: 'hank.new@example.com' })).status).toBe(200);
    const logged = (logger.info as jest.Mock).mock.calls.map((call) => String(call[0])).find((line) => line.includes('confirmEmailChange link for hank.new@example.com'));
    const confirmToken = /token=([0-9a-f]{64})/.exec(logged ?? '')?.[1] ?? '';

    const realNow = Date.now.bind(Date);
    jest.spyOn(Date, 'now').mockImplementation(() => realNow() + 2_000);
    expect((await authed('change-password', token).send({ currentPassword: PASSWORD, password: NEW_PASSWORD, repassword: NEW_PASSWORD })).status).toBe(200);

    expect((await request(app).get('/api/v1/auth/confirm-email-change').query({ token: confirmToken })).status).toBe(400);
    expect(await Candidate.countDocuments({ email: 'hank@example.com' })).toBe(1);
  });

  it('rate-limits change-password with the shared auth limiter (11th request → 429)', async () => {
    const { token } = await login('alice@example.com');
    memStore.clear();

    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push((await authed('change-password', token).send({ currentPassword: 'wrong', password: NEW_PASSWORD, repassword: NEW_PASSWORD })).status);
    expect(statuses.slice(0, 10).every((status) => status === 400)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});

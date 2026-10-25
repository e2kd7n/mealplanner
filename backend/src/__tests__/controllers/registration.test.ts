import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

vi.mock('../../utils/prisma', () => {
  const mockPrisma: any = {
    user: { count: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    mealPlan: { create: vi.fn() },
    authSession: { create: vi.fn() },
  };
  mockPrisma.$transaction = vi.fn((fn: (tx: any) => any) => fn(mockPrisma));
  return { default: mockPrisma, withRetry: vi.fn((fn: () => any) => fn()) };
});

vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(async () => 'hashed-pw'), compare: vi.fn() } }));

vi.mock('../../utils/jwt', () => ({
  generateTokenPair: vi.fn(() => ({ accessToken: 'a', refreshToken: 'r' })),
  verifyRefreshToken: vi.fn(),
}));

vi.mock('../../utils/authCookies', () => ({
  setAuthCookies: vi.fn(),
  clearAuthCookies: vi.fn(),
  getRefreshTokenFromRequest: vi.fn(),
  hashSessionToken: vi.fn(() => 'h'),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('../../utils/prometheus', () => ({ usersRegisteredTotal: { inc: vi.fn() } }));

vi.mock('../../utils/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import prisma from '../../utils/prisma';
import { setAuthCookies } from '../../utils/authCookies';
import { register } from '../../controllers/auth.controller';
import { createUser } from '../../controllers/admin.controller';

const VALID = { email: 'Kid@Example.com', password: 'Str0ng!Pass', familyName: 'Kid' };

function mockReqResNext(body: object, user?: object) {
  const req = { body, user, headers: {} } as unknown as Request;
  const json = vi.fn();
  const res = { json, status: vi.fn().mockReturnValue({ json }) } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next, json };
}

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findUnique as any).mockResolvedValue(null);
  (prisma.user.create as any).mockImplementation(async ({ data }: any) => ({ id: 'new-user', ...data }));
});

describe('register (public sign-up)', () => {
  it('creates the first account as admin on a fresh install', async () => {
    (prisma.user.count as any).mockResolvedValue(0);
    const { req, res, next } = mockReqResNext({ ...VALID });

    await register(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect((prisma.user.create as any).mock.calls[0][0].data.role).toBe('admin');
    expect(setAuthCookies).toHaveBeenCalled();
  });

  it('is closed once any account exists', async () => {
    (prisma.user.count as any).mockResolvedValue(1);
    const { req, res, next } = mockReqResNext({ ...VALID });

    await register(req, res, next);

    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(403);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(setAuthCookies).not.toHaveBeenCalled();
  });

  it('reports closed before revealing whether the email already has an account', async () => {
    (prisma.user.count as any).mockResolvedValue(1);
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'existing' });
    const { req, res, next } = mockReqResNext({ ...VALID });

    await register(req, res, next);

    expect((next as any).mock.calls[0][0].statusCode).toBe(403);
  });

  it('rejects a sign-up that loses the first-run race inside the transaction', async () => {
    // Early check sees an empty install; the serializable re-check doesn't.
    (prisma.user.count as any).mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    const { req, res, next } = mockReqResNext({ ...VALID });

    await register(req, res, next);

    expect((next as any).mock.calls[0][0].statusCode).toBe(403);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe('createUser (admin adds a household member)', () => {
  const admin = { userId: 'admin-1', role: 'admin' };

  it('creates a regular user without signing the admin in as them', async () => {
    const { req, res, next, json } = mockReqResNext({ ...VALID }, admin);

    await createUser(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    const data = (prisma.user.create as any).mock.calls[0][0].data;
    expect(data.role).toBe('user');
    expect(data.email).toBe('kid@example.com');
    expect(json.mock.calls[0][0].user).not.toHaveProperty('passwordHash');
    expect(setAuthCookies).not.toHaveBeenCalled();
    expect(prisma.mealPlan.create).toHaveBeenCalled();
  });

  it('rejects an email that already has an account', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'existing' });
    const { req, res, next } = mockReqResNext({ ...VALID }, admin);

    await createUser(req, res, next);

    expect((next as any).mock.calls[0][0].statusCode).toBe(409);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('applies the same password policy as sign-up', async () => {
    const { req, res, next } = mockReqResNext({ ...VALID, password: 'weakpassword' }, admin);

    await createUser(req, res, next);

    expect((next as any).mock.calls[0][0].statusCode).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  listUsers,
  getVisualChallenge,
  visualLogin,
  deviceLogin,
  deviceLogout,
  setupVisualPassword,
  setupStockVisualPassword,
  getVisualPasswordStatus,
  getStockImages,
  getVisualSetupImages,
} from '../../controllers/visualAuth.controller';

vi.mock('../../utils/prisma', () => {
  const mockPrisma = {
    familyMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    recipe: { findUnique: vi.fn(), findMany: vi.fn() },
    deviceToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    authSession: { create: vi.fn() },
  };
  return {
    default: mockPrisma,
    withRetry: vi.fn((fn: () => any) => fn()),
  };
});

vi.mock('../../utils/jwt', () => ({
  generateTokenPair: vi.fn(() => ({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  })),
}));

vi.mock('../../utils/authCookies', () => ({
  setAuthCookies: vi.fn(),
  clearAuthCookies: vi.fn(),
  hashSessionToken: vi.fn(() => 'hashed-refresh-token'),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('../../utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import prisma from '../../utils/prisma';

function mockReqResNext(overrides: Partial<Request> = {}): {
  req: Request;
  res: Response;
  next: NextFunction;
} {
  const req = {
    body: {},
    params: {},
    query: {},
    cookies: {},
    headers: { 'user-agent': 'test' },
    ...overrides,
  } as unknown as Request;

  const jsonFn = vi.fn();
  const statusFn = vi.fn().mockReturnValue({ json: jsonFn });
  const cookieFn = vi.fn();
  const clearCookieFn = vi.fn();
  const res = {
    json: jsonFn,
    status: statusFn,
    cookie: cookieFn,
    clearCookie: clearCookieFn,
  } as unknown as Response;

  const next = vi.fn();

  return { req, res, next };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── listUsers ────────────────────────────────────────────────────────────

describe('listUsers', () => {
  it('returns all family members', async () => {
    const members = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    (prisma.familyMember.findMany as any).mockResolvedValue(members);
    const { req, res, next } = mockReqResNext();

    await listUsers(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      users: [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('deduplicates members by normalized name', async () => {
    const members = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'alice' },
      { id: '3', name: ' Alice ' },
    ];
    (prisma.familyMember.findMany as any).mockResolvedValue(members);
    const { req, res, next } = mockReqResNext();

    await listUsers(req, res, next);

    const result = (res.json as any).mock.calls[0][0];
    expect(result.users).toHaveLength(1);
    expect(result.users[0].name).toBe('Alice');
  });

  it('returns empty array when no members exist', async () => {
    (prisma.familyMember.findMany as any).mockResolvedValue([]);
    const { req, res, next } = mockReqResNext();

    await listUsers(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ users: [] });
  });

  it('forwards DB errors to next()', async () => {
    const err = new Error('DB down');
    (prisma.familyMember.findMany as any).mockRejectedValue(err);
    const { req, res, next } = mockReqResNext();

    await listUsers(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ── getVisualChallenge ──────────────────────────────────────────────────

describe('getVisualChallenge', () => {
  it('returns stock image challenge when member has stock visual password', async () => {
    (prisma.familyMember.findUnique as any).mockResolvedValue({
      visualPasswordRecipeId: null,
      visualPasswordImageUrl: '/visual-login/burger.svg',
    });
    const { req, res, next } = mockReqResNext({ params: { userId: 'member-1' } } as any);

    await getVisualChallenge(req, res, next);

    const result = (res.json as any).mock.calls[0][0];
    expect(result.images).toHaveLength(4);
    const hasCorrect = result.images.some((img: any) => img.imageUrl === '/visual-login/burger.svg');
    expect(hasCorrect).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns recipe-based challenge when member has recipe visual password', async () => {
    (prisma.familyMember.findUnique as any).mockResolvedValue({
      visualPasswordRecipeId: 'recipe-1',
      visualPasswordImageUrl: null,
    });
    (prisma.recipe.findUnique as any).mockResolvedValue({
      id: 'recipe-1',
      title: 'Pasta',
      imageUrl: '/images/pasta.jpg',
    });
    (prisma.recipe.findMany as any).mockResolvedValue([
      { id: 'recipe-2', title: 'Salad', imageUrl: '/images/salad.jpg' },
      { id: 'recipe-3', title: 'Soup', imageUrl: '/images/soup.jpg' },
      { id: 'recipe-4', title: 'Pizza', imageUrl: '/images/pizza.jpg' },
    ]);
    const { req, res, next } = mockReqResNext({ params: { userId: 'member-1' } } as any);

    await getVisualChallenge(req, res, next);

    const result = (res.json as any).mock.calls[0][0];
    expect(result.images.length).toBeLessThanOrEqual(4);
    const hasCorrect = result.images.some((img: any) => img.id === 'recipe-1');
    expect(hasCorrect).toBe(true);
  });

  it('returns 404 for non-existent member', async () => {
    (prisma.familyMember.findUnique as any).mockResolvedValue(null);
    const { req, res, next } = mockReqResNext({ params: { userId: 'nonexistent' } } as any);

    await getVisualChallenge(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });

  it('returns 400 when no visual password is set', async () => {
    (prisma.familyMember.findUnique as any).mockResolvedValue({
      visualPasswordRecipeId: null,
      visualPasswordImageUrl: null,
    });
    const { req, res, next } = mockReqResNext({ params: { userId: 'member-1' } } as any);

    await getVisualChallenge(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('returns 500 when stock image URL no longer matches known images', async () => {
    (prisma.familyMember.findUnique as any).mockResolvedValue({
      visualPasswordRecipeId: null,
      visualPasswordImageUrl: '/visual-login/unknown.svg',
    });
    const { req, res, next } = mockReqResNext({ params: { userId: 'member-1' } } as any);

    await getVisualChallenge(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(500);
  });
});

// ── visualLogin ─────────────────────────────────────────────────────────

describe('visualLogin', () => {
  const mockUser = {
    id: 'user-1',
    email: 'admin@example.com',
    familyName: 'Test Family',
    role: 'admin',
    isBlocked: false,
  };

  it('succeeds with correct stock image selection', async () => {
    (prisma.familyMember.findUnique as any).mockResolvedValue({
      id: 'member-1',
      name: 'Tracy',
      userId: 'user-1',
      visualPasswordRecipeId: null,
      visualPasswordImageUrl: '/visual-login/burger.svg',
    });
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.deviceToken.create as any).mockResolvedValue({});
    (prisma.authSession.create as any).mockResolvedValue({});

    const { req, res, next } = mockReqResNext({
      body: { memberId: 'member-1', recipeId: 'stock-burger' },
    } as any);

    await visualLogin(req, res, next);

    const result = (res.json as any).mock.calls[0][0];
    expect(result.message).toBe('Visual login successful');
    expect(result.familyMemberId).toBe('member-1');
    expect(result.memberName).toBe('Tracy');
    expect(result.user.email).toBe('admin@example.com');
    expect(next).not.toHaveBeenCalled();
  });

  it('fails with wrong stock image selection', async () => {
    (prisma.familyMember.findUnique as any).mockResolvedValue({
      id: 'member-1',
      name: 'Tracy',
      userId: 'user-1',
      visualPasswordRecipeId: null,
      visualPasswordImageUrl: '/visual-login/burger.svg',
    });

    const { req, res, next } = mockReqResNext({
      body: { memberId: 'member-1', recipeId: 'stock-pizza' },
    } as any);

    await visualLogin(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('succeeds with correct recipe-based selection', async () => {
    (prisma.familyMember.findUnique as any).mockResolvedValue({
      id: 'member-1',
      name: 'Tracy',
      userId: 'user-1',
      visualPasswordRecipeId: 'recipe-1',
      visualPasswordImageUrl: null,
    });
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.deviceToken.create as any).mockResolvedValue({});
    (prisma.authSession.create as any).mockResolvedValue({});

    const { req, res, next } = mockReqResNext({
      body: { memberId: 'member-1', recipeId: 'recipe-1' },
    } as any);

    await visualLogin(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const result = (res.json as any).mock.calls[0][0];
    expect(result.message).toBe('Visual login successful');
  });

  it('rejects when member not found', async () => {
    (prisma.familyMember.findUnique as any).mockResolvedValue(null);
    const { req, res, next } = mockReqResNext({
      body: { memberId: 'bad-id', recipeId: 'stock-burger' },
    } as any);

    await visualLogin(req, res, next);

    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('rejects when user account is blocked', async () => {
    (prisma.familyMember.findUnique as any).mockResolvedValue({
      id: 'member-1',
      name: 'Tracy',
      userId: 'user-1',
      visualPasswordRecipeId: null,
      visualPasswordImageUrl: '/visual-login/burger.svg',
    });
    (prisma.user.findUnique as any).mockResolvedValue({ ...mockUser, isBlocked: true });

    const { req, res, next } = mockReqResNext({
      body: { memberId: 'member-1', recipeId: 'stock-burger' },
    } as any);

    await visualLogin(req, res, next);

    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(403);
  });

  it('returns 400 when memberId or recipeId missing', async () => {
    const { req, res, next } = mockReqResNext({
      body: { memberId: 'member-1' },
    } as any);

    await visualLogin(req, res, next);

    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('returns 400 when visual password not configured', async () => {
    (prisma.familyMember.findUnique as any).mockResolvedValue({
      id: 'member-1',
      name: 'Tracy',
      userId: 'user-1',
      visualPasswordRecipeId: null,
      visualPasswordImageUrl: null,
    });

    const { req, res, next } = mockReqResNext({
      body: { memberId: 'member-1', recipeId: 'stock-burger' },
    } as any);

    await visualLogin(req, res, next);

    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('creates device token with familyMemberId', async () => {
    (prisma.familyMember.findUnique as any).mockResolvedValue({
      id: 'member-1',
      name: 'Tracy',
      userId: 'user-1',
      visualPasswordRecipeId: null,
      visualPasswordImageUrl: '/visual-login/burger.svg',
    });
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.deviceToken.create as any).mockResolvedValue({});
    (prisma.authSession.create as any).mockResolvedValue({});

    const { req, res, next } = mockReqResNext({
      body: { memberId: 'member-1', recipeId: 'stock-burger' },
    } as any);

    await visualLogin(req, res, next);

    expect(prisma.deviceToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        familyMemberId: 'member-1',
      }),
    });
  });
});

// ── deviceLogin ─────────────────────────────────────────────────────────

describe('deviceLogin', () => {
  it('returns 401 when no device cookie present', async () => {
    const { req, res, next } = mockReqResNext({ cookies: {} } as any);

    await deviceLogin(req, res, next);

    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('returns 401 and clears cookie when token expired', async () => {
    const expired = new Date();
    expired.setDate(expired.getDate() - 1);
    (prisma.deviceToken.findUnique as any).mockResolvedValue({
      tokenHash: 'hash',
      expiresAt: expired,
      user: { id: 'user-1', email: 'a@b.com', familyName: 'Fam', role: 'admin', isBlocked: false },
      familyMember: null,
    });
    (prisma.deviceToken.delete as any).mockResolvedValue({});
    const { req, res, next } = mockReqResNext({ cookies: { mealplanner_device: 'some-token' } } as any);

    await deviceLogin(req, res, next);

    expect(res.clearCookie).toHaveBeenCalledWith('mealplanner_device');
    expect(prisma.deviceToken.delete).toHaveBeenCalled();
    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('succeeds with valid token and returns member info', async () => {
    const validExpiry = new Date();
    validExpiry.setDate(validExpiry.getDate() + 7);
    (prisma.deviceToken.findUnique as any).mockResolvedValue({
      tokenHash: 'hash',
      expiresAt: validExpiry,
      user: { id: 'user-1', email: 'a@b.com', familyName: 'Fam', role: 'admin', isBlocked: false },
      familyMember: { id: 'member-1', name: 'Tracy' },
    });
    (prisma.authSession.create as any).mockResolvedValue({});
    (prisma.deviceToken.update as any).mockResolvedValue({});

    const { req, res, next } = mockReqResNext({ cookies: { mealplanner_device: 'valid-token' } } as any);

    await deviceLogin(req, res, next);

    const result = (res.json as any).mock.calls[0][0];
    expect(result.message).toBe('Device login successful');
    expect(result.familyMemberId).toBe('member-1');
    expect(result.memberName).toBe('Tracy');
    expect(next).not.toHaveBeenCalled();
  });

  it('rotates device token on successful login', async () => {
    const validExpiry = new Date();
    validExpiry.setDate(validExpiry.getDate() + 7);
    (prisma.deviceToken.findUnique as any).mockResolvedValue({
      tokenHash: 'stored-hash',
      expiresAt: validExpiry,
      user: { id: 'user-1', email: 'a@b.com', familyName: 'Fam', role: 'admin', isBlocked: false },
      familyMember: null,
    });
    (prisma.authSession.create as any).mockResolvedValue({});
    (prisma.deviceToken.update as any).mockResolvedValue({});

    const { req, res, next } = mockReqResNext({ cookies: { mealplanner_device: 'valid-token' } } as any);

    await deviceLogin(req, res, next);

    expect(prisma.deviceToken.update).toHaveBeenCalledTimes(1);
    const updateCall = (prisma.deviceToken.update as any).mock.calls[0][0];
    expect(updateCall.data.tokenHash).toBeDefined();
    expect(updateCall.data.expiresAt).toBeInstanceOf(Date);
  });

  it('falls back to familyName when no familyMember', async () => {
    const validExpiry = new Date();
    validExpiry.setDate(validExpiry.getDate() + 7);
    (prisma.deviceToken.findUnique as any).mockResolvedValue({
      tokenHash: 'hash',
      expiresAt: validExpiry,
      user: { id: 'user-1', email: 'a@b.com', familyName: 'The Fam', role: 'admin', isBlocked: false },
      familyMember: null,
    });
    (prisma.authSession.create as any).mockResolvedValue({});
    (prisma.deviceToken.update as any).mockResolvedValue({});

    const { req, res, next } = mockReqResNext({ cookies: { mealplanner_device: 'valid-token' } } as any);

    await deviceLogin(req, res, next);

    const result = (res.json as any).mock.calls[0][0];
    expect(result.user.name).toBe('The Fam');
    expect(result.familyMemberId).toBeNull();
    expect(result.memberName).toBeNull();
  });

  it('rejects blocked user', async () => {
    const validExpiry = new Date();
    validExpiry.setDate(validExpiry.getDate() + 7);
    (prisma.deviceToken.findUnique as any).mockResolvedValue({
      tokenHash: 'hash',
      expiresAt: validExpiry,
      user: { id: 'user-1', email: 'a@b.com', familyName: 'Fam', role: 'admin', isBlocked: true },
      familyMember: null,
    });

    const { req, res, next } = mockReqResNext({ cookies: { mealplanner_device: 'valid-token' } } as any);

    await deviceLogin(req, res, next);

    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(403);
  });
});

// ── deviceLogout ────────────────────────────────────────────────────────

describe('deviceLogout', () => {
  it('clears cookies and deletes token from DB', async () => {
    (prisma.deviceToken.deleteMany as any).mockResolvedValue({ count: 1 });
    const { req, res, next } = mockReqResNext({ cookies: { mealplanner_device: 'token' } } as any);

    await deviceLogout(req, res, next);

    expect(prisma.deviceToken.deleteMany).toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('mealplanner_device');
    expect(res.json).toHaveBeenCalledWith({ message: 'Device logged out' });
  });

  it('still clears cookies when no device token present', async () => {
    const { req, res, next } = mockReqResNext({ cookies: {} } as any);

    await deviceLogout(req, res, next);

    expect(prisma.deviceToken.deleteMany).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('mealplanner_device');
    expect(res.json).toHaveBeenCalledWith({ message: 'Device logged out' });
  });

  it('does not fail if DB delete throws', async () => {
    (prisma.deviceToken.deleteMany as any).mockRejectedValue(new Error('DB error'));
    const { req, res, next } = mockReqResNext({ cookies: { mealplanner_device: 'token' } } as any);

    await deviceLogout(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ message: 'Device logged out' });
  });
});

// ── setupStockVisualPassword ────────────────────────────────────────────

describe('setupStockVisualPassword', () => {
  it('sets stock image for owned family member', async () => {
    (prisma.familyMember.findFirst as any).mockResolvedValue({ id: 'member-1', userId: 'user-1' });
    (prisma.familyMember.update as any).mockResolvedValue({});
    const { req, res, next } = mockReqResNext({
      body: { familyMemberId: 'member-1', imageUrl: '/visual-login/pizza.svg' },
    } as any);
    (req as any).user = { userId: 'user-1' };

    await setupStockVisualPassword(req, res, next);

    expect(prisma.familyMember.update).toHaveBeenCalledWith({
      where: { id: 'member-1' },
      data: { visualPasswordImageUrl: '/visual-login/pizza.svg', visualPasswordRecipeId: null },
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Visual password set' }));
  });

  it('rejects invalid stock image URL', async () => {
    const { req, res, next } = mockReqResNext({
      body: { familyMemberId: 'member-1', imageUrl: '/visual-login/HACKED.svg' },
    } as any);
    (req as any).user = { userId: 'user-1' };

    await setupStockVisualPassword(req, res, next);

    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('Invalid stock image');
  });

  it('rejects when family member belongs to another user', async () => {
    (prisma.familyMember.findFirst as any).mockResolvedValue(null);
    const { req, res, next } = mockReqResNext({
      body: { familyMemberId: 'member-1', imageUrl: '/visual-login/pizza.svg' },
    } as any);
    (req as any).user = { userId: 'other-user' };

    await setupStockVisualPassword(req, res, next);

    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });

  it('clears recipe-based visual password when setting stock image', async () => {
    (prisma.familyMember.findFirst as any).mockResolvedValue({ id: 'member-1', userId: 'user-1' });
    (prisma.familyMember.update as any).mockResolvedValue({});
    const { req, res, next } = mockReqResNext({
      body: { familyMemberId: 'member-1', imageUrl: '/visual-login/soup.svg' },
    } as any);
    (req as any).user = { userId: 'user-1' };

    await setupStockVisualPassword(req, res, next);

    expect(prisma.familyMember.update).toHaveBeenCalledWith({
      where: { id: 'member-1' },
      data: { visualPasswordImageUrl: '/visual-login/soup.svg', visualPasswordRecipeId: null },
    });
  });

  it('returns 400 when required fields missing', async () => {
    const { req, res, next } = mockReqResNext({ body: {} } as any);
    (req as any).user = { userId: 'user-1' };

    await setupStockVisualPassword(req, res, next);

    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });
});

// ── setupVisualPassword (recipe-based) ──────────────────────────────────

describe('setupVisualPassword', () => {
  it('sets recipe visual password for owned family member', async () => {
    (prisma.familyMember.findFirst as any).mockResolvedValue({ id: 'member-1', userId: 'user-1' });
    (prisma.recipe.findUnique as any).mockResolvedValue({
      id: 'recipe-1',
      title: 'Pasta',
      imageUrl: '/images/pasta.jpg',
    });
    (prisma.familyMember.update as any).mockResolvedValue({});
    const { req, res, next } = mockReqResNext({
      body: { familyMemberId: 'member-1', recipeId: 'recipe-1' },
    } as any);
    (req as any).user = { userId: 'user-1' };

    await setupVisualPassword(req, res, next);

    expect(prisma.familyMember.update).toHaveBeenCalledWith({
      where: { id: 'member-1' },
      data: { visualPasswordRecipeId: 'recipe-1' },
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Visual password set' }));
  });

  it('rejects recipe with no image', async () => {
    (prisma.familyMember.findFirst as any).mockResolvedValue({ id: 'member-1', userId: 'user-1' });
    (prisma.recipe.findUnique as any).mockResolvedValue({
      id: 'recipe-1',
      title: 'Pasta',
      imageUrl: null,
    });
    const { req, res, next } = mockReqResNext({
      body: { familyMemberId: 'member-1', recipeId: 'recipe-1' },
    } as any);
    (req as any).user = { userId: 'user-1' };

    await setupVisualPassword(req, res, next);

    const error = (next as any).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });
});

// ── getVisualPasswordStatus ─────────────────────────────────────────────

describe('getVisualPasswordStatus', () => {
  it('returns status for specific member', async () => {
    (prisma.familyMember.findFirst as any).mockResolvedValue({
      visualPasswordRecipeId: null,
      visualPasswordImageUrl: '/visual-login/burger.svg',
    });
    const { req, res, next } = mockReqResNext({ query: { familyMemberId: 'member-1' } } as any);
    (req as any).user = { userId: 'user-1' };

    await getVisualPasswordStatus(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ hasVisualPassword: true });
  });

  it('returns false when member has no visual password', async () => {
    (prisma.familyMember.findFirst as any).mockResolvedValue({
      visualPasswordRecipeId: null,
      visualPasswordImageUrl: null,
    });
    const { req, res, next } = mockReqResNext({ query: { familyMemberId: 'member-1' } } as any);
    (req as any).user = { userId: 'user-1' };

    await getVisualPasswordStatus(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ hasVisualPassword: false });
  });

  it('returns all members when no familyMemberId specified', async () => {
    (prisma.familyMember.findMany as any).mockResolvedValue([
      { id: 'member-1', name: 'Alice', visualPasswordRecipeId: null, visualPasswordImageUrl: '/visual-login/burger.svg' },
      { id: 'member-2', name: 'Bob', visualPasswordRecipeId: null, visualPasswordImageUrl: null },
    ]);
    const { req, res, next } = mockReqResNext({ query: {} } as any);
    (req as any).user = { userId: 'user-1' };

    await getVisualPasswordStatus(req, res, next);

    const result = (res.json as any).mock.calls[0][0];
    expect(result.members).toHaveLength(2);
    expect(result.members[0].hasVisualPassword).toBe(true);
    expect(result.members[1].hasVisualPassword).toBe(false);
  });
});

// ── getStockImages ──────────────────────────────────────────────────────

describe('getStockImages', () => {
  it('returns all 8 stock images', () => {
    const { req, res } = mockReqResNext();

    getStockImages(req, res);

    const result = (res.json as any).mock.calls[0][0];
    expect(result.images).toHaveLength(8);
    expect(result.images[0]).toHaveProperty('id');
    expect(result.images[0]).toHaveProperty('title');
    expect(result.images[0]).toHaveProperty('imageUrl');
  });

  it('all stock image URLs start with /visual-login/', () => {
    const { req, res } = mockReqResNext();

    getStockImages(req, res);

    const result = (res.json as any).mock.calls[0][0];
    for (const img of result.images) {
      expect(img.imageUrl).toMatch(/^\/visual-login\//);
    }
  });

  it('all stock image IDs are unique', () => {
    const { req, res } = mockReqResNext();

    getStockImages(req, res);

    const result = (res.json as any).mock.calls[0][0];
    const ids = result.images.map((img: any) => img.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── getVisualSetupImages ────────────────────────────────────────────────

describe('getVisualSetupImages', () => {
  it('returns all recipes with images', async () => {
    (prisma.recipe.findMany as any).mockResolvedValue([
      { id: 'r1', title: 'Pasta', imageUrl: '/images/pasta.jpg' },
    ]);
    const { req, res, next } = mockReqResNext();

    await getVisualSetupImages(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      images: [{ id: 'r1', title: 'Pasta', imageUrl: '/images/pasta.jpg' }],
    });
  });
});

/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import crypto from 'crypto';
import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';

const ACCESS_COOKIE_NAME = 'mealplanner_access';
const REFRESH_COOKIE_NAME = 'mealplanner_refresh';

const isProduction = process.env.NODE_ENV === 'production';

// Cookie maxAge must mirror the actual signed lifetime of the JWT it carries
// (see getJwtConfig in utils/secrets.ts) — otherwise the cookie can outlive
// or, worse, expire before the token it's meant to carry, causing spurious
// re-auths. Parses the same duration strings jsonwebtoken's `expiresIn`
// accepts (a bare number of seconds, or `<number><s|m|h|d>`).
function parseDurationMs(value: string, fallbackMs: number): number {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/.exec(value.trim());
  if (!match) return fallbackMs;
  const amount = parseFloat(match[1]);
  const unitMs: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * unitMs[match[2] || 's'];
}

const accessTokenMaxAgeMs = parseDurationMs(process.env.JWT_EXPIRES_IN || '10m', 10 * 60 * 1000);
const refreshTokenMaxAgeMs = parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN || '1d', 24 * 60 * 60 * 1000);

function getCookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === 'false') return false;
  return process.env.COOKIE_SECURE === 'true' || isProduction;
}

function getCookieDomain(): string | undefined {
  const domain = process.env.COOKIE_DOMAIN?.trim();
  return domain ? domain : undefined;
}

function getAccessCookieOptions() {
  return {
    httpOnly: true,
    secure: getCookieSecure(),
    sameSite: 'lax' as const,
    path: '/',
    domain: getCookieDomain(),
    maxAge: accessTokenMaxAgeMs,
  };
}

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: getCookieSecure(),
    sameSite: 'strict' as const,
    path: '/api/auth',
    domain: getCookieDomain(),
    maxAge: refreshTokenMaxAgeMs,
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, getAccessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE_NAME, getAccessCookieOptions());
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
}

export function getAccessTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1] || null;
    }
  }

  return req.cookies?.[ACCESS_COOKIE_NAME] || null;
}

export function getRefreshTokenFromRequest(req: Request): string | null {
  const bodyRefreshToken = req.body?.refreshToken;
  if (typeof bodyRefreshToken === 'string' && bodyRefreshToken.trim()) {
    return bodyRefreshToken;
  }

  return req.cookies?.[REFRESH_COOKIE_NAME] || null;
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getClientIp(req: Request): string | undefined {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0]?.trim();
  }

  return req.ip || undefined;
}

export function requireRefreshToken(req: Request): string {
  const token = getRefreshTokenFromRequest(req);
  if (!token) {
    throw new AppError('Refresh token is required', 400);
  }

  return token;
}

export const authCookieNames = {
  access: ACCESS_COOKIE_NAME,
  refresh: REFRESH_COOKIE_NAME,
};

export default {
  setAuthCookies,
  clearAuthCookies,
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  requireRefreshToken,
  hashSessionToken,
  getClientIp,
  authCookieNames,
};

// Made with Bob
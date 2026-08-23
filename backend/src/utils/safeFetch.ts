/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import http from 'http';
import https from 'https';
import dns from 'dns';
import net from 'net';
import { URL } from 'url';
import { logger } from './logger';
import { isBlockedIp } from './ipSafety';

/**
 * SSRF-safe outbound fetch for user-supplied URLs (image proxy, recipe import).
 *
 * `sanitizeUrl`/protocol checks alone only validate the *hostname string* the caller
 * gave us — a domain can resolve to a private/internal address at connect time (DNS
 * rebinding), or a public server can 302 to one (redirect-based SSRF), and neither is
 * visible from the string. This module re-resolves and re-validates the IP address on
 * every hop — including redirects — and then pins the actual TCP connection to that
 * exact validated address (via the `lookup` option) so a second, later DNS resolution
 * can never substitute a different, unvalidated address between the check and the
 * connect.
 */

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_REDIRECTS = 5;

export class SafeFetchError extends Error {}

export interface SafeFetchResult {
  status: number;
  headers: http.IncomingHttpHeaders;
  buffer: Buffer;
  finalUrl: string;
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  headers?: Record<string, string>;
}

/** Resolve `hostname` and return the first address, throwing if any resolved address is blocked. */
async function resolvePinnedAddress(hostname: string): Promise<string> {
  const literalFamily = net.isIP(hostname);
  const addresses = literalFamily
    ? [hostname]
    : (await dns.promises.lookup(hostname, { all: true, verbatim: true })).map((r) => r.address);

  if (addresses.length === 0) {
    throw new SafeFetchError(`ENOTFOUND: DNS lookup for ${hostname} returned no addresses`);
  }
  for (const addr of addresses) {
    if (isBlockedIp(addr)) {
      logger.warn('Blocked outbound fetch — resolved to a disallowed address (SSRF protection)', {
        hostname,
        addr,
      });
      throw new SafeFetchError('URL points to a disallowed host');
    }
  }
  return addresses[0];
}

function performRequest(
  parsed: URL,
  pinnedIp: string,
  opts: Required<Pick<SafeFetchOptions, 'timeoutMs' | 'maxBytes'>> & Pick<SafeFetchOptions, 'headers'>
): Promise<{ status: number; headers: http.IncomingHttpHeaders; buffer: Buffer }> {
  return new Promise((resolve, reject) => {
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'GET',
        timeout: opts.timeoutMs,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MealPlannerBot/1.0)',
          ...opts.headers,
        },
        // Pin the connection to the address we already validated, instead of letting
        // Node re-resolve DNS at connect time (which is what a rebinding attack relies on).
        lookup: (_hostname: string, lookupOpts: unknown, callback: (...args: any[]) => void) => {
          const family = net.isIP(pinnedIp);
          if (typeof lookupOpts === 'object' && lookupOpts && (lookupOpts as any).all) {
            callback(null, [{ address: pinnedIp, family }]);
          } else {
            callback(null, pinnedIp, family);
          }
        },
        ...(parsed.protocol === 'https:' ? { servername: parsed.hostname } : {}),
      },
      (res) => {
        const chunks: Buffer[] = [];
        let received = 0;
        res.on('data', (chunk: Buffer) => {
          received += chunk.length;
          if (received > opts.maxBytes) {
            req.destroy(new SafeFetchError('Response exceeded maximum allowed size'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          resolve({ status: res.statusCode || 0, headers: res.headers, buffer: Buffer.concat(chunks) });
        });
      }
    );

    req.on('timeout', () => req.destroy(new SafeFetchError('Request timeout')));
    req.on('error', (err) => reject(err instanceof SafeFetchError ? err : new SafeFetchError(err.message)));
    req.end();
  });
}

/**
 * Fetch `inputUrl`, validating the resolved IP address of every hop (including
 * redirects) against the private/reserved-range blocklist before connecting.
 */
export async function safeFetch(inputUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;

  let currentUrl = inputUrl;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const parsed = new URL(currentUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new SafeFetchError('Only HTTP and HTTPS URLs are allowed');
    }

    const pinnedIp = await resolvePinnedAddress(parsed.hostname);
    const result = await performRequest(parsed, pinnedIp, { timeoutMs, maxBytes, headers: options.headers });

    if (result.status >= 300 && result.status < 400 && typeof result.headers.location === 'string') {
      const nextUrl = new URL(result.headers.location, currentUrl).toString();
      logger.info('safeFetch following validated redirect', { from: currentUrl, to: nextUrl, hop });
      currentUrl = nextUrl;
      continue;
    }

    if (result.status >= 400) {
      throw new SafeFetchError(`HTTP ${result.status}`);
    }

    return {
      status: result.status,
      headers: result.headers,
      buffer: result.buffer,
      finalUrl: currentUrl,
    };
  }

  throw new SafeFetchError('Too many redirects');
}

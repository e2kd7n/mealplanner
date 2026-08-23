/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import net from 'net';

/**
 * Numeric range checks for private/reserved IPv4 and IPv6 addresses — used to validate
 * the address a server-side fetch is *actually* about to connect to (post-DNS-resolution),
 * not just the literal hostname string a caller supplied. String-prefix matching on the
 * hostname (the previous approach) misses DNS rebinding, HTTP redirects to an internal
 * host, and address forms like `127.0.0.2` or IPv4-mapped IPv6 (`::ffff:127.0.0.1`).
 */

export function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true; // malformed — fail closed
  }
  const [a, b] = parts;

  if (a === 0) return true; // 0.0.0.0/8 ("this network")
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 (loopback — not just 127.0.0.1)
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 (link-local, incl. cloud metadata 169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 (benchmarking)
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 (IETF protocol assignments)
  if (a >= 224) return true; // 224.0.0.0+ (multicast, reserved, broadcast)

  return false;
}

export function isBlockedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (normalized === '::1') return true; // loopback
  if (normalized === '::') return true; // unspecified
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
      normalized.startsWith('fea') || normalized.startsWith('feb')) return true; // fe80::/10 link-local
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // fc00::/7 unique-local

  // IPv4-mapped IPv6 (::ffff:a.b.c.d) — check the embedded IPv4 address
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIPv4(mapped[1]);

  return false;
}

/** True if `ip` is a private, loopback, link-local, or otherwise non-public address. */
export function isBlockedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isBlockedIPv4(ip);
  if (family === 6) return isBlockedIPv6(ip);
  return true; // not a valid IP at all — fail closed
}

/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import crypto from 'crypto';

// ── Types ────────────────────────────────────────────────────────────────

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'question' | 'other';

export interface ClientLogRow {
  id: string;
  level: string;
  message: string;
  context: string | null;
  url: string | null;
  createdAt: Date;
}

export interface UserFeedbackRow {
  id: string;
  page: string;
  feedbackType: FeedbackType;
  rating: number | null;
  message: string;
  createdAt: Date;
  user: {
    email: string;
    familyName: string;
  };
}

export interface TriageCandidate {
  kind: 'log' | 'feedback';
  fingerprint: string;
  title: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  page?: string;
  context?: string;
  excerpt: string;
  feedbackType?: FeedbackType;
  rating?: number | null;
  sourceIds: string[];
}

// ── Test/noise filtering ────────────────────────────────────────────────
//
// Nothing in the app layer flags a row as test data (confirmed — there's no
// isTest/source field anywhere), so these patterns are inferred from the
// e2e fixture conventions and the real noise rows visible in the historical
// feedback-analysis.json export (/test-page, /test, "Test feedback with
// rating 1", familyName "Test Family"). Overridable via env vars so ops can
// tune without a code change.

const TEST_EMAIL_PATTERNS = [/@example\.com$/i, /@test\.com$/i, /^test[-_]/i];
const TEST_PAGE_PATTERNS = [/^\/test(-page)?(\/|$)/i, /^\/test$/i];
const TEST_MESSAGE_PATTERN = /^(this is a )?test\b/i;
const TEST_NAME_PATTERN = /^test\b/i;

function envPattern(envVar: string): RegExp | null {
  const src = process.env[envVar];
  if (!src) return null;
  try {
    return new RegExp(src, 'i');
  } catch {
    return null;
  }
}

export interface NoiseCheckInput {
  email?: string | null;
  familyName?: string | null;
  page?: string | null;
  url?: string | null;
  message: string;
}

export function isTestNoise(input: NoiseCheckInput): boolean {
  const email = input.email ?? '';
  if (email) {
    if (TEST_EMAIL_PATTERNS.some((p) => p.test(email))) return true;
    const extra = envPattern('TRIAGE_EXTRA_TEST_EMAIL_PATTERN');
    if (extra?.test(email)) return true;
  }

  const page = input.page ?? input.url ?? '';
  if (page) {
    if (TEST_PAGE_PATTERNS.some((p) => p.test(page))) return true;
    const extra = envPattern('TRIAGE_EXTRA_TEST_PAGE_PATTERN');
    if (extra?.test(page)) return true;
  }

  if (input.familyName && TEST_NAME_PATTERN.test(input.familyName)) return true;
  if (TEST_MESSAGE_PATTERN.test(input.message)) return true;

  return false;
}

// ── Fingerprinting ──────────────────────────────────────────────────────
//
// Deliberately strips only clearly volatile tokens (UUIDs, ISO timestamps,
// long hex session/request ids) — NOT generic numbers or line numbers. Two
// different bugs at different call sites ("...at line 42" vs "...at line
// 187") must produce different fingerprints, not collapse into one issue.

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
// Applied after .toLowerCase() below, so the T/Z separators must be matched
// in their lowercased form here — an uppercase pattern silently matches
// nothing once the input has already been lowercased.
const ISO_TIMESTAMP_PATTERN = /\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}(\.\d+)?z?/g;
const LONG_HEX_TOKEN_PATTERN = /\b[0-9a-f]{16,}\b/gi;

export function normalizeForFingerprint(text: string): string {
  return text
    .toLowerCase()
    .replace(UUID_PATTERN, '')
    .replace(ISO_TIMESTAMP_PATTERN, '')
    .replace(LONG_HEX_TOKEN_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

export function computeFingerprint(kind: 'log' | 'feedback', key: string): string {
  return crypto
    .createHash('sha256')
    .update(`${kind}:${normalizeForFingerprint(key)}`)
    .digest('hex')
    .slice(0, 12);
}

// ── Redaction ────────────────────────────────────────────────────────────
//
// Hard rule: a filed issue must never include the reporter's email or
// family name, and never quote an email-shaped string even if a user
// happened to type one into their own free-text feedback message. This
// repo is public.

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function redactEmails(text: string): string {
  return text.replace(EMAIL_PATTERN, '[redacted email]');
}

export function truncate(text: string, max: number): string {
  const cleaned = redactEmails(text).replace(/\s+/g, ' ').trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

export function capExcerpt(text: string, max = 300): string {
  return truncate(text, max);
}

// Best-effort redaction of the reporter's own name from their own message
// text (e.g. "...from the Smith household") — the structural guarantee is
// that TriageCandidate never carries familyName/email at all, but a name a
// user typed into their own free-text message needs scrubbing at the point
// where both are still in scope (clusterFeedback, before the row is reduced
// to a candidate).
export function redactName(text: string, name: string | null | undefined): string {
  if (!name || name.trim().length < 2) return text;
  const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '[redacted name]');
}

// ── Clustering ───────────────────────────────────────────────────────────

export function clusterClientLogs(logs: ClientLogRow[], minOccurrences = 3): TriageCandidate[] {
  const groups = new Map<string, ClientLogRow[]>();
  for (const log of logs) {
    if (isTestNoise({ page: log.url, url: log.url, message: log.message })) continue;
    const key = `${log.context ?? 'unknown'}::${normalizeForFingerprint(log.message)}`;
    const arr = groups.get(key) ?? [];
    arr.push(log);
    groups.set(key, arr);
  }

  const candidates: TriageCandidate[] = [];
  for (const [key, rows] of groups) {
    if (rows.length < minOccurrences) continue;
    const sorted = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    candidates.push({
      kind: 'log',
      fingerprint: computeFingerprint('log', key),
      title: `Recurring ${first.level} in ${first.context ?? 'unknown context'}: ${truncate(first.message, 80)}`,
      occurrences: rows.length,
      firstSeen: first.createdAt.toISOString(),
      lastSeen: last.createdAt.toISOString(),
      context: first.context ?? undefined,
      excerpt: first.message,
      sourceIds: rows.map((r) => r.id),
    });
  }
  return candidates;
}

// Deliberately a much lower default than clusterClientLogs: each
// UserFeedback row is a deliberate, one-time action by one of at most a
// handful of people — free-text human messages essentially never repeat
// verbatim across submitters, so an occurrence-count gate tuned for
// auto-generated logs would silently drop real reports. Clustering here
// exists only to merge literal resubmissions, not to gate "is this real".
export function clusterFeedback(feedback: UserFeedbackRow[], minOccurrences = 1): TriageCandidate[] {
  const groups = new Map<string, UserFeedbackRow[]>();
  for (const fb of feedback) {
    if (
      isTestNoise({
        email: fb.user.email,
        familyName: fb.user.familyName,
        page: fb.page,
        message: fb.message,
      })
    )
      continue;
    const key = `${fb.feedbackType}::${fb.page}::${normalizeForFingerprint(fb.message)}`;
    const arr = groups.get(key) ?? [];
    arr.push(fb);
    groups.set(key, arr);
  }

  const candidates: TriageCandidate[] = [];
  for (const [key, rows] of groups) {
    if (rows.length < minOccurrences) continue;
    const sorted = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const safeMessage = redactName(first.message, first.user.familyName);
    candidates.push({
      kind: 'feedback',
      fingerprint: computeFingerprint('feedback', key),
      title: `[${first.feedbackType}] ${first.page}: ${truncate(safeMessage, 80)}`,
      occurrences: rows.length,
      firstSeen: first.createdAt.toISOString(),
      lastSeen: last.createdAt.toISOString(),
      page: first.page,
      excerpt: safeMessage,
      feedbackType: first.feedbackType,
      rating: first.rating,
      sourceIds: rows.map((r) => r.id),
    });
  }
  return candidates;
}

// ── Labels & severity ────────────────────────────────────────────────────
//
// Only labels that already exist in the repo (confirmed via `gh label
// list`), plus the auto-feedback-triage marker used for dedup.

export function computeSeverity(candidate: TriageCandidate): 'P1-high' | 'P2-medium' | 'P3-low' {
  if (candidate.kind === 'log') {
    return candidate.occurrences >= 10 ? 'P1-high' : 'P2-medium';
  }
  if (candidate.feedbackType === 'bug') {
    return candidate.rating != null && candidate.rating <= 2 ? 'P1-high' : 'P2-medium';
  }
  if (candidate.feedbackType === 'feature' || candidate.feedbackType === 'improvement') {
    return 'P3-low';
  }
  return 'P2-medium';
}

export function selectLabels(candidate: TriageCandidate): string[] {
  let typeLabel: 'bug' | 'question' | 'enhancement';
  if (candidate.kind === 'log' || candidate.feedbackType === 'bug') {
    typeLabel = 'bug';
  } else if (candidate.feedbackType === 'question') {
    typeLabel = 'question';
  } else {
    typeLabel = 'enhancement';
  }
  return [typeLabel, computeSeverity(candidate), 'auto-feedback-triage'];
}

// ── Issue body ───────────────────────────────────────────────────────────
//
// Locked-down structure (mirrors what worked in the one real historical
// precedent, Issue #168 in FEEDBACK_ANALYSIS_REPORT.md): severity,
// occurrence count, first/last-seen, location, then a capped/redacted
// excerpt — never the reporter's identity, which this type doesn't even
// carry. Always ends with the dedup fingerprint marker.

export function renderIssueBody(candidate: TriageCandidate): string {
  const lines: string[] = [];
  lines.push(`**Severity:** ${computeSeverity(candidate)}`);
  lines.push(`**Occurrences:** ${candidate.occurrences}`);
  lines.push(`**First seen:** ${candidate.firstSeen}`);
  lines.push(`**Last seen:** ${candidate.lastSeen}`);

  if (candidate.kind === 'log') {
    lines.push(`**Context:** ${candidate.context ?? 'unknown'}`);
    lines.push('');
    lines.push('**Sample error message:**');
    lines.push('```');
    lines.push(capExcerpt(candidate.excerpt));
    lines.push('```');
  } else {
    lines.push(`**Page:** ${candidate.page ?? 'unknown'}`);
    lines.push(`**Feedback type:** ${candidate.feedbackType ?? 'unknown'}`);
    if (candidate.rating != null) {
      lines.push(`**Rating:** ${candidate.rating}/5`);
    }
    lines.push('');
    lines.push('**Excerpt:**');
    lines.push(
      capExcerpt(candidate.excerpt)
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n')
    );
  }

  lines.push('');
  lines.push(
    '_Auto-filed by `scripts/feedback-log-triage.sh`. Full unredacted context is archived privately, never in this repo._'
  );
  lines.push('');
  lines.push(`<!-- auto-feedback-triage:fingerprint=${candidate.fingerprint} -->`);
  return lines.join('\n');
}

// Made with Bob

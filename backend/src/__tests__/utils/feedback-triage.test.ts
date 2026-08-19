import { describe, it, expect } from 'vitest';
import {
  isTestNoise,
  normalizeForFingerprint,
  computeFingerprint,
  clusterClientLogs,
  clusterFeedback,
  selectLabels,
  renderIssueBody,
  type ClientLogRow,
  type UserFeedbackRow,
  type TriageCandidate,
} from '../../scripts/feedback-triage.util';

const KNOWN_LABELS = new Set([
  'bug',
  'enhancement',
  'question',
  'P1-high',
  'P2-medium',
  'P3-low',
  'auto-feedback-triage',
]);

function makeLog(overrides: Partial<ClientLogRow> = {}): ClientLogRow {
  return {
    id: 'log-1',
    level: 'error',
    message: 'TypeError: Cannot read property of undefined',
    context: 'GroceryList',
    url: '/grocery-list',
    createdAt: new Date('2026-08-01T10:00:00Z'),
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<UserFeedbackRow> = {}): UserFeedbackRow {
  return {
    id: 'fb-1',
    page: '/grocery-list',
    feedbackType: 'bug',
    rating: 1,
    message: 'The grocery list page crashes when I add an item.',
    createdAt: new Date('2026-08-01T10:00:00Z'),
    user: { email: 'real.family@gmail.com', familyName: 'Smith' },
    ...overrides,
  };
}

describe('isTestNoise', () => {
  it('flags known test email domains', () => {
    expect(isTestNoise({ email: 'someone@example.com', message: 'hi' })).toBe(true);
    expect(isTestNoise({ email: 'someone@test.com', message: 'hi' })).toBe(true);
    expect(isTestNoise({ email: 'test-1234@gmail.com', message: 'hi' })).toBe(true);
  });

  it('flags test-prefixed pages', () => {
    expect(isTestNoise({ page: '/test-page', message: 'hi' })).toBe(true);
    expect(isTestNoise({ page: '/test', message: 'hi' })).toBe(true);
    expect(isTestNoise({ url: '/test-page/sub', message: 'hi' })).toBe(true);
  });

  it('flags the real historical noise rows verbatim', () => {
    // Drawn directly from the committed backend/feedback-analysis.json
    expect(isTestNoise({ familyName: 'Test Family', page: '/grocery-list', message: 'Test feedback with rating 1' })).toBe(
      true
    );
  });

  it('does not flag a real family submitting real feedback', () => {
    expect(
      isTestNoise({
        email: 'real.family@gmail.com',
        familyName: 'Smith',
        page: '/grocery-list',
        message: 'The page crashes when I add an item to the list.',
      })
    ).toBe(false);
  });
});

describe('normalizeForFingerprint / computeFingerprint', () => {
  it('produces the same fingerprint for messages differing only by UUID/timestamp', () => {
    const a = 'Failed to fetch recipe 3fa85f64-5717-4562-b3fc-2c963f66afa6 at 2026-04-20T10:00:00Z';
    const b = 'Failed to fetch recipe 9c858901-8a57-4791-81fe-4c455b099bc9 at 2026-05-11T03:22:41Z';
    expect(normalizeForFingerprint(a)).toBe(normalizeForFingerprint(b));
    expect(computeFingerprint('log', a)).toBe(computeFingerprint('log', b));
  });

  it('produces DIFFERENT fingerprints for two distinct bugs differing only by line number', () => {
    const a = "TypeError: Cannot read property 'foo' of undefined at line 42";
    const b = "TypeError: Cannot read property 'foo' of undefined at line 187";
    expect(normalizeForFingerprint(a)).not.toBe(normalizeForFingerprint(b));
    expect(computeFingerprint('log', a)).not.toBe(computeFingerprint('log', b));
  });
});

describe('clusterClientLogs', () => {
  it('drops clusters below the occurrence threshold', () => {
    const logs = [makeLog({ id: 'a' }), makeLog({ id: 'b' })];
    expect(clusterClientLogs(logs, 3)).toHaveLength(0);
  });

  it('keeps clusters at or above the occurrence threshold', () => {
    const logs = [makeLog({ id: 'a' }), makeLog({ id: 'b' }), makeLog({ id: 'c' })];
    const candidates = clusterClientLogs(logs, 3);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].occurrences).toBe(3);
    expect(candidates[0].sourceIds).toEqual(['a', 'b', 'c']);
  });

  it('excludes test-noise logs before clustering', () => {
    const logs = [
      makeLog({ id: 'a', url: '/test-page' }),
      makeLog({ id: 'b', url: '/test-page' }),
      makeLog({ id: 'c', url: '/test-page' }),
    ];
    expect(clusterClientLogs(logs, 3)).toHaveLength(0);
  });
});

describe('clusterFeedback', () => {
  it('surfaces a real bug from just 2 reports (matches the Issue #168 precedent)', () => {
    const feedback = [makeFeedback({ id: 'f1' }), makeFeedback({ id: 'f2' })];
    const candidates = clusterFeedback(feedback);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].occurrences).toBe(2);
  });

  it('surfaces a single real feedback row (minOccurrences defaults to 1)', () => {
    const candidates = clusterFeedback([makeFeedback()]);
    expect(candidates).toHaveLength(1);
  });

  it('excludes test-noise feedback before clustering', () => {
    const candidates = clusterFeedback([makeFeedback({ user: { email: 'x@example.com', familyName: 'Test Family' } })]);
    expect(candidates).toHaveLength(0);
  });
});

describe('selectLabels', () => {
  it('never emits a label outside the confirmed repo label set', () => {
    const candidates: TriageCandidate[] = [
      ...clusterClientLogs([makeLog({ id: 'a' }), makeLog({ id: 'b' }), makeLog({ id: 'c' })], 3),
      ...clusterFeedback([makeFeedback({ feedbackType: 'bug', rating: 1 })]),
      ...clusterFeedback([makeFeedback({ id: 'f2', feedbackType: 'feature', rating: null })]),
      ...clusterFeedback([makeFeedback({ id: 'f3', feedbackType: 'question', rating: null })]),
    ];
    for (const candidate of candidates) {
      for (const label of selectLabels(candidate)) {
        expect(KNOWN_LABELS.has(label)).toBe(true);
      }
    }
  });
});

describe('renderIssueBody', () => {
  it('never includes the reporter email or family name, even when embedded in the message', () => {
    const feedback = makeFeedback({
      user: { email: 'private.family@gmail.com', familyName: 'Reallyprivatename' },
      message: 'Contact me at private.family@gmail.com if you need more info, this is from the Reallyprivatename household.',
    });
    const [candidate] = clusterFeedback([feedback]);
    const body = renderIssueBody(candidate);

    expect(body).not.toContain('private.family@gmail.com');
    expect(body).not.toContain('Reallyprivatename');
    expect(body).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  });

  it('embeds the fingerprint marker used for dedup', () => {
    const [candidate] = clusterFeedback([makeFeedback()]);
    const body = renderIssueBody(candidate);
    expect(body).toContain(`<!-- auto-feedback-triage:fingerprint=${candidate.fingerprint} -->`);
  });

  it('caps a long excerpt rather than quoting it verbatim in full', () => {
    const longMessage = 'a'.repeat(1000);
    const [candidate] = clusterFeedback([makeFeedback({ message: longMessage })]);
    const body = renderIssueBody(candidate);
    expect(body).not.toContain(longMessage);
    expect(body).toContain('a'.repeat(50));
  });
});

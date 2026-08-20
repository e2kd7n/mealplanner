/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

/**
 * Weekly feedback/error-log triage — orchestration entrypoint.
 *
 * Queries UserFeedback + error/warn ClientLog for the lookback window,
 * filters test noise, clusters, and emits one JSON object per surviving
 * candidate as JSON-lines on stdout (diagnostics go to stderr, so stdout
 * stays a clean contract for the bash wrapper — scripts/feedback-log-triage.sh
 * — to consume). No GitHub credential/network logic lives here; that stays
 * in bash, matching every other script in scripts/.
 *
 * Also writes a full, unredacted archive of everything it looked at
 * (including rows filtered as noise) to a local JSON file — never committed
 * to this repo. See docs/WEEKLY_MAINTENANCE.md's "Feedback & Error-Log
 * Triage" subsection for where that file actually ends up (a private repo,
 * picked up by the existing daily backup job).
 *
 * Run via: podman exec meals-backend node dist/scripts/feedback-triage.js
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDatabaseUrl } from '../utils/secrets';
import {
  isTestNoise,
  clusterClientLogs,
  clusterFeedback,
  selectLabels,
  renderIssueBody,
  type ClientLogRow,
  type UserFeedbackRow,
} from './feedback-triage.util';

const LOOKBACK_DAYS = parseInt(process.env.TRIAGE_LOOKBACK_DAYS || '7', 10);
const MIN_LOG_OCCURRENCES = parseInt(process.env.TRIAGE_MIN_LOG_OCCURRENCES || '3', 10);
const RAW_ARCHIVE_PATH =
  process.env.TRIAGE_RAW_ARCHIVE_PATH ||
  path.join(process.cwd(), 'data', 'maintenance-logs', 'feedback-triage-raw-latest.json');

// If the oldest ClientLog row we can actually see is much younger than the
// requested lookback window, the deployed MAX_DATABASE_LOGS_DAYS is
// probably shorter than assumed (default 30d — see logPruner.ts) — flag it
// rather than silently under-triaging every week.
const RETENTION_WARNING_SLACK_HOURS = 18;

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl(), max: 3 });
  const prisma = new PrismaClient({ adapter });

  try {
    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const [feedbackRows, logRows] = await Promise.all([
      prisma.userFeedback.findMany({
        where: { createdAt: { gte: since } },
        include: { user: { select: { email: true, familyName: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.clientLog.findMany({
        where: { level: { in: ['error', 'warn'] }, createdAt: { gte: since } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    warnIfRetentionLooksShort(logRows);

    const feedback: UserFeedbackRow[] = feedbackRows.map((f) => ({
      id: f.id,
      page: f.page,
      feedbackType: f.feedbackType,
      rating: f.rating,
      message: f.message,
      createdAt: f.createdAt,
      user: { email: f.user.email, familyName: f.user.familyName },
    }));
    const logs: ClientLogRow[] = logRows.map((l) => ({
      id: l.id,
      level: l.level,
      message: l.message,
      context: l.context,
      url: l.url,
      createdAt: l.createdAt,
    }));

    const candidates = [...clusterFeedback(feedback), ...clusterClientLogs(logs, MIN_LOG_OCCURRENCES)];

    for (const candidate of candidates) {
      const record = {
        fingerprint: candidate.fingerprint,
        title: candidate.title,
        body: renderIssueBody(candidate),
        labels: selectLabels(candidate),
        kind: candidate.kind,
        occurrences: candidate.occurrences,
        sourceIds: candidate.sourceIds,
      };
      process.stdout.write(JSON.stringify(record) + '\n');
    }

    writeRawArchive(feedback, logs, candidates.length);

    process.stderr.write(
      `feedback-triage: ${feedback.length} feedback rows, ${logs.length} log rows, ${candidates.length} candidates emitted.\n`
    );
  } finally {
    await prisma.$disconnect();
  }
}

function warnIfRetentionLooksShort(logRows: { createdAt: Date }[]): void {
  if (logRows.length === 0) return;
  const oldestSeen = logRows[0].createdAt;
  const ageHours = (Date.now() - oldestSeen.getTime()) / (1000 * 60 * 60);
  const requestedHours = LOOKBACK_DAYS * 24;
  if (ageHours < requestedHours - RETENTION_WARNING_SLACK_HOURS && ageHours < requestedHours * 0.5) {
    process.stderr.write(
      `WARNING: oldest ClientLog row seen this run is only ${ageHours.toFixed(1)}h old, but a ${requestedHours}h ` +
        `lookback was requested — MAX_DATABASE_LOGS_DAYS on this host may be shorter than the 30-day default. ` +
        `Consider a shorter TRIAGE_LOOKBACK_DAYS or a more frequent cron if this persists.\n`
    );
  }
}

function writeRawArchive(
  feedback: UserFeedbackRow[],
  logs: ClientLogRow[],
  candidateCount: number
): void {
  const archive = {
    generatedAt: new Date().toISOString(),
    lookbackDays: LOOKBACK_DAYS,
    candidateCount,
    feedback: feedback.map((f) => ({
      id: f.id,
      page: f.page,
      feedbackType: f.feedbackType,
      rating: f.rating,
      message: f.message,
      createdAt: f.createdAt.toISOString(),
      email: f.user.email,
      familyName: f.user.familyName,
      isTestNoise: isTestNoise({
        email: f.user.email,
        familyName: f.user.familyName,
        page: f.page,
        message: f.message,
      }),
    })),
    clientLogs: logs.map((l) => ({
      id: l.id,
      level: l.level,
      context: l.context,
      message: l.message,
      url: l.url,
      createdAt: l.createdAt.toISOString(),
      isTestNoise: isTestNoise({ page: l.url, url: l.url, message: l.message }),
    })),
  };
  fs.mkdirSync(path.dirname(RAW_ARCHIVE_PATH), { recursive: true });
  fs.writeFileSync(RAW_ARCHIVE_PATH, JSON.stringify(archive, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    process.stderr.write(
      `feedback-triage: fatal error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`
    );
    process.exit(1);
  });

// Made with Bob

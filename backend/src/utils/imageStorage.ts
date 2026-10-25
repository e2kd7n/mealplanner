/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import path from 'path';
import fs from 'fs/promises';

/**
 * Where uploaded recipe images live — the directory nginx serves as /images/.
 *
 * Set explicitly in containers (podman-compose*.yml): the old cwd-relative
 * `../data/images` resolved to /data/images inside the Pi container, an
 * unmounted path nginx never served and a container restart wiped. The
 * fallback keeps local dev working, where the backend runs from backend/ and
 * ../data/images is the repo's data dir.
 */
export const IMAGES_DIR = process.env.IMAGES_DIR || path.resolve(process.cwd(), '..', 'data', 'images');

/** Scratch dir multer writes raw uploads to before they're validated. */
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(process.cwd(), '..', 'data', 'uploads');

export interface DetectedImage {
  ext: '.jpg' | '.png' | '.gif' | '.webp';
  mime: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
}

/**
 * Identify an image by its leading bytes. The Content-Type and filename a
 * client sends are both attacker-controlled: trusting them let an
 * `evil.html` labelled image/png be stored and served from our own origin.
 */
export function detectImageType(head: Buffer): DetectedImage | null {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return { ext: '.jpg', mime: 'image/jpeg' };
  }
  if (head.length >= 8 && head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: '.png', mime: 'image/png' };
  }
  if (head.length >= 6) {
    const sig = head.toString('ascii', 0, 6);
    if (sig === 'GIF87a' || sig === 'GIF89a') return { ext: '.gif', mime: 'image/gif' };
  }
  if (head.length >= 12 && head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP') {
    return { ext: '.webp', mime: 'image/webp' };
  }
  return null;
}

/** Read the first bytes of a file for detectImageType. */
export async function readFileHead(filePath: string, length = 12): Promise<Buffer> {
  const handle = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buf, 0, length, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

/**
 * Move a file into place. UPLOADS_DIR and IMAGES_DIR are separate bind mounts
 * in the container, and rename(2) across mount points fails with EXDEV even on
 * the same host filesystem — so fall back to copy + delete.
 */
export async function moveFile(from: string, to: string): Promise<void> {
  try {
    await fs.rename(from, to);
  } catch (err: any) {
    if (err?.code !== 'EXDEV') throw err;
    await fs.copyFile(from, to);
    await fs.unlink(from);
  }
}

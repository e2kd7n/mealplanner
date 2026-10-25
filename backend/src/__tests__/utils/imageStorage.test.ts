import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { Request, Response, NextFunction } from 'express';
import { detectImageType } from '../../utils/imageStorage';
import { uploadImage, deleteImage } from '../../controllers/image.controller';

// Fixed temp dirs, chosen before any import so imageStorage picks them up.
const dirs = vi.hoisted(() => {
  const base = `${process.env.TEMP || process.env.TMPDIR || '/tmp'}/mp-images-${process.pid}`;
  return { base, images: `${base}/images`, uploads: `${base}/uploads` };
});

vi.mock('../../utils/imageStorage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/imageStorage')>()),
  IMAGES_DIR: dirs.images,
  UPLOADS_DIR: dirs.uploads,
}));

vi.mock('../../utils/prisma', () => ({ default: { recipe: { findFirst: vi.fn() } } }));
vi.mock('../../utils/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const GIF = Buffer.from('GIF89a\x01\x00\x01\x00', 'latin1');
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x24, 0, 0, 0]), Buffer.from('WEBPVP8 ')]);
const HTML = Buffer.from('<html><script>alert(1)</script></html>');
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>');

const imagesDir = dirs.images;
const uploadsDir = dirs.uploads;

beforeAll(async () => {
  await fs.mkdir(uploadsDir, { recursive: true });
});

afterAll(async () => {
  await fs.rm(dirs.base, { recursive: true, force: true });
});

describe('detectImageType', () => {
  it('recognises the four allowed formats by their signatures', async () => {
    expect(detectImageType(PNG)?.ext).toBe('.png');
    expect(detectImageType(JPEG)?.ext).toBe('.jpg');
    expect(detectImageType(GIF)?.ext).toBe('.gif');
    expect(detectImageType(WEBP)?.ext).toBe('.webp');
  });

  it('rejects HTML, SVG, and empty input', async () => {
    expect(detectImageType(HTML)).toBeNull();
    expect(detectImageType(SVG)).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});

describe('uploadImage', () => {
  async function upload(content: Buffer, claimed: { mimetype: string; originalname: string }) {
    const filePath = path.join(uploadsDir, `upload-${Math.random().toString(16).slice(2)}`);
    await fs.writeFile(filePath, content);
    const req = { file: { path: filePath, size: content.length, ...claimed } } as unknown as Request;
    const json = vi.fn();
    const res = { status: vi.fn().mockReturnValue({ json }) } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;
    await uploadImage(req, res, next);
    return { filePath, json, next };
  }

  it('stores a real image under IMAGES_DIR with the extension its bytes imply', async () => {
    // Client lies about both the name and the type; the bytes are a PNG.
    const { filePath, json, next } = await upload(PNG, { mimetype: 'image/jpeg', originalname: 'photo.html' });

    expect(next).not.toHaveBeenCalled();
    const data = json.mock.calls[0][0].data;
    expect(data.filename).toMatch(/^recipe-\d+-[0-9a-f]{16}\.png$/);
    expect(data.mimeType).toBe('image/png');
    expect(data.imageUrl).toBe(`/images/${data.filename}`);
    await expect(fs.access(path.join(imagesDir, data.filename))).resolves.toBeUndefined();
    await expect(fs.access(filePath)).rejects.toThrow();
  });

  it('rejects HTML labelled as an image and removes the temp file', async () => {
    const { filePath, json, next } = await upload(HTML, { mimetype: 'image/png', originalname: 'evil.html' });

    expect((next as any).mock.calls[0][0].statusCode).toBe(400);
    expect(json).not.toHaveBeenCalled();
    await expect(fs.access(filePath)).rejects.toThrow();
  });

  it('rejects SVG (scriptable) even when labelled as an image', async () => {
    const { next } = await upload(SVG, { mimetype: 'image/png', originalname: 'x.svg' });

    expect((next as any).mock.calls[0][0].statusCode).toBe(400);
  });
});

describe('deleteImage', () => {
  it('rejects filenames that could escape the images directory', async () => {
    for (const filename of ['..', '../secrets.txt', '..\\secrets.txt', 'a/b.png', 'x.png\0']) {
      const req = { params: { filename }, user: { userId: 'u', role: 'admin' } } as unknown as Request;
      const next = vi.fn() as unknown as NextFunction;
      await deleteImage(req, { json: vi.fn() } as unknown as Response, next);
      expect((next as any).mock.calls[0][0].statusCode).toBe(400);
    }
  });
});

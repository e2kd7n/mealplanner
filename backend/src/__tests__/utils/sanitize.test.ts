import { describe, it, expect } from 'vitest';
import { sanitizeString, sanitizeUrl, sanitizeObject, sanitizeRecipeData, SanitizationProfiles } from '../../utils/sanitize';

describe('sanitizeString', () => {
  it('strips script tags in STRICT mode', () => {
    const result = sanitizeString('<script>alert("xss")</script>Hello');
    expect(result).toBe('Hello');
    expect(result).not.toContain('<script>');
  });

  it('strips all HTML in STRICT mode', () => {
    const result = sanitizeString('<b>Bold</b> <i>Italic</i>');
    expect(result).toBe('Bold Italic');
  });

  it('allows basic formatting in BASIC mode', () => {
    const result = sanitizeString('<b>Bold</b> <i>Italic</i>', SanitizationProfiles.BASIC);
    expect(result).toContain('<b>');
    expect(result).toContain('<i>');
  });

  it('strips dangerous tags in BASIC mode', () => {
    const result = sanitizeString('<script>alert("xss")</script><b>Safe</b>', SanitizationProfiles.BASIC);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<b>Safe</b>');
  });

  it('returns non-string values unchanged', () => {
    expect(sanitizeString(42 as any)).toBe(42);
    expect(sanitizeString(null as any)).toBe(null);
  });

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('');
  });

  it('strips event handlers', () => {
    const result = sanitizeString('<img onerror="alert(1)" src="x">');
    expect(result).not.toContain('onerror');
  });
});

describe('sanitizeUrl', () => {
  it('allows valid HTTPS URLs', () => {
    expect(sanitizeUrl('https://example.com/recipe')).toBe('https://example.com/recipe');
  });

  it('allows valid HTTP URLs', () => {
    expect(sanitizeUrl('http://example.com/recipe')).toBe('http://example.com/recipe');
  });

  it('blocks javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeUndefined();
  });

  it('blocks data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined();
  });

  it('blocks localhost', () => {
    expect(sanitizeUrl('http://localhost:3000/api/secrets')).toBeUndefined();
  });

  it('blocks 127.0.0.1', () => {
    expect(sanitizeUrl('http://127.0.0.1/admin')).toBeUndefined();
  });

  it('blocks 0.0.0.0', () => {
    expect(sanitizeUrl('http://0.0.0.0/admin')).toBeUndefined();
  });

  it('blocks 10.x.x.x private range', () => {
    expect(sanitizeUrl('http://10.0.0.1/api')).toBeUndefined();
  });

  it('blocks 192.168.x.x private range', () => {
    expect(sanitizeUrl('http://192.168.1.1/admin')).toBeUndefined();
  });

  it('blocks 172.16-31.x.x private range', () => {
    expect(sanitizeUrl('http://172.16.0.1/api')).toBeUndefined();
    expect(sanitizeUrl('http://172.31.255.255/api')).toBeUndefined();
  });

  it('blocks 169.254.x.x link-local / AWS IMDS', () => {
    expect(sanitizeUrl('http://169.254.169.254/latest/meta-data/')).toBeUndefined();
  });

  it('blocks IPv6 loopback', () => {
    expect(sanitizeUrl('http://[::1]/admin')).toBeUndefined();
  });

  it('blocks IPv6 link-local', () => {
    expect(sanitizeUrl('http://[fe80::1]/api')).toBeUndefined();
  });

  it('blocks IPv6 unique-local (fc/fd)', () => {
    expect(sanitizeUrl('http://[fc00::1]/api')).toBeUndefined();
    expect(sanitizeUrl('http://[fd12::1]/api')).toBeUndefined();
  });

  it('returns undefined for invalid URLs', () => {
    expect(sanitizeUrl('not-a-url')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(sanitizeUrl('')).toBeUndefined();
  });

  it('returns undefined for null/undefined', () => {
    expect(sanitizeUrl(null as any)).toBeUndefined();
    expect(sanitizeUrl(undefined as any)).toBeUndefined();
  });
});

describe('sanitizeObject', () => {
  it('sanitizes string values in objects', () => {
    const result = sanitizeObject({ name: '<script>bad</script>Safe' });
    expect(result.name).toBe('Safe');
  });

  it('sanitizes nested objects', () => {
    const result = sanitizeObject({
      level1: { level2: '<b>html</b>' },
    });
    expect(result.level1.level2).toBe('html');
  });

  it('sanitizes arrays', () => {
    const result = sanitizeObject(['<script>1</script>safe', '<b>bold</b>']);
    expect(result[0]).toBe('safe');
    expect(result[1]).toBe('bold');
  });

  it('preserves non-string values', () => {
    const result = sanitizeObject({ count: 42, active: true, data: null });
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
    expect(result.data).toBeNull();
  });

  it('returns null/undefined as-is', () => {
    expect(sanitizeObject(null)).toBeNull();
    expect(sanitizeObject(undefined)).toBeUndefined();
  });
});

describe('sanitizeRecipeData', () => {
  it('sanitizes recipe title strictly', () => {
    const result = sanitizeRecipeData({
      title: '<script>alert(1)</script>Pasta',
      description: 'A <b>great</b> recipe',
      instructions: ['<img onerror=alert(1)>Step 1'],
      ingredients: [{ name: '<b>Flour</b>', unit: 'cups', notes: '<script>x</script>fine' }],
    });
    expect(result.title).toBe('Pasta');
    expect(result.description).toContain('<b>great</b>');
    expect(result.instructions[0]).not.toContain('onerror');
    expect(result.ingredients[0].name).toBe('Flour');
    expect(result.ingredients[0].notes).toBe('fine');
  });

  it('sanitizes source and image URLs', () => {
    const result = sanitizeRecipeData({
      title: 'Test',
      sourceUrl: 'http://localhost:3000/evil',
      imageUrl: 'https://example.com/image.jpg',
    });
    expect(result.sourceUrl).toBeUndefined();
    expect(result.imageUrl).toBe('https://example.com/image.jpg');
  });
});

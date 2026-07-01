import { describe, it, expect, vi } from 'vitest';
import { validate, validateMultiple } from '../../middleware/validate';
import { z } from 'zod';

function mockReqResNext(overrides: { body?: any; query?: any; params?: any } = {}) {
  const req = {
    body: overrides.body ?? {},
    query: overrides.query ?? {},
    params: overrides.params ?? {},
  } as any;
  const res = {} as any;
  const next = vi.fn();
  return { req, res, next };
}

describe('validate middleware', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  it('passes validated body data to next', async () => {
    const middleware = validate(testSchema);
    const { req, res, next } = mockReqResNext({ body: { name: 'Alice', age: 30 } });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Alice', age: 30 });
  });

  it('calls next with AppError on validation failure', async () => {
    const middleware = validate(testSchema);
    const { req, res, next } = mockReqResNext({ body: { name: '', age: -1 } });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: expect.stringContaining('Validation failed'),
    }));
  });

  it('validates query params when source is query', async () => {
    const querySchema = z.object({
      page: z.string().optional(),
    });
    const middleware = validate(querySchema, 'query');
    const { req, res, next } = mockReqResNext({ query: { page: '1' } });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.query).toEqual({ page: '1' });
  });

  it('validates params when source is params', async () => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });
    const middleware = validate(paramsSchema, 'params');
    const { req, res, next } = mockReqResNext({
      params: { id: '550e8400-e29b-41d4-a716-446655440000' },
    });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('includes field names in error message', async () => {
    const middleware = validate(testSchema);
    const { req, res, next } = mockReqResNext({ body: {} });

    await middleware(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.message).toContain('name');
  });
});

describe('validateMultiple middleware', () => {
  it('validates body and params together', async () => {
    const middleware = validateMultiple({
      body: z.object({ name: z.string().min(1) }),
      params: z.object({ id: z.string().uuid() }),
    });
    const { req, res, next } = mockReqResNext({
      body: { name: 'Test' },
      params: { id: '550e8400-e29b-41d4-a716-446655440000' },
    });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('collects errors from multiple sources', async () => {
    const middleware = validateMultiple({
      body: z.object({ name: z.string().min(1) }),
      params: z.object({ id: z.string().uuid() }),
    });
    const { req, res, next } = mockReqResNext({
      body: {},
      params: { id: 'invalid' },
    });

    await middleware(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('body.');
    expect(error.message).toContain('params.');
  });
});

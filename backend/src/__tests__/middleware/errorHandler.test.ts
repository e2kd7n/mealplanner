import { describe, it, expect, vi, afterEach } from 'vitest';
import { AppError, errorHandler } from '../../middleware/errorHandler';

function mockReqRes() {
  const req = { url: '/test', method: 'GET' } as any;
  const jsonFn = vi.fn();
  const res = {
    status: vi.fn().mockReturnValue({ json: jsonFn }),
  } as any;
  const next = vi.fn();
  return { req, res, next, jsonFn };
}

describe('AppError', () => {
  it('creates error with status code', () => {
    const error = new AppError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });

  it('defaults to 500 status code', () => {
    const error = new AppError('Server error');
    expect(error.statusCode).toBe(500);
  });

  it('is an instance of Error', () => {
    const error = new AppError('test');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('errorHandler', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('handles AppError with correct status code', () => {
    const { req, res, next, jsonFn } = mockReqRes();
    const error = new AppError('Resource not found', 404);

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(jsonFn).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ message: 'Resource not found' }),
    }));
  });

  it('returns 500 for generic errors', () => {
    const { req, res, next, jsonFn } = mockReqRes();
    const error = new Error('Something broke');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonFn).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ message: 'Internal Server Error' }),
    }));
  });

  it('returns 400 for ValidationError', () => {
    const { req, res, next } = mockReqRes();
    const error = new Error('Invalid input');
    error.name = 'ValidationError';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 for JsonWebTokenError', () => {
    const { req, res, next } = mockReqRes();
    const error = new Error('jwt malformed');
    error.name = 'JsonWebTokenError';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for TokenExpiredError', () => {
    const { req, res, next } = mockReqRes();
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('includes stack trace in development', () => {
    process.env.NODE_ENV = 'development';
    const { req, res, next, jsonFn } = mockReqRes();
    const error = new AppError('Dev error', 400);

    errorHandler(error, req, res, next);

    const response = jsonFn.mock.calls[0][0];
    expect(response.error.stack).toBeDefined();
  });

  it('excludes stack trace in production', () => {
    process.env.NODE_ENV = 'production';
    const { req, res, next, jsonFn } = mockReqRes();
    const error = new AppError('Prod error', 400);

    errorHandler(error, req, res, next);

    const response = jsonFn.mock.calls[0][0];
    expect(response.error.stack).toBeUndefined();
  });
});

/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from './errorHandler';

/**
 * Validation middleware factory
 * Creates middleware that validates request body, query, or params against a Zod schema
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      
      // Validate and parse the data
      const validated = await schema.parseAsync(data);
      
      // Replace the original data with validated data
      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        req.query = validated as any;
      } else {
        req.params = validated as any;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a readable format
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return next(new AppError(`Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`, 400));
      }
      
      next(error);
    }
  };
};

/**
 * Validation middleware for multiple sources
 * Validates body, query, and params simultaneously
 */
export const validateMultiple = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const errors: string[] = [];
      
      // Validate body
      if (schemas.body) {
        try {
          req.body = await schemas.body.parseAsync(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.issues.map((err) => `body.${err.path.join('.')}: ${err.message}`));
          }
        }
      }
      
      // Validate query
      if (schemas.query) {
        try {
          req.query = await schemas.query.parseAsync(req.query) as any;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.issues.map((err) => `query.${err.path.join('.')}: ${err.message}`));
          }
        }
      }
      
      // Validate params
      if (schemas.params) {
        try {
          req.params = await schemas.params.parseAsync(req.params) as any;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.issues.map((err) => `params.${err.path.join('.')}: ${err.message}`));
          }
        }
      }
      
      if (errors.length > 0) {
        return next(new AppError(`Validation failed: ${errors.join(', ')}`, 400));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Made with Bob

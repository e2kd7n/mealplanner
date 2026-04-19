/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { AxiosError } from 'axios';

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Axios error
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    // Check for response data message
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    // Check for response data error
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    
    // Network error
    if (axiosError.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    // Timeout error
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    
    // Status-based messages
    if (axiosError.response?.status) {
      switch (axiosError.response.status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'You are not authorized. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return 'This action conflicts with existing data.';
        case 422:
          return 'Validation failed. Please check your input.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return `Request failed with status ${axiosError.response.status}`;
      }
    }
    
    return axiosError.message || 'Request failed';
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  // Object with message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error is an Axios error
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as any).isAxiosError === true
  );
}

/**
 * Parse error into AppError format
 */
export function parseError(error: unknown): AppError {
  const message = getErrorMessage(error);
  
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    return {
      message,
      code: axiosError.code,
      statusCode: axiosError.response?.status,
      details: axiosError.response?.data,
    };
  }

  return { message };
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.message === 'Network Error' || error.code === 'ECONNABORTED';
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.response?.status === 400 || error.response?.status === 422;
  }
  return false;
}

/**
 * Log error to console in development
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(context ? `[${context}]` : '[Error]', error);
  }
}

/**
 * Get user-friendly error title based on error type
 */
export function getErrorTitle(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Connection Error';
  }
  
  if (isAuthError(error)) {
    return 'Authentication Error';
  }
  
  if (isValidationError(error)) {
    return 'Validation Error';
  }
  
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status && axiosError.response.status >= 500) {
      return 'Server Error';
    }
  }
  
  return 'Error';
}

// Made with Bob
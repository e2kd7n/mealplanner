/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { useState, useCallback } from 'react';
import { getErrorMessage, parseError, logError } from '../utils/errorHandler';
import type { AppError } from '../utils/errorHandler';

interface UseErrorHandlerReturn {
  error: AppError | null;
  setError: (error: unknown) => void;
  clearError: () => void;
  handleError: (error: unknown, context?: string) => void;
}

/**
 * Custom hook for consistent error handling across components
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<AppError | null>(null);

  const setError = useCallback((error: unknown) => {
    if (error) {
      const parsedError = parseError(error);
      setErrorState(parsedError);
    } else {
      setErrorState(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleError = useCallback((error: unknown, context?: string) => {
    logError(error, context);
    setError(error);
  }, [setError]);

  return {
    error,
    setError,
    clearError,
    handleError,
  };
}

/**
 * Hook for handling async operations with loading and error states
 */
interface UseAsyncOperationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  successMessage?: string;
}

interface UseAsyncOperationReturn {
  loading: boolean;
  error: AppError | null;
  execute: (operation: () => Promise<any>) => Promise<void>;
  clearError: () => void;
}

export function useAsyncOperation(options: UseAsyncOperationOptions = {}): UseAsyncOperationReturn {
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();

  const execute = useCallback(async (operation: () => Promise<any>) => {
    setLoading(true);
    clearError();

    try {
      await operation();
      options.onSuccess?.();
    } catch (err) {
      handleError(err);
      options.onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError, options]);

  return {
    loading,
    error,
    execute,
    clearError,
  };
}

// Made with Bob
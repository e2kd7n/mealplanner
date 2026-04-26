/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { parseError, getErrorTitle } from '../utils/errorHandler';
import type { AppError } from '../utils/errorHandler';

export interface ErrorReportData {
  error: AppError;
  errorTitle: string;
  page: string;
  userAgent: string;
  timestamp: string;
  additionalContext?: string;
}

interface UseErrorReportReturn {
  reportError: (error: unknown, additionalContext?: string) => Promise<void>;
  isReporting: boolean;
  reportSuccess: boolean;
  openReportDialog: (error: unknown, additionalContext?: string) => void;
  closeReportDialog: () => void;
  reportDialogOpen: boolean;
  currentErrorData: ErrorReportData | null;
}

/**
 * Hook for reporting errors through the feedback system
 */
export function useErrorReport(): UseErrorReportReturn {
  const location = useLocation();
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [currentErrorData, setCurrentErrorData] = useState<ErrorReportData | null>(null);

  const createErrorReportData = useCallback((error: unknown, additionalContext?: string): ErrorReportData => {
    const parsedError = parseError(error);
    const errorTitle = getErrorTitle(error);
    
    return {
      error: parsedError,
      errorTitle,
      page: location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      additionalContext,
    };
  }, [location.pathname]);

  const reportError = useCallback(async (error: unknown, additionalContext?: string) => {
    try {
      setIsReporting(true);
      setReportSuccess(false);

      const errorData = createErrorReportData(error, additionalContext);

      // Format error report message
      const message = `
**Error Report**

**Error:** ${errorData.errorTitle}
**Message:** ${errorData.error.message}
${errorData.error.code ? `**Code:** ${errorData.error.code}` : ''}
${errorData.error.statusCode ? `**Status Code:** ${errorData.error.statusCode}` : ''}

**Page:** ${errorData.page}
**Timestamp:** ${errorData.timestamp}
${errorData.additionalContext ? `\n**Additional Context:**\n${errorData.additionalContext}` : ''}

**Technical Details:**
\`\`\`json
${JSON.stringify(errorData.error.details || {}, null, 2)}
\`\`\`

**User Agent:** ${errorData.userAgent}
      `.trim();

      // Submit as bug report through feedback system
      await api.post('/feedback', {
        page: errorData.page,
        feedbackType: 'bug',
        rating: 1, // Low rating for errors
        message,
        screenshot: null, // Could be enhanced to capture screenshot
      });

      setReportSuccess(true);
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setReportSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to report error:', err);
      throw err;
    } finally {
      setIsReporting(false);
    }
  }, [createErrorReportData]);

  const openReportDialog = useCallback((error: unknown, additionalContext?: string) => {
    const errorData = createErrorReportData(error, additionalContext);
    setCurrentErrorData(errorData);
    setReportDialogOpen(true);
  }, [createErrorReportData]);

  const closeReportDialog = useCallback(() => {
    setReportDialogOpen(false);
    setCurrentErrorData(null);
  }, []);

  return {
    reportError,
    isReporting,
    reportSuccess,
    openReportDialog,
    closeReportDialog,
    reportDialogOpen,
    currentErrorData,
  };
}

// Made with Bob
/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { BugReport as BugReportIcon } from '@mui/icons-material';
import { useErrorReport } from '../hooks/useErrorReport';
import ErrorReportDialog from './ErrorReportDialog';

interface ErrorAlertProps {
  error: unknown;
  title?: string;
  onClose?: () => void;
  severity?: 'error' | 'warning';
  showReportButton?: boolean;
  additionalContext?: string;
  sx?: SxProps<Theme>;
}

/**
 * Reusable error alert component with optional error reporting
 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  title = 'Error',
  onClose,
  severity = 'error',
  showReportButton = true,
  additionalContext,
  sx,
}) => {
  const {
    openReportDialog,
    closeReportDialog,
    reportDialogOpen,
    currentErrorData,
  } = useErrorReport();

  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : 'An unexpected error occurred';

  const handleReportClick = () => {
    openReportDialog(error, additionalContext);
  };

  return (
    <>
      <Alert
        severity={severity}
        onClose={onClose}
        sx={sx}
        action={
          showReportButton && (
            <Button
              color="inherit"
              size="small"
              startIcon={<BugReportIcon />}
              onClick={handleReportClick}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Report
            </Button>
          )
        }
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {errorMessage}
        </Box>
      </Alert>

      <ErrorReportDialog
        open={reportDialogOpen}
        onClose={closeReportDialog}
        errorData={currentErrorData}
      />
    </>
  );
};

export default ErrorAlert;

// Made with Bob
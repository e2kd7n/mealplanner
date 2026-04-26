/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  IconButton,
  Stack,
  CircularProgress,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  BugReport as BugIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import api from '../services/api';
import type { ErrorReportData } from '../hooks/useErrorReport';

interface ErrorReportDialogProps {
  open: boolean;
  onClose: () => void;
  errorData: ErrorReportData | null;
}

const ErrorReportDialog: React.FC<ErrorReportDialogProps> = ({
  open,
  onClose,
  errorData,
}) => {
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handleClose = () => {
    if (!submitting) {
      setAdditionalInfo('');
      setError(null);
      setSuccess(false);
      setShowTechnicalDetails(false);
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!errorData) return;

    try {
      setSubmitting(true);
      setError(null);

      // Format error report message
      const message = `
**Error Report**

**Error:** ${errorData.errorTitle}
**Message:** ${errorData.error.message}
${errorData.error.code ? `**Code:** ${errorData.error.code}` : ''}
${errorData.error.statusCode ? `**Status Code:** ${errorData.error.statusCode}` : ''}

**Page:** ${errorData.page}
**Timestamp:** ${errorData.timestamp}

${additionalInfo.trim() ? `**User Description:**\n${additionalInfo.trim()}\n` : ''}
${errorData.additionalContext ? `**Additional Context:**\n${errorData.additionalContext}\n` : ''}

**Technical Details:**
\`\`\`json
${JSON.stringify(errorData.error.details || {}, null, 2)}
\`\`\`

**User Agent:** ${errorData.userAgent}
      `.trim();

      await api.post('/feedback', {
        page: errorData.page,
        feedbackType: 'bug',
        rating: 1,
        message,
        screenshot: null,
      });

      setSuccess(true);

      // Close dialog after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error report submission failed:', err);
      setError(err.response?.data?.message || 'Failed to submit error report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!errorData) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="error-report-dialog-title"
    >
      <DialogTitle id="error-report-dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <BugIcon color="error" />
            <Typography variant="h6">Report Error</Typography>
          </Box>
          <IconButton
            edge="end"
            onClick={handleClose}
            disabled={submitting}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Thank you for reporting this error! Our team will investigate and work on a fix.
          </Alert>
        ) : (
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Alert severity="info" icon={<BugIcon />}>
              <Typography variant="body2">
                Help us fix this issue by providing additional details about what you were doing when the error occurred.
              </Typography>
            </Alert>

            <Box>
              <Typography variant="subtitle2" gutterBottom color="error">
                {errorData.errorTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {errorData.error.message}
              </Typography>
              
              {errorData.error.statusCode && (
                <Chip
                  label={`Status: ${errorData.error.statusCode}`}
                  size="small"
                  color="error"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>

            <TextField
              label="What were you trying to do? (Optional)"
              multiline
              rows={4}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Please describe what you were doing when this error occurred..."
              disabled={submitting}
              fullWidth
              inputProps={{
                maxLength: 1000,
              }}
              helperText={`${additionalInfo.length}/1000 characters`}
            />

            <Box>
              <Button
                startIcon={showTechnicalDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                size="small"
                variant="text"
              >
                {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
              <Collapse in={showTechnicalDetails}>
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 200,
                  }}
                >
                  <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                    Page: {errorData.page}
                    {'\n'}Time: {new Date(errorData.timestamp).toLocaleString()}
                    {errorData.error.code && `\nCode: ${errorData.error.code}`}
                    {errorData.error.details && `\n\nDetails:\n${JSON.stringify(errorData.error.details, null, 2)}`}
                  </Typography>
                </Box>
              </Collapse>
            </Box>

            <Typography variant="caption" color="text.secondary">
              This report will be sent to our development team for investigation.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        {!success && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="error"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {submitting ? 'Sending...' : 'Send Report'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ErrorReportDialog;

// Made with Bob
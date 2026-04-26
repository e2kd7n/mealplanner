/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Error as ErrorIcon, BugReport as BugReportIcon } from '@mui/icons-material';
import logger from '../utils/logger';
import ErrorReportDialog from './ErrorReportDialog';
import type { ErrorReportData } from '../hooks/useErrorReport';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showReportDialog: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showReportDialog: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Log error using the centralized logger
    logger.error(
      error.message,
      'ErrorBoundary',
      {
        componentStack: errorInfo.componentStack,
        errorName: error.name,
      },
      error
    );
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showReportDialog: false,
    });
    // Reload the page to reset the app state
    window.location.href = '/';
  };

  handleOpenReportDialog = () => {
    this.setState({ showReportDialog: true });
  };

  handleCloseReportDialog = () => {
    this.setState({ showReportDialog: false });
  };

  getErrorReportData = (): ErrorReportData | null => {
    if (!this.state.error) return null;

    return {
      error: {
        message: this.state.error.message,
        code: this.state.error.name,
        details: {
          componentStack: this.state.errorInfo?.componentStack,
        },
      },
      errorTitle: 'Application Error',
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      additionalContext: 'Error caught by ErrorBoundary',
    };
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              py: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                maxWidth: 600,
              }}
            >
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              <Typography variant="h4" gutterBottom>
                Oops! Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We're sorry for the inconvenience. An unexpected error has occurred.
              </Typography>

              {import.meta.env.DEV && this.state.error && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    textAlign: 'left',
                    overflow: 'auto',
                    maxHeight: 300,
                  }}
                >
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Error Details (Development Only):
                  </Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo && (
                      <>
                        {'\n\n'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={this.handleReset}
                  size="large"
                >
                  Return to Home
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                  size="large"
                >
                  Reload Page
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<BugReportIcon />}
                  onClick={this.handleOpenReportDialog}
                  size="large"
                >
                  Report Error
                </Button>
              </Box>

              <ErrorReportDialog
                open={this.state.showReportDialog}
                onClose={this.handleCloseReportDialog}
                errorData={this.getErrorReportData()}
              />
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Made with Bob
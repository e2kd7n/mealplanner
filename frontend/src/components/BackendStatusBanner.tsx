/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, Button, Collapse, IconButton } from '@mui/material';
import { Close as CloseIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import axios from 'axios';

const BackendStatusBanner: React.FC = () => {
  const [isBackendDown, setIsBackendDown] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Only show in development mode
  const isDevelopment = import.meta.env.DEV;
  const showBanner = import.meta.env.VITE_SHOW_BACKEND_STATUS !== 'false';

  const checkBackendHealth = async () => {
    if (!isDevelopment || !showBanner) return;

    try {
      setIsChecking(true);
      const response = await axios.get('/api/health', {
        timeout: 3000,
      });
      
      if (response.status === 200) {
        setIsBackendDown(false);
        setIsDismissed(false);
      }
    } catch (error: any) {
      // Check if it's a connection error
      const isConnectionError = 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('ERR_CONNECTION_REFUSED') ||
        !error.response;

      if (isConnectionError) {
        setIsBackendDown(true);
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!isDevelopment || !showBanner) return;

    // Initial check
    checkBackendHealth();

    // Periodic health check every 10 seconds
    const interval = setInterval(checkBackendHealth, 10000);

    return () => clearInterval(interval);
  }, [isDevelopment, showBanner]);

  const handleRetry = () => {
    setIsDismissed(false);
    checkBackendHealth();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (!isDevelopment || !showBanner || !isBackendDown || isDismissed) {
    return null;
  }

  return (
    <Collapse in={isBackendDown && !isDismissed}>
      <Alert
        severity="error"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          borderRadius: 0,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
        action={
          <>
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              disabled={isChecking}
              startIcon={<RefreshIcon />}
              sx={{ mr: 1 }}
            >
              {isChecking ? 'Checking...' : 'Retry'}
            </Button>
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleDismiss}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </>
        }
      >
        <AlertTitle>Backend Server Not Running</AlertTitle>
        The backend API server is not reachable. Please start the backend server to use the application.
        <br />
        <strong>Run:</strong> <code>cd backend && npm run dev</code>
      </Alert>
    </Collapse>
  );
};

export default BackendStatusBanner;

// Made with Bob

/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { Alert, Snackbar, Button, Box } from '@mui/material';
import { WifiOff as WifiOffIcon } from '@mui/icons-material';

/**
 * D1-2 FIX: Global offline detector component
 * Provides user-friendly feedback when the application goes offline
 * and offers retry functionality when connection is restored
 */
const OfflineDetector: React.FC = () => {
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setShowOfflineAlert(false);
      setShowOnlineAlert(true);
      // Auto-hide the "back online" message after 3 seconds
      setTimeout(() => setShowOnlineAlert(false), 3000);
    };

    const handleOffline = () => {
      setShowOfflineAlert(true);
      setShowOnlineAlert(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    // Reload the page to retry failed requests
    window.location.reload();
  };

  return (
    <>
      {/* Persistent offline banner */}
      {showOfflineAlert && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: 'error.main',
            color: 'error.contrastText',
            py: 1,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            boxShadow: 3,
          }}
        >
          <WifiOffIcon />
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <strong>You're offline</strong> — Some features may not be available. 
            Check your internet connection.
          </Box>
        </Box>
      )}

      {/* Back online notification */}
      <Snackbar
        open={showOnlineAlert}
        autoHideDuration={3000}
        onClose={() => setShowOnlineAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setShowOnlineAlert(false)}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          You're back online! Click Retry to reload any failed content.
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineDetector;

// Made with Bob
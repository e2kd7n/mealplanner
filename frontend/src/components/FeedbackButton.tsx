/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useState } from 'react';
import { Fab, Tooltip, useTheme, useMediaQuery, Box, Snackbar, Alert } from '@mui/material';
import type { SnackbarCloseReason } from '@mui/material';
import { ChatBubbleOutline as FeedbackIcon } from '@mui/icons-material';
import FeedbackDialog from './FeedbackDialog';

const FeedbackButton: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpen = () => {
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  const handleSuccess = () => {
    setToastOpen(true);
  };

  const handleToastClose = (_event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') return;
    setToastOpen(false);
  };

  return (
    <>
      <Tooltip title="Share Feedback" placement="left">
        <Fab
          size="large"
          color="primary"
          aria-label="Open feedback form"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: isMobile ? 88 : 24,
            right: isMobile ? 16 : 24,
            zIndex: 1300,
            boxShadow: 3,
            width: 56,
            height: 56,
            '&:hover': {
              boxShadow: 6,
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <Box
            component={FeedbackIcon}
            sx={{ fontSize: 28 }}
            aria-hidden="true"
          />
        </Fab>
      </Tooltip>

      <FeedbackDialog open={dialogOpen} onClose={handleClose} onSuccess={handleSuccess} />

      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Thank you for your feedback! It helps us improve the app.
        </Alert>
      </Snackbar>
    </>
  );
};

export default FeedbackButton;

// Made with Bob

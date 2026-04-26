/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useState } from 'react';
import { Fab, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import { Feedback as FeedbackIcon } from '@mui/icons-material';
import FeedbackDialog from './FeedbackDialog';

const FeedbackButton: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpen = () => {
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Tooltip title="Share Feedback" placement="left">
        <Fab
          color="primary"
          aria-label="feedback"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: isMobile ? 16 : 24,
            right: isMobile ? 16 : 24,
            zIndex: 1000,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <FeedbackIcon />
        </Fab>
      </Tooltip>

      <FeedbackDialog open={dialogOpen} onClose={handleClose} />
    </>
  );
};

export default FeedbackButton;

// Made with Bob

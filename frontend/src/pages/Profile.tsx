/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Profile: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          User profile management coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default Profile;

// Made with Bob

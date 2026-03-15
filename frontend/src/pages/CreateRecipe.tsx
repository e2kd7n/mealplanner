import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const CreateRecipe: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create Recipe
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Recipe creation form coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default CreateRecipe;

// Made with Bob

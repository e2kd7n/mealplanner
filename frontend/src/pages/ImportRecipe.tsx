/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
import {
  Link as LinkIcon,
  Check as CheckIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { recipeImportAPI } from '../services/api';

interface ParsedRecipe {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  cuisineType?: string;
  mealType: string;
  imageUrl?: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
  instructions: any;
  nutritionInfo?: any;
  sourceUrl: string;
}

export default function ImportRecipe() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [saving, setSaving] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');
    setParsedRecipe(null);

    try {
      const response = await recipeImportAPI.importFromUrl(url);
      setParsedRecipe(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import recipe. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedRecipe) return;

    setSaving(true);
    setError('');

    try {
      const response = await recipeImportAPI.saveImported(parsedRecipe);
      const recipeId = response.data.data.id;
      navigate(`/recipes/${recipeId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save recipe');
      setSaving(false);
    }
  };

  const handleEdit = () => {
    // Navigate to create recipe page with pre-filled data
    navigate('/recipes/create', { state: { importedRecipe: parsedRecipe } });
  };

  const formatInstructions = (instructions: any): string[] => {
    if (Array.isArray(instructions)) {
      return instructions.map((inst: any) => 
        typeof inst === 'string' ? inst : inst.instruction || inst.text || ''
      );
    }
    return [];
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Import Recipe from URL
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Enter a recipe URL to automatically import the recipe details
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            label="Recipe URL"
            placeholder="https://example.com/recipe"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading || !!parsedRecipe}
            error={!!error && !parsedRecipe}
            helperText={error && !parsedRecipe ? error : 'Paste a link to a recipe from any website'}
            InputProps={{
              startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={loading || !!parsedRecipe}
            sx={{ minWidth: 120, height: 56 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Import'}
          </Button>
        </Box>
      </Paper>

      {error && parsedRecipe && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {parsedRecipe && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">
              Recipe Preview
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                disabled={saving}
              >
                Edit Before Saving
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <CheckIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Recipe'}
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {parsedRecipe.imageUrl && (
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardMedia
                    component="img"
                    height="250"
                    image={parsedRecipe.imageUrl}
                    alt={parsedRecipe.title}
                    sx={{ objectFit: 'cover' }}
                  />
                </Card>
              </Grid>
            )}

            <Grid size={{ xs: 12, md: parsedRecipe.imageUrl ? 8 : 12 }}>
              <Typography variant="h6" gutterBottom>
                {parsedRecipe.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {parsedRecipe.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={`${parsedRecipe.prepTime + parsedRecipe.cookTime} min`} size="small" />
                <Chip label={`${parsedRecipe.servings} servings`} size="small" />
                <Chip label={parsedRecipe.difficulty} size="small" color="primary" />
                <Chip label={parsedRecipe.mealType} size="small" />
                {parsedRecipe.cuisineType && (
                  <Chip label={parsedRecipe.cuisineType} size="small" variant="outlined" />
                )}
              </Box>

              <Typography variant="caption" color="text.secondary">
                Source: {parsedRecipe.sourceUrl}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ingredients ({parsedRecipe.ingredients.length})
                  </Typography>
                  <List dense>
                    {parsedRecipe.ingredients.map((ing, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${ing.quantity} ${ing.unit} ${ing.name}`}
                          secondary={ing.notes}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Instructions ({formatInstructions(parsedRecipe.instructions).length} steps)
                  </Typography>
                  <List dense>
                    {formatInstructions(parsedRecipe.instructions).map((instruction, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${index + 1}. ${instruction}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {parsedRecipe.nutritionInfo && (
              <Grid size={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Nutrition Information
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {parsedRecipe.nutritionInfo.calories && (
                        <Chip label={`${parsedRecipe.nutritionInfo.calories} cal`} />
                      )}
                      {parsedRecipe.nutritionInfo.protein && (
                        <Chip label={`${parsedRecipe.nutritionInfo.protein}g protein`} />
                      )}
                      {parsedRecipe.nutritionInfo.carbs && (
                        <Chip label={`${parsedRecipe.nutritionInfo.carbs}g carbs`} />
                      )}
                      {parsedRecipe.nutritionInfo.fat && (
                        <Chip label={`${parsedRecipe.nutritionInfo.fat}g fat`} />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setParsedRecipe(null);
                setUrl('');
                setError('');
              }}
            >
              Import Another Recipe
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <CheckIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Recipe'}
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
}

// Made with Bob

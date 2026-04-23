/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccessTime as TimeIcon,
  Restaurant as RestaurantIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAppDispatch } from '../store/hooks';
import { getSpoonacularRecipeDetails, addSpoonacularRecipeToBox } from '../store/slices/recipeBrowseSlice';

interface SpoonacularRecipeDialogProps {
  open: boolean;
  recipeId: number | null;
  onClose: () => void;
}

const SpoonacularRecipeDialog: React.FC<SpoonacularRecipeDialogProps> = ({
  open,
  recipeId,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (open && recipeId) {
      const fetchDetails = async () => {
        try {
          setLoading(true);
          setError(null);
          const result = await dispatch(getSpoonacularRecipeDetails(recipeId)).unwrap();
          setRecipe(result);
        } catch (err: any) {
          setError(err || 'Failed to load recipe details');
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setRecipe(null);
      setAdded(false);
    }
  }, [open, recipeId, dispatch]);

  const handleAddToBox = async () => {
    if (!recipeId) return;
    try {
      setAdding(true);
      await dispatch(addSpoonacularRecipeToBox(recipeId)).unwrap();
      setAdded(true);
    } catch (err: any) {
      // Check if it's a duplicate error (409)
      if (err?.includes('already in your recipe box')) {
        setAdded(true);
      }
      // Other errors handled by Redux
    } finally {
      setAdding(false);
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="div">
            {recipe?.title || 'Recipe Details'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {recipe && !loading && (
          <Box>
            {/* Image */}
            {recipe.image && (
              <Box
                component="img"
                src={recipe.image}
                alt={recipe.title}
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'cover',
                  borderRadius: 1,
                  mb: 3,
                }}
              />
            )}

            {/* Meta Information */}
            <Stack direction="row" spacing={2} flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
              {recipe.readyInMinutes && (
                <Chip
                  icon={<TimeIcon />}
                  label={`${recipe.readyInMinutes} minutes`}
                  color="primary"
                  variant="outlined"
                />
              )}
              {recipe.servings && (
                <Chip
                  icon={<RestaurantIcon />}
                  label={`${recipe.servings} servings`}
                  color="primary"
                  variant="outlined"
                />
              )}
              {recipe.cuisines && recipe.cuisines.length > 0 && (
                <Chip
                  label={recipe.cuisines.join(', ')}
                  variant="outlined"
                />
              )}
            </Stack>

            {/* Diets */}
            {recipe.diets && recipe.diets.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Dietary Information
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {recipe.diets.map((diet: string) => (
                    <Chip key={diet} label={diet} size="small" color="success" />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Summary */}
            {recipe.summary && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  About This Recipe
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stripHtml(recipe.summary)}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Ingredients */}
            {recipe.extendedIngredients && recipe.extendedIngredients.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Ingredients
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {recipe.extendedIngredients.map((ing: any, index: number) => (
                    <Typography component="li" key={index} variant="body2" sx={{ mb: 0.5 }}>
                      {ing.original}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Instructions */}
            {recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Instructions
                </Typography>
                {recipe.analyzedInstructions[0].steps.map((step: any) => (
                  <Box key={step.number} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">
                      Step {step.number}
                    </Typography>
                    <Typography variant="body2">{step.step}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Nutrition */}
            {recipe.nutrition?.nutrients && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Nutrition (per serving)
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                  {recipe.nutrition.nutrients.slice(0, 6).map((nutrient: any) => (
                    <Chip
                      key={nutrient.name}
                      label={`${nutrient.name}: ${Math.round(nutrient.amount)}${nutrient.unit}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Source URL */}
            {recipe.sourceUrl && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Source:{' '}
                  <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {recipe.sourceUrl}
                  </a>
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {recipe && (
          <Button
            variant={added ? 'outlined' : 'contained'}
            startIcon={added ? <CheckCircleIcon /> : <AddIcon />}
            onClick={handleAddToBox}
            disabled={adding || added}
            color={added ? 'success' : 'primary'}
          >
            {added ? 'In Recipe Box' : adding ? 'Adding...' : 'Add to Recipe Box'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SpoonacularRecipeDialog;

// Made with Bob
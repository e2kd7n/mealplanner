/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Stack,
  Skeleton,
  Container,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingIcon,
  Explore as ExploreIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { searchSpoonacularRecipes, addSpoonacularRecipeToBox } from '../store/slices/recipeBrowseSlice';
import { useCachedImage } from '../hooks/useCachedImage';
import SpoonacularRecipeDialog from './SpoonacularRecipeDialog';

interface RecipeCardProps {
  recipe: any;
  onAdd: (id: number) => void;
  onView: (id: number) => void;
}

const QuickRecipeCard: React.FC<RecipeCardProps> = ({ recipe, onAdd, onView }) => {
  const { src: imageSrc, isLoading: imageLoading } = useCachedImage(recipe.image);
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdding(true);
    await onAdd(recipe.id);
    setAdding(false);
  };

  const handleView = () => {
    onView(recipe.id);
  };

  return (
    <Card
      onClick={handleView}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <Box sx={{ position: 'relative', height: 180 }}>
        {imageLoading ? (
          <Skeleton variant="rectangular" height={180} animation="wave" />
        ) : (
          <CardMedia
            component="img"
            height="180"
            image={imageSrc}
            alt={recipe.title}
            sx={{ objectFit: 'cover' }}
          />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography variant="h6" gutterBottom noWrap sx={{ fontSize: '1rem' }}>
          {recipe.title}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
          {recipe.readyInMinutes && (
            <Chip
              icon={<TimeIcon />}
              label={`${recipe.readyInMinutes} min`}
              size="small"
              variant="outlined"
            />
          )}
          {recipe.servings && (
            <Chip
              label={`${recipe.servings} servings`}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
      </CardContent>
      <CardActions sx={{ pt: 0, gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={handleView}
          sx={{ flex: 1 }}
        >
          View
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={adding}
          sx={{ flex: 1 }}
        >
          {adding ? 'Adding...' : 'Add'}
        </Button>
      </CardActions>
    </Card>
  );
};

const RecipeDiscoveryEmptyState: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [trendingRecipes, setTrendingRecipes] = useState<any[]>([]);
  const [quickDinners, setQuickDinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        
        // Fetch trending recipes (popular)
        const trendingResult = await dispatch(
          searchSpoonacularRecipes({
            query: '',
            number: 6,
            sort: 'popularity',
          })
        ).unwrap();
        
        // Fetch quick dinner recipes
        const quickResult = await dispatch(
          searchSpoonacularRecipes({
            query: 'dinner',
            number: 6,
            maxReadyTime: 30,
            sort: 'time',
          })
        ).unwrap();

        setTrendingRecipes(trendingResult.results || []);
        setQuickDinners(quickResult.results || []);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching recipe suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [dispatch]);

  const handleAddRecipe = async (recipeId: number) => {
    try {
      await dispatch(addSpoonacularRecipeToBox(recipeId)).unwrap();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error adding recipe:', error);
    }
  };

  const handleViewRecipe = (recipeId: number) => {
    setSelectedRecipeId(recipeId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRecipeId(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <RestaurantIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Welcome to Your Recipe Collection!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
          Start building your personalized recipe collection. Browse thousands of recipes, 
          import from your favorite sites, or create your own from scratch.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" gap={2}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/recipes/create')}
          >
            Create Recipe
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<ExploreIcon />}
            onClick={() => navigate('/recipes?tab=1')}
          >
            Browse Recipes
          </Button>
        </Stack>
      </Box>

      {/* Trending Recipes Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TrendingIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5">
            Trending Recipes
          </Typography>
        </Box>
        {loading ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(6, 1fr)',
              },
              gap: 3,
            }}
          >
            {[...Array(6)].map((_, index) => (
              <Card key={index}>
                <Skeleton variant="rectangular" height={180} />
                <CardContent>
                  <Skeleton variant="text" width="80%" height={24} />
                  <Skeleton variant="text" width="60%" height={20} />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : trendingRecipes.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(6, 1fr)',
              },
              gap: 3,
            }}
          >
            {trendingRecipes.map((recipe) => (
              <QuickRecipeCard key={recipe.id} recipe={recipe} onAdd={handleAddRecipe} onView={handleViewRecipe} />
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">
            No trending recipes available at the moment.
          </Typography>
        )}
      </Box>

      {/* Quick Dinners Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TimeIcon sx={{ mr: 1, color: 'success.main' }} />
          <Typography variant="h5">
            Quick Dinners (Under 30 Minutes)
          </Typography>
        </Box>
        {loading ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(6, 1fr)',
              },
              gap: 3,
            }}
          >
            {[...Array(6)].map((_, index) => (
              <Card key={index}>
                <Skeleton variant="rectangular" height={180} />
                <CardContent>
                  <Skeleton variant="text" width="80%" height={24} />
                  <Skeleton variant="text" width="60%" height={20} />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : quickDinners.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(6, 1fr)',
              },
              gap: 3,
            }}
          >
            {quickDinners.map((recipe) => (
              <QuickRecipeCard key={recipe.id} recipe={recipe} onAdd={handleAddRecipe} onView={handleViewRecipe} />
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">
            No quick dinner recipes available at the moment.
          </Typography>
        )}
      </Box>

      {/* Call to Action */}
      <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Ready to explore more?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Browse thousands of recipes from around the world
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<ExploreIcon />}
          onClick={() => navigate('/recipes?tab=1')}
        >
          Browse All Recipes
        </Button>
      </Box>

      {/* Recipe Details Dialog */}
      <SpoonacularRecipeDialog
        open={dialogOpen}
        recipeId={selectedRecipeId}
        onClose={handleCloseDialog}
      />
    </Container>
  );
};

export default RecipeDiscoveryEmptyState;

// Made with Bob

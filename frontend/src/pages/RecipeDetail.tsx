import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  Card,
  CardMedia,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccessTime as TimeIcon,
  Restaurant as RestaurantIcon,
  People as PeopleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchRecipeById, clearCurrentRecipe } from '../store/slices/recipeSlice';

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentRecipe: recipe, loading, error } = useAppSelector((state) => state.recipes);

  useEffect(() => {
    if (id) {
      dispatch(fetchRecipeById(id));
    }
    return () => {
      dispatch(clearCurrentRecipe());
    };
  }, [dispatch, id]);

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/recipes')}
          sx={{ mt: 2 }}
        >
          Back to Recipes
        </Button>
      </Container>
    );
  }

  if (!recipe) {
    return (
      <Container maxWidth="lg">
        <Alert severity="info" sx={{ mt: 4 }}>
          Recipe not found
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/recipes')}
          sx={{ mt: 2 }}
        >
          Back to Recipes
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/recipes')}
            sx={{ mb: 2 }}
          >
            Back to Recipes
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h3" gutterBottom>
                {recipe.title}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Chip
                  label={recipe.difficulty}
                  color={getDifficultyColor(recipe.difficulty)}
                />
                <Chip
                  icon={<TimeIcon />}
                  label={`Prep: ${recipe.prepTime} min`}
                  variant="outlined"
                />
                <Chip
                  icon={<TimeIcon />}
                  label={`Cook: ${recipe.cookTime} min`}
                  variant="outlined"
                />
                <Chip
                  icon={<PeopleIcon />}
                  label={`${recipe.servings} servings`}
                  variant="outlined"
                />
                <Chip
                  label={recipe.mealType}
                  variant="outlined"
                />
                {recipe.cuisineType && (
                  <Chip
                    icon={<RestaurantIcon />}
                    label={recipe.cuisineType}
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/recipes/${id}/edit`)}
            >
              Edit
            </Button>
          </Box>
        </Box>

        {/* Image */}
        {recipe.imageUrl && (
          <Card sx={{ mb: 4 }}>
            <CardMedia
              component="img"
              height="400"
              image={recipe.imageUrl}
              alt={recipe.title}
              sx={{ objectFit: 'cover' }}
            />
          </Card>
        )}

        {/* Description */}
        {recipe.description && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {recipe.description}
            </Typography>
          </Paper>
        )}

        {/* Ingredients & Instructions Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
            gap: 3,
          }}
        >
          {/* Ingredients */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Ingredients
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {/* Placeholder - will be populated from recipe.ingredients */}
              <ListItem>
                <ListItemText
                  primary="Ingredients will be loaded from the API"
                  secondary="This section will display all recipe ingredients with quantities"
                />
              </ListItem>
            </List>
          </Paper>

          {/* Instructions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Instructions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {/* Placeholder - will be populated from recipe.instructions */}
              <ListItem>
                <ListItemText
                  primary="Step-by-step instructions will be loaded from the API"
                  secondary="This section will display cooking instructions in order"
                />
              </ListItem>
            </List>
          </Paper>
        </Box>

        {/* Nutrition Info */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Nutrition Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Nutrition information per serving will be displayed here
          </Typography>
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/meal-planner')}
          >
            Add to Meal Plan
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/grocery-list')}
          >
            Add to Grocery List
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default RecipeDetail;

// Made with Bob

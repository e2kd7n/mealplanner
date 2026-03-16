/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import React, { useEffect, useState, memo, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccessTime as TimeIcon,
  Restaurant as RestaurantIcon,
  Add as AddIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchRecipes } from '../store/slices/recipesSlice';
import { useDebounce } from '../hooks/useDebounce';
import { useCachedImage } from '../hooks/useCachedImage';

// Memoized Recipe Card Component for better performance
interface RecipeCardProps {
  recipe: any;
  onNavigate: (id: string) => void;
}

const RecipeCard = memo(({ recipe, onNavigate }: RecipeCardProps) => {
  const { src: imageSrc, isLoading: imageLoading } = useCachedImage(recipe.imageUrl);

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
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

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          cursor: 'pointer',
        },
      }}
      onClick={() => onNavigate(recipe.id)}
    >
      <Box sx={{ position: 'relative', height: 200 }}>
        <CardMedia
          component="img"
          height="200"
          image={imageSrc}
          alt={recipe.title}
          sx={{ objectFit: 'cover' }}
        />
        {imageLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <CircularProgress size={30} />
          </Box>
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom noWrap>
          {recipe.title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {recipe.description || 'No description available'}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          <Tooltip title={`Difficulty: ${recipe.difficulty}`} arrow>
            <Chip
              label={recipe.difficulty}
              size="small"
              color={getDifficultyColor(recipe.difficulty)}
            />
          </Tooltip>
          <Tooltip
            title={`Prep: ${recipe.prepTime} min | Cook: ${recipe.cookTime} min`}
            arrow
          >
            <Chip
              icon={<TimeIcon />}
              label={`${recipe.prepTime + recipe.cookTime} min`}
              size="small"
              variant="outlined"
            />
          </Tooltip>
          <Tooltip title={`Meal type: ${recipe.mealType}`} arrow>
            <Chip
              label={recipe.mealType}
              size="small"
              variant="outlined"
            />
          </Tooltip>
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(recipe.id);
          }}
        >
          View Recipe
        </Button>
      </CardActions>
    </Card>
  );
});

RecipeCard.displayName = 'RecipeCard';

const Recipes: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { recipes, loading, error, pagination } = useAppSelector((state) => state.recipes);

  const [searchInput, setSearchInput] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [mealType, setMealType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input to reduce API calls
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    const params: any = { page: currentPage, limit: 12 };
    if (debouncedSearch) params.search = debouncedSearch;
    if (difficulty) params.difficulty = difficulty;
    if (mealType) params.mealType = mealType;

    dispatch(fetchRecipes(params));
  }, [dispatch, currentPage, debouncedSearch, difficulty, mealType]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (debouncedSearch !== searchInput) {
      setCurrentPage(1);
    }
  }, [debouncedSearch, searchInput]);

  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigate = useCallback((id: string) => {
    navigate(`/recipes/${id}`);
  }, [navigate]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Recipes
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={() => navigate('/recipes/import')}
            >
              Import from URL
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/recipes/create')}
            >
              Create Recipe
            </Button>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search recipes..."
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={difficulty}
              label="Difficulty"
              onChange={(e) => {
                setDifficulty(e.target.value);
                setCurrentPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="EASY">Easy</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HARD">Hard</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Meal Type</InputLabel>
            <Select
              value={mealType}
              label="Meal Type"
              onChange={(e) => {
                setMealType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="BREAKFAST">Breakfast</MenuItem>
              <MenuItem value="LUNCH">Lunch</MenuItem>
              <MenuItem value="DINNER">Dinner</MenuItem>
              <MenuItem value="SNACK">Snack</MenuItem>
              <MenuItem value="DESSERT">Dessert</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : recipes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <RestaurantIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No recipes found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try adjusting your search or filters
            </Typography>
          </Box>
        ) : (
          <>
            {/* Recipe Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 3,
                mb: 4,
              }}
            >
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onNavigate={handleNavigate}
                />
              ))}
            </Box>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default Recipes;

// Made with Bob

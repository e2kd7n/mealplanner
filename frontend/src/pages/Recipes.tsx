/**
 * Copyright (c) 2026 e2kd7n
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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccessTime as TimeIcon,
  Restaurant as RestaurantIcon,
  Add as AddIcon,
  Link as LinkIcon,
  Explore as ExploreIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchRecipes } from '../store/slices/recipesSlice';
import { useDebounce } from '../hooks/useDebounce';
import { useCachedImage } from '../hooks/useCachedImage';
import BrowseRecipes from './BrowseRecipes';

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
          aria-label={`View ${recipe.title} recipe`}
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state
  const [activeTab, setActiveTab] = useState(Number(searchParams.get('tab')) || 0);

  // Initialize state from URL query parameters
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [mealType, setMealType] = useState(searchParams.get('mealType') || '');
  const [cleanupScore, setCleanupScore] = useState(searchParams.get('cleanup') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'title');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  // Debounce search input to reduce API calls
  const debouncedSearch = useDebounce(searchInput, 500);

  // Update URL query parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab > 0) params.set('tab', activeTab.toString());
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (difficulty) params.set('difficulty', difficulty);
    if (mealType) params.set('mealType', mealType);
    if (cleanupScore) params.set('cleanup', cleanupScore);
    if (sortBy && sortBy !== 'title') params.set('sortBy', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params, { replace: true });
  }, [activeTab, debouncedSearch, difficulty, mealType, cleanupScore, sortBy, currentPage, setSearchParams]);

  useEffect(() => {
    if (activeTab === 0) {
      const params: any = { page: currentPage, limit: 12 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (difficulty) params.difficulty = difficulty;
      if (mealType) params.mealType = mealType;
      if (cleanupScore) params.maxCleanupScore = cleanupScore;
      if (sortBy) params.sortBy = sortBy;

      dispatch(fetchRecipes(params));
    }
  }, [dispatch, activeTab, currentPage, debouncedSearch, difficulty, mealType, cleanupScore, sortBy]);

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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Recipes
          </Typography>
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => navigate('/recipes/import')}
                aria-label="Import recipe from URL"
              >
                Import from URL
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/recipes/create')}
                aria-label="Create new recipe"
              >
                Create Recipe
              </Button>
            </Box>
          )}
        </Box>

        {/* Tabs for My Recipes vs Browse Recipes */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="recipe tabs">
            <Tab 
              icon={<RestaurantIcon />} 
              label="My Recipes" 
              iconPosition="start"
              aria-label="View my recipes"
            />
            <Tab 
              icon={<ExploreIcon />} 
              label="Browse Recipes" 
              iconPosition="start"
              aria-label="Browse external recipes"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 ? (
          // My Recipes Tab
          <>
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
                aria-label="Search my recipes"
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
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
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
                  <MenuItem value="breakfast">Breakfast</MenuItem>
                  <MenuItem value="lunch">Lunch</MenuItem>
                  <MenuItem value="dinner">Dinner</MenuItem>
                  <MenuItem value="snack">Snack</MenuItem>
                  <MenuItem value="dessert">Dessert</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Cleanup</InputLabel>
                <Select
                  value={cleanupScore}
                  label="Cleanup"
                  onChange={(e) => {
                    setCleanupScore(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="3">Minimal (0-3)</MenuItem>
                  <MenuItem value="5">Easy (0-5)</MenuItem>
                  <MenuItem value="7">Moderate (0-7)</MenuItem>
                  <MenuItem value="10">Any</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <MenuItem value="title">Title (A-Z)</MenuItem>
                  <MenuItem value="title_desc">Title (Z-A)</MenuItem>
                  <MenuItem value="prepTime">Prep Time (Low-High)</MenuItem>
                  <MenuItem value="prepTime_desc">Prep Time (High-Low)</MenuItem>
                  <MenuItem value="totalTime">Total Time (Low-High)</MenuItem>
                  <MenuItem value="totalTime_desc">Total Time (High-Low)</MenuItem>
                  <MenuItem value="difficulty">Difficulty (Easy-Hard)</MenuItem>
                  <MenuItem value="difficulty_desc">Difficulty (Hard-Easy)</MenuItem>
                  <MenuItem value="createdAt">Newest First</MenuItem>
                  <MenuItem value="createdAt_asc">Oldest First</MenuItem>
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
          </>
        ) : (
          // Browse Recipes Tab
          <BrowseRecipes />
        )}
      </Box>
    </Container>
  );
};

export default Recipes;

// Made with Bob

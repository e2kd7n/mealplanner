/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
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
  Skeleton,
  Collapse,
  Badge,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccessTime as TimeIcon,
  Restaurant as RestaurantIcon,
  Add as AddIcon,
  Link as LinkIcon,
  Explore as ExploreIcon,
  Tune as TuneIcon,
  Info as InfoIcon,
  CleaningServices as CleaningServicesIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchRecipes } from '../store/slices/recipesSlice';
import type { Recipe } from '../store/slices/recipesSlice';

type FetchRecipesParams = Parameters<typeof fetchRecipes>[0];
import { useDebounce } from '../hooks/useDebounce';
import { useCachedImage } from '../hooks/useCachedImage';
import BrowseRecipes from './BrowseRecipes';
import RecipeDiscoveryEmptyState from '../components/RecipeDiscoveryEmptyState';

// Memoized Recipe Card Component for better performance
interface RecipeCardProps {
  recipe: Recipe;
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
      <Box sx={{ position: 'relative', height: 200, flexShrink: 0 }}>
        <CardMedia
          component="img"
          height="200"
          image={imageSrc}
          alt={recipe.title}
          sx={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
        />
        {imageLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
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
        <Typography variant="h6" gutterBottom noWrap>{recipe.title}</Typography>
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
            <Chip label={recipe.difficulty} size="small" color={getDifficultyColor(recipe.difficulty)} />
          </Tooltip>
          <Tooltip title={`Prep: ${recipe.prepTime} min | Cook: ${recipe.cookTime} min`} arrow>
            <Chip icon={<TimeIcon />} label={`${recipe.prepTime + recipe.cookTime} min`} size="small" variant="outlined" />
          </Tooltip>
          {recipe.mealTypes?.map((mealType: string) => (
            <Tooltip key={mealType} title={`Meal type: ${mealType}`} arrow>
              <Chip label={mealType} size="small" variant="outlined" />
            </Tooltip>
          ))}
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          onClick={(e) => { e.stopPropagation(); onNavigate(recipe.id); }}
          aria-label={`View ${recipe.title} recipe`}
        >
          View Recipe
        </Button>
      </CardActions>
    </Card>
  );
});
RecipeCard.displayName = 'RecipeCard';

const RecipeCardSkeleton = () => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Skeleton variant="rectangular" height={200} />
    <CardContent sx={{ flexGrow: 1 }}>
      <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="90%" sx={{ mb: 2 }} />
      <Stack direction="row" spacing={1}>
        <Skeleton variant="rectangular" width={60} height={24} />
        <Skeleton variant="rectangular" width={80} height={24} />
        <Skeleton variant="rectangular" width={70} height={24} />
      </Stack>
    </CardContent>
    <CardActions>
      <Skeleton variant="rectangular" width={100} height={30} />
    </CardActions>
  </Card>
);

const Recipes: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { recipes, loading, error, pagination } = useAppSelector((state) => state.recipes);
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(Number(searchParams.get('tab')) || 0);

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [mealType, setMealType] = useState(searchParams.get('mealType') || '');
  const [cleanupScore, setCleanupScore] = useState(searchParams.get('cleanup') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'title');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  // Filter panel open/closed
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 300);

  // Client-side filter of already-loaded recipes by search text
  const displayedRecipes = useMemo(() => {
    if (!debouncedSearch.trim()) return recipes;
    const term = debouncedSearch.trim().toLowerCase();
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term))
    );
  }, [recipes, debouncedSearch]);

  const activeFilterCount = [difficulty, mealType, cleanupScore].filter(Boolean).length;

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
      const params: FetchRecipesParams = { page: currentPage, limit: 12 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (difficulty) params.difficulty = difficulty;
      if (mealType) params.mealType = mealType;
      if (cleanupScore) params.maxCleanupScore = cleanupScore;
      if (sortBy) params.sortBy = sortBy;
      dispatch(fetchRecipes(params));
    }
  }, [dispatch, activeTab, currentPage, debouncedSearch, difficulty, mealType, cleanupScore, sortBy]);

  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigate = useCallback((id: string) => navigate(`/recipes/${id}`), [navigate]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setActiveTab(newValue);

  const clearFilter = (filter: 'difficulty' | 'mealType' | 'cleanupScore') => {
    if (filter === 'difficulty') setDifficulty('');
    if (filter === 'mealType') setMealType('');
    if (filter === 'cleanupScore') setCleanupScore('');
    setCurrentPage(1);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Recipes</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Paste any recipe URL — we'll extract the ingredients and steps automatically." arrow>
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => navigate('/recipes/import')}
                aria-label="Import recipe from URL"
              >
                Import Recipe
              </Button>
            </Tooltip>
            {activeTab === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/recipes/create')}
                aria-label="Create new recipe"
              >
                Create Recipe
              </Button>
            )}
          </Box>
        </Box>

        {/* Tabs */}
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
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Discover Recipes
                  <Chip
                    label="Thousands of recipes"
                    size="small"
                    color="secondary"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                </Box>
              }
              iconPosition="start"
              aria-label="Discover external recipes from Spoonacular"
            />
          </Tabs>
        </Box>

        {/* My Recipes Tab */}
        <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
          {/* Search + Filters */}
          <Box sx={{ mb: 2 }}>
            {/* Row 1: Search + Filters button + Sort */}
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                placeholder="Search my recipes..."
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => { handleSearchInput(''); setCurrentPage(1); }}
                        aria-label="Clear search"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                aria-label="Search my recipes"
              />
              <Badge badgeContent={activeFilterCount || null} color="secondary">
                <Button
                  variant="outlined"
                  startIcon={<TuneIcon />}
                  onClick={() => setFiltersOpen((o) => !o)}
                  aria-expanded={filtersOpen}
                  aria-controls="recipe-filter-panel"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Filters
                </Button>
              </Badge>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
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

            {/* Collapsible filter panel */}
            <Collapse in={filtersOpen} id="recipe-filter-panel">
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}
              >
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={difficulty}
                    label="Difficulty"
                    onChange={(e) => { setDifficulty(e.target.value); setCurrentPage(1); }}
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
                    onChange={(e) => { setMealType(e.target.value); setCurrentPage(1); }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="breakfast">Breakfast</MenuItem>
                    <MenuItem value="lunch">Lunch</MenuItem>
                    <MenuItem value="dinner">Dinner</MenuItem>
                    <MenuItem value="snack">Snack</MenuItem>
                    <MenuItem value="dessert">Dessert</MenuItem>
                  </Select>
                </FormControl>

                {/* Cleanup Effort filter — with icon and tooltip */}
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CleaningServicesIcon sx={{ fontSize: 16 }} />
                      Cleanup Effort
                      <Tooltip
                        title="Cleanup score measures how many dishes and pans a recipe uses. Lower = less washing up."
                        arrow
                        placement="top"
                      >
                        <IconButton size="small" sx={{ p: 0, ml: 0.25 }} tabIndex={-1}>
                          <InfoIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </InputLabel>
                  <Select
                    value={cleanupScore}
                    label="Cleanup Effort"
                    onChange={(e) => { setCleanupScore(e.target.value); setCurrentPage(1); }}
                  >
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="3">Minimal cleanup</MenuItem>
                    <MenuItem value="5">Easy cleanup</MenuItem>
                    <MenuItem value="7">Moderate cleanup</MenuItem>
                    <MenuItem value="10">Any</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Collapse>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                {difficulty && (
                  <Chip
                    label={`Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`}
                    size="small"
                    onDelete={() => clearFilter('difficulty')}
                  />
                )}
                {mealType && (
                  <Chip
                    label={`Meal Type: ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`}
                    size="small"
                    onDelete={() => clearFilter('mealType')}
                  />
                )}
                {cleanupScore && (
                  <Chip
                    label={`Cleanup: ${cleanupScore === '3' ? 'Minimal' : cleanupScore === '5' ? 'Easy' : cleanupScore === '7' ? 'Moderate' : 'Any'}`}
                    size="small"
                    onDelete={() => clearFilter('cleanupScore')}
                  />
                )}
              </Stack>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          )}

          {loading ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: 3,
                mb: 4,
              }}
            >
              {[...Array(8)].map((_, index) => <RecipeCardSkeleton key={index} />)}
            </Box>
          ) : displayedRecipes.length === 0 ? (
            !searchInput && !difficulty && !mealType && !cleanupScore ? (
              <RecipeDiscoveryEmptyState />
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <RestaurantIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No recipes found</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try adjusting your search or filters
                </Typography>
              </Box>
            )
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
                  gap: 3,
                  mb: 4,
                }}
              >
                {displayedRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} onNavigate={handleNavigate} />
                ))}
              </Box>

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

        {/* Discover Recipes Tab */}
        <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
          <BrowseRecipes />
        </Box>
      </Box>
    </Container>
  );
};

export default Recipes;

// Made with Bob

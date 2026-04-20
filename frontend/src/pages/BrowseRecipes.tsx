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
  Pagination,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Skeleton,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccessTime as TimeIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Explore as ExploreIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  searchSpoonacularRecipes,
  addSpoonacularRecipeToBox,
  clearError,
} from '../store/slices/recipeBrowseSlice';
import { useDebounce } from '../hooks/useDebounce';

// Memoized Recipe Card Component
interface BrowseRecipeCardProps {
  recipe: any;
  onAddToBox: (id: number) => void;
  isAdding: boolean;
}

const BrowseRecipeCard = memo(({ recipe, onAddToBox, isAdding }: BrowseRecipeCardProps) => {
  const [added, setAdded] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToBox(recipe.id);
    setAdded(true);
  };

  return (
    <Card
      data-testid="recipe-card"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <Box sx={{ position: 'relative', height: 200 }}>
        <CardMedia
          component="img"
          height="200"
          image={recipe.image || '/placeholder-recipe.jpg'}
          alt={recipe.title}
          sx={{ objectFit: 'cover' }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom noWrap>
          {recipe.title}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
          {recipe.readyInMinutes && (
            <Tooltip title={`Ready in ${recipe.readyInMinutes} minutes`} arrow>
              <Chip
                icon={<TimeIcon />}
                label={`${recipe.readyInMinutes} min`}
                size="small"
                variant="outlined"
              />
            </Tooltip>
          )}
          {recipe.servings && (
            <Chip
              label={`${recipe.servings} servings`}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
        {recipe.cuisines && recipe.cuisines.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {recipe.cuisines.join(', ')}
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <Button
          size="small"
          variant={added ? "outlined" : "contained"}
          color={added ? "success" : "primary"}
          startIcon={added ? <CheckCircleIcon /> : <AddIcon />}
          onClick={handleAddClick}
          disabled={isAdding || added}
          fullWidth
        >
          {added ? 'Added to Recipe Box' : 'Add to Recipe Box'}
        </Button>
      </CardActions>
    </Card>
  );
});

BrowseRecipeCard.displayName = 'BrowseRecipeCard';

// Skeleton loader for recipe cards
const RecipeCardSkeleton = () => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Skeleton variant="rectangular" height={200} />
    <CardContent sx={{ flexGrow: 1 }}>
      <Skeleton variant="text" width="80%" height={32} />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" />
    </CardContent>
    <CardActions>
      <Skeleton variant="rectangular" width="100%" height={36} />
    </CardActions>
  </Card>
);

const BrowseRecipes: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { recipes, loading, error, pagination, addingToBox, addToBoxError } = useAppSelector(
    (state) => state.recipeBrowse
  );

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') || '');
  const [diet, setDiet] = useState(searchParams.get('diet') || '');
  const [mealType, setMealType] = useState(searchParams.get('type') || '');
  const [maxTime, setMaxTime] = useState<number>(parseInt(searchParams.get('maxTime') || '0') || 0);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popularity');
  const [successMessage, setSuccessMessage] = useState('');
  
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Calculate current page from offset
  const currentPage = Math.floor(pagination.offset / pagination.number) + 1;

  // Load recipes on mount and when filters change
  useEffect(() => {
    const params: any = {
      offset: pagination.offset,
      number: pagination.number,
    };

    if (debouncedSearch) params.query = debouncedSearch;
    if (cuisine) params.cuisine = cuisine;
    if (diet) params.diet = diet;
    if (mealType) params.type = mealType;
    if (maxTime > 0) params.maxReadyTime = maxTime;
    if (sortBy) params.sort = sortBy;

    dispatch(searchSpoonacularRecipes(params));
  }, [dispatch, debouncedSearch, cuisine, diet, mealType, maxTime, sortBy, pagination.offset, pagination.number]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (cuisine) params.set('cuisine', cuisine);
    if (diet) params.set('diet', diet);
    if (mealType) params.set('type', mealType);
    if (maxTime > 0) params.set('maxTime', maxTime.toString());
    if (sortBy && sortBy !== 'popularity') params.set('sort', sortBy);
    setSearchParams(params);
  }, [debouncedSearch, cuisine, diet, mealType, maxTime, sortBy, setSearchParams]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCuisine('');
    setDiet('');
    setMealType('');
    setMaxTime(0);
    setSortBy('popularity');
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    const newOffset = (page - 1) * pagination.number;
    const params: any = {
      offset: newOffset,
      number: pagination.number,
    };
    
    if (debouncedSearch) params.query = debouncedSearch;
    if (cuisine) params.cuisine = cuisine;
    if (diet) params.diet = diet;
    if (mealType) params.type = mealType;
    if (maxTime > 0) params.maxReadyTime = maxTime;
    if (sortBy) params.sort = sortBy;

    dispatch(searchSpoonacularRecipes(params));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToBox = useCallback(
    async (recipeId: number) => {
      const result = await dispatch(addSpoonacularRecipeToBox(recipeId));
      if (addSpoonacularRecipeToBox.fulfilled.match(result)) {
        setSuccessMessage('Recipe added to your recipe box!');
      }
    },
    [dispatch]
  );

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleCloseSuccess = () => {
    setSuccessMessage('');
  };

  const totalPages = Math.ceil(pagination.totalResults / pagination.number);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <ExploreIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Browse Recipes
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Discover new recipes from Spoonacular's database of 360,000+ recipes
        </Typography>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search recipes by name or ingredients..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <FilterListIcon color="action" />
            <Typography variant="subtitle2" color="text.secondary">
              Filters
            </Typography>
            <Button size="small" onClick={handleClearFilters}>
              Clear All
            </Button>
          </Stack>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Cuisine</InputLabel>
              <Select value={cuisine} label="Cuisine" onChange={(e) => setCuisine(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="African">African</MenuItem>
                <MenuItem value="American">American</MenuItem>
                <MenuItem value="British">British</MenuItem>
                <MenuItem value="Chinese">Chinese</MenuItem>
                <MenuItem value="European">European</MenuItem>
                <MenuItem value="French">French</MenuItem>
                <MenuItem value="German">German</MenuItem>
                <MenuItem value="Greek">Greek</MenuItem>
                <MenuItem value="Indian">Indian</MenuItem>
                <MenuItem value="Italian">Italian</MenuItem>
                <MenuItem value="Japanese">Japanese</MenuItem>
                <MenuItem value="Korean">Korean</MenuItem>
                <MenuItem value="Mediterranean">Mediterranean</MenuItem>
                <MenuItem value="Mexican">Mexican</MenuItem>
                <MenuItem value="Middle Eastern">Middle Eastern</MenuItem>
                <MenuItem value="Spanish">Spanish</MenuItem>
                <MenuItem value="Thai">Thai</MenuItem>
                <MenuItem value="Vietnamese">Vietnamese</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Diet</InputLabel>
              <Select value={diet} label="Diet" onChange={(e) => setDiet(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Gluten Free">Gluten Free</MenuItem>
                <MenuItem value="Ketogenic">Ketogenic</MenuItem>
                <MenuItem value="Vegetarian">Vegetarian</MenuItem>
                <MenuItem value="Vegan">Vegan</MenuItem>
                <MenuItem value="Pescetarian">Pescetarian</MenuItem>
                <MenuItem value="Paleo">Paleo</MenuItem>
                <MenuItem value="Primal">Primal</MenuItem>
                <MenuItem value="Whole30">Whole30</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Meal Type</InputLabel>
              <Select value={mealType} label="Meal Type" onChange={(e) => setMealType(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="breakfast">Breakfast</MenuItem>
                <MenuItem value="lunch">Lunch</MenuItem>
                <MenuItem value="dinner">Dinner</MenuItem>
                <MenuItem value="snack">Snack</MenuItem>
                <MenuItem value="dessert">Dessert</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
                <MenuItem value="popularity">Popularity</MenuItem>
                <MenuItem value="time">Cooking Time</MenuItem>
                <MenuItem value="healthiness">Healthiness</MenuItem>
                <MenuItem value="price">Price</MenuItem>
              </Select>
            </FormControl>

            {maxTime > 0 && (
              <Box sx={{ minWidth: 200, px: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Max Time: {maxTime} min
                </Typography>
                <Slider
                  value={maxTime}
                  onChange={(_e, value) => setMaxTime(value as number)}
                  min={15}
                  max={180}
                  step={15}
                  marks={[
                    { value: 15, label: '15m' },
                    { value: 90, label: '90m' },
                    { value: 180, label: '180m' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>
            )}
            {maxTime === 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setMaxTime(60)}
                sx={{ alignSelf: 'center' }}
              >
                Add Time Filter
              </Button>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Error Messages */}
      {error && (
        <Alert severity="error" onClose={handleClearError} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {addToBoxError && (
        <Alert severity="error" onClose={handleClearError} sx={{ mb: 3 }}>
          {addToBoxError}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
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
          }}
        >
          {[...Array(8)].map((_, index) => (
            <RecipeCardSkeleton key={index} />
          ))}
        </Box>
      )}

      {/* Empty State */}
      {!loading && recipes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ExploreIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery ? 'No recipes found' : 'Start searching to discover recipes'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery
              ? 'Try different keywords or check your spelling'
              : 'Enter a recipe name or ingredient to get started'}
          </Typography>
        </Box>
      )}

      {/* Recipe Grid */}
      {!loading && recipes.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Found {pagination.totalResults.toLocaleString()} recipes
          </Typography>
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
            }}
          >
            {recipes.map((recipe) => (
              <BrowseRecipeCard
                key={recipe.id}
                recipe={recipe}
                onAddToBox={handleAddToBox}
                isAdding={addingToBox}
              />
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BrowseRecipes;

// Made with Bob
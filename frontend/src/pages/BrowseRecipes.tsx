/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useEffect, useState, memo, useCallback, useRef } from 'react';
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
  Badge,
  ClickAwayListener,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccessTime as TimeIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Explore as ExploreIcon,
  FilterList as FilterListIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  searchSpoonacularRecipes,
  addSpoonacularRecipeToBox,
  clearError,
} from '../store/slices/recipeBrowseSlice';
import { useDebounce } from '../hooks/useDebounce';
import { useCachedImage } from '../hooks/useCachedImage';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { parseNaturalLanguage, formatParsedQuery } from '../utils/searchParser';
import SearchSuggestions from '../components/SearchSuggestions';

// Memoized Recipe Card Component
interface BrowseRecipeCardProps {
  recipe: import('../store/slices/recipeBrowseSlice').SpoonacularRecipe;
  onAddToBox: (id: number) => void;
  isAdding: boolean;
}

const BrowseRecipeCard = memo(({ recipe, onAddToBox, isAdding }: BrowseRecipeCardProps) => {
  const [added, setAdded] = useState(false);
  // Use cached image hook for proper error handling and fallback
  const { src: imageSrc, isLoading: imageLoading } = useCachedImage(recipe.image);

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
        {imageLoading ? (
          <Skeleton variant="rectangular" height={200} animation="wave" />
        ) : (
          <CardMedia
            component="img"
            height="200"
            image={imageSrc}
            alt={recipe.title}
            sx={{ objectFit: 'cover' }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              // Additional fallback if CardMedia fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [parsedQueryInfo, setParsedQueryInfo] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const debouncedSearch = useDebounce(searchQuery, 500);
  const { suggestions, addRecentSearch } = useSearchSuggestions(searchQuery);

  // D2-3 FIX: Keyboard shortcuts for better navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSuggestions(true);
      }
      // Escape to clear search or close suggestions
      if (e.key === 'Escape') {
        if (showSuggestions) {
          setShowSuggestions(false);
        } else if (searchQuery) {
          setSearchQuery('');
        }
      }
      // Arrow keys for suggestion navigation
      if (showSuggestions && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
          e.preventDefault();
          handleSuggestionSelect(suggestions[highlightedIndex].text);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, showSuggestions, suggestions, highlightedIndex]);

  // Parse natural language queries
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length > 5) {
      const parsed = parseNaturalLanguage(debouncedSearch);
      
      // Auto-apply parsed filters
      if (parsed.maxTime && maxTime === 0) {
        setMaxTime(parsed.maxTime);
      }
      if (parsed.diet && !diet) {
        setDiet(parsed.diet);
      }
      if (parsed.mealType && !mealType) {
        setMealType(parsed.mealType);
      }
      if (parsed.cuisine && !cuisine) {
        setCuisine(parsed.cuisine);
      }
      
      // Show parsed query info
      const info = formatParsedQuery(parsed);
      if (info) {
        setParsedQueryInfo(info);
      }
    } else {
      setParsedQueryInfo('');
    }
  }, [debouncedSearch]);

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
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  const handleSearchFocus = () => {
    setShowSuggestions(true);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    addRecentSearch(suggestion);
    searchInputRef.current?.blur();
  };

  const handleClickAway = () => {
    setShowSuggestions(false);
    setHighlightedIndex(-1);
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
    [dispatch, setSuccessMessage]
  );

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleCloseSuccess = () => {
    setSuccessMessage('');
  };

  // D2-2 FIX: Calculate active filter count for visual indicators
  const activeFilterCount = [cuisine, diet, mealType, maxTime > 0 ? 'maxTime' : null, sortBy !== 'popularity' ? 'sort' : null].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

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

        {/* Enhanced search bar with natural language support and suggestions */}
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Try: 'quick dinner for two' or 'healthy vegetarian pasta'..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              inputRef={searchInputRef}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              autoComplete="off"
              inputProps={{
                'aria-label': 'Search recipes with natural language',
                'aria-describedby': 'search-help-text',
                'aria-expanded': showSuggestions,
                'aria-autocomplete': 'list',
                'aria-controls': showSuggestions ? 'search-suggestions' : undefined,
              }}
              helperText={
                parsedQueryInfo
                  ? `Press Ctrl+K to focus • Use ↑↓ to navigate • ${parsedQueryInfo}`
                  : "Press Ctrl+K to focus • Use ↑↓ to navigate suggestions • Enter to select"
              }
              FormHelperTextProps={{
                id: 'search-help-text',
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <SearchSuggestions
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
                onClose={() => setShowSuggestions(false)}
                highlightedIndex={highlightedIndex}
              />
            )}
          </Box>
        </ClickAwayListener>

        {/* D2-2 FIX: Enhanced filters section with visual indicators */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Badge badgeContent={activeFilterCount} color="primary">
              <FilterListIcon color={hasActiveFilters ? "primary" : "action"} />
            </Badge>
            <Typography variant="subtitle2" color={hasActiveFilters ? "primary" : "text.secondary"} sx={{ fontWeight: hasActiveFilters ? 600 : 400 }}>
              Filters {hasActiveFilters && `(${activeFilterCount} active)`}
            </Typography>
            {hasActiveFilters && (
              <Button size="small" onClick={handleClearFilters} variant="outlined" color="primary">
                Clear All
              </Button>
            )}
          </Stack>
          
          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
              {cuisine && (
                <Chip
                  label={`Cuisine: ${cuisine}`}
                  onDelete={() => setCuisine('')}
                  color="primary"
                  size="small"
                />
              )}
              {diet && (
                <Chip
                  label={`Diet: ${diet}`}
                  onDelete={() => setDiet('')}
                  color="primary"
                  size="small"
                />
              )}
              {mealType && (
                <Chip
                  label={`Type: ${mealType}`}
                  onDelete={() => setMealType('')}
                  color="primary"
                  size="small"
                />
              )}
              {maxTime > 0 && (
                <Chip
                  label={`Max Time: ${maxTime} min`}
                  onDelete={() => setMaxTime(0)}
                  color="primary"
                  size="small"
                />
              )}
              {sortBy !== 'popularity' && (
                <Chip
                  label={`Sort: ${sortBy}`}
                  onDelete={() => setSortBy('popularity')}
                  color="primary"
                  size="small"
                />
              )}
            </Stack>
          )}
          
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

      {/* D2-2 FIX: Context-aware empty state messaging */}
      {!loading && recipes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ExploreIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery || hasActiveFilters ? 'No recipes found' : 'Start searching to discover recipes'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {searchQuery && hasActiveFilters
              ? 'No recipes match your search and filters. Try adjusting your criteria.'
              : searchQuery
              ? 'Try different keywords or check your spelling'
              : hasActiveFilters
              ? 'Filters applied — enter a keyword to search, or adjust your filters'
              : 'Enter a recipe name or ingredient to get started'}
          </Typography>
          {hasActiveFilters && (
            <Button variant="outlined" onClick={handleClearFilters} sx={{ mt: 2 }}>
              Clear All Filters
            </Button>
          )}
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
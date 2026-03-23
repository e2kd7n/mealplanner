/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import React, { useEffect, useState } from 'react';
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
  ListItemIcon,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccessTime as TimeIcon,
  Restaurant as RestaurantIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchRecipeById, setCurrentRecipe } from '../store/slices/recipesSlice';
import { fetchGroceryLists, addItemToList } from '../store/slices/groceryListsSlice';
import { fetchMealPlans, addMealToPlan } from '../store/slices/mealPlansSlice';
import { useCachedImage } from '../hooks/useCachedImage';

// Helper function to format date without timezone issues
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentRecipe: recipe, loading, error } = useAppSelector((state) => state.recipes);
  const { groceryLists } = useAppSelector((state) => state.groceryLists);
  const { mealPlans } = useAppSelector((state) => state.mealPlans);
  const { src: imageSrc, isLoading: imageLoading } = useCachedImage(recipe?.imageUrl);
  
  const [openGroceryDialog, setOpenGroceryDialog] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [addingToList, setAddingToList] = useState(false);

  const [openMealPlanDialog, setOpenMealPlanDialog] = useState(false);
  const [selectedMealPlanId, setSelectedMealPlanId] = useState<string>('');
  const [mealDate, setMealDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState<string>('dinner');
  const [mealServings, setMealServings] = useState<number>(4);
  const [addingToMealPlan, setAddingToMealPlan] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchRecipeById(id));
    }
    return () => {
      dispatch(setCurrentRecipe(null));
    };
  }, [dispatch, id]);

  useEffect(() => {
    // Fetch grocery lists and meal plans when component mounts
    dispatch(fetchGroceryLists({ status: 'draft' }));
    dispatch(fetchMealPlans({ status: 'active' }));
  }, [dispatch]);

  const handleAddToMealPlan = () => {
    if (!recipe) return;
    
    if (mealPlans.length === 0) {
      alert('No active meal plans found. Please create a meal plan first.');
      navigate('/meal-planner');
      return;
    }
    
    // Set default servings from recipe
    setMealServings(recipe.servings || 4);
    setOpenMealPlanDialog(true);
  };

  const handleConfirmAddToMealPlan = async () => {
    if (!selectedMealPlanId || !recipe) return;

    setAddingToMealPlan(true);
    try {
      // Convert the date string to a Date object and format it properly
      const dateObj = new Date(mealDate + 'T00:00:00');
      const formattedDate = formatDateForAPI(dateObj);
      
      await dispatch(addMealToPlan({
        planId: selectedMealPlanId,
        mealData: {
          recipeId: recipe.id,
          date: formattedDate,
          mealType: mealType,
          servings: mealServings,
          notes: '',
        },
      })).unwrap();
      
      setOpenMealPlanDialog(false);
      setSelectedMealPlanId('');
      alert(`Successfully added "${recipe.title}" to meal plan!`);
    } catch (error: any) {
      console.error('Failed to add to meal plan:', error);
      alert(error.message || 'Failed to add recipe to meal plan');
    } finally {
      setAddingToMealPlan(false);
    }
  };

  const handleAddToGroceryList = () => {
    if (groceryLists.length === 0) {
      alert('No grocery lists found. Please create a meal plan first to generate a grocery list.');
      navigate('/meal-planner');
      return;
    }
    setOpenGroceryDialog(true);
  };

  const handleConfirmAddToList = async () => {
    if (!selectedListId || !recipe) return;

    setAddingToList(true);
    try {
      // Add each ingredient from the recipe to the selected grocery list
      for (const item of recipe.ingredients || []) {
        const ingredientData: any = item;
        await dispatch(addItemToList({
          listId: selectedListId,
          itemData: {
            ingredientId: ingredientData.ingredient?.id || ingredientData.ingredientId || '',
            quantity: ingredientData.quantity || 1,
            unit: ingredientData.unit || 'unit',
            estimatedPrice: ingredientData.ingredient?.averagePrice || 0,
            notes: ingredientData.notes || '',
          },
        })).unwrap();
      }
      
      setOpenGroceryDialog(false);
      setSelectedListId('');
      alert(`Successfully added ${recipe.ingredients?.length || 0} ingredients to grocery list!`);
    } catch (error: any) {
      console.error('Failed to add ingredients:', error);
      alert(error.message || 'Failed to add ingredients to grocery list');
    } finally {
      setAddingToList(false);
    }
  };

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

        {/* Action Buttons */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleAddToMealPlan}
          >
            Add to Meal Plan
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={handleAddToGroceryList}
          >
            Add to Grocery List
          </Button>
        </Box>

        {/* Image */}
        {recipe.imageUrl && (
          <Card sx={{ mb: 4, position: 'relative' }}>
            <CardMedia
              component="img"
              height="400"
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
                <CircularProgress size={50} />
              </Box>
            )}
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
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Ingredients
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <List sx={{ '& .MuiListItem-root': { py: 1.5 } }}>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((item: any, index: number) => (
                  <ListItem
                    key={index}
                    sx={{
                      px: 0,
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        px: 1,
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckBoxOutlineBlankIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {`${item.quantity} ${item.unit} ${item.ingredient?.name || item.ingredientName || 'Unknown ingredient'}`}
                        </Typography>
                      }
                      secondary={item.notes ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                          {item.notes}
                        </Typography>
                      ) : null}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No ingredients listed"
                    secondary="Add ingredients when editing this recipe"
                  />
                </ListItem>
              )}
            </List>
          </Paper>

          {/* Instructions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Instructions
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <List sx={{ '& .MuiListItem-root': { py: 2 } }}>
              {recipe.instructions && Array.isArray(recipe.instructions) && recipe.instructions.length > 0 ? (
                recipe.instructions.map((step: any, index: number) => (
                  <ListItem
                    key={index}
                    sx={{
                      alignItems: 'flex-start',
                      px: 0,
                      borderLeft: 3,
                      borderColor: 'primary.main',
                      pl: 2,
                      mb: 2,
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        pr: 1,
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                        }}
                      >
                        {step.step || index + 1}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ lineHeight: 1.7, color: 'text.primary' }}>
                          {step.instruction || step.text || step}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No instructions available"
                    secondary="Add instructions when editing this recipe"
                  />
                </ListItem>
              )}
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
      </Box>

      {/* Add to Meal Plan Dialog */}
      <Dialog open={openMealPlanDialog} onClose={() => setOpenMealPlanDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add to Meal Plan</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Schedule "{recipe?.title}" in your meal plan
          </Typography>
          
          {mealPlans.length === 0 ? (
            <Alert severity="info">
              No active meal plans found. Create a meal plan first.
            </Alert>
          ) : (
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Select Meal Plan</InputLabel>
                <Select
                  value={selectedMealPlanId}
                  onChange={(e) => setSelectedMealPlanId(e.target.value)}
                  label="Select Meal Plan"
                >
                  {mealPlans.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      Week of {new Date(plan.weekStartDate).toLocaleDateString()} - {plan.status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Date"
                type="date"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <FormControl fullWidth>
                <InputLabel>Meal Type</InputLabel>
                <Select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  label="Meal Type"
                >
                  <MenuItem value="breakfast">Breakfast</MenuItem>
                  <MenuItem value="lunch">Lunch</MenuItem>
                  <MenuItem value="dinner">Dinner</MenuItem>
                  <MenuItem value="snack">Snack</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Servings"
                type="number"
                value={mealServings}
                onChange={(e) => setMealServings(parseInt(e.target.value) || 1)}
                fullWidth
                inputProps={{ min: 1, max: 20 }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMealPlanDialog(false)} disabled={addingToMealPlan}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAddToMealPlan}
            variant="contained"
            disabled={!selectedMealPlanId || addingToMealPlan || mealPlans.length === 0}
          >
            {addingToMealPlan ? 'Adding...' : 'Add to Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add to Grocery List Dialog */}
      <Dialog open={openGroceryDialog} onClose={() => setOpenGroceryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add to Grocery List</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a grocery list to add this recipe's ingredients to:
          </Typography>
          {groceryLists.length === 0 ? (
            <Alert severity="info">
              No grocery lists found. Create a meal plan first to generate a grocery list.
            </Alert>
          ) : (
            <RadioGroup value={selectedListId} onChange={(e) => setSelectedListId(e.target.value)}>
              {groceryLists.map((list) => (
                <FormControlLabel
                  key={list.id}
                  value={list.id}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">
                        Grocery List - {new Date(list.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {list.items?.length || 0} items • Status: {list.status}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGroceryDialog(false)} disabled={addingToList}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAddToList}
            variant="contained"
            disabled={!selectedListId || addingToList || groceryLists.length === 0}
          >
            {addingToList ? 'Adding...' : 'Add Ingredients'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RecipeDetail;

// Made with Bob

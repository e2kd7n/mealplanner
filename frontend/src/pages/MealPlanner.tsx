/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ShoppingCart as ShoppingCartIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

interface FamilyMember {
  id: string;
  name: string;
  canCook: boolean;
}

interface Recipe {
  id: string;
  title: string;
  difficulty: string;
  prepTime: number;
  cookTime: number;
  servings: number;
}

interface Meal {
  id: string;
  recipeId: string;
  recipeName: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  date: Date;
  servings: number;
  assignedCookId?: string;
  assignedCookName?: string;
}

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MealPlanner: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  
  // Mock family members - in real app, fetch from API
  const [familyMembers] = useState<FamilyMember[]>([
    { id: 'fm1', name: 'Mom', canCook: true },
    { id: 'fm2', name: 'Dad', canCook: true },
    { id: 'fm3', name: 'Sarah (Teen)', canCook: true },
    { id: 'fm4', name: 'Tommy (Teen)', canCook: true },
    { id: 'fm5', name: 'Emma (Child)', canCook: false },
  ]);
  
  const [meals, setMeals] = useState<Meal[]>([
    {
      id: '1',
      recipeId: 'r1',
      recipeName: 'Scrambled Eggs',
      mealType: 'BREAKFAST',
      date: new Date(),
      servings: 2,
      assignedCookId: 'fm1',
      assignedCookName: 'Mom',
    },
    {
      id: '2',
      recipeId: 'r2',
      recipeName: 'Chicken Salad',
      mealType: 'LUNCH',
      date: new Date(),
      servings: 4,
      assignedCookId: 'fm3',
      assignedCookName: 'Sarah (Teen)',
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>('DINNER');
  const [newMeal, setNewMeal] = useState({
    recipeId: '',
    recipeName: '',
    servings: 4,
    assignedCookId: '',
  });
  
  // Recipe search state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeSearchLoading, setRecipeSearchLoading] = useState(false);
  const [recipeSearchInput, setRecipeSearchInput] = useState('');

  // Meal detail dialog state
  const [openMealDetail, setOpenMealDetail] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  // Day summary dialog state
  const [openDaySummary, setOpenDaySummary] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
  }, []);
  
  const loadRecipes = async () => {
    try {
      setRecipeSearchLoading(true);
      // Mock data for now - in real app, fetch from API
      const mockRecipes: Recipe[] = [
        { id: 'r1', title: 'Scrambled Eggs', difficulty: 'easy', prepTime: 5, cookTime: 10, servings: 2 },
        { id: 'r2', title: 'Chicken Salad', difficulty: 'easy', prepTime: 15, cookTime: 0, servings: 4 },
        { id: 'r3', title: 'Spaghetti Carbonara', difficulty: 'medium', prepTime: 10, cookTime: 20, servings: 4 },
        { id: 'r4', title: 'Grilled Cheese Sandwich', difficulty: 'easy', prepTime: 5, cookTime: 5, servings: 1 },
        { id: 'r5', title: 'Beef Stir Fry', difficulty: 'medium', prepTime: 20, cookTime: 15, servings: 4 },
      ];
      setRecipes(mockRecipes);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setRecipeSearchLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date()));
  };

  const handleOpenDialog = (date: Date, mealType: string) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setNewMeal({ recipeId: '', recipeName: '', servings: 4, assignedCookId: '' });
    setRecipeSearchInput('');
    setOpenDialog(true);
  };

  const handleAddMeal = () => {
    if (!selectedDate) return;

    const assignedCook = familyMembers.find(fm => fm.id === newMeal.assignedCookId);
    
    const meal: Meal = {
      id: Date.now().toString(),
      recipeId: 'temp',
      recipeName: newMeal.recipeName,
      mealType: selectedMealType as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
      date: selectedDate,
      servings: newMeal.servings,
      assignedCookId: newMeal.assignedCookId || undefined,
      assignedCookName: assignedCook?.name,
    };
    setMeals([...meals, meal]);
    setOpenDialog(false);
  };

  const handleDeleteMeal = (id: string, event?: React.MouseEvent) => {
    // Stop propagation to prevent opening meal detail when clicking delete
    if (event) {
      event.stopPropagation();
    }
    setMeals(meals.filter(meal => meal.id !== id));
  };

  const handleGenerateGroceryList = () => {
    // Navigate to grocery list with meal plan data
    alert('Generating grocery list from meal plan...');
  };

  const handleOpenMealDetail = (meal: Meal) => {
    setSelectedMeal(meal);
    setOpenMealDetail(true);
  };

  const handleOpenDaySummary = (date: Date) => {
    setSelectedDay(date);
    setOpenDaySummary(true);
  };

  const handleEditMeal = () => {
    if (selectedMeal) {
      setSelectedDate(selectedMeal.date);
      setSelectedMealType(selectedMeal.mealType);
      setNewMeal({
        recipeId: selectedMeal.recipeId,
        recipeName: selectedMeal.recipeName,
        servings: selectedMeal.servings,
        assignedCookId: selectedMeal.assignedCookId || '',
      });
      setRecipeSearchInput(selectedMeal.recipeName);
      setOpenMealDetail(false);
      setOpenDialog(true);
    }
  };

  const handleCopyMeal = () => {
    if (selectedMeal) {
      const newMeal: Meal = {
        ...selectedMeal,
        id: Date.now().toString(),
      };
      setMeals([...meals, newMeal]);
      setOpenMealDetail(false);
    }
  };

  const handleClearDay = () => {
    if (selectedDay) {
      setMeals(meals.filter(meal => !isSameDay(meal.date, selectedDay)));
      setOpenDaySummary(false);
    }
  };

  const getMealsForDay = (date: Date, mealType: string) => {
    return meals.filter(
      meal => isSameDay(meal.date, date) && meal.mealType === mealType
    );
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'BREAKFAST':
        return '#FFA726';
      case 'LUNCH':
        return '#66BB6A';
      case 'DINNER':
        return '#42A5F5';
      case 'SNACK':
        return '#AB47BC';
      default:
        return '#757575';
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Meal Planner
          </Typography>
          <Button
            variant="contained"
            startIcon={<ShoppingCartIcon />}
            onClick={handleGenerateGroceryList}
            color="success"
          >
            Generate Grocery List
          </Button>
        </Box>

        {/* Week Navigation */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <IconButton onClick={handlePreviousWeek}>
                <ChevronLeftIcon />
              </IconButton>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">
                  {format(currentWeekStart, 'MMMM yyyy')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Week of {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d')}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={handleToday}>
                  Today
                </Button>
                <IconButton onClick={handleNextWeek}>
                  <ChevronRightIcon />
                </IconButton>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Weekly Calendar Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 2,
          }}
        >
          {weekDays.map((day, dayIndex) => {
            const isToday = isSameDay(day, new Date());

            return (
              <Card
                key={dayIndex}
                sx={{
                  bgcolor: isToday ? 'primary.light' : 'background.paper',
                  border: isToday ? 2 : 0,
                  borderColor: 'primary.main',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box
                    onClick={() => handleOpenDaySummary(day)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      align="center"
                      gutterBottom
                      sx={{
                        fontWeight: 'bold',
                        color: isToday ? 'primary.contrastText' : 'text.primary',
                      }}
                    >
                      {DAYS_OF_WEEK[dayIndex]}
                    </Typography>
                    <Typography
                      variant="h6"
                      align="center"
                      gutterBottom
                      sx={{
                        color: isToday ? 'primary.contrastText' : 'text.primary',
                      }}
                    >
                      {format(day, 'd')}
                    </Typography>
                  </Box>

                  {/* Meal Types */}
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {MEAL_TYPES.map((mealType) => {
                      const dayMeals = getMealsForDay(day, mealType);

                      return (
                        <Box key={mealType}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 'bold',
                                color: getMealTypeColor(mealType),
                              }}
                            >
                              {mealType}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(day, mealType)}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          {dayMeals.length === 0 ? (
                            <Box
                              sx={{
                                p: 1,
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                textAlign: 'center',
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: 'action.selected',
                                },
                              }}
                              onClick={() => handleOpenDialog(day, mealType)}
                            >
                              <Typography variant="caption" color="text.secondary">
                                No meal
                              </Typography>
                            </Box>
                          ) : (
                            dayMeals.map((meal) => (
                              <Box
                                key={meal.id}
                                onClick={() => handleOpenMealDetail(meal)}
                                sx={{
                                  p: 1,
                                  bgcolor: 'background.default',
                                  borderRadius: 1,
                                  borderLeft: 3,
                                  borderColor: getMealTypeColor(mealType),
                                  mb: 0.5,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                  },
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: 'medium',
                                        display: 'block',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {meal.recipeName}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                      <Chip
                                        label={`${meal.servings} servings`}
                                        size="small"
                                        sx={{ height: 16, fontSize: '0.65rem' }}
                                      />
                                      {meal.assignedCookName && (
                                        <Chip
                                          label={`👨‍🍳 ${meal.assignedCookName}`}
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                          sx={{ height: 16, fontSize: '0.65rem' }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleDeleteMeal(meal.id, e)}
                                    sx={{ ml: 0.5 }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            ))
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>

      {/* Add Meal Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Meal for {selectedDate && format(selectedDate, 'EEEE, MMM d')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Meal Type"
              fullWidth
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value)}
            >
              {MEAL_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <Autocomplete
              freeSolo
              options={recipes}
              getOptionLabel={(option) => typeof option === 'string' ? option : option.title}
              value={recipes.find(r => r.id === newMeal.recipeId) || null}
              inputValue={recipeSearchInput}
              onInputChange={(_, value) => setRecipeSearchInput(value)}
              onChange={(_, value) => {
                if (typeof value === 'string') {
                  // User typed a custom name
                  setNewMeal({ ...newMeal, recipeId: '', recipeName: value });
                } else if (value) {
                  // User selected a recipe
                  setNewMeal({
                    ...newMeal,
                    recipeId: value.id,
                    recipeName: value.title,
                    servings: value.servings
                  });
                }
              }}
              loading={recipeSearchLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Recipe Name"
                  placeholder="Search for a recipe..."
                  autoFocus
                  helperText="Select from existing recipes or type a custom name"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {recipeSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body1">{option.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.difficulty} • {option.prepTime + option.cookTime} min • {option.servings} servings
                    </Typography>
                  </Box>
                </li>
              )}
            />
            <TextField
              select
              label="Assigned Cook"
              fullWidth
              value={newMeal.assignedCookId}
              onChange={(e) => setNewMeal({ ...newMeal, assignedCookId: e.target.value })}
              helperText="Who will prepare this meal?"
            >
              <MenuItem value="">
                <em>Not assigned</em>
              </MenuItem>
              {familyMembers
                .filter(fm => fm.canCook)
                .map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label="Servings"
              type="number"
              fullWidth
              value={newMeal.servings}
              onChange={(e) => setNewMeal({ ...newMeal, servings: Number(e.target.value) })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddMeal}
            variant="contained"
            disabled={!newMeal.recipeName}
          >
            Add Meal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Meal Detail Dialog */}
      <Dialog
        open={openMealDetail}
        onClose={() => setOpenMealDetail(false)}
        maxWidth="sm"
        fullWidth
        disableRestoreFocus
        keepMounted={false}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Meal Details</Typography>
            <IconButton onClick={() => setOpenMealDetail(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMeal && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Recipe
                </Typography>
                <Typography variant="h6">{selectedMeal.recipeName}</Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Meal Type
                </Typography>
                <Chip
                  label={selectedMeal.mealType}
                  sx={{
                    bgcolor: getMealTypeColor(selectedMeal.mealType),
                    color: 'white',
                  }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Date
                </Typography>
                <Typography>{format(selectedMeal.date, 'EEEE, MMMM d, yyyy')}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Servings
                </Typography>
                <Typography>{selectedMeal.servings} servings</Typography>
              </Box>

              {selectedMeal.assignedCookName && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Assigned Cook
                  </Typography>
                  <Chip
                    label={`👨‍🍳 ${selectedMeal.assignedCookName}`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Full recipe details would be loaded from the recipe database here, including:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="• Ingredients list" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Cooking instructions" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Prep and cook time" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Nutrition information" />
                  </ListItem>
                </List>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyMeal}
          >
            Copy Meal
          </Button>
          <Button
            startIcon={<EditIcon />}
            onClick={handleEditMeal}
          >
            Edit
          </Button>
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              if (selectedMeal) {
                handleDeleteMeal(selectedMeal.id);
                setOpenMealDetail(false);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Day Summary Dialog */}
      <Dialog
        open={openDaySummary}
        onClose={() => setOpenDaySummary(false)}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
        keepMounted={false}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedDay && format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </Typography>
            <IconButton onClick={() => setOpenDaySummary(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDay && (
            <Stack spacing={3}>
              {/* Meals for the day */}
              {MEAL_TYPES.map((mealType) => {
                const dayMeals = getMealsForDay(selectedDay, mealType);
                if (dayMeals.length === 0) return null;

                return (
                  <Box key={mealType}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 'bold',
                        color: getMealTypeColor(mealType),
                        mb: 1,
                      }}
                    >
                      {mealType}
                    </Typography>
                    <Stack spacing={1}>
                      {dayMeals.map((meal) => (
                        <Card
                          key={meal.id}
                          variant="outlined"
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                          onClick={() => {
                            setOpenDaySummary(false);
                            handleOpenMealDetail(meal);
                          }}
                        >
                          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body1" fontWeight="medium">
                                  {meal.recipeName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {meal.servings} servings
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMeal(meal.id);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                );
              })}

              {/* Empty state */}
              {getMealsForDay(selectedDay, 'BREAKFAST').length === 0 &&
               getMealsForDay(selectedDay, 'LUNCH').length === 0 &&
               getMealsForDay(selectedDay, 'DINNER').length === 0 &&
               getMealsForDay(selectedDay, 'SNACK').length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No meals planned for this day
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setOpenDaySummary(false);
                      handleOpenDialog(selectedDay, 'DINNER');
                    }}
                    sx={{ mt: 2 }}
                  >
                    Add Meal
                  </Button>
                </Box>
              )}

              <Divider />

              {/* Nutrition Summary Placeholder */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Daily Nutrition Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total nutrition information for all meals would be calculated and displayed here, including:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="• Total calories" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Macronutrients (protein, carbs, fat)" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Key vitamins and minerals" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Comparison to daily recommended values" />
                  </ListItem>
                </List>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (selectedDay) {
                handleOpenDialog(selectedDay, 'DINNER');
                setOpenDaySummary(false);
              }
            }}
            startIcon={<AddIcon />}
          >
            Add Meal
          </Button>
          <Button
            color="error"
            onClick={handleClearDay}
            disabled={!selectedDay || (
              getMealsForDay(selectedDay, 'BREAKFAST').length === 0 &&
              getMealsForDay(selectedDay, 'LUNCH').length === 0 &&
              getMealsForDay(selectedDay, 'DINNER').length === 0 &&
              getMealsForDay(selectedDay, 'SNACK').length === 0
            )}
          >
            Clear All Meals
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MealPlanner;

// Made with Bob

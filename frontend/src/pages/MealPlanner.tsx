import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ShoppingCart as ShoppingCartIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

interface Meal {
  id: string;
  recipeId: string;
  recipeName: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  date: Date;
  servings: number;
}

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MealPlanner: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [meals, setMeals] = useState<Meal[]>([
    {
      id: '1',
      recipeId: 'r1',
      recipeName: 'Scrambled Eggs',
      mealType: 'BREAKFAST',
      date: new Date(),
      servings: 2,
    },
    {
      id: '2',
      recipeId: 'r2',
      recipeName: 'Chicken Salad',
      mealType: 'LUNCH',
      date: new Date(),
      servings: 4,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>('DINNER');
  const [newMeal, setNewMeal] = useState({
    recipeName: '',
    servings: 4,
  });

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
    setNewMeal({ recipeName: '', servings: 4 });
    setOpenDialog(true);
  };

  const handleAddMeal = () => {
    if (!selectedDate) return;

    const meal: Meal = {
      id: Date.now().toString(),
      recipeId: 'temp',
      recipeName: newMeal.recipeName,
      mealType: selectedMealType as any,
      date: selectedDate,
      servings: newMeal.servings,
    };
    setMeals([...meals, meal]);
    setOpenDialog(false);
  };

  const handleDeleteMeal = (id: string) => {
    setMeals(meals.filter(meal => meal.id !== id));
  };

  const handleGenerateGroceryList = () => {
    // Navigate to grocery list with meal plan data
    alert('Generating grocery list from meal plan...');
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
                                sx={{
                                  p: 1,
                                  bgcolor: 'background.default',
                                  borderRadius: 1,
                                  borderLeft: 3,
                                  borderColor: getMealTypeColor(mealType),
                                  mb: 0.5,
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
                                    <Chip
                                      label={`${meal.servings} servings`}
                                      size="small"
                                      sx={{ height: 16, fontSize: '0.65rem', mt: 0.5 }}
                                    />
                                  </Box>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteMeal(meal.id)}
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
            <TextField
              label="Recipe Name"
              fullWidth
              value={newMeal.recipeName}
              onChange={(e) => setNewMeal({ ...newMeal, recipeName: e.target.value })}
              placeholder="Search or enter recipe name..."
              autoFocus
            />
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
    </Container>
  );
};

export default MealPlanner;

// Made with Bob

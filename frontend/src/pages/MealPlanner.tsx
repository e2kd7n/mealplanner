/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Link,
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
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
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
  recipeImageUrl?: string;
  recipeSourceUrl?: string;
}

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper function to format date without timezone issues
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MealPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  
  // Family members from API
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [, setFamilyMembersLoading] = useState(false);
  
  // Meal plan state
  const [currentMealPlanId, setCurrentMealPlanId] = useState<string | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealsLoading, setMealsLoading] = useState(false);

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
  
  // Grocery list generation dialog state
  const [openGroceryDialog, setOpenGroceryDialog] = useState(false);
  
  // Edit schedule state
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editMealType, setEditMealType] = useState<string>('');
  
  // Copy/paste state
  const [copiedMeal, setCopiedMeal] = useState<Meal | null>(null);
  
  // Load recipes and family members on mount
  useEffect(() => {
    loadRecipes();
    loadFamilyMembers();
  }, []);
  
  // Load meals when week changes
  useEffect(() => {
    loadMealsForWeek();
  }, [currentWeekStart]);
  
  const loadMealsForWeek = async () => {
    try {
      setMealsLoading(true);
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      
      // Format dates for API query
      const startDate = currentWeekStart.toISOString().split('T')[0];
      const endDate = addDays(currentWeekStart, 6).toISOString().split('T')[0];
      
      const response = await fetch(
        `${apiBase}/meal-plans?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load meal plans');
      }

      const result = await response.json();
      const mealPlans = result.data || [];
      
      // Get the meal plan for this week (should be only one)
      if (mealPlans.length > 0) {
        const mealPlan = mealPlans[0];
        setCurrentMealPlanId(mealPlan.id);
        
        // Transform planned meals to our Meal interface
        const transformedMeals: Meal[] = mealPlan.plannedMeals.map((pm: any) => ({
          id: pm.id,
          recipeId: pm.recipeId,
          recipeName: pm.recipe?.title || 'Unknown Recipe',
          mealType: pm.mealType.toUpperCase() as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
          date: new Date(pm.date + 'T00:00:00'),
          servings: pm.servings,
          assignedCookId: pm.assignedCookId || undefined,
          assignedCookName: pm.assignedCook?.name,
          recipeImageUrl: pm.recipe?.imageUrl || undefined,
          recipeSourceUrl: pm.recipe?.sourceUrl || undefined,
        }));
        
        setMeals(transformedMeals);
      } else {
        // No meal plan for this week yet
        setCurrentMealPlanId(null);
        setMeals([]);
      }
    } catch (error) {
      console.error('Failed to load meals:', error);
      setMeals([]);
    } finally {
      setMealsLoading(false);
    }
  };

  const loadRecipes = async () => {
    try {
      setRecipeSearchLoading(true);
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/recipes?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load recipes');
      }

      const result = await response.json();
      const recipesData = result.recipes || result.data?.recipes || [];
      setRecipes(recipesData);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      setRecipes([]);
    } finally {
      setRecipeSearchLoading(false);
    }
  };

  const loadFamilyMembers = async () => {
    try {
      setFamilyMembersLoading(true);
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/family-members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load family members');
      }

      const result = await response.json();
      setFamilyMembers(result.data || []);
    } catch (error) {
      console.error('Failed to load family members:', error);
      // Set empty array on error so UI still works
      setFamilyMembers([]);
    } finally {
      setFamilyMembersLoading(false);
    }
  };
  
  const ensureMealPlanExists = async (): Promise<string> => {
    if (currentMealPlanId) {
      return currentMealPlanId;
    }
    
    // Create a new meal plan for this week
    try {
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      
      const response = await fetch(`${apiBase}/meal-plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekStartDate: currentWeekStart.toISOString().split('T')[0],
          status: 'draft',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create meal plan');
      }

      const result = await response.json();
      const newMealPlanId = result.data.id;
      setCurrentMealPlanId(newMealPlanId);
      return newMealPlanId;
    } catch (error) {
      console.error('Failed to create meal plan:', error);
      throw error;
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

  const handleAddMeal = async () => {
    if (!selectedDate || !newMeal.recipeId) return;

    try {
      const mealPlanId = await ensureMealPlanExists();
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      
      const response = await fetch(`${apiBase}/meal-plans/${mealPlanId}/meals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId: newMeal.recipeId,
          date: formatDateForAPI(selectedDate),
          mealType: selectedMealType.toLowerCase(),
          servings: newMeal.servings,
          assignedCookId: newMeal.assignedCookId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add meal');
      }

      const result = await response.json();
      const addedMeal = result.data;
      
      // Add to local state
      const meal: Meal = {
        id: addedMeal.id,
        recipeId: addedMeal.recipeId,
        recipeName: addedMeal.recipe?.title || newMeal.recipeName,
        mealType: addedMeal.mealType.toUpperCase() as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
        date: new Date(addedMeal.date + 'T00:00:00'),
        servings: addedMeal.servings,
        assignedCookId: addedMeal.assignedCookId || undefined,
        assignedCookName: addedMeal.assignedCook?.name,
        recipeImageUrl: addedMeal.recipe?.imageUrl || undefined,
        recipeSourceUrl: addedMeal.recipe?.sourceUrl || undefined,
      };
      
      setMeals([...meals, meal]);
      setOpenDialog(false);
    } catch (error) {
      console.error('Failed to add meal:', error);
      alert('Failed to add meal. Please try again.');
    }
  };

  const handleDeleteMeal = async (id: string, event?: React.MouseEvent) => {
    // Stop propagation to prevent opening meal detail when clicking delete
    if (event) {
      event.stopPropagation();
    }
    
    if (!currentMealPlanId) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      
      const response = await fetch(
        `${apiBase}/meal-plans/${currentMealPlanId}/meals/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

      // Remove from local state
      setMeals(meals.filter(meal => meal.id !== id));
    } catch (error) {
      console.error('Failed to delete meal:', error);
      alert('Failed to delete meal. Please try again.');
    }
  };

  const handleGenerateGroceryList = () => {
    setOpenGroceryDialog(true);
  };
  
  const handleNavigateToGroceryList = async () => {
    if (!currentMealPlanId) {
      alert('No meal plan found. Please add some meals first.');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      
      // Generate grocery list from meal plan
      const response = await fetch(`${apiBase}/meal-plans/${currentMealPlanId}/generate-grocery-list`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate grocery list');
      }

      setOpenGroceryDialog(false);
      navigate('/grocery-list');
    } catch (error) {
      console.error('Failed to generate grocery list:', error);
      alert('Failed to generate grocery list. Please try again.');
    }
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
      setCopiedMeal(selectedMeal);
      setOpenMealDetail(false);
    }
  };
  
  const handlePasteMeal = async (date: Date, mealType: string) => {
    if (!copiedMeal) return;
    
    try {
      const mealPlanId = await ensureMealPlanExists();
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      
      const response = await fetch(`${apiBase}/meal-plans/${mealPlanId}/meals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId: copiedMeal.recipeId,
          date: date.toISOString().split('T')[0],
          mealType: mealType.toLowerCase(),
          servings: copiedMeal.servings,
          assignedCookId: copiedMeal.assignedCookId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to paste meal');
      }

      const result = await response.json();
      const addedMeal = result.data;
      
      // Add to local state
      const newMeal: Meal = {
        id: addedMeal.id,
        recipeId: addedMeal.recipeId,
        recipeName: addedMeal.recipe?.title || copiedMeal.recipeName,
        mealType: mealType as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
        date,
        servings: addedMeal.servings,
        assignedCookId: addedMeal.assignedCookId || undefined,
        assignedCookName: addedMeal.assignedCook?.name,
        recipeImageUrl: addedMeal.recipe?.imageUrl || copiedMeal.recipeImageUrl,
        recipeSourceUrl: addedMeal.recipe?.sourceUrl || copiedMeal.recipeSourceUrl,
      };
      
      setMeals([...meals, newMeal]);
    } catch (error) {
      console.error('Failed to paste meal:', error);
      alert('Failed to paste meal. Please try again.');
    }
  };

  const handleStartEditSchedule = () => {
    if (selectedMeal) {
      setEditDate(selectedMeal.date);
      setEditMealType(selectedMeal.mealType);
      setEditingSchedule(true);
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedMeal || !editDate || !editMealType || !currentMealPlanId) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      
      const response = await fetch(
        `${apiBase}/meal-plans/${currentMealPlanId}/meals/${selectedMeal.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: formatDateForAPI(editDate),
            mealType: editMealType.toLowerCase(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update meal schedule');
      }

      // Update local state
      const updatedMeals = meals.map(meal =>
        meal.id === selectedMeal.id
          ? { ...meal, date: editDate, mealType: editMealType as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' }
          : meal
      );
      setMeals(updatedMeals);
      setEditingSchedule(false);
      setOpenMealDetail(false);
    } catch (error) {
      console.error('Failed to update meal schedule:', error);
      alert('Failed to update meal schedule. Please try again.');
    }
  };

  const handleCancelEditSchedule = () => {
    setEditingSchedule(false);
    setEditDate(null);
    setEditMealType('');
  };

  const handleClearDay = async () => {
    if (!selectedDay || !currentMealPlanId) return;
    
    const mealsToDelete = meals.filter(meal => isSameDay(meal.date, selectedDay));
    
    try {
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      
      // Delete all meals for this day
      await Promise.all(
        mealsToDelete.map(meal =>
          fetch(`${apiBase}/meal-plans/${currentMealPlanId}/meals/${meal.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
        )
      );
      
      // Update local state
      setMeals(meals.filter(meal => !isSameDay(meal.date, selectedDay)));
      setOpenDaySummary(false);
    } catch (error) {
      console.error('Failed to clear day:', error);
      alert('Failed to clear day. Please try again.');
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
        {mealsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
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
                              }}
                            >
                              {copiedMeal ? (
                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                  <Button
                                    size="small"
                                    onClick={() => handleOpenDialog(day, mealType)}
                                    sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                                  >
                                    Add
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handlePasteMeal(day, mealType)}
                                    sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                                  >
                                    Paste
                                  </Button>
                                </Stack>
                              ) : (
                                <Box
                                  sx={{
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
                              )}
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
        )}
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
            disabled={!newMeal.recipeId || !newMeal.recipeName}
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
              {/* Recipe Image */}
              {selectedMeal.recipeImageUrl && (
                <Box
                  component="img"
                  src={selectedMeal.recipeImageUrl}
                  alt={selectedMeal.recipeName}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 1,
                  }}
                />
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Recipe
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">{selectedMeal.recipeName}</Typography>
                  {selectedMeal.recipeId && selectedMeal.recipeId !== 'temp' && (
                    <Link
                      href={`/recipes/${selectedMeal.recipeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </Link>
                  )}
                </Box>
                {selectedMeal.recipeSourceUrl && (
                  <Link
                    href={selectedMeal.recipeSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                  >
                    <LinkIcon fontSize="small" />
                    <Typography variant="caption">View Original Recipe</Typography>
                  </Link>
                )}
              </Box>

              <Divider />

              {editingSchedule ? (
                <>
                  <Box>
                    <TextField
                      select
                      label="Meal Type"
                      fullWidth
                      value={editMealType}
                      onChange={(e) => setEditMealType(e.target.value)}
                    >
                      {MEAL_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  <Box>
                    <TextField
                      label="Date"
                      type="date"
                      fullWidth
                      value={editDate ? format(editDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setEditDate(new Date(e.target.value + 'T00:00:00'))}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Box>
                </>
              ) : (
                <>
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
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={handleStartEditSchedule}
                      sx={{ mt: 0.5 }}
                    >
                      Change Schedule
                    </Button>
                  </Box>
                </>
              )}

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
          {editingSchedule ? (
            <>
              <Button onClick={handleCancelEditSchedule}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveSchedule}
                disabled={!editDate || !editMealType}
              >
                Save Schedule
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
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

      {/* Grocery List Generation Dialog */}
      <Dialog
        open={openGroceryDialog}
        onClose={() => setOpenGroceryDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Generate Grocery List</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            A grocery list will be generated from all meals in your current meal plan.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The list will include all ingredients needed for the planned meals.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGroceryDialog(false)}>
            Stay Here
          </Button>
          <Button
            onClick={handleNavigateToGroceryList}
            variant="contained"
            startIcon={<ShoppingCartIcon />}
          >
            View Grocery List
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MealPlanner;

// Made with Bob

/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import React, { useState, useEffect, useRef } from 'react';
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
  ViewWeek as ViewWeekIcon,
  CalendarMonth as CalendarMonthIcon,
  ViewDay as ViewDayIcon,
  DragIndicator as DragIndicatorIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { format, addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { mealPlanAPI } from '../services/api';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { recipeAPI, familyMemberAPI, groceryListAPI } from '../services/api';
import BatchCookingDialog from '../components/BatchCookingDialog';
import { websocketService } from '../services/websocket.service';
import type { MealPlanUpdate } from '../services/websocket.service';

interface FamilyMember {
  id: string;
  name: string;
  canCook: boolean;
  ageGroup?: string;
  dietaryRestrictions?: string[];
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
  isLeftover?: boolean;
}

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

type ViewMode = 'month' | 'week' | '3-day';

// Helper function to format date without timezone issues
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MealPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  
  // Initialize with date at midnight to avoid timezone issues
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return startOfWeek(today);
  });
  
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
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  
  // Edit meal state (for updating existing meals)
  const [isEditingMeal, setIsEditingMeal] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editMealType, setEditMealType] = useState<string>('');
  
  // Drag and drop state
  const [activeMeal, setActiveMeal] = useState<Meal | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );
  
  // Copy/paste state
  const [copiedMeal, setCopiedMeal] = useState<Meal | null>(null);
  
  // Batch cooking state
  const [openBatchCooking, setOpenBatchCooking] = useState(false);
  
  // Load recipes and family members on mount (only once)
  useEffect(() => {
    loadRecipes('');
    loadFamilyMembers();
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - load only once
  
  // Load meals when week changes
  useEffect(() => {
    loadMealsForWeek();
  }, [currentWeekStart]); // Only reload when week changes
  
  // WebSocket connection and meal plan updates
  useEffect(() => {
    // Connect to WebSocket when component mounts
    websocketService.connect();
    
    // Subscribe to meal plan updates
    const unsubscribe = websocketService.onMealPlanUpdate((update: MealPlanUpdate) => {
      console.log('[MealPlanner] Received update:', update);
      
      // Only process updates for the current meal plan
      if (update.mealPlanId !== currentMealPlanId) {
        return;
      }
      
      // Handle different update types
      switch (update.type) {
        case 'meal_added':
          // Add new meal to state
          setMeals((prevMeals) => {
            // Check if meal already exists (avoid duplicates)
            if (prevMeals.some(m => m.id === update.data.id)) {
              return prevMeals;
            }
            return [...prevMeals, {
              id: update.data.id,
              recipeId: update.data.recipeId,
              recipeName: update.data.recipe?.title || 'Unknown Recipe',
              mealType: update.data.mealType,
              date: new Date(update.data.date),
              servings: update.data.servings,
              assignedCookId: update.data.assignedCookId,
              assignedCookName: update.data.assignedCook?.name,
              recipeImageUrl: update.data.recipe?.imageUrl,
              recipeSourceUrl: update.data.recipe?.sourceUrl,
              isLeftover: update.data.isLeftover,
            }];
          });
          break;
          
        case 'meal_updated':
          // Update existing meal in state
          setMeals((prevMeals) =>
            prevMeals.map((meal) =>
              meal.id === update.data.id
                ? {
                    ...meal,
                    mealType: update.data.mealType,
                    date: new Date(update.data.date),
                    servings: update.data.servings,
                    assignedCookId: update.data.assignedCookId,
                    assignedCookName: update.data.assignedCook?.name,
                  }
                : meal
            )
          );
          break;
          
        case 'meal_deleted':
          // Remove meal from state
          setMeals((prevMeals) =>
            prevMeals.filter((meal) => meal.id !== update.data.mealId)
          );
          break;
      }
    });
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
      websocketService.disconnect();
    };
  }, [currentMealPlanId]);
  
  // Join/leave meal plan rooms when meal plan changes
  useEffect(() => {
    if (currentMealPlanId && websocketService.isConnected()) {
      websocketService.joinMealPlan(currentMealPlanId);
    }
    
    return () => {
      if (currentMealPlanId) {
        websocketService.leaveMealPlan(currentMealPlanId);
      }
    };
  }, [currentMealPlanId]);
  
  const loadMealsForWeek = async () => {
    try {
      setMealsLoading(true);
      
      const response = await mealPlanAPI.getAll({ status: 'draft' });
      const mealPlans = response.data.data || [];
      
      // Find the meal plan that matches the current week
      const weekStartStr = formatDateForAPI(currentWeekStart);
      
      const mealPlan = mealPlans.find((mp: any) => {
        // Extract just the date part from the ISO string (YYYY-MM-DD)
        const mpDateStr = mp.weekStartDate.split('T')[0];
        return mpDateStr === weekStartStr;
      });
      
      if (mealPlan) {
        setCurrentMealPlanId(mealPlan.id);
        
        // Transform planned meals to our Meal interface
        const transformedMeals: Meal[] = (mealPlan.plannedMeals || []).map((pm: any) => {
          // Parse the date - it comes as ISO string from backend
          const mealDate = new Date(pm.date);
          
          return {
            id: pm.id,
            recipeId: pm.recipeId,
            recipeName: pm.recipe?.title || 'Unknown Recipe',
            mealType: pm.mealType.toUpperCase() as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
            date: mealDate,
            servings: pm.servings,
            assignedCookId: pm.assignedCookId || undefined,
            assignedCookName: pm.assignedCook?.name,
            recipeImageUrl: pm.recipe?.imageUrl || undefined,
            recipeSourceUrl: pm.recipe?.sourceUrl || undefined,
          };
        });
        
        setMeals(transformedMeals);
      } else {
        // No meal plan for this week yet
        setCurrentMealPlanId(null);
        setMeals([]);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) console.error('Failed to load meals:', error);
      }
      setMeals([]);
    } finally {
      setMealsLoading(false);
    }
  };

  const loadRecipes = async (searchQuery: string = '') => {
    try {
      setRecipeSearchLoading(true);
      const params: { limit: number; search?: string } = { limit: 100 };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const response = await recipeAPI.getAll(params);
      const recipesData = response.data.recipes || response.data.data?.recipes || [];
      setRecipes(recipesData);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to load recipes:', error);
      setRecipes([]);
    } finally {
      setRecipeSearchLoading(false);
    }
  };

  // Debounced search function
  const handleRecipeSearch = (searchValue: string) => {
    setRecipeSearchInput(searchValue);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      loadRecipes(searchValue);
    }, 300); // 300ms debounce
  };

  const loadFamilyMembers = async () => {
    try {
      setFamilyMembersLoading(true);
      const response = await familyMemberAPI.getAll();
      setFamilyMembers(response.data.data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to load family members:', error);
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
    
    // Create a new meal plan for this week using the API service (includes CSRF token)
    try {
      const response = await mealPlanAPI.create({
        weekStartDate: formatDateForAPI(currentWeekStart),
      });

      const newMealPlanId = response.data.data.id;
      setCurrentMealPlanId(newMealPlanId);
      return newMealPlanId;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to create meal plan:', error);
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
    // Load initial recipes when opening dialog
    loadRecipes('');
    setOpenDialog(true);
  };

  const handleAddMeal = async () => {
    if (!selectedDate || !newMeal.recipeId) return;

    try {
      const mealPlanId = await ensureMealPlanExists();
      
      await mealPlanAPI.addMeal(mealPlanId, {
        recipeId: newMeal.recipeId,
        date: formatDateForAPI(selectedDate),
        mealType: selectedMealType.toLowerCase(),
        servings: newMeal.servings,
        assignedCookId: newMeal.assignedCookId || undefined,
      });

      // Reload meals from server to ensure consistency
      await loadMealsForWeek();
      
      setOpenDialog(false);
      setIsEditingMeal(false);
      setEditingMealId(null);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to add meal:', error);
      alert('Failed to add meal. Please try again.');
    }
  };

  const handleUpdateMeal = async () => {
    if (!selectedDate || !newMeal.recipeId || !editingMealId || !currentMealPlanId) return;

    try {
      await mealPlanAPI.updateMeal(currentMealPlanId, editingMealId, {
        date: formatDateForAPI(selectedDate),
        mealType: selectedMealType.toLowerCase(),
        servings: newMeal.servings,
        assignedCookId: newMeal.assignedCookId || undefined,
      });

      // Update local state
      const updatedMeals = meals.map(meal =>
        meal.id === editingMealId
          ? {
              ...meal,
              date: selectedDate,
              mealType: selectedMealType as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
              servings: newMeal.servings,
              assignedCookId: newMeal.assignedCookId || undefined,
            }
          : meal
      );
      setMeals(updatedMeals);
      setOpenDialog(false);
      setIsEditingMeal(false);
      setEditingMealId(null);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to update meal:', error);
      alert('Failed to update meal. Please try again.');
    }
  };

  const handleDeleteMeal = async (id: string, event?: React.MouseEvent) => {
    // Stop propagation to prevent opening meal detail when clicking delete
    if (event) {
      event.stopPropagation();
    }
    
    if (!currentMealPlanId) return;
    
    try {
      await mealPlanAPI.deleteMeal(currentMealPlanId, id);

      // Remove from local state
      setMeals(meals.filter(meal => meal.id !== id));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to delete meal:', error);
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
      // Generate grocery list from meal plan
      await groceryListAPI.generateFromMealPlan(currentMealPlanId);

      setOpenGroceryDialog(false);
      navigate('/grocery-list');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to generate grocery list:', error);
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
      setIsEditingMeal(true);
      setEditingMealId(selectedMeal.id);
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
      
      const response = await mealPlanAPI.addMeal(mealPlanId, {
        recipeId: copiedMeal.recipeId,
        date: formatDateForAPI(date),
        mealType: mealType.toLowerCase(),
        servings: copiedMeal.servings,
        assignedCookId: copiedMeal.assignedCookId || undefined,
      });

      const addedMeal = response.data.data;
      
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
      if (import.meta.env.DEV) console.error('Failed to paste meal:', error);
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
      await mealPlanAPI.updateMeal(currentMealPlanId, selectedMeal.id, {
        date: formatDateForAPI(editDate),
        mealType: editMealType.toLowerCase(),
      });

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
      if (import.meta.env.DEV) console.error('Failed to update meal schedule:', error);
      alert('Failed to update meal schedule. Please try again.');
    }
  };

  const handleBatchCook = async (dates: Date[], servingsMultiplier: number, markAsLeftovers: boolean) => {
    if (!selectedMeal || !currentMealPlanId) return;

    try {
      const formattedDates = dates.map(date => formatDateForAPI(date));
      
      await mealPlanAPI.batchCookMeal(currentMealPlanId, selectedMeal.id, {
        dates: formattedDates,
        servingsMultiplier,
        markAsLeftovers,
      });

      // Reload meals to get the newly created batch cooked meals
      await loadMealsForWeek();
      
      setOpenBatchCooking(false);
      setOpenMealDetail(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to batch cook meal:', error);
      throw error; // Re-throw to let BatchCookingDialog handle the error
    }
  };

  const handleOpenBatchCooking = () => {
    setOpenBatchCooking(true);
    setOpenMealDetail(false);
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
      // Delete all meals for this day
      await Promise.all(
        mealsToDelete.map(meal =>
          mealPlanAPI.deleteMeal(currentMealPlanId, meal.id)
        )
      );
      
      // Update local state
      setMeals(meals.filter(meal => !isSameDay(meal.date, selectedDay)));
      setOpenDaySummary(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error clearing day:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const meal = meals.find(m => m.id === event.active.id);
    if (meal) {
      setActiveMeal(meal);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveMeal(null);

    if (!over || !currentMealPlanId) return;

    // Parse the droppable ID: format is "day-YYYY-MM-DD-MEALTYPE"
    const dropId = over.id as string;
    if (!dropId.startsWith('day-')) return;

    const parts = dropId.split('-');
    if (parts.length < 5) return;

    // Extract date and meal type from drop zone ID
    const dateStr = `${parts[1]}-${parts[2]}-${parts[3]}`;
    const newMealType = parts[4];
    const newDate = new Date(dateStr + 'T00:00:00');

    const meal = meals.find(m => m.id === active.id);
    if (!meal) return;

    // Check if anything changed
    if (isSameDay(meal.date, newDate) && meal.mealType === newMealType) {
      return;
    }

    try {
      await mealPlanAPI.updateMeal(currentMealPlanId, meal.id, {
        date: formatDateForAPI(newDate),
        mealType: newMealType.toLowerCase(),
      });

      // Update local state
      const updatedMeals = meals.map(m =>
        m.id === meal.id
          ? { ...m, date: newDate, mealType: newMealType as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' }
          : m
      );
      setMeals(updatedMeals);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to move meal:', error);
      alert('Failed to move meal. Please try again.');
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

  const getVisibleDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (viewMode) {
      case 'month': {
        const monthStart = startOfMonth(currentWeekStart);
        const monthEnd = endOfMonth(currentWeekStart);
        return eachDayOfInterval({ start: monthStart, end: monthEnd });
      }
      case '3-day': {
        // Show today and next 2 days
        return Array.from({ length: 3 }, (_, i) => addDays(today, i));
      }
      case 'week':
      default:
        return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    }
  };


  // Draggable meal card component
  const DraggableMealCard = ({ meal, mealType }: { meal: Meal; mealType: string }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: meal.id,
    });

    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      opacity: isDragging ? 0.5 : 1,
    } : undefined;

    return (
      <Box
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => {
          // Only open modal if not dragging
          if (!isDragging) {
            handleOpenMealDetail(meal);
          }
        }}
        sx={{
          p: 0.75,
          bgcolor: 'background.default',
          borderRadius: 1,
          borderLeft: 3,
          borderColor: getMealTypeColor(mealType),
          mb: 0.5,
          cursor: isDragging ? 'grabbing' : 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <DragIndicatorIcon
              sx={{
                fontSize: 14,
                mr: 0.5,
                color: 'text.secondary',
                display: { xs: 'none', lg: 'block' }
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'medium',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.75rem',
                }}
              >
                {meal.recipeName}
              </Typography>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  label={`${meal.servings} servings`}
                  size="small"
                  sx={{ height: 16, fontSize: '0.6rem' }}
                />
                {meal.assignedCookName && (
                  <Chip
                    label={`👨‍🍳 ${meal.assignedCookName}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 16, fontSize: '0.6rem' }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  // Droppable zone component
  const DroppableZone = ({ day, mealType, children }: { day: Date; mealType: string; children: React.ReactNode }) => {
    const dropId = `day-${formatDateForAPI(day)}-${mealType}`;
    const { setNodeRef, isOver } = useDroppable({
      id: dropId,
    });

    return (
      <Box
        ref={setNodeRef}
        sx={{
          minHeight: '40px',
          bgcolor: isOver ? 'action.selected' : 'transparent',
          borderRadius: 1,
          transition: 'background-color 0.2s',
        }}
      >
        {children}
      </Box>
    );
  };

  const weekDays = getVisibleDays();

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

        {/* View Mode Selector */}
        <Card sx={{ mb: 2, bgcolor: 'background.default' }}>
          <CardContent sx={{ py: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary" align="center">
                View Mode
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  size="medium"
                  variant={viewMode === 'month' ? 'contained' : 'outlined'}
                  startIcon={<CalendarMonthIcon />}
                  onClick={() => setViewMode('month')}
                  sx={{ minWidth: 120 }}
                >
                  Month
                </Button>
                <Button
                  size="medium"
                  variant={viewMode === 'week' ? 'contained' : 'outlined'}
                  startIcon={<ViewWeekIcon />}
                  onClick={() => setViewMode('week')}
                  sx={{ minWidth: 120 }}
                >
                  Week
                </Button>
                <Button
                  size="medium"
                  variant={viewMode === '3-day' ? 'contained' : 'outlined'}
                  startIcon={<ViewDayIcon />}
                  onClick={() => setViewMode('3-day')}
                  sx={{ minWidth: 120 }}
                >
                  3-Day
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

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
                  {viewMode === 'month'
                    ? format(currentWeekStart, 'MMMM yyyy')
                    : viewMode === '3-day'
                    ? 'Next 3 Days'
                    : `Week of ${format(currentWeekStart, 'MMM d')} - ${format(addDays(currentWeekStart, 6), 'MMM d')}`
                  }
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
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: viewMode === 'month'
                  ? 'repeat(7, minmax(120px, 1fr))'
                  : viewMode === '3-day'
                  ? 'repeat(3, minmax(200px, 1fr))'
                  : 'repeat(7, minmax(120px, 1fr))',
                gap: { xs: 1, md: 1.5, lg: 2 },
                overflowX: 'auto',
              }}
            >
            {weekDays.map((day, dayIndex) => {
            const isToday = isSameDay(day, new Date());

            return (
              <Card
                key={dayIndex}
                sx={{
                  bgcolor: 'background.paper',
                  border: 2,
                  borderColor: isToday ? 'success.main' : 'transparent',
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
                        color: 'text.primary',
                      }}
                    >
                      {format(day, 'EEE')}
                    </Typography>
                    <Typography
                      variant="h6"
                      align="center"
                      gutterBottom
                      sx={{
                        color: 'text.primary',
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

                          <DroppableZone day={day} mealType={mealType}>
                            {dayMeals.length === 0 ? (
                              copiedMeal ? (
                                <Box
                                  sx={{
                                    p: 1,
                                    bgcolor: 'action.hover',
                                    borderRadius: 1,
                                    textAlign: 'center',
                                  }}
                                >
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
                                </Box>
                              ) : null
                            ) : (
                              dayMeals.map((meal) => (
                                <DraggableMealCard key={meal.id} meal={meal} mealType={mealType} />
                              ))
                            )}
                          </DroppableZone>
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
            </Box>
            <DragOverlay>
              {activeMeal ? (
                <Box
                  sx={{
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    borderLeft: 3,
                    borderColor: getMealTypeColor(activeMeal.mealType),
                    boxShadow: 3,
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                    {activeMeal.recipeName}
                  </Typography>
                </Box>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </Box>

      {/* Add/Edit Meal Dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setIsEditingMeal(false); setEditingMealId(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditingMeal ? 'Edit Meal' : `Add Meal for ${selectedDate && format(selectedDate, 'EEEE, MMM d')}`}
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
              onInputChange={(_, value) => handleRecipeSearch(value)}
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
          <Button onClick={() => { setOpenDialog(false); setIsEditingMeal(false); setEditingMealId(null); }}>Cancel</Button>
          <Button
            onClick={isEditingMeal ? handleUpdateMeal : handleAddMeal}
            variant="contained"
            disabled={!newMeal.recipeId || !newMeal.recipeName}
          >
            {isEditingMeal ? 'Update Meal' : 'Add Meal'}
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
                      value={editDate ? formatDateForAPI(editDate) : ''}
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
                startIcon={<RestaurantIcon />}
                onClick={handleOpenBatchCooking}
                color="primary"
              >
                Batch Cook
              </Button>
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

      {/* Batch Cooking Dialog */}
      <BatchCookingDialog
        open={openBatchCooking}
        onClose={() => setOpenBatchCooking(false)}
        meal={selectedMeal}
        onBatchCook={handleBatchCook}
        currentWeekStart={currentWeekStart}
      />
    </Container>
  );
};

export default MealPlanner;

// Made with Bob

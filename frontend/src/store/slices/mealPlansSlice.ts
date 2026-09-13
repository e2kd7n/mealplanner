/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mealPlanAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/errorHandler';

export interface PlannedMeal {
  id: string;
  recipeId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  assignedCookId?: string;
  notes?: string;
  recipe?: {
    id: string;
    title: string;
    imageUrl?: string;
    prepTime: number;
    cookTime: number;
  };
}

export interface MealPlan {
  id: string;
  weekStartDate: string;
  status: 'draft' | 'active' | 'completed';
  plannedMeals: PlannedMeal[];
  createdAt: string;
  updatedAt: string;
}

interface MealPlansState {
  mealPlans: MealPlan[];
  currentMealPlan: MealPlan | null;
  loading: boolean;
  error: string | null;
}

const initialState: MealPlansState = {
  mealPlans: [],
  currentMealPlan: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchMealPlans = createAsyncThunk(
  'mealPlans/fetchMealPlans',
  async (params: { status?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await mealPlanAPI.getAll(params);
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch meal plans'));
    }
  }
);

export const fetchCurrentMealPlan = createAsyncThunk(
  'mealPlans/fetchCurrentMealPlan',
  async (_, { rejectWithValue }) => {
    try {
      const response = await mealPlanAPI.getCurrent();
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch current meal plan'));
    }
  }
);

export const addMealToPlan = createAsyncThunk(
  'mealPlans/addMealToPlan',
  async ({ planId, mealData }: {
    planId: string;
    mealData: {
      recipeId: string;
      date: string;
      mealType: string;
      servings: number;
      assignedCookId?: string;
      notes?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await mealPlanAPI.addMeal(planId, mealData);
      return { planId, meal: response.data.data };
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to add meal'));
    }
  }
);

const mealPlansSlice = createSlice({
  name: 'mealPlans',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch meal plans
      .addCase(fetchMealPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.mealPlans = action.payload;
      })
      .addCase(fetchMealPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch current meal plan
      .addCase(fetchCurrentMealPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentMealPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMealPlan = action.payload;
      })
      .addCase(fetchCurrentMealPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add meal to plan
      .addCase(addMealToPlan.fulfilled, (state, action) => {
        if (state.currentMealPlan?.id === action.payload.planId) {
          state.currentMealPlan.plannedMeals.push(action.payload.meal);
        }
      });
  },
});

export const { clearError } = mealPlansSlice.actions;
export default mealPlansSlice.reducer;

// Made with Bob

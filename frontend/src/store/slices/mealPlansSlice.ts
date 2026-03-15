import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { mealPlanAPI } from '../../services/api';

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
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch meal plans');
    }
  }
);

export const fetchMealPlanById = createAsyncThunk(
  'mealPlans/fetchMealPlanById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await mealPlanAPI.getById(id);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch meal plan');
    }
  }
);

export const fetchCurrentMealPlan = createAsyncThunk(
  'mealPlans/fetchCurrentMealPlan',
  async (_, { rejectWithValue }) => {
    try {
      const response = await mealPlanAPI.getCurrent();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch current meal plan');
    }
  }
);

export const createMealPlan = createAsyncThunk(
  'mealPlans/createMealPlan',
  async (data: { weekStartDate: string }, { rejectWithValue }) => {
    try {
      const response = await mealPlanAPI.create(data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create meal plan');
    }
  }
);

export const updateMealPlan = createAsyncThunk(
  'mealPlans/updateMealPlan',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await mealPlanAPI.update(id, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update meal plan');
    }
  }
);

export const deleteMealPlan = createAsyncThunk(
  'mealPlans/deleteMealPlan',
  async (id: string, { rejectWithValue }) => {
    try {
      await mealPlanAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete meal plan');
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
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add meal');
    }
  }
);

export const updateMealInPlan = createAsyncThunk(
  'mealPlans/updateMealInPlan',
  async ({ planId, mealId, data }: {
    planId: string;
    mealId: string;
    data: any;
  }, { rejectWithValue }) => {
    try {
      const response = await mealPlanAPI.updateMeal(planId, mealId, data);
      return { planId, meal: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update meal');
    }
  }
);

export const deleteMealFromPlan = createAsyncThunk(
  'mealPlans/deleteMealFromPlan',
  async ({ planId, mealId }: { planId: string; mealId: string }, { rejectWithValue }) => {
    try {
      await mealPlanAPI.deleteMeal(planId, mealId);
      return { planId, mealId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete meal');
    }
  }
);

const mealPlansSlice = createSlice({
  name: 'mealPlans',
  initialState,
  reducers: {
    setCurrentMealPlan: (state, action: PayloadAction<MealPlan | null>) => {
      state.currentMealPlan = action.payload;
    },
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
      // Fetch meal plan by ID
      .addCase(fetchMealPlanById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealPlanById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMealPlan = action.payload;
      })
      .addCase(fetchMealPlanById.rejected, (state, action) => {
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
      // Create meal plan
      .addCase(createMealPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMealPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.mealPlans.unshift(action.payload);
        state.currentMealPlan = action.payload;
      })
      .addCase(createMealPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update meal plan
      .addCase(updateMealPlan.fulfilled, (state, action) => {
        const index = state.mealPlans.findIndex(mp => mp.id === action.payload.id);
        if (index !== -1) {
          state.mealPlans[index] = action.payload;
        }
        if (state.currentMealPlan?.id === action.payload.id) {
          state.currentMealPlan = action.payload;
        }
      })
      // Delete meal plan
      .addCase(deleteMealPlan.fulfilled, (state, action) => {
        state.mealPlans = state.mealPlans.filter(mp => mp.id !== action.payload);
        if (state.currentMealPlan?.id === action.payload) {
          state.currentMealPlan = null;
        }
      })
      // Add meal to plan
      .addCase(addMealToPlan.fulfilled, (state, action) => {
        if (state.currentMealPlan?.id === action.payload.planId) {
          state.currentMealPlan.plannedMeals.push(action.payload.meal);
        }
      })
      // Update meal in plan
      .addCase(updateMealInPlan.fulfilled, (state, action) => {
        if (state.currentMealPlan?.id === action.payload.planId) {
          const index = state.currentMealPlan.plannedMeals.findIndex(
            m => m.id === action.payload.meal.id
          );
          if (index !== -1) {
            state.currentMealPlan.plannedMeals[index] = action.payload.meal;
          }
        }
      })
      // Delete meal from plan
      .addCase(deleteMealFromPlan.fulfilled, (state, action) => {
        if (state.currentMealPlan?.id === action.payload.planId) {
          state.currentMealPlan.plannedMeals = state.currentMealPlan.plannedMeals.filter(
            m => m.id !== action.payload.mealId
          );
        }
      });
  },
});

export const { setCurrentMealPlan, clearError } = mealPlansSlice.actions;
export default mealPlansSlice.reducer;

// Made with Bob

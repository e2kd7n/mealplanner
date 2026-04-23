/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { recipeBrowseAPI } from '../../services/api';

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image?: string;
  imageType?: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl?: string;
  summary?: string;
  cuisines?: string[];
  diets?: string[];
  dishTypes?: string[];
  instructions?: string;
  extendedIngredients?: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
    original: string;
  }>;
  analyzedInstructions?: any[];
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
}

interface RecipeBrowseState {
  recipes: SpoonacularRecipe[];
  currentRecipe: SpoonacularRecipe | null;
  loading: boolean;
  error: string | null;
  pagination: {
    offset: number;
    number: number;
    totalResults: number;
  };
  filters: {
    query?: string;
    cuisine?: string;
    diet?: string;
    type?: string;
    maxReadyTime?: number;
    sort?: string;
  };
  addingToBox: boolean;
  addToBoxError: string | null;
  addedRecipeIds: Set<number>;
}

const initialState: RecipeBrowseState = {
  recipes: [],
  currentRecipe: null,
  loading: false,
  error: null,
  pagination: {
    offset: 0,
    number: 12,
    totalResults: 0,
  },
  filters: {},
  addingToBox: false,
  addToBoxError: null,
  addedRecipeIds: new Set<number>(),
};

// Async thunks
export const searchSpoonacularRecipes = createAsyncThunk(
  'recipeBrowse/searchRecipes',
  async (params: {
    query?: string;
    cuisine?: string;
    diet?: string;
    type?: string;
    maxReadyTime?: number;
    sort?: string;
    offset?: number;
    number?: number;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await recipeBrowseAPI.search(params);
      // Backend wraps response in { success: true, data: {...} }
      return response.data.data;
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Spoonacular search error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to search recipes');
    }
  }
);

export const getSpoonacularRecipeDetails = createAsyncThunk(
  'recipeBrowse/getRecipeDetails',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await recipeBrowseAPI.getDetails(id);
      // Backend wraps response in { success: true, data: {...} }
      return response.data.data;
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Spoonacular recipe details error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recipe details');
    }
  }
);

export const addSpoonacularRecipeToBox = createAsyncThunk(
  'recipeBrowse/addToBox',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await recipeBrowseAPI.addToBox(id);
      // Backend wraps response in { success: true, data: {...} }
      return response.data.data;
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Add to recipe box error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to add recipe to box');
    }
  }
);

const recipeBrowseSlice = createSlice({
  name: 'recipeBrowse',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<RecipeBrowseState['filters']>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCurrentRecipe: (state, action: PayloadAction<SpoonacularRecipe | null>) => {
      state.currentRecipe = action.payload;
    },
    clearError: (state) => {
      state.error = null;
      state.addToBoxError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Search recipes
      .addCase(searchSpoonacularRecipes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchSpoonacularRecipes.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.recipes = action.payload.results || [];
          state.pagination = {
            offset: action.payload.offset || 0,
            number: action.payload.number || 12,
            totalResults: action.payload.totalResults || 0,
          };
        }
      })
      .addCase(searchSpoonacularRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get recipe details
      .addCase(getSpoonacularRecipeDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSpoonacularRecipeDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecipe = action.payload;
      })
      .addCase(getSpoonacularRecipeDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add to recipe box
      .addCase(addSpoonacularRecipeToBox.pending, (state) => {
        state.addingToBox = true;
        state.addToBoxError = null;
      })
      .addCase(addSpoonacularRecipeToBox.fulfilled, (state, action) => {
        state.addingToBox = false;
        // Extract recipe ID from the meta argument
        const recipeId = action.meta.arg;
        state.addedRecipeIds.add(recipeId);
      })
      .addCase(addSpoonacularRecipeToBox.rejected, (state, action) => {
        state.addingToBox = false;
        const error = action.payload as string;
        // If it's a duplicate error, still mark as added
        if (error?.includes('already in your recipe box')) {
          const recipeId = action.meta.arg;
          state.addedRecipeIds.add(recipeId);
        }
        state.addToBoxError = error;
      });
  },
});

export const { setFilters, clearFilters, setCurrentRecipe, clearError } = recipeBrowseSlice.actions;
export default recipeBrowseSlice.reducer;

// Made with Bob
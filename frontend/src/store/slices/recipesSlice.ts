/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { recipeAPI } from '../../services/api';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert')[];
  cuisineType?: string;
  imageUrl?: string;
  ingredients: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }>;
  instructions: any;
  kidFriendly: boolean;
  averageRating?: number;
  totalRatings?: number;
}

interface RecipesState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search?: string;
    mealType?: string;
    difficulty?: string;
    maxPrepTime?: number;
    kidFriendly?: boolean;
  };
}

const initialState: RecipesState = {
  recipes: [],
  currentRecipe: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
  filters: {},
};

// Async thunks
export const fetchRecipes = createAsyncThunk(
  'recipes/fetchRecipes',
  async (params: {
    page?: number;
    limit?: number;
    search?: string;
    mealType?: string;
    difficulty?: string;
    maxPrepTime?: number;
    kidFriendly?: boolean;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await recipeAPI.getAll(params);
      return response.data;
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Recipe fetch error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recipes');
    }
  }
);

export const fetchRecipeById = createAsyncThunk(
  'recipes/fetchRecipeById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await recipeAPI.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recipe');
    }
  }
);

export const createRecipe = createAsyncThunk(
  'recipes/createRecipe',
  async (recipeData: any, { rejectWithValue }) => {
    try {
      const response = await recipeAPI.create(recipeData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create recipe');
    }
  }
);

export const updateRecipe = createAsyncThunk(
  'recipes/updateRecipe',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await recipeAPI.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update recipe');
    }
  }
);

export const deleteRecipe = createAsyncThunk(
  'recipes/deleteRecipe',
  async (id: string, { rejectWithValue }) => {
    try {
      await recipeAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete recipe');
    }
  }
);

export const rateRecipe = createAsyncThunk(
  'recipes/rateRecipe',
  async ({ id, rating, notes, wouldMakeAgain }: {
    id: string;
    rating: number;
    notes?: string;
    wouldMakeAgain: boolean;
  }, { rejectWithValue }) => {
    try {
      const response = await recipeAPI.rate(id, { rating, notes, wouldMakeAgain });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to rate recipe');
    }
  }
);

export const searchRecipes = createAsyncThunk(
  'recipes/searchRecipes',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await recipeAPI.search(query);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search recipes');
    }
  }
);

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<RecipesState['filters']>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCurrentRecipe: (state, action: PayloadAction<Recipe | null>) => {
      state.currentRecipe = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch recipes
      .addCase(fetchRecipes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.loading = false;
        // The API returns { recipes: [...], pagination: {...} }
        // But axios wraps it in response.data, so action.payload is already the unwrapped data
        if (action.payload) {
          // Check if payload has recipes property (expected format)
          if (action.payload.recipes) {
            state.recipes = action.payload.recipes;
            state.pagination = action.payload.pagination || state.pagination;
          }
          // Check if payload.data has recipes (double-wrapped)
          else if (action.payload.data && action.payload.data.recipes) {
            state.recipes = action.payload.data.recipes;
            state.pagination = action.payload.data.pagination || state.pagination;
          }
          // Fallback: treat payload as array of recipes
          else if (Array.isArray(action.payload)) {
            state.recipes = action.payload;
          }
          // Last resort: empty array
          else {
            state.recipes = [];
          }
        } else {
          state.recipes = [];
        }
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch recipe by ID
      .addCase(fetchRecipeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipeById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecipe = action.payload;
      })
      .addCase(fetchRecipeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create recipe
      .addCase(createRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRecipe.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes.unshift(action.payload);
      })
      .addCase(createRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update recipe
      .addCase(updateRecipe.fulfilled, (state, action) => {
        const index = state.recipes.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.recipes[index] = action.payload;
        }
        if (state.currentRecipe?.id === action.payload.id) {
          state.currentRecipe = action.payload;
        }
      })
      // Delete recipe
      .addCase(deleteRecipe.fulfilled, (state, action) => {
        state.recipes = state.recipes.filter(r => r.id !== action.payload);
        if (state.currentRecipe?.id === action.payload) {
          state.currentRecipe = null;
        }
      })
      // Rate recipe
      .addCase(rateRecipe.fulfilled, (state, action) => {
        if (state.currentRecipe) {
          state.currentRecipe = { ...state.currentRecipe, ...action.payload };
        }
      })
      // Search recipes
      .addCase(searchRecipes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes = action.payload;
      })
      .addCase(searchRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, setCurrentRecipe } = recipesSlice.actions;
export default recipesSlice.reducer;

// Made with Bob

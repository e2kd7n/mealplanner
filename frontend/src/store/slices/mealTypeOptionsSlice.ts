/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mealTypeOptionsAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/errorHandler';

export interface MealTypeOption {
  id: string;
  name: string;
  sortOrder: number;
}

interface MealTypeOptionsState {
  options: MealTypeOption[];
  loading: boolean;
  error: string | null;
}

const initialState: MealTypeOptionsState = {
  options: [],
  loading: false,
  error: null,
};

export const fetchMealTypeOptions = createAsyncThunk(
  'mealTypeOptions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await mealTypeOptionsAPI.getAll();
      return response.data.data as MealTypeOption[];
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch meal type categories'));
    }
  }
);

export const createMealTypeOption = createAsyncThunk(
  'mealTypeOptions/create',
  async (data: { name: string; sortOrder?: number }, { rejectWithValue }) => {
    try {
      const response = await mealTypeOptionsAPI.create(data);
      return response.data.data as MealTypeOption;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to create meal type category'));
    }
  }
);

export const updateMealTypeOption = createAsyncThunk(
  'mealTypeOptions/update',
  async ({ id, data }: { id: string; data: { name?: string; sortOrder?: number } }, { rejectWithValue }) => {
    try {
      const response = await mealTypeOptionsAPI.update(id, data);
      return response.data.data as MealTypeOption;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to update meal type category'));
    }
  }
);

export const deleteMealTypeOption = createAsyncThunk(
  'mealTypeOptions/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await mealTypeOptionsAPI.delete(id);
      return id;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to delete meal type category'));
    }
  }
);

const mealTypeOptionsSlice = createSlice({
  name: 'mealTypeOptions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMealTypeOptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealTypeOptions.fulfilled, (state, action) => {
        state.loading = false;
        state.options = action.payload;
      })
      .addCase(fetchMealTypeOptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createMealTypeOption.fulfilled, (state, action) => {
        state.options.push(action.payload);
      })
      .addCase(updateMealTypeOption.fulfilled, (state, action) => {
        const index = state.options.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.options[index] = action.payload;
        }
      })
      .addCase(deleteMealTypeOption.fulfilled, (state, action) => {
        state.options = state.options.filter((o) => o.id !== action.payload);
      });
  },
});

export const { clearError } = mealTypeOptionsSlice.actions;
export default mealTypeOptionsSlice.reducer;

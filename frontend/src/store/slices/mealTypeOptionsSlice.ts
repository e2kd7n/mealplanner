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
      });
  },
});

export const { clearError } = mealTypeOptionsSlice.actions;
export default mealTypeOptionsSlice.reducer;

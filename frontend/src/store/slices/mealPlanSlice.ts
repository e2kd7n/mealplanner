import { createSlice } from '@reduxjs/toolkit';

interface MealPlanState {
  mealPlans: any[];
  currentMealPlan: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: MealPlanState = {
  mealPlans: [],
  currentMealPlan: null,
  loading: false,
  error: null,
};

const mealPlanSlice = createSlice({
  name: 'mealPlans',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { clearError } = mealPlanSlice.actions;
export default mealPlanSlice.reducer;

// Made with Bob

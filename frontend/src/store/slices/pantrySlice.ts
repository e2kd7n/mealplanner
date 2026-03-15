import { createSlice } from '@reduxjs/toolkit';

interface PantryState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: PantryState = {
  items: [],
  loading: false,
  error: null,
};

const pantrySlice = createSlice({
  name: 'pantry',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { clearError } = pantrySlice.actions;
export default pantrySlice.reducer;

// Made with Bob

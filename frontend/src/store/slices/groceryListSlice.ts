import { createSlice } from '@reduxjs/toolkit';

interface GroceryListState {
  groceryLists: any[];
  currentList: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: GroceryListState = {
  groceryLists: [],
  currentList: null,
  loading: false,
  error: null,
};

const groceryListSlice = createSlice({
  name: 'groceryLists',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { clearError } = groceryListSlice.actions;
export default groceryListSlice.reducer;

// Made with Bob

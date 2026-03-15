import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { groceryListAPI } from '../../services/api';

export interface GroceryListItem {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  isChecked: boolean;
  notes?: string;
  ingredient?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface GroceryList {
  id: string;
  mealPlanId: string;
  status: 'draft' | 'shopping' | 'completed';
  totalEstimatedCost?: number;
  items: GroceryListItem[];
  createdAt: string;
  updatedAt: string;
}

interface GroceryListsState {
  groceryLists: GroceryList[];
  currentList: GroceryList | null;
  loading: boolean;
  error: string | null;
}

const initialState: GroceryListsState = {
  groceryLists: [],
  currentList: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchGroceryLists = createAsyncThunk(
  'groceryLists/fetchGroceryLists',
  async (params: { status?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await groceryListAPI.getAll(params);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch grocery lists');
    }
  }
);

export const fetchGroceryListById = createAsyncThunk(
  'groceryLists/fetchGroceryListById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await groceryListAPI.getById(id);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch grocery list');
    }
  }
);

export const createGroceryList = createAsyncThunk(
  'groceryLists/createGroceryList',
  async (data: { mealPlanId: string }, { rejectWithValue }) => {
    try {
      const response = await groceryListAPI.create(data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create grocery list');
    }
  }
);

export const generateGroceryList = createAsyncThunk(
  'groceryLists/generateGroceryList',
  async (mealPlanId: string, { rejectWithValue }) => {
    try {
      const response = await groceryListAPI.generateFromMealPlan(mealPlanId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate grocery list');
    }
  }
);

export const updateGroceryList = createAsyncThunk(
  'groceryLists/updateGroceryList',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await groceryListAPI.update(id, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update grocery list');
    }
  }
);

export const deleteGroceryList = createAsyncThunk(
  'groceryLists/deleteGroceryList',
  async (id: string, { rejectWithValue }) => {
    try {
      await groceryListAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete grocery list');
    }
  }
);

export const addItemToList = createAsyncThunk(
  'groceryLists/addItemToList',
  async ({ listId, itemData }: {
    listId: string;
    itemData: {
      ingredientId: string;
      quantity: number;
      unit: string;
      estimatedPrice: number;
      notes?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await groceryListAPI.addItem(listId, itemData);
      return { listId, item: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add item');
    }
  }
);

export const updateItemInList = createAsyncThunk(
  'groceryLists/updateItemInList',
  async ({ listId, itemId, data }: {
    listId: string;
    itemId: string;
    data: any;
  }, { rejectWithValue }) => {
    try {
      const response = await groceryListAPI.updateItem(listId, itemId, data);
      return { listId, item: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update item');
    }
  }
);

export const deleteItemFromList = createAsyncThunk(
  'groceryLists/deleteItemFromList',
  async ({ listId, itemId }: { listId: string; itemId: string }, { rejectWithValue }) => {
    try {
      await groceryListAPI.deleteItem(listId, itemId);
      return { listId, itemId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete item');
    }
  }
);

export const toggleItemChecked = createAsyncThunk(
  'groceryLists/toggleItemChecked',
  async ({ listId, itemId }: { listId: string; itemId: string }, { rejectWithValue }) => {
    try {
      const response = await groceryListAPI.toggleItem(listId, itemId);
      return { listId, item: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle item');
    }
  }
);

const groceryListsSlice = createSlice({
  name: 'groceryLists',
  initialState,
  reducers: {
    setCurrentList: (state, action: PayloadAction<GroceryList | null>) => {
      state.currentList = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch grocery lists
      .addCase(fetchGroceryLists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroceryLists.fulfilled, (state, action) => {
        state.loading = false;
        state.groceryLists = action.payload;
      })
      .addCase(fetchGroceryLists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch grocery list by ID
      .addCase(fetchGroceryListById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroceryListById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentList = action.payload;
      })
      .addCase(fetchGroceryListById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create grocery list
      .addCase(createGroceryList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroceryList.fulfilled, (state, action) => {
        state.loading = false;
        state.groceryLists.unshift(action.payload);
        state.currentList = action.payload;
      })
      .addCase(createGroceryList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Generate grocery list
      .addCase(generateGroceryList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateGroceryList.fulfilled, (state, action) => {
        state.loading = false;
        state.groceryLists.unshift(action.payload);
        state.currentList = action.payload;
      })
      .addCase(generateGroceryList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update grocery list
      .addCase(updateGroceryList.fulfilled, (state, action) => {
        const index = state.groceryLists.findIndex(gl => gl.id === action.payload.id);
        if (index !== -1) {
          state.groceryLists[index] = action.payload;
        }
        if (state.currentList?.id === action.payload.id) {
          state.currentList = action.payload;
        }
      })
      // Delete grocery list
      .addCase(deleteGroceryList.fulfilled, (state, action) => {
        state.groceryLists = state.groceryLists.filter(gl => gl.id !== action.payload);
        if (state.currentList?.id === action.payload) {
          state.currentList = null;
        }
      })
      // Add item to list
      .addCase(addItemToList.fulfilled, (state, action) => {
        if (state.currentList?.id === action.payload.listId) {
          state.currentList.items.push(action.payload.item);
        }
      })
      // Update item in list
      .addCase(updateItemInList.fulfilled, (state, action) => {
        if (state.currentList?.id === action.payload.listId) {
          const index = state.currentList.items.findIndex(
            item => item.id === action.payload.item.id
          );
          if (index !== -1) {
            state.currentList.items[index] = action.payload.item;
          }
        }
      })
      // Delete item from list
      .addCase(deleteItemFromList.fulfilled, (state, action) => {
        if (state.currentList?.id === action.payload.listId) {
          state.currentList.items = state.currentList.items.filter(
            item => item.id !== action.payload.itemId
          );
        }
      })
      // Toggle item checked
      .addCase(toggleItemChecked.fulfilled, (state, action) => {
        if (state.currentList?.id === action.payload.listId) {
          const index = state.currentList.items.findIndex(
            item => item.id === action.payload.item.id
          );
          if (index !== -1) {
            state.currentList.items[index] = action.payload.item;
          }
        }
      });
  },
});

export const { setCurrentList, clearError } = groceryListsSlice.actions;
export default groceryListsSlice.reducer;

// Made with Bob

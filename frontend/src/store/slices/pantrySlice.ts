import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { pantryAPI } from '../../services/api';

export interface PantryItem {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  location: 'fridge' | 'freezer' | 'pantry';
  expirationDate?: string;
  updatedAt: string;
  ingredient?: {
    id: string;
    name: string;
    category: string;
  };
}

interface PantryState {
  items: PantryItem[];
  lowStockItems: PantryItem[];
  expiringItems: PantryItem[];
  loading: boolean;
  error: string | null;
  filters: {
    location?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
  };
}

const initialState: PantryState = {
  items: [],
  lowStockItems: [],
  expiringItems: [],
  loading: false,
  error: null,
  filters: {},
};

// Async thunks
export const fetchPantryItems = createAsyncThunk(
  'pantry/fetchPantryItems',
  async (params: {
    location?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await pantryAPI.getAll(params);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pantry items');
    }
  }
);

export const fetchPantryItemById = createAsyncThunk(
  'pantry/fetchPantryItemById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await pantryAPI.getById(id);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pantry item');
    }
  }
);

export const fetchLowStockItems = createAsyncThunk(
  'pantry/fetchLowStockItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await pantryAPI.getLowStock();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch low stock items');
    }
  }
);

export const fetchExpiringItems = createAsyncThunk(
  'pantry/fetchExpiringItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await pantryAPI.getExpiringSoon();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expiring items');
    }
  }
);

export const addPantryItem = createAsyncThunk(
  'pantry/addPantryItem',
  async (data: {
    ingredientId: string;
    quantity: number;
    unit: string;
    location: string;
    expirationDate?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await pantryAPI.add(data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add pantry item');
    }
  }
);

export const updatePantryItem = createAsyncThunk(
  'pantry/updatePantryItem',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await pantryAPI.update(id, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update pantry item');
    }
  }
);

export const deletePantryItem = createAsyncThunk(
  'pantry/deletePantryItem',
  async (id: string, { rejectWithValue }) => {
    try {
      await pantryAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete pantry item');
    }
  }
);

const pantrySlice = createSlice({
  name: 'pantry',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<PantryState['filters']>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch pantry items
      .addCase(fetchPantryItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPantryItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPantryItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch pantry item by ID
      .addCase(fetchPantryItemById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPantryItemById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })
      .addCase(fetchPantryItemById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch low stock items
      .addCase(fetchLowStockItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLowStockItems.fulfilled, (state, action) => {
        state.loading = false;
        state.lowStockItems = action.payload;
      })
      .addCase(fetchLowStockItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch expiring items
      .addCase(fetchExpiringItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpiringItems.fulfilled, (state, action) => {
        state.loading = false;
        state.expiringItems = action.payload;
      })
      .addCase(fetchExpiringItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add pantry item
      .addCase(addPantryItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPantryItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(addPantryItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update pantry item
      .addCase(updatePantryItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete pantry item
      .addCase(deletePantryItem.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
        state.lowStockItems = state.lowStockItems.filter(item => item.id !== action.payload);
        state.expiringItems = state.expiringItems.filter(item => item.id !== action.payload);
      });
  },
});

export const { setFilters, clearFilters, clearError } = pantrySlice.actions;
export default pantrySlice.reducer;

// Made with Bob

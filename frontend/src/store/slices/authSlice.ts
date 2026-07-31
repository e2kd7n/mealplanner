/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/errorHandler';

export interface User {
  id: string;
  email: string;
  /** Household/family name, as sent by the backend (`formatUserResponse`). */
  familyName: string;
  /**
   * Individual family member's display name. Client-only — never sent by the
   * classic login/register/session-bootstrap endpoints. Set by the visual
   * "member tile" / device login flow (see `LocalLogin.tsx`) so personalized
   * UI (sidebar brand, avatar initial, FTUE greeting) can show the selected
   * member's name without overwriting the household `familyName`.
   */
  displayName?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Best available name for personalized UI: prefers the individual family
 * member's name (set during the member-tile login flow) and falls back to
 * the household family name, then to the caller-supplied default.
 */
export function getDisplayName(user: User | null | undefined, fallback: string): string {
  return user?.displayName ?? user?.familyName ?? fallback;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  // Starts true so PrivateRoute shows its spinner until the initial
  // bootstrapAuth() (dispatched on mount by AuthContext) resolves, instead
  // of racing ahead on this pre-effect default and redirecting to /login.
  loading: true,
  error: null,
};

// Async thunks
export const bootstrapAuth = createAsyncThunk(
  'auth/bootstrap',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser();
      return { user: response.data.user };
    } catch (error: unknown) {
      // Not authenticated - this is expected on initial load
      return rejectWithValue(getApiErrorMessage(error, 'Not authenticated'));
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const { user } = response.data;
      return { user };
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Login failed'));
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    userData: { email: string; password: string; familyName: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.register(userData);
      const { user } = response.data;
      return { user };
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Registration failed'));
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authAPI.logout();
  } catch (error) {
    // Ignore errors during logout
    if (import.meta.env.DEV) console.error('Logout error:', error);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Bootstrap auth
      .addCase(bootstrapAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null; // Not an error - just not authenticated
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Login failed';
        state.isAuthenticated = false;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Registration failed';
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;

// Made with Bob

/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: sessionStorage.getItem('refreshToken'), // Read from sessionStorage
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,
};

// Helper functions for token storage
// Security: Access tokens in localStorage (persistent), refresh tokens in sessionStorage (cleared on browser close)
const storeTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem('accessToken', accessToken);
  sessionStorage.setItem('refreshToken', refreshToken); // sessionStorage for better security
};

const clearTokens = (): void => {
  localStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = response.data;
      storeTokens(accessToken, refreshToken);
      return { user, accessToken, refreshToken };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
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
      const { user, accessToken, refreshToken } = response.data;
      storeTokens(accessToken, refreshToken);
      return { user, accessToken, refreshToken };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authAPI.logout();
  } catch (error) {
    // Ignore errors during logout
    if (import.meta.env.DEV) console.error('Logout error:', error);
  } finally {
    clearTokens();
  }
});

export const refreshAccessToken = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken = state.auth.refreshToken;
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await authAPI.refreshToken(refreshToken);
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      // Note: Backend may return new refresh token for rotation
      if (response.data.refreshToken) {
        sessionStorage.setItem('refreshToken', response.data.refreshToken);
      }
      return { accessToken };
    } catch (error: any) {
      clearTokens();
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login fulfilled
      .addCase(login.fulfilled, (state, action) => {
        const { user, accessToken, refreshToken } = action.payload;
        Object.assign(state, { user, accessToken, refreshToken, isAuthenticated: true });
      })
      // Register fulfilled
      .addCase(register.fulfilled, (state, action) => {
        const { user, accessToken, refreshToken } = action.payload;
        Object.assign(state, { user, accessToken, refreshToken, isAuthenticated: true });
      })
      // Logout fulfilled
      .addCase(logout.fulfilled, (state) => {
        Object.assign(state, {
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      })
      // Refresh token fulfilled
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      // Refresh token rejected
      .addCase(refreshAccessToken.rejected, (state) => {
        Object.assign(state, {
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      })
      // Centralized pending matcher for all auth thunks
      .addMatcher(
        (action) =>
          [
            login.pending.type,
            register.pending.type,
            logout.pending.type,
            refreshAccessToken.pending.type,
          ].includes(action.type),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      // Centralized fulfilled matcher for all auth thunks
      .addMatcher(
        (action) =>
          [
            login.fulfilled.type,
            register.fulfilled.type,
            logout.fulfilled.type,
            refreshAccessToken.fulfilled.type,
          ].includes(action.type),
        (state) => {
          state.loading = false;
          state.error = null;
        }
      )
      // Centralized rejected matcher for login and register
      .addMatcher(
        (action): action is ReturnType<typeof login.rejected | typeof register.rejected> =>
          [login.rejected.type, register.rejected.type].includes(action.type),
        (state, action) => {
          state.loading = false;
          state.error = (action.payload as string) || 'An error occurred';
          state.isAuthenticated = false;
        }
      );
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;

// Made with Bob

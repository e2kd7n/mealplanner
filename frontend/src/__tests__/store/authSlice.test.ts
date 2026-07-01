import { describe, it, expect } from 'vitest';
import authReducer, {
  clearError,
  setCredentials,
  login,
  register,
  logout,
  bootstrapAuth,
} from '../../store/slices/authSlice';
import type { User } from '../../store/slices/authSlice';

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

describe('authSlice', () => {
  describe('initial state', () => {
    it('has correct initial state', () => {
      const state = authReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    it('clearError clears the error', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const state = authReducer(stateWithError, clearError());
      expect(state.error).toBeNull();
    });

    it('setCredentials sets user and isAuthenticated', () => {
      const state = authReducer(initialState, setCredentials({ user: mockUser }));
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('login thunk', () => {
    it('sets loading on pending', () => {
      const state = authReducer(initialState, login.pending('', { email: '', password: '' }));
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('sets user and isAuthenticated on fulfilled', () => {
      const state = authReducer(
        { ...initialState, loading: true },
        login.fulfilled({ user: mockUser }, '', { email: '', password: '' })
      );
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error on rejected', () => {
      const state = authReducer(
        { ...initialState, loading: true },
        login.rejected(null, '', { email: '', password: '' }, 'Invalid credentials')
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
      expect(state.isAuthenticated).toBe(false);
    });

    it('uses fallback error message when no payload', () => {
      const state = authReducer(
        { ...initialState, loading: true },
        login.rejected(null, '', { email: '', password: '' })
      );
      expect(state.error).toBe('Login failed');
    });
  });

  describe('register thunk', () => {
    it('sets loading on pending', () => {
      const state = authReducer(
        initialState,
        register.pending('', { email: '', password: '', familyName: '' })
      );
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('sets user on fulfilled', () => {
      const state = authReducer(
        { ...initialState, loading: true },
        register.fulfilled({ user: mockUser }, '', { email: '', password: '', familyName: '' })
      );
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });

    it('sets error on rejected', () => {
      const state = authReducer(
        { ...initialState, loading: true },
        register.rejected(null, '', { email: '', password: '', familyName: '' }, 'Email taken')
      );
      expect(state.error).toBe('Email taken');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('logout thunk', () => {
    it('sets loading on pending', () => {
      const loggedInState = {
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
      const state = authReducer(loggedInState, logout.pending('', undefined));
      expect(state.loading).toBe(true);
    });

    it('clears user state on fulfilled', () => {
      const loggedInState = {
        user: mockUser,
        isAuthenticated: true,
        loading: true,
        error: null,
      };
      const state = authReducer(loggedInState, logout.fulfilled(undefined, '', undefined));
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
    });
  });

  describe('bootstrapAuth thunk', () => {
    it('sets loading on pending', () => {
      const state = authReducer(initialState, bootstrapAuth.pending('', undefined));
      expect(state.loading).toBe(true);
    });

    it('sets user on fulfilled', () => {
      const state = authReducer(
        { ...initialState, loading: true },
        bootstrapAuth.fulfilled({ user: mockUser }, '', undefined)
      );
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });

    it('clears auth without error on rejected', () => {
      const state = authReducer(
        { ...initialState, loading: true },
        bootstrapAuth.rejected(null, '', undefined, 'Not authenticated')
      );
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});

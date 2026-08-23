/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import { theme } from '../../theme';
import Register from '../../pages/Register';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function createStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
    } as any,
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      },
    },
  });
}

function renderRegister(initialEntry: string | { pathname: string; state?: unknown }) {
  return render(
    <Provider store={createStore()}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Register />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Register', () => {
  it('shows generic "Create Account" copy on a standalone visit', () => {
    renderRegister('/register');
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByText(/already have an account\? sign in/i)).toBeInTheDocument();
  });

  it('shows household-member copy when linked from the FTUE flow (#356)', () => {
    renderRegister({ pathname: '/register', state: { fromFtue: true } });
    expect(screen.getByText('Add a Household Member')).toBeInTheDocument();
    expect(screen.getByText(/switched to their account once it's created/i)).toBeInTheDocument();
    expect(screen.getByText(/skip for now — go to dashboard/i)).toBeInTheDocument();
    expect(screen.queryByText(/already have an account\? sign in/i)).not.toBeInTheDocument();
  });
});

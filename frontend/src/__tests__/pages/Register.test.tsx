/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import { theme } from '../../theme';
import Register from '../../pages/Register';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/api', () => {
  const api = { get: vi.fn() };
  return { default: api };
});

import api from '../../services/api';

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
  it('shows household-joining copy on a standalone visit once a household exists (#355)', async () => {
    (api.get as any).mockResolvedValue({ data: { hasUsers: true } });
    renderRegister('/register');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Join This Household' })).toBeInTheDocument();
    });
    expect(screen.getByText(/this household already has an admin set up/i)).toBeInTheDocument();
    expect(screen.getByText(/already have an account\? sign in/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects to /welcome when no household exists yet (#355)', async () => {
    (api.get as any).mockResolvedValue({ data: { hasUsers: false } });
    renderRegister('/register');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/welcome', { replace: true });
    });
  });

  it('shows household-member copy when linked from the FTUE flow (#356)', async () => {
    (api.get as any).mockResolvedValue({ data: { hasUsers: true } });
    renderRegister({ pathname: '/register', state: { fromFtue: true } });
    await waitFor(() => {
      expect(screen.getByText('Add a Household Member')).toBeInTheDocument();
    });
    expect(screen.getByText(/switched to their account once it's created/i)).toBeInTheDocument();
    expect(screen.getByText(/skip for now — go to dashboard/i)).toBeInTheDocument();
    expect(screen.queryByText(/already have an account\? sign in/i)).not.toBeInTheDocument();
  });

  it('lets a visitor register anyway if the status check fails', async () => {
    (api.get as any).mockRejectedValue(new Error('network error'));
    renderRegister('/register');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Join This Household' })).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

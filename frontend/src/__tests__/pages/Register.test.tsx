/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  const api = { get: vi.fn(), post: vi.fn() };
  return { default: api };
});

import api from '../../services/api';

function createStore(role: string | null) {
  return configureStore({
    reducer: {
      auth: authReducer,
    } as any,
    preloadedState: {
      auth: {
        user: role ? { id: 'u1', email: 'me@example.com', familyName: 'Fam', role } : null,
        isAuthenticated: Boolean(role),
        loading: false,
        error: null,
      },
    },
  });
}

function renderRegister(
  initialEntry: string | { pathname: string; state?: unknown },
  role: string | null = null
) {
  return render(
    <Provider store={createStore(role)}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Register />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
}

function fillForm() {
  fireEvent.change(document.querySelector('#name')!, { target: { value: 'Kid' } });
  fireEvent.change(document.querySelector('#email')!, { target: { value: 'kid@example.com' } });
  fireEvent.change(document.querySelector('#password')!, { target: { value: 'Str0ng!Password' } });
  fireEvent.change(document.querySelector('#confirmPassword')!, { target: { value: 'Str0ng!Password' } });
}

beforeEach(() => {
  vi.clearAllMocks();
  (api.get as any).mockResolvedValue({ data: { hasUsers: true } });
});

describe('Register', () => {
  it('tells a signed-out visitor that sign-ups are closed', async () => {
    renderRegister('/register');
    await waitFor(() => {
      expect(screen.getByText(/sign-ups are closed/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/already have an account\? sign in/i)).toBeInTheDocument();
    expect(document.querySelector('#password')).toBeNull();
  });

  it('redirects to /welcome when no household exists yet (#355)', async () => {
    (api.get as any).mockResolvedValue({ data: { hasUsers: false } });
    renderRegister('/register');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/welcome', { replace: true });
    });
  });

  it('does not let a signed-in non-admin add sign-ins', async () => {
    renderRegister('/register', 'user');
    await waitFor(() => {
      expect(screen.getByText(/sign-ups are closed/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/back to dashboard/i)).toBeInTheDocument();
    expect(document.querySelector('#password')).toBeNull();
  });

  it('shows the add-member form to an admin coming from the FTUE flow (#356)', async () => {
    renderRegister({ pathname: '/register', state: { fromFtue: true } }, 'admin');
    await waitFor(() => {
      expect(screen.getByText('Add a Household Member')).toBeInTheDocument();
    });
    expect(screen.getByText(/you'll stay signed in as yourself/i)).toBeInTheDocument();
    expect(screen.getByText(/skip for now — go to dashboard/i)).toBeInTheDocument();
    expect(document.querySelector('#password')).not.toBeNull();
  });

  it('creates the sign-in via the admin endpoint and keeps the admin signed in', async () => {
    (api.post as any).mockResolvedValue({ data: { user: { email: 'kid@example.com' } } });
    renderRegister('/register', 'admin');
    await waitFor(() => expect(document.querySelector('#password')).not.toBeNull());

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create sign-in/i }));

    await waitFor(() => {
      expect(screen.getByText(/sign-in created for kid@example.com/i)).toBeInTheDocument();
    });
    expect(api.post).toHaveBeenCalledWith('/admin/users', {
      familyName: 'Kid',
      email: 'kid@example.com',
      password: 'Str0ng!Password',
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows the server's reason when the sign-in can't be created", async () => {
    (api.post as any).mockRejectedValue({
      response: { data: { error: { message: 'User with this email already exists' } } },
    });
    renderRegister('/register', 'admin');
    await waitFor(() => expect(document.querySelector('#password')).not.toBeNull());

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create sign-in/i }));

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });
});

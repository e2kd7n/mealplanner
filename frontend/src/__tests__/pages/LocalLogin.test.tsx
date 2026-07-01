/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import LocalLogin from '../../pages/LocalLogin';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/api', () => {
  const visualAuthAPI = {
    deviceLogin: vi.fn(),
    listUsers: vi.fn(),
    getVisualChallenge: vi.fn(),
    visualLogin: vi.fn(),
  };
  return { default: { get: vi.fn() }, visualAuthAPI };
});

import { visualAuthAPI } from '../../services/api';

function renderWithProviders(preloadedAuth = { user: null, isAuthenticated: false, loading: false, error: null }) {
  const store = configureStore({
    reducer: { auth: authReducer, recipes: (s = {}) => s, recipeBrowse: (s = {}) => s, mealPlans: (s = {}) => s, groceryLists: (s = {}) => s, pantry: (s = {}) => s } as any,
    preloadedState: { auth: preloadedAuth },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/login']}>
        <LocalLogin />
      </MemoryRouter>
    </Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  (visualAuthAPI.deviceLogin as any).mockRejectedValue(new Error('no cookie'));
});

describe('LocalLogin', () => {
  describe('initial load', () => {
    it('attempts device login on mount', async () => {
      (visualAuthAPI.listUsers as any).mockResolvedValue({ data: { users: [] } });
      renderWithProviders();
      expect(visualAuthAPI.deviceLogin).toHaveBeenCalledTimes(1);
    });

    it('redirects to dashboard on successful device login', async () => {
      (visualAuthAPI.deviceLogin as any).mockResolvedValue({
        data: {
          user: { id: '1', email: 'a@b.com', name: 'Fam', role: 'admin' },
          memberName: 'Tracy',
        },
      });
      renderWithProviders();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('loads user list when device login fails', async () => {
      (visualAuthAPI.listUsers as any).mockResolvedValue({
        data: { users: [{ id: 'm1', name: 'Alice' }, { id: 'm2', name: 'Bob' }] },
      });
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });
    });

    it('redirects to /welcome when no users exist', async () => {
      (visualAuthAPI.listUsers as any).mockResolvedValue({ data: { users: [] } });
      renderWithProviders();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/welcome', { replace: true });
      });
    });

    it('shows error when server is unreachable', async () => {
      (visualAuthAPI.listUsers as any).mockRejectedValue(new Error('network'));
      const api = (await import('../../services/api')).default;
      (api.get as any).mockRejectedValue(new Error('nope'));
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText(/could not load users/i)).toBeInTheDocument();
      });
    });
  });

  describe('branding', () => {
    it('shows "Family Meal Planner" heading (#235)', async () => {
      (visualAuthAPI.listUsers as any).mockResolvedValue({ data: { users: [{ id: 'm1', name: 'Alice' }] } });
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Family Meal Planner')).toBeInTheDocument();
      });
    });

    it('shows "Classic sign-in" link', async () => {
      (visualAuthAPI.listUsers as any).mockResolvedValue({ data: { users: [{ id: 'm1', name: 'Alice' }] } });
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic sign-in')).toBeInTheDocument();
      });
    });
  });

  describe('stepper', () => {
    it('shows 2-step stepper', async () => {
      (visualAuthAPI.listUsers as any).mockResolvedValue({ data: { users: [{ id: 'm1', name: 'Alice' }] } });
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Who are you?')).toBeInTheDocument();
        expect(screen.getByText('Pick your image')).toBeInTheDocument();
      });
    });
  });

  describe('user selection', () => {
    it('selects user and loads visual challenge', async () => {
      const user = userEvent.setup();
      (visualAuthAPI.listUsers as any).mockResolvedValue({
        data: { users: [{ id: 'm1', name: 'Alice' }] },
      });
      (visualAuthAPI.getVisualChallenge as any).mockResolvedValue({
        data: {
          images: [
            { id: 'stock-burger', title: 'Burger', imageUrl: '/visual-login/burger.svg' },
            { id: 'stock-pizza', title: 'Pizza', imageUrl: '/visual-login/pizza.svg' },
            { id: 'stock-sushi', title: 'Sushi', imageUrl: '/visual-login/sushi.svg' },
            { id: 'stock-salad', title: 'Salad', imageUrl: '/visual-login/salad.svg' },
          ],
        },
      });

      renderWithProviders();
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

      await user.click(screen.getByText('Alice'));

      await waitFor(() => {
        expect(screen.getByText(/Hi/)).toBeInTheDocument();
        expect(screen.getByText('Burger')).toBeInTheDocument();
        expect(screen.getByText('Pizza')).toBeInTheDocument();
      });
    });

    it('shows error and returns to step 0 when no visual password set', async () => {
      const user = userEvent.setup();
      (visualAuthAPI.listUsers as any).mockResolvedValue({
        data: { users: [{ id: 'm1', name: 'Tracy' }] },
      });
      (visualAuthAPI.getVisualChallenge as any).mockRejectedValue(new Error('not set'));

      renderWithProviders();
      await waitFor(() => expect(screen.getByText('Tracy')).toBeInTheDocument());

      await user.click(screen.getByText('Tracy'));

      await waitFor(() => {
        expect(screen.getByText(/visual login not set up yet/i)).toBeInTheDocument();
        expect(screen.getByText('Tracy')).toBeInTheDocument();
      });
    });
  });

  describe('visual login', () => {
    async function setupToChallenge() {
      const user = userEvent.setup();
      (visualAuthAPI.listUsers as any).mockResolvedValue({
        data: { users: [{ id: 'm1', name: 'Alice' }] },
      });
      (visualAuthAPI.getVisualChallenge as any).mockResolvedValue({
        data: {
          images: [
            { id: 'stock-burger', title: 'Burger', imageUrl: '/visual-login/burger.svg' },
            { id: 'stock-pizza', title: 'Pizza', imageUrl: '/visual-login/pizza.svg' },
          ],
        },
      });

      renderWithProviders();
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
      await user.click(screen.getByText('Alice'));
      await waitFor(() => expect(screen.getByText('Burger')).toBeInTheDocument());

      return user;
    }

    it('navigates to dashboard on correct image pick when FTUE done', async () => {
      localStorage.setItem('mealplanner_member_ftue_done_m1', '1');
      (visualAuthAPI.visualLogin as any).mockResolvedValue({
        data: {
          user: { id: 'u1', email: 'a@b.com', name: 'Fam', role: 'admin' },
          memberName: 'Alice',
        },
      });
      const user = await setupToChallenge();

      await user.click(screen.getByText('Burger'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('navigates to member-welcome on correct pick when FTUE not done', async () => {
      (visualAuthAPI.visualLogin as any).mockResolvedValue({
        data: {
          user: { id: 'u1', email: 'a@b.com', name: 'Fam', role: 'admin' },
          memberName: 'Alice',
        },
      });
      const user = await setupToChallenge();

      await user.click(screen.getByText('Burger'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/member-welcome', { replace: true });
      });
    });

    it('shows error on wrong image pick', async () => {
      (visualAuthAPI.visualLogin as any).mockRejectedValue(new Error('wrong'));
      const user = await setupToChallenge();

      await user.click(screen.getByText('Burger'));

      await waitFor(() => {
        expect(screen.getByText(/wrong image/i)).toBeInTheDocument();
      });
    });
  });

  describe('back button', () => {
    it('returns to user picker from challenge step', async () => {
      const user = userEvent.setup();
      (visualAuthAPI.listUsers as any).mockResolvedValue({
        data: { users: [{ id: 'm1', name: 'Alice' }] },
      });
      (visualAuthAPI.getVisualChallenge as any).mockResolvedValue({
        data: { images: [{ id: 'stock-burger', title: 'Burger', imageUrl: '/visual-login/burger.svg' }] },
      });

      renderWithProviders();
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
      await user.click(screen.getByText('Alice'));
      await waitFor(() => expect(screen.getByText('Burger')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
    });
  });
});

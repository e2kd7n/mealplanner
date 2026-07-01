import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import MemberWelcome from '../../pages/MemberWelcome';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function createStore(authState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      recipes: (s = {}) => s,
      recipeBrowse: (s = {}) => s,
      mealPlans: (s = {}) => s,
      groceryLists: (s = {}) => s,
      pantry: (s = {}) => s,
    },
    preloadedState: {
      auth: {
        user: { id: 'user-1', email: 'a@b.com', name: 'Tracy', role: 'user' },
        isAuthenticated: true,
        loading: false,
        error: null,
        ...authState,
      },
    } as any,
  });
}

function renderMemberWelcome(authState = {}) {
  return render(
    <Provider store={createStore(authState)}>
      <MemoryRouter initialEntries={['/member-welcome']}>
        <MemberWelcome />
      </MemoryRouter>
    </Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('MemberWelcome', () => {
  describe('slide content', () => {
    it('shows personalized greeting on first slide', () => {
      renderMemberWelcome();
      expect(screen.getByText(/Hey, Tracy!/i)).toBeInTheDocument();
    });

    it('shows 4 stepper dots', () => {
      renderMemberWelcome();
      const dots = document.querySelectorAll('.MuiMobileStepper-dot');
      expect(dots.length).toBe(4);
    });

    it('shows Skip button on first slide', () => {
      renderMemberWelcome();
      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('advances through all 4 slides', async () => {
      const user = userEvent.setup();
      renderMemberWelcome();

      expect(screen.getByText(/Hey, Tracy!/i)).toBeInTheDocument();

      const nextBtn = screen.getByRole('button', { name: /next/i });
      await user.click(nextBtn);
      expect(screen.getByText(/What's for dinner/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(screen.getByText(/Shopping, sorted/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(screen.getByText(/You're all set/i)).toBeInTheDocument();
    });

    it('shows Back button after first slide', async () => {
      const user = userEvent.setup();
      renderMemberWelcome();

      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('Back button goes to previous slide', async () => {
      const user = userEvent.setup();
      renderMemberWelcome();

      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(screen.getByText(/What's for dinner/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByText(/Hey, Tracy!/i)).toBeInTheDocument();
    });
  });

  describe('FTUE completion (#239 — per-member key)', () => {
    it('sets per-member localStorage key on finish', async () => {
      const user = userEvent.setup();
      renderMemberWelcome();

      // Navigate to last slide and finish
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }));
      }
      // Last slide has "Let's go!" button
      await user.click(screen.getByRole('button', { name: /let's go/i }));

      expect(localStorage.getItem('mealplanner_member_ftue_done_user-1')).toBe('1');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('Skip button also sets FTUE key and navigates', async () => {
      const user = userEvent.setup();
      renderMemberWelcome();

      await user.click(screen.getByRole('button', { name: /skip/i }));

      expect(localStorage.getItem('mealplanner_member_ftue_done_user-1')).toBe('1');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('does NOT set global FTUE key (only per-member)', async () => {
      const user = userEvent.setup();
      renderMemberWelcome();

      await user.click(screen.getByRole('button', { name: /skip/i }));

      expect(localStorage.getItem('mealplanner_member_ftue_done')).toBeNull();
    });
  });

  describe('fallback for missing user', () => {
    it('shows "Hey, there!" when no user name in store', () => {
      renderMemberWelcome({ user: { id: 'u1', email: 'a@b.com', role: 'user' } });
      expect(screen.getByText(/Hey, there!/i)).toBeInTheDocument();
    });

    it('does not set FTUE key when userId is undefined', async () => {
      const user = userEvent.setup();
      renderMemberWelcome({ user: null, isAuthenticated: false });

      await user.click(screen.getByRole('button', { name: /skip/i }));

      const ftueKeys = Object.keys(localStorage).filter((k) => k.includes('ftue'));
      expect(ftueKeys).toHaveLength(0);
    });
  });
});

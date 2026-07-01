import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Setup from '../../pages/Setup';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/api', () => {
  const visualAuthAPI = {
    getStockImages: vi.fn(),
    setupStockVisualPassword: vi.fn(),
  };
  const familyMemberAPI = {
    create: vi.fn(),
  };
  const userAPI = {
    updatePreferences: vi.fn(),
  };
  const api = {
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
  };
  return { default: api, visualAuthAPI, familyMemberAPI, userAPI };
});

import api, { visualAuthAPI, familyMemberAPI, userAPI } from '../../services/api';

const stockImages = [
  { id: 'stock-burger', title: 'Burger', imageUrl: '/visual-login/burger.svg' },
  { id: 'stock-pizza', title: 'Pizza', imageUrl: '/visual-login/pizza.svg' },
  { id: 'stock-sushi', title: 'Sushi', imageUrl: '/visual-login/sushi.svg' },
  { id: 'stock-salad', title: 'Salad', imageUrl: '/visual-login/salad.svg' },
];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  (visualAuthAPI.getStockImages as any).mockResolvedValue({ data: { images: stockImages } });
});

function renderSetup() {
  return render(
    <MemoryRouter initialEntries={['/setup']}>
      <Setup />
    </MemoryRouter>
  );
}

describe('Setup Wizard', () => {
  describe('Step 0 — Welcome', () => {
    it('shows "Family Meal Planner" heading (#235)', () => {
      renderSetup();
      expect(screen.getByText('Family Meal Planner')).toBeInTheDocument();
    });

    it('shows Get Started button', () => {
      renderSetup();
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    });

    it('shows all stepper labels', () => {
      renderSetup();
      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText('Family')).toBeInTheDocument();
    });
  });

  describe('Step 1 — Family Members', () => {
    async function goToStep1() {
      const user = userEvent.setup();
      renderSetup();
      await user.click(screen.getByRole('button', { name: /get started/i }));
      return user;
    }

    it('advances to family step on Get Started', async () => {
      const user = await goToStep1();
      expect(screen.getByText(/who's in the family/i)).toBeInTheDocument();
    });

    it('has Back button (#240)', async () => {
      const user = await goToStep1();
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('adds a family member to the list', async () => {
      const user = await goToStep1();

      await user.type(screen.getByLabelText(/name/i), 'Tracy');
      await user.click(screen.getByRole('button', { name: /add/i }));

      expect(screen.getByText('Tracy')).toBeInTheDocument();
    });

    it('removes a family member from the list', async () => {
      const user = await goToStep1();

      await user.type(screen.getByLabelText(/name/i), 'Tracy');
      await user.click(screen.getByRole('button', { name: /add/i }));
      expect(screen.getByText('Tracy')).toBeInTheDocument();

      await user.click(screen.getByTestId('DeleteIcon'));

      expect(screen.queryByText('Tracy')).not.toBeInTheDocument();
    });

    it('does not add empty name', async () => {
      const user = await goToStep1();
      const addBtn = screen.getByRole('button', { name: /add/i });
      expect(addBtn).toBeDisabled();
    });

    it('skip button advances to preferences step', async () => {
      const user = await goToStep1();
      await user.click(screen.getByRole('button', { name: /skip/i }));
      expect(screen.getByText(/your preferences/i)).toBeInTheDocument();
    });

    it('saves members and shows visual password picker (#243 — partial failure)', async () => {
      const user = await goToStep1();

      (familyMemberAPI.create as any)
        .mockResolvedValueOnce({ data: { id: 'm1', name: 'Alice' } })
        .mockRejectedValueOnce(new Error('fail'));

      await user.type(screen.getByLabelText(/name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /add/i }));
      await user.type(screen.getByLabelText(/name/i), 'Bob');
      await user.click(screen.getByRole('button', { name: /add/i }));

      await user.click(screen.getByRole('button', { name: /save & continue/i }));

      await waitFor(() => {
        expect(screen.getByText(/could not save: bob/i)).toBeInTheDocument();
      });
    });

    it('shows visual password picker after saving all members', async () => {
      const user = await goToStep1();

      (familyMemberAPI.create as any).mockResolvedValue({ data: { id: 'm1', name: 'Tracy' } });

      await user.type(screen.getByLabelText(/name/i), 'Tracy');
      await user.click(screen.getByRole('button', { name: /add/i }));
      await user.click(screen.getByRole('button', { name: /save & continue/i }));

      await waitFor(() => {
        expect(screen.getByText(/pick a login image for tracy/i)).toBeInTheDocument();
        expect(screen.getByText('Burger')).toBeInTheDocument();
      });
    });
  });

  describe('Step 1b — Visual Password Picker', () => {
    async function goToVisualPicker() {
      const user = userEvent.setup();
      renderSetup();
      await user.click(screen.getByRole('button', { name: /get started/i }));

      (familyMemberAPI.create as any)
        .mockResolvedValueOnce({ data: { id: 'm1', name: 'Alice' } })
        .mockResolvedValueOnce({ data: { id: 'm2', name: 'Bob' } });

      await user.type(screen.getByLabelText(/name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /add/i }));
      await user.type(screen.getByLabelText(/name/i), 'Bob');
      await user.click(screen.getByRole('button', { name: /add/i }));
      await user.click(screen.getByRole('button', { name: /save & continue/i }));

      await waitFor(() => {
        expect(screen.getByText(/pick a login image for alice/i)).toBeInTheDocument();
      });

      return user;
    }

    it('shows stock images for first member', async () => {
      await goToVisualPicker();
      expect(screen.getByText('Burger')).toBeInTheDocument();
      expect(screen.getByText('Pizza')).toBeInTheDocument();
    });

    it('assigns image and advances to next member', async () => {
      (visualAuthAPI.setupStockVisualPassword as any).mockResolvedValue({});
      const user = await goToVisualPicker();

      await user.click(screen.getByText('Burger'));

      await waitFor(() => {
        expect(visualAuthAPI.setupStockVisualPassword).toHaveBeenCalledWith('m1', '/visual-login/burger.svg');
        expect(screen.getByText(/pick a login image for bob/i)).toBeInTheDocument();
      });
    });

    it('skip advances to next member', async () => {
      const user = await goToVisualPicker();

      await user.click(screen.getByRole('button', { name: /skip for now/i }));

      expect(screen.getByText(/pick a login image for bob/i)).toBeInTheDocument();
    });

    it('advances to preferences after last member', async () => {
      (visualAuthAPI.setupStockVisualPassword as any).mockResolvedValue({});
      const user = await goToVisualPicker();

      // Skip Alice
      await user.click(screen.getByRole('button', { name: /skip for now/i }));
      // Skip Bob
      await user.click(screen.getByRole('button', { name: /skip for now/i }));

      expect(screen.getByText(/your preferences/i)).toBeInTheDocument();
    });

    it('back button returns to member list from picker', async () => {
      const user = await goToVisualPicker();

      await user.click(screen.getByRole('button', { name: /back/i }));

      expect(screen.getByText(/who's in the family/i)).toBeInTheDocument();
    });

    it('handles API error silently and still advances', async () => {
      (visualAuthAPI.setupStockVisualPassword as any).mockRejectedValue(new Error('fail'));
      const user = await goToVisualPicker();

      await user.click(screen.getByText('Burger'));

      await waitFor(() => {
        expect(screen.getByText(/pick a login image for bob/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 2 — Preferences', () => {
    async function goToPreferences() {
      const user = userEvent.setup();
      renderSetup();
      await user.click(screen.getByRole('button', { name: /get started/i }));
      await user.click(screen.getByRole('button', { name: /skip/i })); // Skip family
      return user;
    }

    it('shows dietary preferences chips', async () => {
      await goToPreferences();
      expect(screen.getByText(/your preferences/i)).toBeInTheDocument();
      expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    });

    it('shows cuisine options', async () => {
      await goToPreferences();
      expect(screen.getByText('Italian')).toBeInTheDocument();
      expect(screen.getByText('Mexican')).toBeInTheDocument();
    });

    it('saves preferences on continue (#237)', async () => {
      (userAPI.updatePreferences as any).mockResolvedValue({});
      const user = await goToPreferences();

      await user.click(screen.getByText('Vegetarian'));
      await user.click(screen.getByText('Italian'));
      await user.click(screen.getByRole('button', { name: /save & continue/i }));

      await waitFor(() => {
        expect(userAPI.updatePreferences).toHaveBeenCalledWith(
          expect.objectContaining({
            dietaryRestrictions: expect.arrayContaining(['Vegetarian']),
            preferredCuisines: expect.arrayContaining(['Italian']),
          })
        );
      });
    });

    it('has back button to return to family step', async () => {
      const user = await goToPreferences();
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByText(/who's in the family/i)).toBeInTheDocument();
    });
  });

  describe('Step 3 — Spoonacular API Key', () => {
    async function goToApiStep() {
      const user = userEvent.setup();
      renderSetup();
      await user.click(screen.getByRole('button', { name: /get started/i }));
      await user.click(screen.getByRole('button', { name: /skip/i }));
      await user.click(screen.getByRole('button', { name: /skip/i }));
      return user;
    }

    it('shows Spoonacular instructions', async () => {
      await goToApiStep();
      expect(screen.getByRole('heading', { name: /spoonacular api key/i })).toBeInTheDocument();
    });

    it('test key button calls backend', async () => {
      (api.post as any).mockResolvedValue({});
      const user = await goToApiStep();

      await user.type(screen.getByLabelText(/spoonacular api key/i), 'test-key-123');
      await user.click(screen.getByRole('button', { name: /test key/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/setup/test/spoonacular', { key: 'test-key-123' });
      });
    });

    it('shows success after valid key test', async () => {
      (api.post as any).mockResolvedValue({});
      const user = await goToApiStep();

      await user.type(screen.getByLabelText(/spoonacular api key/i), 'valid-key');
      await user.click(screen.getByRole('button', { name: /test key/i }));

      await waitFor(() => {
        expect(screen.getByText(/verified successfully/i)).toBeInTheDocument();
      });
    });

    it('skip advances without saving key', async () => {
      (api.put as any).mockResolvedValue({});
      const user = await goToApiStep();

      await user.click(screen.getByRole('button', { name: /skip for now/i }));

      await waitFor(() => {
        expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 4 — Done', () => {
    it('sets onboardingCompleted in localStorage', async () => {
      (api.put as any).mockResolvedValue({});
      const user = userEvent.setup();
      renderSetup();

      // Fast-forward through all steps
      await user.click(screen.getByRole('button', { name: /get started/i }));
      await user.click(screen.getByRole('button', { name: /skip/i }));
      await user.click(screen.getByRole('button', { name: /skip/i }));
      await user.click(screen.getByRole('button', { name: /skip for now/i }));

      await waitFor(() => {
        expect(localStorage.getItem('onboardingCompleted')).toBe('true');
      });
    });

    it('Go to Dashboard navigates to /dashboard', async () => {
      (api.put as any).mockResolvedValue({});
      const user = userEvent.setup();
      renderSetup();

      await user.click(screen.getByRole('button', { name: /get started/i }));
      await user.click(screen.getByRole('button', { name: /skip/i }));
      await user.click(screen.getByRole('button', { name: /skip/i }));
      await user.click(screen.getByRole('button', { name: /skip for now/i }));

      await waitFor(() => expect(screen.getByText(/you're all set/i)).toBeInTheDocument());
      await user.click(screen.getByRole('button', { name: /go to dashboard/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});

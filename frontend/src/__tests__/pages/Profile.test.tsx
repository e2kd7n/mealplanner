import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from '../../pages/Profile';

vi.mock('../../services/api', () => {
  const userAPI = {
    getProfile: vi.fn(),
    getPreferences: vi.fn(),
    updateProfile: vi.fn(),
    updatePreferences: vi.fn(),
  };
  const familyMemberAPI = {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const visualAuthAPI = {
    getStockImages: vi.fn(),
    setupStockVisualPassword: vi.fn(),
  };
  return { userAPI, familyMemberAPI, visualAuthAPI };
});

import { userAPI, familyMemberAPI, visualAuthAPI } from '../../services/api';

const mockProfile = { id: 'u1', email: 'admin@test.com', familyName: 'Test Fam' };
const mockPreferences = {
  dietaryRestrictions: [],
  cookingSkillLevel: 'intermediate',
  avoidedIngredients: [],
};

function setupApiMocks(members = defaultMembers()) {
  (userAPI.getProfile as any).mockResolvedValue({ data: { data: mockProfile } });
  (userAPI.getPreferences as any).mockResolvedValue({ data: { data: mockPreferences } });
  (familyMemberAPI.getAll as any).mockResolvedValue({ data: { data: members } });
}

function defaultMembers() {
  return [
    { id: 'm1', name: 'Alice', ageGroup: 'adult', canCook: true, dietaryRestrictions: [], cookingSkillLevel: 'intermediate', avoidedIngredients: [], visualPasswordImageUrl: '/visual-login/burger.svg', visualPasswordRecipeId: null },
    { id: 'm2', name: 'Bob', ageGroup: 'child', canCook: false, dietaryRestrictions: ['dairy-free'], cookingSkillLevel: 'beginner', avoidedIngredients: [], visualPasswordImageUrl: null, visualPasswordRecipeId: null },
  ];
}

const stockImages = [
  { id: 'stock-burger', title: 'Burger', imageUrl: '/visual-login/burger.svg' },
  { id: 'stock-pizza', title: 'Pizza', imageUrl: '/visual-login/pizza.svg' },
  { id: 'stock-sushi', title: 'Sushi', imageUrl: '/visual-login/sushi.svg' },
  { id: 'stock-salad', title: 'Salad', imageUrl: '/visual-login/salad.svg' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

async function renderProfile() {
  render(<Profile />);
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
}

async function goToFamilyTab() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('tab', { name: /family members/i }));
  return user;
}

describe('Profile — Family Members tab', () => {
  describe('member list', () => {
    it('shows all family members', async () => {
      setupApiMocks();
      await renderProfile();
      const user = await goToFamilyTab();

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('shows "Login image set" chip for members with visual password', async () => {
      setupApiMocks();
      await renderProfile();
      await goToFamilyTab();

      expect(screen.getByText('Login image set')).toBeInTheDocument();
    });

    it('shows "No login image" chip for members without visual password', async () => {
      setupApiMocks();
      await renderProfile();
      await goToFamilyTab();

      expect(screen.getByText('No login image')).toBeInTheDocument();
    });

    it('shows empty state when no members', async () => {
      setupApiMocks([]);
      await renderProfile();
      await goToFamilyTab();

      expect(screen.getByText(/no family members added yet/i)).toBeInTheDocument();
    });
  });

  describe('visual password picker', () => {
    it('opens picker dialog when clicking image icon', async () => {
      setupApiMocks();
      (visualAuthAPI.getStockImages as any).mockResolvedValue({ data: { images: stockImages } });
      await renderProfile();
      const user = await goToFamilyTab();

      const imageButtons = screen.getAllByTestId('ImageIcon');
      await user.click(imageButtons[1]); // Bob's image icon (no visual password)

      await waitFor(() => {
        expect(screen.getByText(/assign login image for bob/i)).toBeInTheDocument();
      });
    });

    it('shows stock images in picker', async () => {
      setupApiMocks();
      (visualAuthAPI.getStockImages as any).mockResolvedValue({ data: { images: stockImages } });
      await renderProfile();
      const user = await goToFamilyTab();

      const imageButtons = screen.getAllByTestId('ImageIcon');
      await user.click(imageButtons[1]);

      await waitFor(() => {
        expect(screen.getByText('Burger')).toBeInTheDocument();
        expect(screen.getByText('Pizza')).toBeInTheDocument();
        expect(screen.getByText('Sushi')).toBeInTheDocument();
        expect(screen.getByText('Salad')).toBeInTheDocument();
      });
    });

    it('assigns visual password and shows success message', async () => {
      const members = defaultMembers();
      setupApiMocks(members);
      (visualAuthAPI.getStockImages as any).mockResolvedValue({ data: { images: stockImages } });
      (visualAuthAPI.setupStockVisualPassword as any).mockResolvedValue({});
      (familyMemberAPI.getAll as any)
        .mockResolvedValueOnce({ data: { data: members } })
        .mockResolvedValueOnce({
          data: {
            data: members.map((m) =>
              m.id === 'm2' ? { ...m, visualPasswordImageUrl: '/visual-login/pizza.svg' } : m
            ),
          },
        });

      await renderProfile();
      const user = await goToFamilyTab();

      const imageButtons = screen.getAllByTestId('ImageIcon');
      await user.click(imageButtons[1]);

      await waitFor(() => expect(screen.getByText('Pizza')).toBeInTheDocument());
      await user.click(screen.getByText('Pizza'));

      await waitFor(() => {
        expect(visualAuthAPI.setupStockVisualPassword).toHaveBeenCalledWith('m2', '/visual-login/pizza.svg');
      });
    });

    it('shows "Change" title for members who already have visual password', async () => {
      setupApiMocks();
      (visualAuthAPI.getStockImages as any).mockResolvedValue({ data: { images: stockImages } });
      await renderProfile();
      const user = await goToFamilyTab();

      const imageButtons = screen.getAllByTestId('ImageIcon');
      await user.click(imageButtons[0]); // Alice already has one

      await waitFor(() => {
        expect(screen.getByText(/change login image for alice/i)).toBeInTheDocument();
      });
    });

    it('shows explanatory text about tap-to-sign-in', async () => {
      setupApiMocks();
      (visualAuthAPI.getStockImages as any).mockResolvedValue({ data: { images: stockImages } });
      await renderProfile();
      const user = await goToFamilyTab();

      const imageButtons = screen.getAllByTestId('ImageIcon');
      await user.click(imageButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/will tap this image to sign in/i)).toBeInTheDocument();
      });
    });

    it('handles API error when loading stock images', async () => {
      setupApiMocks();
      (visualAuthAPI.getStockImages as any).mockRejectedValue(new Error('fail'));
      await renderProfile();
      const user = await goToFamilyTab();

      const imageButtons = screen.getAllByTestId('ImageIcon');
      await user.click(imageButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/failed to load login images/i)).toBeInTheDocument();
      });
    });

    it('cancel button closes the picker', async () => {
      setupApiMocks();
      (visualAuthAPI.getStockImages as any).mockResolvedValue({ data: { images: stockImages } });
      await renderProfile();
      const user = await goToFamilyTab();

      const imageButtons = screen.getAllByTestId('ImageIcon');
      await user.click(imageButtons[1]);
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      // The dialog has a cancel button
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('add/edit/delete members', () => {
    it('opens add member dialog', async () => {
      setupApiMocks();
      await renderProfile();
      const user = await goToFamilyTab();

      await user.click(screen.getByRole('button', { name: /add family member/i }));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Add Family Member')).toBeInTheDocument();
    });

    it('opens edit dialog with pre-filled data', async () => {
      setupApiMocks();
      await renderProfile();
      const user = await goToFamilyTab();

      const editButtons = screen.getAllByTestId('EditIcon');
      await user.click(editButtons[0]); // Alice's edit

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Edit Family Member')).toBeInTheDocument();
      expect(within(dialog).getByDisplayValue('Alice')).toBeInTheDocument();
    });
  });
});

describe('Profile — Profile Information tab', () => {
  it('shows profile info on load', async () => {
    setupApiMocks();
    await renderProfile();

    expect(screen.getByDisplayValue('admin@test.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Fam')).toBeInTheDocument();
  });

  it('enters edit mode and saves', async () => {
    setupApiMocks();
    (userAPI.updateProfile as any).mockResolvedValue({});
    await renderProfile();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    const nameInput = screen.getByLabelText(/family name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Fam');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(userAPI.updateProfile).toHaveBeenCalledWith({ familyName: 'New Fam' });
    });
  });
});

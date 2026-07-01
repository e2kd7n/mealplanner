import { describe, it, expect } from 'vitest';
import recipesReducer, {
  setFilters,
  clearFilters,
  setCurrentRecipe,
  fetchRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '../../store/slices/recipesSlice';
import type { Recipe } from '../../store/slices/recipesSlice';

const mockRecipe: Recipe = {
  id: 'recipe-1',
  title: 'Pasta Carbonara',
  description: 'Classic Italian dish',
  prepTime: 15,
  cookTime: 20,
  servings: 4,
  difficulty: 'medium',
  mealTypes: ['dinner'],
  ingredients: [{ id: 'ing-1', name: 'Spaghetti', quantity: 400, unit: 'g' }],
  instructions: ['Boil water', 'Cook pasta'],
  kidFriendly: true,
};

const initialState = {
  recipes: [],
  currentRecipe: null,
  loading: false,
  error: null,
  pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
  filters: {},
};

describe('recipesSlice', () => {
  describe('initial state', () => {
    it('has correct initial state', () => {
      const state = recipesReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    it('setFilters merges filters', () => {
      const state = recipesReducer(initialState, setFilters({ search: 'pasta' }));
      expect(state.filters.search).toBe('pasta');

      const state2 = recipesReducer(state, setFilters({ difficulty: 'easy' }));
      expect(state2.filters.search).toBe('pasta');
      expect(state2.filters.difficulty).toBe('easy');
    });

    it('clearFilters resets all filters', () => {
      const filtered = { ...initialState, filters: { search: 'test', mealType: 'dinner' } };
      const state = recipesReducer(filtered, clearFilters());
      expect(state.filters).toEqual({});
    });

    it('setCurrentRecipe sets the current recipe', () => {
      const state = recipesReducer(initialState, setCurrentRecipe(mockRecipe));
      expect(state.currentRecipe).toEqual(mockRecipe);
    });

    it('setCurrentRecipe can clear the recipe', () => {
      const withRecipe = { ...initialState, currentRecipe: mockRecipe };
      const state = recipesReducer(withRecipe, setCurrentRecipe(null));
      expect(state.currentRecipe).toBeNull();
    });
  });

  describe('fetchRecipes thunk', () => {
    it('sets loading on pending', () => {
      const state = recipesReducer(initialState, fetchRecipes.pending('', {}));
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('handles payload with recipes property', () => {
      const payload = {
        recipes: [mockRecipe],
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
      };
      const state = recipesReducer(
        { ...initialState, loading: true },
        fetchRecipes.fulfilled(payload, '', {})
      );
      expect(state.loading).toBe(false);
      expect(state.recipes).toEqual([mockRecipe]);
      expect(state.pagination.total).toBe(1);
    });

    it('handles double-wrapped payload (data.recipes)', () => {
      const payload = {
        data: {
          recipes: [mockRecipe],
          pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
        },
      };
      const state = recipesReducer(
        { ...initialState, loading: true },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetchRecipes.fulfilled(payload as any, '', {})
      );
      expect(state.recipes).toEqual([mockRecipe]);
    });

    it('handles array payload', () => {
      const state = recipesReducer(
        { ...initialState, loading: true },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetchRecipes.fulfilled([mockRecipe] as any, '', {})
      );
      expect(state.recipes).toEqual([mockRecipe]);
    });

    it('handles null payload', () => {
      const state = recipesReducer(
        { ...initialState, loading: true },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetchRecipes.fulfilled(null as any, '', {})
      );
      expect(state.recipes).toEqual([]);
    });

    it('sets error on rejected', () => {
      const state = recipesReducer(
        { ...initialState, loading: true },
        fetchRecipes.rejected(null, '', {}, 'Network error')
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('createRecipe thunk', () => {
    it('prepends new recipe to list', () => {
      const existing = { ...initialState, recipes: [{ ...mockRecipe, id: 'old' }] };
      const newRecipe = { ...mockRecipe, id: 'new' };
      const state = recipesReducer(
        existing,
        createRecipe.fulfilled(newRecipe, '', {})
      );
      expect(state.recipes[0].id).toBe('new');
      expect(state.recipes).toHaveLength(2);
    });
  });

  describe('updateRecipe thunk', () => {
    it('updates recipe in list', () => {
      const existing = { ...initialState, recipes: [mockRecipe] };
      const updated = { ...mockRecipe, title: 'Updated Pasta' };
      const state = recipesReducer(
        existing,
        updateRecipe.fulfilled(updated, '', { id: 'recipe-1', data: {} })
      );
      expect(state.recipes[0].title).toBe('Updated Pasta');
    });

    it('updates currentRecipe if it matches', () => {
      const existing = { ...initialState, recipes: [mockRecipe], currentRecipe: mockRecipe };
      const updated = { ...mockRecipe, title: 'Updated' };
      const state = recipesReducer(
        existing,
        updateRecipe.fulfilled(updated, '', { id: 'recipe-1', data: {} })
      );
      expect(state.currentRecipe?.title).toBe('Updated');
    });
  });

  describe('deleteRecipe thunk', () => {
    it('removes recipe from list', () => {
      const existing = { ...initialState, recipes: [mockRecipe] };
      const state = recipesReducer(
        existing,
        deleteRecipe.fulfilled('recipe-1', '', 'recipe-1')
      );
      expect(state.recipes).toHaveLength(0);
    });

    it('clears currentRecipe if it matches', () => {
      const existing = { ...initialState, recipes: [mockRecipe], currentRecipe: mockRecipe };
      const state = recipesReducer(
        existing,
        deleteRecipe.fulfilled('recipe-1', '', 'recipe-1')
      );
      expect(state.currentRecipe).toBeNull();
    });

    it('preserves currentRecipe if it does not match', () => {
      const otherRecipe = { ...mockRecipe, id: 'other' };
      const existing = { ...initialState, recipes: [mockRecipe], currentRecipe: otherRecipe };
      const state = recipesReducer(
        existing,
        deleteRecipe.fulfilled('recipe-1', '', 'recipe-1')
      );
      expect(state.currentRecipe).toEqual(otherRecipe);
    });
  });
});

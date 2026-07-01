import { describe, it, expect } from 'vitest';
import groceryListsReducer, {
  setCurrentList,
  clearError,
  fetchGroceryLists,
  createGroceryList,
  deleteGroceryList,
  addItemToList,
  deleteItemFromList,
  updateItemInList,
  toggleItemChecked,
} from '../../store/slices/groceryListsSlice';
import type { GroceryList, GroceryListItem } from '../../store/slices/groceryListsSlice';

const mockItem: GroceryListItem = {
  id: 'item-1',
  ingredientId: 'ing-1',
  quantity: 2,
  unit: 'lbs',
  estimatedPrice: 4.99,
  isChecked: false,
  ingredient: { id: 'ing-1', name: 'Chicken', category: 'Meat' },
};

const mockList: GroceryList = {
  id: 'list-1',
  mealPlanId: 'plan-1',
  status: 'draft',
  items: [mockItem],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const initialState = {
  groceryLists: [],
  currentList: null,
  loading: false,
  error: null,
};

describe('groceryListsSlice', () => {
  describe('reducers', () => {
    it('setCurrentList sets the current list', () => {
      const state = groceryListsReducer(initialState, setCurrentList(mockList));
      expect(state.currentList).toEqual(mockList);
    });

    it('setCurrentList can clear the list', () => {
      const withList = { ...initialState, currentList: mockList };
      const state = groceryListsReducer(withList, setCurrentList(null));
      expect(state.currentList).toBeNull();
    });

    it('clearError clears the error', () => {
      const withError = { ...initialState, error: 'Failed' };
      const state = groceryListsReducer(withError, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('fetchGroceryLists thunk', () => {
    it('sets loading on pending', () => {
      const state = groceryListsReducer(initialState, fetchGroceryLists.pending('', {}));
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('sets lists on fulfilled', () => {
      const state = groceryListsReducer(
        { ...initialState, loading: true },
        fetchGroceryLists.fulfilled([mockList], '', {})
      );
      expect(state.loading).toBe(false);
      expect(state.groceryLists).toEqual([mockList]);
    });

    it('sets error on rejected', () => {
      const state = groceryListsReducer(
        { ...initialState, loading: true },
        fetchGroceryLists.rejected(null, '', {}, 'Network error')
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('createGroceryList thunk', () => {
    it('prepends new list and sets as current', () => {
      const state = groceryListsReducer(
        initialState,
        createGroceryList.fulfilled(mockList, '', { mealPlanId: 'plan-1' })
      );
      expect(state.groceryLists[0]).toEqual(mockList);
      expect(state.currentList).toEqual(mockList);
    });
  });

  describe('deleteGroceryList thunk', () => {
    it('removes list from groceryLists', () => {
      const existing = { ...initialState, groceryLists: [mockList] };
      const state = groceryListsReducer(
        existing,
        deleteGroceryList.fulfilled('list-1', '', 'list-1')
      );
      expect(state.groceryLists).toHaveLength(0);
    });

    it('clears currentList if it matches', () => {
      const existing = { ...initialState, groceryLists: [mockList], currentList: mockList };
      const state = groceryListsReducer(
        existing,
        deleteGroceryList.fulfilled('list-1', '', 'list-1')
      );
      expect(state.currentList).toBeNull();
    });
  });

  describe('addItemToList thunk', () => {
    it('adds item to current list', () => {
      const newItem = { ...mockItem, id: 'item-2', ingredientId: 'ing-2' };
      const existing = { ...initialState, currentList: mockList };
      const state = groceryListsReducer(
        existing,
        addItemToList.fulfilled(
          { listId: 'list-1', item: newItem },
          '',
          { listId: 'list-1', itemData: { ingredientId: 'ing-2', quantity: 1, unit: 'each', estimatedPrice: 2 } }
        )
      );
      expect(state.currentList?.items).toHaveLength(2);
    });

    it('does nothing if currentList does not match', () => {
      const existing = { ...initialState, currentList: mockList };
      const state = groceryListsReducer(
        existing,
        addItemToList.fulfilled(
          { listId: 'other-list', item: mockItem },
          '',
          { listId: 'other-list', itemData: { ingredientId: 'ing-1', quantity: 1, unit: 'each', estimatedPrice: 2 } }
        )
      );
      expect(state.currentList?.items).toHaveLength(1);
    });
  });

  describe('deleteItemFromList thunk', () => {
    it('removes item from current list', () => {
      const existing = { ...initialState, currentList: mockList };
      const state = groceryListsReducer(
        existing,
        deleteItemFromList.fulfilled(
          { listId: 'list-1', itemId: 'item-1' },
          '',
          { listId: 'list-1', itemId: 'item-1' }
        )
      );
      expect(state.currentList?.items).toHaveLength(0);
    });
  });

  describe('updateItemInList thunk', () => {
    it('updates item in current list', () => {
      const updatedItem = { ...mockItem, quantity: 5 };
      const existing = { ...initialState, currentList: mockList };
      const state = groceryListsReducer(
        existing,
        updateItemInList.fulfilled(
          { listId: 'list-1', item: updatedItem },
          '',
          { listId: 'list-1', itemId: 'item-1', data: { quantity: 5 } }
        )
      );
      expect(state.currentList?.items[0].quantity).toBe(5);
    });
  });

  describe('toggleItemChecked thunk', () => {
    it('toggles item checked state', () => {
      const checkedItem = { ...mockItem, isChecked: true };
      const existing = { ...initialState, currentList: mockList };
      const state = groceryListsReducer(
        existing,
        toggleItemChecked.fulfilled(
          { listId: 'list-1', item: checkedItem },
          '',
          { listId: 'list-1', itemId: 'item-1' }
        )
      );
      expect(state.currentList?.items[0].isChecked).toBe(true);
    });
  });
});

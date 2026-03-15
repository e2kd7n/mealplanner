import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.ts';
import recipesReducer from './slices/recipesSlice.ts';
import mealPlansReducer from './slices/mealPlansSlice.ts';
import groceryListsReducer from './slices/groceryListsSlice.ts';
import pantryReducer from './slices/pantrySlice.ts';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recipes: recipesReducer,
    mealPlans: mealPlansReducer,
    groceryLists: groceryListsReducer,
    pantry: pantryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/login/fulfilled', 'auth/register/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Made with Bob

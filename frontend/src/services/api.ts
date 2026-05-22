/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Type for axios config with retry flag
interface RetryableAxiosConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  withCredentials: true, // Important for cookies
});

// CSRF token management
let csrfToken: string | null = null;

/**
 * Fetch CSRF token from the server
 */
const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/csrf-token`, {
      withCredentials: true,
    });
    csrfToken = response.data.csrfToken;
    return csrfToken as string;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to fetch CSRF token:', error);
    throw error;
  }
};

/**
 * Get CSRF token, fetching if not available
 */
const getCsrfToken = async (): Promise<string> => {
  if (!csrfToken) {
    return fetchCsrfToken();
  }
  return csrfToken as string;
};

// Request interceptor to add CSRF token for state-changing requests
api.interceptors.request.use(
  async (config) => {
    // Add CSRF token for state-changing requests
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      try {
        const csrf = await getCsrfToken();
        config.headers['X-CSRF-Token'] = csrf;
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to add CSRF token to request:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle CSRF errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableAxiosConfig;

    // Handle CSRF token errors (403 with EBADCSRFTOKEN)
    if (error.response?.status === 403 &&
        (error.response.data as any)?.code === 'EBADCSRFTOKEN') {
      // Fetch new CSRF token and retry
      try {
        await fetchCsrfToken();
        const csrf = await getCsrfToken();
        if (originalRequest.headers) {
          originalRequest.headers['X-CSRF-Token'] = csrf;
        }
        return axios(originalRequest);
      } catch (csrfError) {
        return Promise.reject(csrfError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; familyName: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () =>
    api.post('/auth/logout'),

  getCurrentUser: () =>
    api.get('/auth/me'),
};

// Visual / Local Auth API (home-network convenience login)
export const visualAuthAPI = {
  listUsers: () =>
    api.get('/auth/users'),

  getVisualChallenge: (memberId: string) =>
    api.get(`/auth/visual-challenge/${memberId}`),

  visualLogin: (data: { memberId: string; recipeId: string }) =>
    api.post('/auth/login/visual', data),

  deviceLogin: () =>
    api.post('/auth/login/device'),

  deviceLogout: () =>
    api.post('/auth/logout/device'),

  getVisualPasswordStatus: (familyMemberId?: string) =>
    api.get('/auth/visual-password/status', { params: familyMemberId ? { familyMemberId } : undefined }),

  setupVisualPassword: (familyMemberId: string, recipeId: string) =>
    api.post('/auth/visual-password/setup', { familyMemberId, recipeId }),

  getSetupImages: () =>
    api.get('/auth/visual-setup/images'),
};

// Recipe API
export const recipeAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    mealType?: string;
    difficulty?: string;
    maxPrepTime?: number;
    kidFriendly?: boolean;
  }) => api.get('/recipes', { params }),
  
  getById: (id: string) =>
    api.get(`/recipes/${id}`),
  
  create: (data: any) =>
    api.post('/recipes', data),
  
  update: (id: string, data: any) =>
    api.put(`/recipes/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/recipes/${id}`),
  
  rate: (id: string, data: { rating: number; notes?: string; wouldMakeAgain: boolean }) =>
    api.post(`/recipes/${id}/rate`, data),
  
  search: (query: string) =>
    api.get('/recipes/search', { params: { q: query } }),
};

// Meal Plan API
export const mealPlanAPI = {
  getAll: (params?: { status?: string }) =>
    api.get('/meal-plans', { params }),
  
  getById: (id: string) =>
    api.get(`/meal-plans/${id}`),
  
  create: (data: { weekStartDate: string }) =>
    api.post('/meal-plans', data),
  
  update: (id: string, data: any) =>
    api.put(`/meal-plans/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/meal-plans/${id}`),
  
  addMeal: (id: string, data: {
    recipeId: string;
    date: string;
    mealType: string;
    servings: number;
    assignedCookId?: string;
    notes?: string;
  }) => api.post(`/meal-plans/${id}/meals`, data),
  
  updateMeal: (planId: string, mealId: string, data: any) =>
    api.put(`/meal-plans/${planId}/meals/${mealId}`, data),
  
  deleteMeal: (planId: string, mealId: string) =>
    api.delete(`/meal-plans/${planId}/meals/${mealId}`),
  
  batchCookMeal: (planId: string, mealId: string, data: {
    dates: string[];
    servingsMultiplier?: number;
    markAsLeftovers?: boolean;
  }) => api.post(`/meal-plans/${planId}/meals/${mealId}/batch-cook`, data),
  
  getCurrent: () =>
    api.get('/meal-plans/current'),
};

// Grocery List API
export const groceryListAPI = {
  getAll: (params?: { status?: string }) =>
    api.get('/grocery-lists', { params }),
  
  getById: (id: string) =>
    api.get(`/grocery-lists/${id}`),
  
  create: (data: { mealPlanId: string }) =>
    api.post('/grocery-lists', data),
  
  update: (id: string, data: any) =>
    api.put(`/grocery-lists/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/grocery-lists/${id}`),
  
  generateFromMealPlan: (mealPlanId: string) =>
    api.post('/grocery-lists/generate', { mealPlanId }),
  
  addItem: (listId: string, data: {
    ingredientId: string;
    quantity: number;
    unit: string;
    estimatedPrice: number;
    notes?: string;
  }) => api.post(`/grocery-lists/${listId}/items`, data),
  
  updateItem: (listId: string, itemId: string, data: any) =>
    api.put(`/grocery-lists/${listId}/items/${itemId}`, data),
  
  deleteItem: (listId: string, itemId: string) =>
    api.delete(`/grocery-lists/${listId}/items/${itemId}`),
  
  toggleItem: (listId: string, itemId: string) =>
    api.patch(`/grocery-lists/${listId}/items/${itemId}/toggle`),
};

// Pantry API
export const pantryAPI = {
  getAll: (params?: { location?: string; lowStock?: boolean; expiringSoon?: boolean }) =>
    api.get('/pantry', { params }),
  
  getById: (id: string) =>
    api.get(`/pantry/${id}`),
  
  add: (data: {
    ingredientId: string;
    quantity: number;
    unit: string;
    location: string;
    expirationDate?: string;
  }) => api.post('/pantry', data),
  
  update: (id: string, data: any) =>
    api.put(`/pantry/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/pantry/${id}`),
  
  getLowStock: () =>
    api.get('/pantry/low-stock'),
  
  getExpiringSoon: () =>
    api.get('/pantry/expiring-soon'),
};

// Ingredient API
export const ingredientAPI = {
  getAll: (params?: { category?: string; search?: string }) =>
    api.get('/ingredients', { params }),
  
  getById: (id: string) =>
    api.get(`/ingredients/${id}`),
  
  create: (data: any) =>
    api.post('/ingredients', data),
  
  update: (id: string, data: any) =>
    api.put(`/ingredients/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/ingredients/${id}`),
  
  search: (query: string) =>
    api.get('/ingredients/search', { params: { q: query } }),
};

// User API
export const userAPI = {
  getProfile: () =>
    api.get('/users/profile'),
  
  updateProfile: (data: { familyName: string }) =>
    api.put('/users/profile', data),
  
  getPreferences: () =>
    api.get('/users/preferences'),
  
  updatePreferences: (data: {
    dietaryRestrictions?: string[];
    cookingSkillLevel?: string;
    avoidedIngredients?: string[];
  }) => api.put('/users/preferences', data),
};

// Family Member API
export const familyMemberAPI = {
  getAll: () =>
    api.get('/family-members'),
  
  getById: (id: string) =>
    api.get(`/family-members/${id}`),
  
  create: (data: {
    name: string;
    ageGroup: string;
    dietaryRestrictions?: string[];
    cookingSkillLevel?: string;
    avoidedIngredients?: string[];
  }) => api.post('/family-members', data),
  
  update: (id: string, data: any) =>
    api.put(`/family-members/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/family-members/${id}`),
};

// Recipe Import API
export const recipeImportAPI = {
  importFromUrl: (url: string) =>
    api.post('/recipes/import/url', { url }),
  
  saveImported: (data: {
    title: string;
    description?: string;
    prepTime: number;
    cookTime: number;
    servings: number;
    difficulty: string;
    cuisineType?: string;
    mealTypes: string[];
    imageUrl?: string;
    ingredients: Array<{
      name: string;
      quantity: number;
      unit: string;
      notes?: string;
    }>;
    instructions: any;
    nutritionInfo?: any;
    sourceUrl?: string;
  }) => api.post('/recipes/import/url/save', data),
};

// Recipe Browse API (Spoonacular)
export const recipeBrowseAPI = {
  search: (params?: {
    query?: string;
    cuisine?: string;
    diet?: string;
    type?: string;
    maxReadyTime?: number;
    sort?: string;
    offset?: number;
    number?: number;
  }) => api.get('/recipes/browse/search', { params }),
  
  getDetails: (id: number) =>
    api.get(`/recipes/browse/${id}`),
  
  addToBox: (id: number) =>
    api.post(`/recipes/browse/${id}/add-to-box`),
};

export default api;

// Made with Bob

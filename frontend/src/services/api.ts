/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Type for axios config with retry flag
interface RetryableAxiosConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Shared promise to prevent multiple simultaneous token refresh attempts
let refreshPromise: Promise<string> | null = null;

/**
 * Set authorization header on request config
 */
const setAuthHeader = (config: RetryableAxiosConfig, token: string): void => {
  if (!config.headers) {
    config.headers = {} as any;
  }
  config.headers.Authorization = `Bearer ${token}`;
};

/**
 * Retry a failed request with a new token
 */
const retryRequestWithToken = (config: RetryableAxiosConfig, token: string) => {
  setAuthHeader(config, token);
  return axios(config);
};

/**
 * Handle refresh token failure by cleaning up and redirecting to login
 */
const handleRefreshFailure = (error: unknown): string => {
  localStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  window.location.href = '/login';
  throw error;
};

/**
 * Refresh the access token using the refresh token
 */
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = sessionStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { withCredentials: true }
  );

  const { accessToken } = response.data;
  localStorage.setItem('accessToken', accessToken);
  
  // Handle refresh token rotation if backend provides new one
  if (response.data.refreshToken) {
    sessionStorage.setItem('refreshToken', response.data.refreshToken);
  }

  return accessToken;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableAxiosConfig;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, wait for the existing refresh to complete
      if (refreshPromise) {
        try {
          const token = await refreshPromise;
          return retryRequestWithToken(originalRequest, token);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      // Mark request as retried and start refresh
      originalRequest._retry = true;
      
      // Create shared refresh promise
      refreshPromise = refreshAccessToken()
        .then((token) => {
          refreshPromise = null;
          return token;
        })
        .catch((err) => {
          refreshPromise = null;
          return handleRefreshFailure(err);
        });

      try {
        const token = await refreshPromise;
        if (!token) {
          throw new Error('Token refresh failed');
        }
        return retryRequestWithToken(originalRequest, token);
      } catch (refreshError) {
        return Promise.reject(refreshError);
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
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
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

export default api;

// Made with Bob

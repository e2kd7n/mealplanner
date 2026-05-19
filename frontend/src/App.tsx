/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineDetector from './components/OfflineDetector';
import SetupGuard from './components/SetupGuard';

// Lazy load pages for better performance
const LocalLogin = lazy(() => import('./pages/LocalLogin'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Recipes = lazy(() => import('./pages/Recipes'));
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'));
const CreateRecipe = lazy(() => import('./pages/CreateRecipe'));
const ImportRecipe = lazy(() => import('./pages/ImportRecipe'));
const BrowseRecipes = lazy(() => import('./pages/BrowseRecipes'));
const MealPlanner = lazy(() => import('./pages/MealPlanner'));
const GroceryList = lazy(() => import('./pages/GroceryList'));
const Pantry = lazy(() => import('./pages/Pantry'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Setup = lazy(() => import('./pages/Setup'));
const Welcome = lazy(() => import('./pages/Welcome'));

// Loading fallback component
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeContextProvider>
          <CssBaseline />
          {/* D1-2 FIX: Global offline detector for better error messaging */}
          <OfflineDetector />
          <AuthProvider>
            <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/login" element={<LocalLogin />} />
                <Route path="/login/classic" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Setup wizard — requires login, shown once for admins */}
                <Route
                  path="/setup"
                  element={
                    <PrivateRoute>
                      <Setup />
                    </PrivateRoute>
                  }
                />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <SetupGuard>
                        <Layout />
                      </SetupGuard>
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="recipes" element={<Recipes />} />
                  <Route path="recipes/:id" element={<RecipeDetail />} />
                  <Route path="recipes/create" element={<CreateRecipe />} />
                  <Route path="recipes/:id/edit" element={<CreateRecipe />} />
                  <Route path="recipes/import" element={<ImportRecipe />} />
                  <Route path="recipes/browse" element={<BrowseRecipes />} />
                  <Route path="meal-planner" element={<MealPlanner />} />
                  <Route path="grocery-list" element={<GroceryList />} />
                  <Route path="pantry" element={<Pantry />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="admin" element={<AdminDashboard />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
            </Router>
          </AuthProvider>
        </ThemeContextProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;

// Made with Bob

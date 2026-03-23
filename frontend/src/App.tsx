/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { Provider } from 'react-redux';
import { theme } from './theme';
import { store } from './store';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Recipes = lazy(() => import('./pages/Recipes'));
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'));
const CreateRecipe = lazy(() => import('./pages/CreateRecipe'));
const ImportRecipe = lazy(() => import('./pages/ImportRecipe'));
const MealPlanner = lazy(() => import('./pages/MealPlanner'));
const GroceryList = lazy(() => import('./pages/GroceryList'));
const Pantry = lazy(() => import('./pages/Pantry'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

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
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Layout />
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
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;

// Made with Bob

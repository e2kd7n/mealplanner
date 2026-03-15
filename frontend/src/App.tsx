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

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Recipes = lazy(() => import('./pages/Recipes'));
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'));
const CreateRecipe = lazy(() => import('./pages/CreateRecipe'));
const MealPlanner = lazy(() => import('./pages/MealPlanner'));
const GroceryList = lazy(() => import('./pages/GroceryList'));
const Pantry = lazy(() => import('./pages/Pantry'));
const Profile = lazy(() => import('./pages/Profile'));

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
                  <Route path="meal-planner" element={<MealPlanner />} />
                  <Route path="grocery-list" element={<GroceryList />} />
                  <Route path="pantry" element={<Pantry />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;

// Made with Bob

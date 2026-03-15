/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import React, { createContext, useContext, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { refreshAccessToken } from '../store/slices/authSlice';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Try to refresh token on mount if we have a refresh token
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken && !isAuthenticated) {
      dispatch(refreshAccessToken());
    }
  }, [dispatch, isAuthenticated]);

  const value: AuthContextType = {
    isAuthenticated,
    loading,
    user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Made with Bob

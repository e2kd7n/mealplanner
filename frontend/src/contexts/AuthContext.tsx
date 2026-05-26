/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { bootstrapAuth } from '../store/slices/authSlice';
import type { User } from '../store/slices/authSlice';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Separate component to fix Fast Refresh warning
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Bootstrap auth state from backend session on mount
    dispatch(bootstrapAuth());
  }, [dispatch]);

  const value: AuthContextType = {
    isAuthenticated,
    loading,
    user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Named export for the hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Made with Bob

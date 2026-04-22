/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

/**
 * Custom hook for managing keyboard shortcuts throughout the application
 * Provides consistent keyboard navigation and accessibility
 */
export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Focus search input when '/' is pressed
  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }, []);

  // Navigate to dashboard
  const goToDashboard = useCallback(() => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  }, [navigate, location.pathname]);

  // Navigate to recipes
  const goToRecipes = useCallback(() => {
    if (location.pathname !== '/recipes') {
      navigate('/recipes');
    }
  }, [navigate, location.pathname]);

  // Navigate to meal planner
  const goToMealPlanner = useCallback(() => {
    if (location.pathname !== '/meal-planner') {
      navigate('/meal-planner');
    }
  }, [navigate, location.pathname]);

  // Navigate to grocery list
  const goToGroceryList = useCallback(() => {
    if (location.pathname !== '/grocery-list') {
      navigate('/grocery-list');
    }
  }, [navigate, location.pathname]);

  // Navigate to pantry
  const goToPantry = useCallback(() => {
    if (location.pathname !== '/pantry') {
      navigate('/pantry');
    }
  }, [navigate, location.pathname]);

  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      action: focusSearch,
      description: 'Focus search input',
      preventDefault: true,
    },
    {
      key: 'd',
      altKey: true,
      action: goToDashboard,
      description: 'Go to Dashboard',
      preventDefault: true,
    },
    {
      key: 'r',
      altKey: true,
      action: goToRecipes,
      description: 'Go to Recipes',
      preventDefault: true,
    },
    {
      key: 'm',
      altKey: true,
      action: goToMealPlanner,
      description: 'Go to Meal Planner',
      preventDefault: true,
    },
    {
      key: 'g',
      altKey: true,
      action: goToGroceryList,
      description: 'Go to Grocery List',
      preventDefault: true,
    },
    {
      key: 'p',
      altKey: true,
      action: goToPantry,
      description: 'Go to Pantry',
      preventDefault: true,
    },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields (except for '/')
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (isInputField && event.key !== '/') {
        return;
      }

      // Check if any shortcut matches
      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.altKey ? event.altKey : !event.altKey;
        const metaMatches = shortcut.metaKey ? event.metaKey : !event.metaKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return { shortcuts };
};

/**
 * Get all available keyboard shortcuts for display in help dialog
 */
export const getKeyboardShortcuts = (): Array<{ keys: string; description: string }> => {
  return [
    { keys: 'Tab', description: 'Navigate to next element' },
    { keys: 'Shift + Tab', description: 'Navigate to previous element' },
    { keys: 'Enter', description: 'Activate button or link' },
    { keys: 'Space', description: 'Toggle checkbox or activate button' },
    { keys: 'Escape', description: 'Close dialog or cancel action' },
    { keys: 'Arrow Keys', description: 'Navigate within lists and menus' },
    { keys: '/', description: 'Focus search input' },
    { keys: 'Alt + D', description: 'Go to Dashboard' },
    { keys: 'Alt + R', description: 'Go to Recipes' },
    { keys: 'Alt + M', description: 'Go to Meal Planner' },
    { keys: 'Alt + G', description: 'Go to Grocery List' },
    { keys: 'Alt + P', description: 'Go to Pantry' },
  ];
};

// Made with Bob
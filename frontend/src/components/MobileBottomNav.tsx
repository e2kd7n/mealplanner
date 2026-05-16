/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  CalendarMonth as CalendarIcon,
  ShoppingCart as ShoppingCartIcon,
  Kitchen as KitchenIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../store/hooks';

/**
 * Mobile-optimized bottom navigation bar
 * Only shown on mobile devices (< md breakpoint)
 */
const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { expiringItems, lowStockItems } = useAppSelector((state) => state.pantry);
  const { groceryLists } = useAppSelector((state) => state.groceryLists);

  if (!isMobile) return null;

  const hasPantryAlert = expiringItems.length > 0 || lowStockItems.length > 0;
  const activeGroceryList = groceryLists.find((gl) => gl.status === 'shopping') ?? null;
  const groceryUnchecked = activeGroceryList?.items.filter((i) => !i.isChecked).length ?? 0;

  const getValueFromPath = (path: string): number => {
    if (path.startsWith('/dashboard')) return 0;
    if (path.startsWith('/recipes')) return 1;
    if (path.startsWith('/meal-planner')) return 2;
    if (path.startsWith('/grocery-list')) return 3;
    if (path.startsWith('/pantry')) return 4;
    return 0;
  };

  const currentValue = getValueFromPath(location.pathname);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const paths = ['/dashboard', '/recipes', '/meal-planner', '/grocery-list', '/pantry'];
    navigate(paths[newValue]);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      elevation={8}
    >
      <BottomNavigation
        value={currentValue}
        onChange={handleChange}
        showLabels
        sx={{
          height: 'auto',
          minHeight: 56,
          '& .MuiBottomNavigationAction-root': {
            minHeight: 56,
            padding: '6px 12px 8px',
            minWidth: 64,
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            marginTop: '4px',
          },
        }}
      >
        <BottomNavigationAction
          label="Dashboard"
          icon={<DashboardIcon />}
          aria-label="Navigate to Dashboard"
        />
        <BottomNavigationAction
          label="Recipes"
          icon={<RestaurantIcon />}
          aria-label="Navigate to Recipes"
        />
        <BottomNavigationAction
          label="Planner"
          icon={<CalendarIcon />}
          aria-label="Navigate to Meal Planner"
        />
        <BottomNavigationAction
          label="Grocery"
          icon={
            <Badge badgeContent={groceryUnchecked || null} color="secondary" max={99}>
              <ShoppingCartIcon />
            </Badge>
          }
          aria-label={groceryUnchecked ? `Grocery List — ${groceryUnchecked} items remaining` : 'Navigate to Grocery List'}
        />
        <BottomNavigationAction
          label="Pantry"
          icon={
            <Badge variant="dot" color="error" invisible={!hasPantryAlert}>
              <KitchenIcon />
            </Badge>
          }
          aria-label={hasPantryAlert ? 'Pantry — items need attention' : 'Navigate to Pantry'}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;

// Made with Bob

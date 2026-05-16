/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import React, { memo, useCallback, useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Skeleton,
  LinearProgress,
  Alert,
  Snackbar,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  CalendarMonth as CalendarIcon,
  ShoppingCart as ShoppingCartIcon,
  Kitchen as KitchenIcon,
  Warning as WarningIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCurrentMealPlan } from '../store/slices/mealPlansSlice';
import { fetchGroceryLists } from '../store/slices/groceryListsSlice';
import { fetchExpiringItems, fetchLowStockItems } from '../store/slices/pantrySlice';
import OnboardingWizard from '../components/OnboardingWizard';
import type { OnboardingData } from '../components/OnboardingWizard';
import { userAPI } from '../services/api';

const getTimeOfDayGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

// ─── Today's Meals ───────────────────────────────────────────────────────────

interface TodayMealsProps {
  loading: boolean;
  meals: Array<{ mealType: string; recipeName: string; assignedCookName?: string }>;
  onNavigate: () => void;
}

const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

const TodayMeals = memo(({ loading, meals, onNavigate }: TodayMealsProps) => {
  if (loading) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>Today's Meals</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {MEAL_SLOTS.map((slot) => (
            <Skeleton key={slot} variant="rectangular" width={160} height={56} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Today's Meals</Typography>
        <Button size="small" onClick={onNavigate}>Open Planner</Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {MEAL_SLOTS.map((slot) => {
          const meal = meals.find((m) => m.mealType.toLowerCase() === slot);
          return (
            <Box
              key={slot}
              sx={{
                flex: '1 1 140px',
                minWidth: 120,
                p: 1.5,
                border: '1px solid',
                borderColor: meal ? 'primary.light' : 'divider',
                borderRadius: 1,
                bgcolor: meal ? 'primary.50' : 'background.default',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', display: 'block' }}>
                {slot}
              </Typography>
              {meal ? (
                <>
                  <Typography variant="body2" fontWeight={500} noWrap>{meal.recipeName}</Typography>
                  {meal.assignedCookName && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {meal.assignedCookName}
                    </Typography>
                  )}
                </>
              ) : (
                <Button
                  size="small"
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  onClick={onNavigate}
                  sx={{ fontSize: '0.7rem', p: 0, minWidth: 0, mt: 0.5 }}
                >
                  Not planned
                </Button>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});
TodayMeals.displayName = 'TodayMeals';

// ─── Week at a Glance ─────────────────────────────────────────────────────────

interface WeekGlanceProps {
  loading: boolean;
  mealsForWeek: Array<{ date: string }>;
  onDayClick: () => void;
}

const WeekGlance = memo(({ loading, mealsForWeek, onDayClick }: WeekGlanceProps) => {
  const weekStart = startOfWeek(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  if (loading) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>This Week</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {days.map((_, i) => <Skeleton key={i} variant="circular" width={36} height={36} />)}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>This Week</Typography>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {days.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const dayStr = format(day, 'yyyy-MM-dd');
          const hasAnyMeal = mealsForWeek.some((m) => m.date.startsWith(dayStr));
          return (
            <Tooltip key={i} title={format(day, 'EEEE, MMM d')}>
              <Box
                onClick={onDayClick}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: isToday ? '2px solid' : '1px solid',
                  borderColor: isToday ? 'primary.main' : 'divider',
                  bgcolor: hasAnyMeal ? 'primary.main' : 'transparent',
                  '&:hover': { opacity: 0.8 },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: hasAnyMeal ? 'primary.contrastText' : isToday ? 'primary.main' : 'text.secondary',
                    fontSize: '0.65rem',
                    fontWeight: isToday ? 700 : 400,
                    lineHeight: 1,
                  }}
                >
                  {format(day, 'EEE').toUpperCase()}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: hasAnyMeal ? 'primary.contrastText' : isToday ? 'primary.main' : 'text.primary',
                    fontWeight: isToday ? 700 : 400,
                    lineHeight: 1,
                  }}
                >
                  {format(day, 'd')}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
});
WeekGlance.displayName = 'WeekGlance';

// ─── Grocery Status ───────────────────────────────────────────────────────────

interface GroceryStatusProps {
  loading: boolean;
  total: number;
  remaining: number;
  onNavigate: () => void;
}

const GroceryStatus = memo(({ loading, total, remaining, onNavigate }: GroceryStatusProps) => {
  if (loading) {
    return <Skeleton variant="rectangular" height={72} sx={{ borderRadius: 1 }} />;
  }
  if (total === 0) return null;

  const pct = Math.round(((total - remaining) / total) * 100);
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCartIcon color="secondary" fontSize="small" />
          <Typography variant="body2" fontWeight={500}>
            {remaining} of {total} items remaining
          </Typography>
        </Box>
        <Button size="small" onClick={onNavigate}>View List</Button>
      </Box>
      <LinearProgress variant="determinate" value={pct} color="secondary" />
    </Paper>
  );
});
GroceryStatus.displayName = 'GroceryStatus';

// ─── Pantry Alerts ────────────────────────────────────────────────────────────

interface PantryAlertsProps {
  loading: boolean;
  expiringCount: number;
  lowStockCount: number;
  alerts: Array<{ name: string; status: string }>;
  onNavigate: () => void;
}

const PantryAlerts = memo(({ loading, expiringCount, lowStockCount, alerts, onNavigate }: PantryAlertsProps) => {
  if (loading) {
    return <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />;
  }
  if (expiringCount === 0 && lowStockCount === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'warning.main' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" fontSize="small" />
          <Typography variant="body2" fontWeight={500}>Pantry needs attention</Typography>
        </Box>
        <Button size="small" onClick={onNavigate}>Check Pantry</Button>
      </Box>
      {alerts.slice(0, 3).map((alert, i) => (
        <Typography key={i} variant="caption" display="block" color="text.secondary">
          {alert.name} — {alert.status}
        </Typography>
      ))}
    </Paper>
  );
});
PantryAlerts.displayName = 'PantryAlerts';

// ─── Quick Action Card ────────────────────────────────────────────────────────

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  ctaLabel: string;
  onNavigate: () => void;
}

const QuickActionCard = memo(({ title, description, icon, iconColor, ctaLabel, onNavigate }: QuickActionCardProps) => (
  <Paper
    onClick={onNavigate}
    sx={{
      p: 2.5,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
    }}
  >
    <Box sx={{ color: iconColor, mb: 1.5 }}>{icon}</Box>
    <Typography variant="h6" gutterBottom>{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>{description}</Typography>
    <Button
      size="small"
      variant="contained"
      onClick={(e) => { e.stopPropagation(); onNavigate(); }}
      sx={{ mt: 2, alignSelf: 'flex-start', bgcolor: iconColor }}
    >
      {ctaLabel}
    </Button>
  </Paper>
));
QuickActionCard.displayName = 'QuickActionCard';

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const { currentMealPlan, loading: mealLoading } = useAppSelector((state) => state.mealPlans);
  const { groceryLists, loading: groceryLoading } = useAppSelector((state) => state.groceryLists);
  const { expiringItems, lowStockItems, loading: pantryLoading } = useAppSelector((state) => state.pantry);
  const { user } = useAppSelector((state) => state.auth);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileNudgeDismissed, setProfileNudgeDismissed] = useState(
    () => !!localStorage.getItem('profileNudgeDismissed')
  );
  const [onboardingSnackbar, setOnboardingSnackbar] = useState<{ open: boolean; error: boolean }>({
    open: false,
    error: false,
  });

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    if (!onboardingCompleted) {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch all dashboard data in parallel on mount
  useEffect(() => {
    dispatch(fetchCurrentMealPlan());
    dispatch(fetchGroceryLists({ status: 'shopping' }));
    dispatch(fetchExpiringItems());
    dispatch(fetchLowStockItems());
  }, [dispatch]);

  const handleNavigate = useCallback((path: string) => navigate(path), [navigate]);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.setItem('onboardingData', JSON.stringify(data));
    setShowOnboarding(false);

    try {
      // Persist onboarding preferences to backend
      await userAPI.updatePreferences({
        dietaryRestrictions: data.dietaryPreferences,
        cookingSkillLevel: data.cookingSkillLevel,
      });
      setOnboardingSnackbar({ open: true, error: false });
    } catch {
      setOnboardingSnackbar({ open: true, error: true });
    }
  };

  const handleOnboardingClose = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  const handleDismissNudge = () => {
    localStorage.setItem('profileNudgeDismissed', 'true');
    setProfileNudgeDismissed(true);
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const todayMeals = (currentMealPlan?.plannedMeals ?? [])
    .filter((m) => m.date.startsWith(todayStr))
    .map((m) => ({
      mealType: m.mealType,
      recipeName: m.recipe?.title ?? 'Unknown recipe',
    }));

  const mealsForWeek = currentMealPlan?.plannedMeals ?? [];

  const activeGroceryList = groceryLists.find((gl) => gl.status === 'shopping') ?? null;
  const groceryTotal = activeGroceryList?.items.length ?? 0;
  const groceryRemaining = activeGroceryList?.items.filter((i) => !i.isChecked).length ?? 0;

  const pantryAlerts = [
    ...expiringItems.map((i) => ({ name: i.ingredient?.name ?? 'Item', status: 'expiring soon' })),
    ...lowStockItems.map((i) => ({ name: i.ingredient?.name ?? 'Item', status: 'low stock' })),
  ];

  const showProfileNudge =
    !profileNudgeDismissed &&
    !!localStorage.getItem('onboardingData') &&
    !localStorage.getItem('profileNudgeDismissed');

  const familyName = user?.name ?? 'Family';
  const greeting = `Good ${getTimeOfDayGreeting()}, ${familyName}`;

  const quickActions = [
    {
      title: 'Recipes',
      description: 'Explore and discover new recipes for your family',
      icon: <RestaurantIcon sx={{ fontSize: 36 }} />,
      iconColor: theme.palette.primary.main,
      ctaLabel: 'Browse Recipes',
      path: '/recipes',
    },
    {
      title: 'Meal Planner',
      description: 'Plan your meals for the week ahead',
      icon: <CalendarIcon sx={{ fontSize: 36 }} />,
      iconColor: theme.palette.info.main,
      ctaLabel: 'Plan This Week',
      path: '/meal-planner',
    },
    {
      title: 'Grocery List',
      description: 'Manage your shopping list',
      icon: <ShoppingCartIcon sx={{ fontSize: 36 }} />,
      iconColor: theme.palette.secondary.main,
      ctaLabel: 'View List',
      path: '/grocery-list',
    },
    {
      title: 'Pantry',
      description: 'Track your pantry inventory and expiry dates',
      icon: <KitchenIcon sx={{ fontSize: 36 }} />,
      iconColor: '#7B1FA2',
      ctaLabel: 'Check Pantry',
      path: '/pantry',
    },
  ];

  const dataLoading = mealLoading || groceryLoading || pantryLoading;

  return (
    <>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          {dataLoading ? (
            <Skeleton variant="text" width={300} height={40} />
          ) : (
            <Typography variant="h4" gutterBottom>{greeting}</Typography>
          )}
          <Typography variant="body1" color="text.secondary">
            Plan your meals, manage your grocery list, and track your pantry.
          </Typography>
        </Box>

        {/* Profile nudge */}
        {showProfileNudge && (
          <Alert
            severity="info"
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" color="inherit" onClick={() => navigate('/profile')}>Complete now</Button>
                <Button size="small" color="inherit" onClick={handleDismissNudge}>Dismiss</Button>
              </Box>
            }
            sx={{ mb: 3 }}
          >
            Complete your profile to personalise recipe recommendations.
          </Alert>
        )}

        {/* Live info sections */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
          <TodayMeals
            loading={mealLoading}
            meals={todayMeals}
            onNavigate={() => handleNavigate('/meal-planner')}
          />

          <WeekGlance
            loading={mealLoading}
            mealsForWeek={mealsForWeek}
            onDayClick={() => handleNavigate('/meal-planner')}
          />

          <GroceryStatus
            loading={groceryLoading}
            total={groceryTotal}
            remaining={groceryRemaining}
            onNavigate={() => handleNavigate('/grocery-list')}
          />

          <PantryAlerts
            loading={pantryLoading}
            expiringCount={expiringItems.length}
            lowStockCount={lowStockItems.length}
            alerts={pantryAlerts}
            onNavigate={() => handleNavigate('/pantry')}
          />
        </Box>

        {/* Quick Actions */}
        <Typography variant="h5" gutterBottom>Quick Actions</Typography>
        <Grid container spacing={3}>
          {quickActions.map((action) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={action.title}>
              <QuickActionCard
                title={action.title}
                description={action.description}
                icon={action.icon}
                iconColor={action.iconColor}
                ctaLabel={action.ctaLabel}
                onNavigate={() => handleNavigate(action.path)}
              />
            </Grid>
          ))}
        </Grid>
      </Container>

      <OnboardingWizard
        open={showOnboarding}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />

      <Snackbar
        open={onboardingSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setOnboardingSnackbar((s) => ({ ...s, open: false }))}
        message={
          onboardingSnackbar.error
            ? 'Could not save preferences — visit Profile to complete setup'
            : 'Your preferences were saved — you can update them in Profile any time'
        }
        action={
          onboardingSnackbar.error ? (
            <Button color="secondary" size="small" onClick={() => navigate('/profile')}>
              Go to Profile
            </Button>
          ) : undefined
        }
      />
    </>
  );
};

export default Dashboard;

// Made with Bob

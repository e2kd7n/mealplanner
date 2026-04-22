/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Collapse,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Spa as ProduceIcon,
  Restaurant as MeatIcon,
  LocalDrink as DairyIcon,
  Cake as BakeryIcon,
  Kitchen as PantryIcon,
  AcUnit as FrozenIcon,
  LocalCafe as BeveragesIcon,
  Fastfood as SnacksIcon,
  Category as OtherIcon,
} from '@mui/icons-material';

interface Ingredient {
  id: string;
  name: string;
  category: string;
  averagePrice: number;
}

interface GroceryItem {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  isChecked: boolean;
  storeSection: string | null;
  notes: string | null;
  ingredient: Ingredient;
}

interface GroceryList {
  id: string;
  mealPlanId: string;
  userId: string;
  status: 'draft' | 'shopping' | 'completed';
  totalEstimatedCost: number | null;
  createdAt: string;
  updatedAt: string;
  items: GroceryItem[];
}

// Category configuration with icons and display order
const CATEGORY_CONFIG = [
  { key: 'produce', label: 'Produce', icon: ProduceIcon, color: '#4caf50', emoji: '🥬' },
  { key: 'dairy', label: 'Dairy & Eggs', icon: DairyIcon, color: '#2196f3', emoji: '🥛' },
  { key: 'protein', label: 'Meat & Seafood', icon: MeatIcon, color: '#f44336', emoji: '🥩' },
  { key: 'grains', label: 'Bakery & Grains', icon: BakeryIcon, color: '#ff9800', emoji: '🍞' },
  { key: 'pantry', label: 'Pantry', icon: PantryIcon, color: '#795548', emoji: '🥫' },
  { key: 'frozen', label: 'Frozen', icon: FrozenIcon, color: '#00bcd4', emoji: '❄️' },
  { key: 'beverages', label: 'Beverages', icon: BeveragesIcon, color: '#9c27b0', emoji: '🥤' },
  { key: 'snacks', label: 'Snacks', icon: SnacksIcon, color: '#ff5722', emoji: '🍿' },
  { key: 'spices', label: 'Spices & Seasonings', icon: OtherIcon, color: '#607d8b', emoji: '🌶️' },
  { key: 'other', label: 'Other', icon: OtherIcon, color: '#9e9e9e', emoji: '📦' },
];

// Map ingredient categories to store categories
const mapIngredientCategoryToStore = (ingredientCategory: string): string => {
  const mapping: Record<string, string> = {
    'produce': 'produce',
    'protein': 'protein',
    'dairy': 'dairy',
    'grains': 'grains',
    'pantry': 'pantry',
    'spices': 'spices',
    'other': 'other',
  };
  return mapping[ingredientCategory.toLowerCase()] || 'other';
};

const GroceryList: React.FC = () => {
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [currentList, setCurrentList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: 'pieces',
    category: 'Other',
  });

  const apiBase = import.meta.env.VITE_API_URL || '/api';

  // Fetch grocery lists on mount
  useEffect(() => {
    fetchGroceryLists();
  }, []);

  const fetchGroceryLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${apiBase}/grocery-lists`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch grocery lists');
      }

      const data = await response.json();
      setGroceryLists(data.data || []);
      
      // Set the most recent list as current
      if (data.data && data.data.length > 0) {
        setCurrentList(data.data[0]);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching grocery lists:', err);
      setError('Failed to load grocery lists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const expandAllCategories = () => {
    const allExpanded: Record<string, boolean> = {};
    CATEGORY_CONFIG.forEach(cat => {
      allExpanded[cat.key] = true;
    });
    setExpandedCategories(allExpanded);
  };

  const collapseAllCategories = () => {
    setExpandedCategories({});
  };

  const handleToggleItem = async (itemId: string) => {
    if (!currentList) return;

    try {
      const item = currentList.items.find(i => i.id === itemId);
      if (!item) return;

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${apiBase}/grocery-lists/${currentList.id}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checked: !item.isChecked,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const data = await response.json();
      
      // Update local state
      setCurrentList({
        ...currentList,
        items: currentList.items.map(i =>
          i.id === itemId ? data.data : i
        ),
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error toggling item:', err);
      alert('Failed to update item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!currentList) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${apiBase}/grocery-lists/${currentList.id}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Update local state
      setCurrentList({
        ...currentList,
        items: currentList.items.filter(i => i.id !== itemId),
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error deleting item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleAddItem = async () => {
    if (!currentList) return;

    try {
      const token = localStorage.getItem('accessToken');
      
      // First, we need to find or create an ingredient
      // For now, we'll show an error that this feature needs ingredient management
      alert('Adding custom items requires ingredient management. Please use the meal planner to generate grocery lists from recipes.');
      setOpenDialog(false);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error adding item:', err);
      alert('Failed to add item. Please try again.');
    }
  };

  const handleClearChecked = async () => {
    if (!currentList) return;

    const checkedItems = currentList.items.filter(item => item.isChecked);
    
    try {
      const token = localStorage.getItem('accessToken');
      
      // Delete all checked items
      await Promise.all(
        checkedItems.map(item =>
          fetch(`${apiBase}/grocery-lists/${currentList.id}/items/${item.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
        )
      );

      // Update local state
      setCurrentList({
        ...currentList,
        items: currentList.items.filter(item => !item.isChecked),
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error clearing checked items:', err);
      alert('Failed to clear checked items. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={fetchGroceryLists}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  const items = currentList?.items || [];
  
  // Group items by store category
  const groupedItems = items.reduce((acc, item) => {
    const storeCategory = mapIngredientCategoryToStore(item.ingredient.category || 'other');
    if (!acc[storeCategory]) {
      acc[storeCategory] = [];
    }
    acc[storeCategory].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  const checkedCount = items.filter(item => item.isChecked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  // Initialize expanded state for categories with items
  useEffect(() => {
    if (currentList && Object.keys(expandedCategories).length === 0) {
      const initialExpanded: Record<string, boolean> = {};
      CATEGORY_CONFIG.forEach(cat => {
        if (groupedItems[cat.key] && groupedItems[cat.key].length > 0) {
          initialExpanded[cat.key] = true;
        }
      });
      setExpandedCategories(initialExpanded);
    }
  }, [currentList]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4">
            Grocery List
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              onClick={expandAllCategories}
              aria-label="Expand all categories"
            >
              Expand All
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={collapseAllCategories}
              aria-label="Collapse all categories"
            >
              Collapse All
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchGroceryLists}
              aria-label="Refresh grocery lists"
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearChecked}
              disabled={checkedCount === 0}
              aria-label={`Clear ${checkedCount} checked items`}
            >
              Clear Checked ({checkedCount})
            </Button>
          </Stack>
        </Box>

        {/* Progress */}
        {currentList && (
          <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ShoppingCartIcon sx={{ fontSize: 40 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">
                    Shopping Progress
                  </Typography>
                  <Typography variant="body2">
                    {checkedCount} of {totalCount} items checked
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h4">
                    {Math.round(progress)}%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!currentList || items.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your grocery list is empty
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate a grocery list from your meal plan to get started
              </Typography>
              <Button
                variant="contained"
                onClick={() => window.location.href = '/meal-planner'}
              >
                Go to Meal Planner
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Grouped Items by Category */
          <Box>
            {CATEGORY_CONFIG.map(categoryConfig => {
              const categoryItems = groupedItems[categoryConfig.key];
              if (!categoryItems || categoryItems.length === 0) return null;

              const categoryChecked = categoryItems.filter(item => item.isChecked).length;
              const categoryTotal = categoryItems.length;
              const isExpanded = expandedCategories[categoryConfig.key] !== false;
              const CategoryIcon = categoryConfig.icon;

              return (
                <Card key={categoryConfig.key} sx={{ mb: 2, border: `2px solid ${categoryConfig.color}20` }}>
                  <CardContent sx={{ pb: isExpanded ? 2 : 1, '&:last-child': { pb: isExpanded ? 2 : 1 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        p: 1,
                        mx: -1,
                        borderRadius: 1,
                      }}
                      onClick={() => toggleCategory(categoryConfig.key)}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: categoryConfig.color, width: 40, height: 40 }}>
                          <CategoryIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{categoryConfig.emoji}</span>
                            {categoryConfig.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {categoryChecked} of {categoryTotal} items checked
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={`${categoryChecked}/${categoryTotal}`}
                          size="small"
                          color={categoryChecked === categoryTotal ? 'success' : 'default'}
                          icon={categoryChecked === categoryTotal ? <CheckCircleIcon /> : undefined}
                        />
                        <IconButton size="small">
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Stack>
                    </Box>
                    
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Divider sx={{ my: 2 }} />
                      <List disablePadding>
                        {categoryItems.map((item) => (
                          <ListItem
                            key={item.id}
                            disablePadding
                            secondaryAction={
                              <IconButton
                                edge="end"
                                aria-label={`Delete ${item.ingredient.name}`}
                                onClick={() => handleDeleteItem(item.id)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemButton
                              onClick={() => handleToggleItem(item.id)}
                              dense
                              sx={{
                                borderRadius: 1,
                                mb: 0.5,
                                '&:hover': {
                                  bgcolor: `${categoryConfig.color}10`,
                                }
                              }}
                            >
                              <ListItemIcon>
                                <Checkbox
                                  edge="start"
                                  checked={item.isChecked}
                                  tabIndex={-1}
                                  disableRipple
                                  sx={{
                                    color: categoryConfig.color,
                                    '&.Mui-checked': {
                                      color: categoryConfig.color,
                                    }
                                  }}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={item.ingredient.name}
                                secondary={`${item.quantity} ${item.unit}`}
                                sx={{
                                  textDecoration: item.isChecked ? 'line-through' : 'none',
                                  color: item.isChecked ? 'text.secondary' : 'text.primary',
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Add Item Dialog (Disabled for now) */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Grocery Item</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1 }}>
            Adding custom items is not yet supported. Please generate grocery lists from your meal plans.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GroceryList;

// Made with Bob

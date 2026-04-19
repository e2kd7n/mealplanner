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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
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

const CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery',
  'Pantry',
  'Frozen',
  'Beverages',
  'Snacks',
  'Other',
];

const GroceryList: React.FC = () => {
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [currentList, setCurrentList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
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
      console.error('Error fetching grocery lists:', err);
      setError('Failed to load grocery lists. Please try again.');
    } finally {
      setLoading(false);
    }
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
      console.error('Error toggling item:', err);
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
      console.error('Error deleting item:', err);
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
      console.error('Error adding item:', err);
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
      console.error('Error clearing checked items:', err);
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
  const groupedItems = items.reduce((acc, item) => {
    const category = item.ingredient.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  const checkedCount = items.filter(item => item.isChecked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Grocery List
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchGroceryLists}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearChecked}
              disabled={checkedCount === 0}
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
          /* Grouped Items */
          <Box>
            {Object.keys(groupedItems).sort().map(category => {
              const categoryItems = groupedItems[category];
              if (!categoryItems || categoryItems.length === 0) return null;

              const categoryChecked = categoryItems.filter(item => item.isChecked).length;
              const categoryTotal = categoryItems.length;

              return (
                <Card key={category} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        {category}
                      </Typography>
                      <Chip
                        label={`${categoryChecked}/${categoryTotal}`}
                        size="small"
                        color={categoryChecked === categoryTotal ? 'success' : 'default'}
                        icon={categoryChecked === categoryTotal ? <CheckCircleIcon /> : undefined}
                      />
                    </Box>
                    <Divider sx={{ mb: 1 }} />
                    <List disablePadding>
                      {categoryItems.map((item) => (
                        <ListItem
                          key={item.id}
                          disablePadding
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemButton
                            onClick={() => handleToggleItem(item.id)}
                            dense
                          >
                            <ListItemIcon>
                              <Checkbox
                                edge="start"
                                checked={item.isChecked}
                                tabIndex={-1}
                                disableRipple
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

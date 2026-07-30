/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
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
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Kitchen as KitchenIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchPantryItems,
  fetchLowStockItems,
  fetchExpiringItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  clearError,
} from '../store/slices/pantrySlice';
import type { PantryItem } from '../store/slices/pantrySlice';
import { ingredientAPI } from '../services/api';
import { getApiErrorMessage } from '../utils/errorHandler';

interface IngredientOption {
  id: string;
  name: string;
  category: string;
}

// Mirrors the store-section categories used elsewhere (e.g. GroceryList.tsx)
// so ingredients created here stay consistent with the rest of the app.
const INGREDIENT_CATEGORIES = [
  { value: 'produce', label: 'Produce' },
  { value: 'dairy', label: 'Dairy & Eggs' },
  { value: 'protein', label: 'Meat & Seafood' },
  { value: 'grains', label: 'Bakery & Grains' },
  { value: 'pantry', label: 'Pantry' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'spices', label: 'Spices & Seasonings' },
  { value: 'other', label: 'Other' },
];

const LOCATIONS: Array<{ value: PantryItem['location']; label: string }> = [
  { value: 'pantry', label: 'Pantry' },
  { value: 'fridge', label: 'Refrigerator' },
  { value: 'freezer', label: 'Freezer' },
];

const locationLabel = (location: string): string =>
  LOCATIONS.find((l) => l.value === location)?.label || location;

interface PantryFormData {
  ingredientId: string;
  ingredientName: string;
  ingredientCategory: string;
  quantity: number;
  unit: string;
  location: PantryItem['location'];
  expirationDate: string;
}

const emptyFormData: PantryFormData = {
  ingredientId: '',
  ingredientName: '',
  ingredientCategory: 'other',
  quantity: 1,
  unit: 'pieces',
  location: 'pantry',
  expirationDate: '',
};

const Pantry: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, lowStockItems, expiringItems, loading, error } = useAppSelector(
    (state) => state.pantry
  );

  const [activeTab, setActiveTab] = useState(0);
  const [availableIngredients, setAvailableIngredients] = useState<IngredientOption[]>([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [formData, setFormData] = useState<PantryFormData>(emptyFormData);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load real pantry data on mount — same thunks that drive the nav badge in Layout.tsx,
  // so the page and the badge always reflect the same backend truth.
  useEffect(() => {
    dispatch(fetchPantryItems({}));
    dispatch(fetchLowStockItems());
    dispatch(fetchExpiringItems());
  }, [dispatch]);

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const response = await ingredientAPI.getAll();
        const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setAvailableIngredients(data);
      } catch {
        setAvailableIngredients([]);
      }
    };
    loadIngredients();
  }, []);

  const handleOpenDialog = (item?: PantryItem) => {
    setFormError('');
    if (item) {
      setEditingItem(item);
      setFormData({
        ingredientId: item.ingredientId,
        ingredientName: item.ingredient?.name || '',
        ingredientCategory: item.ingredient?.category || 'other',
        quantity: item.quantity,
        unit: item.unit,
        location: item.location,
        expirationDate: item.expirationDate ? item.expirationDate.slice(0, 10) : '',
      });
    } else {
      setEditingItem(null);
      setFormData(emptyFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormError('');
  };

  const handleSaveItem = async () => {
    const name = formData.ingredientName.trim();
    if (!name) {
      setFormError('Please enter an ingredient name');
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      setFormError('Please enter a valid quantity greater than 0');
      return;
    }
    if (!formData.unit.trim()) {
      setFormError('Please enter a unit (e.g., lbs, bottle, pieces)');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (editingItem) {
        // The backend update endpoint only accepts quantity/unit/location/expirationDate —
        // the ingredient identity of an existing pantry entry isn't changeable.
        await dispatch(
          updatePantryItem({
            id: editingItem.id,
            data: {
              quantity: Number(formData.quantity),
              unit: formData.unit.trim(),
              location: formData.location,
              expirationDate: formData.expirationDate || null,
            },
          })
        ).unwrap();
      } else {
        let ingredientId = formData.ingredientId;

        if (!ingredientId) {
          const existing = availableIngredients.find(
            (ing) => ing.name.toLowerCase() === name.toLowerCase()
          );
          if (existing) {
            ingredientId = existing.id;
          } else {
            const created = await ingredientAPI.create({
              name,
              category: formData.ingredientCategory,
              unit: formData.unit.trim(),
              averagePrice: 0,
            });
            const createdIngredient = (created.data?.data || created.data) as IngredientOption;
            ingredientId = createdIngredient.id;
            setAvailableIngredients((prev) => [...prev, createdIngredient]);
          }
        }

        await dispatch(
          addPantryItem({
            ingredientId,
            quantity: Number(formData.quantity),
            unit: formData.unit.trim(),
            location: formData.location,
            expirationDate: formData.expirationDate || undefined,
          })
        ).unwrap();
      }

      // Adding/editing an item can move it in or out of the low-stock / expiring-soon
      // buckets, so refresh those the same way Layout.tsx does for the nav badge.
      dispatch(fetchLowStockItems());
      dispatch(fetchExpiringItems());

      setOpenDialog(false);
    } catch (err: unknown) {
      setFormError(
        typeof err === 'string' ? err : getApiErrorMessage(err, 'Failed to save pantry item')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await dispatch(deletePantryItem(id)).unwrap();
    } catch {
      // Failure surfaces via the redux `error` state below.
    }
  };

  const getFilteredItems = (): PantryItem[] => {
    switch (activeTab) {
      case 1:
        return lowStockItems;
      case 2:
        return expiringItems;
      default:
        return items;
    }
  };

  const filteredItems = getFilteredItems();
  const initialLoading = loading && items.length === 0;

  if (initialLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Pantry Inventory
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            aria-label="Add pantry item"
          >
            Add Item
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {/* Alerts */}
        {lowStockItems.length > 0 && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
            {lowStockItems.length} item(s) running low on stock
          </Alert>
        )}
        {expiringItems.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {expiringItems.length} item(s) expiring within 7 days
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label={`All Items (${items.length})`} />
            <Tab label={`Low Stock (${lowStockItems.length})`} />
            <Tab label={`Expiring Soon (${expiringItems.length})`} />
          </Tabs>
        </Box>

        {/* Empty State */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <KitchenIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {activeTab === 0 ? 'Your pantry is empty' : 'No items in this category'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {activeTab === 0 ? 'Start tracking your pantry inventory' : 'Great! Everything is well stocked'}
              </Typography>
              {activeTab === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  aria-label="Add first pantry item"
                >
                  Add First Item
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Items List */
          (<Card>
            <List>
              {filteredItems.map((item, index) => {
                const isLowStock = lowStockItems.some((i) => i.id === item.id);
                const isExpiringSoon = expiringItems.some((i) => i.id === item.id);
                const daysUntilExpiry = item.expirationDate
                  ? Math.floor(
                      (new Date(item.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    )
                  : null;
                const itemName = item.ingredient?.name || 'Unknown item';

                return (
                  <React.Fragment key={item.id}>
                    <ListItem
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            edge="end"
                            aria-label={`Edit ${itemName}`}
                            onClick={() => handleOpenDialog(item)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label={`Delete ${itemName}`}
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">{itemName}</Typography>
                            {isLowStock && (
                              <Chip label="Low Stock" size="small" color="warning" />
                            )}
                            {isExpiringSoon && (
                              <Chip
                                label={
                                  daysUntilExpiry !== null && daysUntilExpiry >= 0
                                    ? `Expires in ${daysUntilExpiry} days`
                                    : 'Expiring soon'
                                }
                                size="small"
                                color="error"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }} component="span">
                            <Typography variant="body2" color="text.secondary" component="span">
                              Quantity: {item.quantity} {item.unit}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="span">
                              Location: {locationLabel(item.location)}
                            </Typography>
                            {item.ingredient?.category && (
                              <Typography variant="body2" color="text.secondary" component="span">
                                Category: {item.ingredient.category}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                    {index < filteredItems.length - 1 && <Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}
                  </React.Fragment>
                );
              })}
            </List>
          </Card>)
        )}
      </Box>
      {/* Add/Edit Item Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Item' : 'Add Pantry Item'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Autocomplete
              freeSolo
              disabled={!!editingItem}
              options={availableIngredients}
              getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
              value={formData.ingredientName || null}
              onChange={(_, value) => {
                if (typeof value === 'string') {
                  setFormData({ ...formData, ingredientId: '', ingredientName: value });
                } else if (value) {
                  setFormData({
                    ...formData,
                    ingredientId: value.id,
                    ingredientName: value.name,
                    ingredientCategory: value.category || formData.ingredientCategory,
                  });
                } else {
                  setFormData({ ...formData, ingredientId: '', ingredientName: '' });
                }
              }}
              onInputChange={(_, value) => {
                if (value !== undefined) {
                  setFormData((prev) => ({ ...prev, ingredientName: value }));
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Item Name"
                  placeholder="Search or type new ingredient..."
                  helperText="Select an existing ingredient or type a new one"
                  autoFocus
                />
              )}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                sx={{ flex: 1 }}
                slotProps={{ htmlInput: { min: 0, step: 0.25 } }}
              />
              <TextField
                label="Unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>
            {!editingItem && (
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.ingredientCategory}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, ingredientCategory: e.target.value })}
                  disabled={!!formData.ingredientId}
                >
                  {INGREDIENT_CATEGORIES.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={formData.location}
                label="Location"
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value as PantryItem['location'] })
                }
              >
                {LOCATIONS.map((loc) => (
                  <MenuItem key={loc.value} value={loc.value}>{loc.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Expiration Date"
              type="date"
              fullWidth
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveItem}
            variant="contained"
            disabled={!formData.ingredientName.trim() || saving}
          >
            {saving ? <CircularProgress size={20} /> : editingItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Pantry;

// Made with Bob

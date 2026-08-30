/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
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
  Alert,
  Collapse,
  Avatar,
  Skeleton,
  Snackbar,
  Autocomplete,
  TextField,
  Select,
  MenuItem,
} from '@mui/material';
import {
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
  Home as HouseholdIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import api from '../services/api';

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
  mealPlanId: string | null;
  name: string | null;
  userId: string;
  status: 'draft' | 'shopping' | 'completed';
  totalEstimatedCost: number | null;
  createdAt: string;
  updatedAt: string;
  items: GroceryItem[];
}

interface IngredientSuggestion {
  id: string;
  name: string;
  category: string;
  unit: string;
}

// Category configuration with icons and display order. "household" is
// rendered last and only appears once it has items (issue #357 ad-hoc entry) —
// see the "only render if non-empty" check at each card below.
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
  { key: 'household', label: 'Household & Other', icon: HouseholdIcon, color: '#8d6e63', emoji: '🏠' },
];

const ADHOC_NAME_MAX_LENGTH = 80;
const ADHOC_NAME_WARN_LENGTH = 60;

// Map ingredient categories to store categories
const mapIngredientCategoryToStore = (ingredientCategory: string): string => {
  const mapping: Record<string, string> = {
    'produce': 'produce',
    'protein': 'protein',
    'dairy': 'dairy',
    'grains': 'grains',
    'pantry': 'pantry',
    'spices': 'spices',
    'household': 'household',
    'other': 'other',
  };
  return mapping[ingredientCategory.toLowerCase()] || 'other';
};

const GroceryList: React.FC = () => {
  const navigate = useNavigate();
  const { confirm, confirmDialogProps } = useConfirmDialog();
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [currentList, setCurrentList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'error',
  });
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Ad-hoc item entry (issue #357)
  const [adHocText, setAdHocText] = useState('');
  const [adHocOptions, setAdHocOptions] = useState<IngredientSuggestion[]>([]);
  const [adHocSelected, setAdHocSelected] = useState<IngredientSuggestion | null>(null);
  const [adHocSubmitting, setAdHocSubmitting] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const adHocInputRef = useRef<HTMLInputElement>(null);
  const adHocDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Standalone list creation (issue #357)
  const [showNewListPrompt, setShowNewListPrompt] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListSubmitting, setNewListSubmitting] = useState(false);

  const fetchGroceryLists = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/grocery-lists');
      const data = response.data;
      const lists: GroceryList[] = data.data || [];
      setGroceryLists(lists);

      // Set the most recent list as current
      if (lists.length > 0) {
        setCurrentList(lists[0]);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching grocery lists:', err);
      setError('Failed to load grocery lists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchableLists = groceryLists.filter((l) => l.status !== 'completed');

  const fetchAdHocSuggestions = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setAdHocOptions([]);
      return;
    }
    try {
      const response = await api.get('/ingredients/search/suggestions', {
        params: { q: text.trim(), limit: 8, context: 'grocery' },
      });
      setAdHocOptions(response.data?.data || []);
    } catch {
      setAdHocOptions([]);
    }
  }, []);

  const handleAdHocTextChange = (text: string) => {
    setAdHocText(text);
    setAdHocSelected(null);
    if (adHocDebounceRef.current) clearTimeout(adHocDebounceRef.current);
    adHocDebounceRef.current = setTimeout(() => fetchAdHocSuggestions(text), 300);
  };

  const handleAddAdHocItem = async () => {
    if (!currentList || !adHocText.trim() || adHocSubmitting) return;

    const trimmed = adHocText.trim();
    setAdHocSubmitting(true);
    try {
      const response = await api.post(`/grocery-lists/${currentList.id}/items`, adHocSelected
        ? { ingredientId: adHocSelected.id }
        : { ingredientName: trimmed, category: 'household' });
      const { data: item, alreadyOnList } = response.data;

      if (alreadyOnList) {
        setHighlightedItemId(item.id);
        setLiveMessage(`${item.ingredient.name} is already on your list.`);
        setTimeout(() => setHighlightedItemId(null), 1500);
      } else {
        setCurrentList({ ...currentList, items: [...currentList.items, item] });
        setLiveMessage(`${item.ingredient.name} added.`);
      }

      setAdHocText('');
      setAdHocSelected(null);
      setAdHocOptions([]);
      adHocInputRef.current?.focus();
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error adding ad-hoc item:', err);
      showSnackbar('Failed to add item. Please try again.', 'error');
    } finally {
      setAdHocSubmitting(false);
    }
  };

  const handleStartNewList = async () => {
    if (!newListName.trim() || newListSubmitting) return;

    setNewListSubmitting(true);
    try {
      const response = await api.post('/grocery-lists', { name: newListName.trim() });
      const newList: GroceryList = { ...response.data.data, items: [] };
      setGroceryLists((prev) => [newList, ...prev]);
      setCurrentList(newList);
      setShowNewListPrompt(false);
      setNewListName('');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error creating grocery list:', err);
      showSnackbar('Failed to create list. Please try again.', 'error');
    } finally {
      setNewListSubmitting(false);
    }
  };

  const handleSwitchList = (listId: string) => {
    const list = switchableLists.find((l) => l.id === listId);
    if (list) setCurrentList(list);
  };

  // Fetch grocery lists on mount
  useEffect(() => {
    fetchGroceryLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize expanded state for categories with items
  useEffect(() => {
    if (currentList && Object.keys(expandedCategories).length === 0) {
      const items = currentList.items || [];
      const groupedItems = items.reduce((acc, item) => {
        const storeCategory = mapIngredientCategoryToStore(item.ingredient.category || 'other');
        if (!acc[storeCategory]) {
          acc[storeCategory] = [];
        }
        acc[storeCategory].push(item);
        return acc;
      }, {} as Record<string, GroceryItem[]>);
      
      const initialExpanded: Record<string, boolean> = {};
      CATEGORY_CONFIG.forEach(cat => {
        if (groupedItems[cat.key] && groupedItems[cat.key].length > 0) {
          initialExpanded[cat.key] = true;
        }
      });
      setExpandedCategories(initialExpanded);
    }
  }, [currentList, expandedCategories]);

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

      const response = await api.put(`/grocery-lists/${currentList.id}/items/${itemId}`, {
        checked: !item.isChecked,
      });
      const data = response.data;

      // Update local state
      setCurrentList({
        ...currentList,
        items: currentList.items.map(i =>
          i.id === itemId ? data.data : i
        ),
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error toggling item:', err);
      showSnackbar('Failed to update item. Please try again.', 'error');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!currentList) return;

    const itemName = currentList.items.find((i) => i.id === itemId)?.ingredient?.name ?? 'this item';
    const confirmed = await confirm({
      title: 'Delete Grocery Item',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    });
    if (!confirmed) return;

    try {
      await api.delete(`/grocery-lists/${currentList.id}/items/${itemId}`);

      // Update local state
      setCurrentList({
        ...currentList,
        items: currentList.items.filter(i => i.id !== itemId),
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error deleting item:', err);
      showSnackbar('Failed to delete item. Please try again.', 'error');
    }
  };


  const handleClearChecked = async () => {
    if (!currentList) return;

    const checkedItems = currentList.items.filter(item => item.isChecked);
    
    try {
      // Delete all checked items
      await Promise.all(
        checkedItems.map(item =>
          api.delete(`/grocery-lists/${currentList.id}/items/${item.id}`)
        )
      );

      // Update local state
      setCurrentList({
        ...currentList,
        items: currentList.items.filter(item => !item.isChecked),
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error clearing checked items:', err);
      showSnackbar('Failed to clear checked items. Please try again.', 'error');
    }
  };

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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Skeleton variant="text" width={220} height={40} />
            <Skeleton variant="rectangular" width={340} height={36} sx={{ borderRadius: 1 }} />
          </Box>

          <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 1, mb: 3 }} />

          {[...Array(4)].map((_, i) => (
            <Card key={i} sx={{ mb: 2 }}>
              <CardContent>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="40%" height={28} />
                    <Skeleton variant="text" width="30%" />
                  </Box>
                </Stack>
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} variant="text" width="80%" sx={{ mb: 1 }} />
                ))}
              </CardContent>
            </Card>
          ))}
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            Grocery List
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
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

        {/* List switcher + ad-hoc add row (issue #357) */}
        <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {switchableLists.length > 1 && (
            <Select
              size="small"
              value={currentList?.id ?? ''}
              onChange={(e) => handleSwitchList(e.target.value)}
              aria-label="Switch grocery list"
              sx={{ minWidth: 180 }}
            >
              {switchableLists.map((list) => (
                <MenuItem key={list.id} value={list.id}>
                  {list.name || (list.mealPlanId ? 'Meal plan list' : 'Untitled list')}
                </MenuItem>
              ))}
            </Select>
          )}
          <Autocomplete
            freeSolo
            options={adHocOptions}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
            filterOptions={(options) => options}
            inputValue={adHocText}
            onInputChange={(_, value, reason) => {
              if (reason === 'input') handleAdHocTextChange(value);
            }}
            onChange={(_, value) => {
              if (value && typeof value !== 'string') {
                setAdHocText(value.name);
                setAdHocSelected(value);
              }
            }}
            disabled={!currentList}
            sx={{ minWidth: 260, flexGrow: 1, maxWidth: 400 }}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={adHocInputRef}
                size="small"
                placeholder="Add an item (e.g. paper towels)"
                aria-label="Add a grocery item"
                helperText={
                  !currentList
                    ? 'Generate a grocery list from your meal planner, or start a new list, first.'
                    : adHocText.trim().length > 0 && !adHocSelected
                      ? `Will create "${adHocText.trim()}" as a new item`
                      : adHocText.length > ADHOC_NAME_WARN_LENGTH
                        ? `${adHocText.length}/${ADHOC_NAME_MAX_LENGTH}`
                        : ' '
                }
                inputProps={{ ...params.inputProps, maxLength: ADHOC_NAME_MAX_LENGTH }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAdHocItem();
                  }
                }}
              />
            )}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddAdHocItem}
            disabled={!currentList || !adHocText.trim() || adHocSubmitting}
            aria-label="Add item to grocery list"
          >
            Add
          </Button>
        </Stack>
        <Box
          role="status"
          aria-live="polite"
          sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
        >
          {liveMessage}
        </Box>

        {/* Progress */}
        {currentList && (
          <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <ShoppingCartIcon sx={{ fontSize: 40 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2">
                    Shopping Progress
                  </Typography>
                  <Typography variant="body2">
                    {checkedCount} of {totalCount} items checked
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  {/* Decorative progress readout, not a document heading. */}
                  <Typography variant="h4" component="div">
                    {Math.round(progress)}%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!currentList ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.primary', mb: 2 }} aria-hidden="true" />
              <Typography variant="h6" component="h2" sx={{ color: 'text.primary' }} gutterBottom>
                Your grocery list is empty
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.primary' }}>
                Generate a list from your meal plan, or start a new one from scratch
              </Typography>
              {showNewListPrompt ? (
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', maxWidth: 400, mx: 'auto' }}>
                  <TextField
                    size="small"
                    autoFocus
                    placeholder="List name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleStartNewList(); }
                    }}
                    aria-label="New list name"
                  />
                  <Button
                    variant="contained"
                    onClick={handleStartNewList}
                    disabled={!newListName.trim() || newListSubmitting}
                  >
                    Create
                  </Button>
                  <Button variant="text" onClick={() => { setShowNewListPrompt(false); setNewListName(''); }}>
                    Cancel
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                  <Button variant="contained" onClick={() => navigate('/meal-planner')}>
                    Generate from Meal Plan
                  </Button>
                  <Button variant="outlined" onClick={() => setShowNewListPrompt(true)}>
                    Start a New List
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.primary', mb: 2 }} aria-hidden="true" />
              <Typography variant="h6" component="h2" sx={{ color: 'text.primary' }} gutterBottom>
                {currentList.name || 'This list'} is empty
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.primary' }}>
                Add your first item using the field above, or generate one from your meal plan
              </Typography>
              <Button variant="contained" onClick={() => navigate('/meal-planner')}>
                Generate from Meal Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Grouped Items by Category */
          (<Box>
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
                      component="button"
                      type="button"
                      sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        background: 'transparent',
                        border: 0,
                        textAlign: 'left',
                        p: 1,
                        mx: -1,
                        borderRadius: 1,
                      }}
                      onClick={() => toggleCategory(categoryConfig.key)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${categoryConfig.label} category`}
                    >
                      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: categoryConfig.color, width: 40, height: 40 }}>
                          <CategoryIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{categoryConfig.emoji}</span>
                            {categoryConfig.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.primary' }}>
                            {categoryChecked} of {categoryTotal} items checked
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Chip
                          label={`${categoryChecked}/${categoryTotal}`}
                          size="small"
                          color={categoryChecked === categoryTotal ? 'success' : 'default'}
                          icon={categoryChecked === categoryTotal ? <CheckCircleIcon /> : undefined}
                        />
                        <IconButton
                          size="small"
                          tabIndex={-1}
                          aria-hidden="true"
                        >
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
                                transition: 'background-color 0.3s',
                                bgcolor: highlightedItemId === item.id ? `${categoryConfig.color}30` : undefined,
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
                                  slotProps={{ input: { 'aria-label': `${item.isChecked ? 'Uncheck' : 'Check'} ${item.ingredient.name}` } }}
                                  sx={{
                                    color: categoryConfig.color,
                                    '&.Mui-checked': {
                                      color: categoryConfig.color,
                                    }
                                  }}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <span>{item.ingredient.name}</span>
                                    {item.ingredient.category === 'household' && (
                                      <Chip label="Custom" size="small" variant="outlined" />
                                    )}
                                  </Stack>
                                }
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
          </Box>)
        )}
      </Box>
      <ConfirmDialog {...confirmDialogProps} />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GroceryList;

// Made with Bob

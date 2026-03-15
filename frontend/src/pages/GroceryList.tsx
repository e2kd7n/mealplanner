import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
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
  const [items, setItems] = useState<GroceryItem[]>([
    {
      id: '1',
      name: 'Tomatoes',
      quantity: 4,
      unit: 'pieces',
      category: 'Produce',
      checked: false,
    },
    {
      id: '2',
      name: 'Chicken Breast',
      quantity: 2,
      unit: 'lbs',
      category: 'Meat & Seafood',
      checked: false,
    },
    {
      id: '3',
      name: 'Milk',
      quantity: 1,
      unit: 'gallon',
      category: 'Dairy & Eggs',
      checked: true,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: 'pieces',
    category: 'Other',
  });

  const handleToggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    const item: GroceryItem = {
      id: Date.now().toString(),
      ...newItem,
      checked: false,
    };
    setItems([...items, item]);
    setNewItem({ name: '', quantity: 1, unit: 'pieces', category: 'Other' });
    setOpenDialog(false);
  };

  const handleClearChecked = () => {
    setItems(items.filter(item => !item.checked));
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  const checkedCount = items.filter(item => item.checked).length;
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
              color="error"
              onClick={handleClearChecked}
              disabled={checkedCount === 0}
            >
              Clear Checked ({checkedCount})
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Add Item
            </Button>
          </Stack>
        </Box>

        {/* Progress */}
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

        {/* Empty State */}
        {items.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your grocery list is empty
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add items manually or generate from a meal plan
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Add First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Grouped Items */
          <Box>
            {CATEGORIES.map(category => {
              const categoryItems = groupedItems[category];
              if (!categoryItems || categoryItems.length === 0) return null;

              const categoryChecked = categoryItems.filter(item => item.checked).length;
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
                                checked={item.checked}
                                tabIndex={-1}
                                disableRipple
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={item.name}
                              secondary={`${item.quantity} ${item.unit}`}
                              sx={{
                                textDecoration: item.checked ? 'line-through' : 'none',
                                color: item.checked ? 'text.secondary' : 'text.primary',
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

      {/* Add Item Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Grocery Item</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Item Name"
              fullWidth
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              autoFocus
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Quantity"
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Unit"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newItem.category}
                label="Category"
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              >
                {CATEGORIES.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddItem}
            variant="contained"
            disabled={!newItem.name}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GroceryList;

// Made with Bob

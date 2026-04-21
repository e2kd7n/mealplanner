/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Kitchen as KitchenIcon,
} from '@mui/icons-material';

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  location: string;
  expirationDate?: string;
  minQuantity: number;
}

const CATEGORIES = [
  'Grains & Pasta',
  'Canned Goods',
  'Spices & Seasonings',
  'Oils & Condiments',
  'Baking',
  'Snacks',
  'Beverages',
  'Other',
];

const LOCATIONS = ['Pantry', 'Refrigerator', 'Freezer', 'Cabinet'];

const Pantry: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [items, setItems] = useState<PantryItem[]>([
    {
      id: '1',
      name: 'Rice',
      quantity: 5,
      unit: 'lbs',
      category: 'Grains & Pasta',
      location: 'Pantry',
      minQuantity: 2,
    },
    {
      id: '2',
      name: 'Olive Oil',
      quantity: 1,
      unit: 'bottle',
      category: 'Oils & Condiments',
      location: 'Pantry',
      expirationDate: '2026-12-31',
      minQuantity: 1,
    },
    {
      id: '3',
      name: 'Flour',
      quantity: 0.5,
      unit: 'lbs',
      category: 'Baking',
      location: 'Pantry',
      minQuantity: 2,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    unit: 'pieces',
    category: 'Other',
    location: 'Pantry',
    expirationDate: '',
    minQuantity: 0,
  });

  const handleOpenDialog = (item?: PantryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        location: item.location,
        expirationDate: item.expirationDate || '',
        minQuantity: item.minQuantity,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        quantity: 1,
        unit: 'pieces',
        category: 'Other',
        location: 'Pantry',
        expirationDate: '',
        minQuantity: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleSaveItem = () => {
    if (editingItem) {
      setItems(items.map(item =>
        item.id === editingItem.id
          ? { ...item, ...formData }
          : item
      ));
    } else {
      const newItem: PantryItem = {
        id: Date.now().toString(),
        ...formData,
      };
      setItems([...items, newItem]);
    }
    setOpenDialog(false);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const lowStockItems = items.filter(item => item.quantity <= item.minQuantity);
  const expiringItems = items.filter(item => {
    if (!item.expirationDate) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(item.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  });

  const getFilteredItems = () => {
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
          <Card>
            <List>
              {filteredItems.map((item, index) => {
                const isLowStock = item.quantity <= item.minQuantity;
                const daysUntilExpiry = item.expirationDate
                  ? Math.floor(
                      (new Date(item.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    )
                  : null;
                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

                return (
                  <React.Fragment key={item.id}>
                    <ListItem
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            edge="end"
                            aria-label={`Edit ${item.name}`}
                            onClick={() => handleOpenDialog(item)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label={`Delete ${item.name}`}
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
                            <Typography variant="subtitle1">{item.name}</Typography>
                            {isLowStock && (
                              <Chip label="Low Stock" size="small" color="warning" />
                            )}
                            {isExpiringSoon && (
                              <Chip
                                label={`Expires in ${daysUntilExpiry} days`}
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
                              Location: {item.location}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="span">
                              Category: {item.category}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                    {index < filteredItems.length - 1 && <Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}
                  </React.Fragment>
                );
              })}
            </List>
          </Card>
        )}
      </Box>

      {/* Add/Edit Item Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Item' : 'Add Pantry Item'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Item Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={formData.location}
                label="Location"
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              >
                {LOCATIONS.map(loc => (
                  <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Minimum Quantity (for alerts)"
              type="number"
              fullWidth
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
            />
            <TextField
              label="Expiration Date"
              type="date"
              fullWidth
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveItem}
            variant="contained"
            disabled={!formData.name}
          >
            {editingItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Pantry;

// Made with Bob

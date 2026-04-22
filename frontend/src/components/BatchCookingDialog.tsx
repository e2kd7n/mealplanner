/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  Stack,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Restaurant as RestaurantIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { format, addDays, isSameDay } from 'date-fns';

interface Meal {
  id: string;
  recipeId: string;
  recipeName: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  date: Date;
  servings: number;
  assignedCookId?: string;
  assignedCookName?: string;
  recipeImageUrl?: string;
  recipeSourceUrl?: string;
  isLeftover?: boolean;
}

interface BatchCookingDialogProps {
  open: boolean;
  onClose: () => void;
  meal: Meal | null;
  onBatchCook: (dates: Date[], servingsMultiplier: number, markAsLeftovers: boolean) => Promise<void>;
  currentWeekStart: Date;
}

const BatchCookingDialog: React.FC<BatchCookingDialogProps> = ({
  open,
  onClose,
  meal,
  onBatchCook,
  currentWeekStart,
}) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);
  const [markAsLeftovers, setMarkAsLeftovers] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Generate next 14 days for selection
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(currentWeekStart, i));

  const handleDateToggle = (date: Date) => {
    setSelectedDates((prev) => {
      const exists = prev.some((d) => isSameDay(d, date));
      if (exists) {
        return prev.filter((d) => !isSameDay(d, date));
      } else {
        return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedDates.length === availableDates.length) {
      setSelectedDates([]);
    } else {
      setSelectedDates([...availableDates]);
    }
  };

  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      alert('Please select at least one date');
      return;
    }

    setLoading(true);
    try {
      await onBatchCook(selectedDates, servingsMultiplier, markAsLeftovers);
      handleClose();
    } catch (error) {
      console.error('Batch cooking failed:', error);
      alert('Failed to batch cook meals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDates([]);
    setServingsMultiplier(1);
    setMarkAsLeftovers(true);
    onClose();
  };

  if (!meal) return null;

  const totalServings = meal.servings * servingsMultiplier * selectedDates.length;
  const originalMealDate = meal.date;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <ContentCopyIcon color="primary" />
            <Typography variant="h6">Batch Cook: {meal.recipeName}</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Info Alert */}
          <Alert severity="info" icon={<RestaurantIcon />}>
            Batch cooking lets you prepare one recipe and schedule it for multiple days. Perfect for meal prep!
          </Alert>

          {/* Original Meal Info */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Original Meal
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                icon={<CalendarIcon />}
                label={format(originalMealDate, 'EEE, MMM d')}
                size="small"
              />
              <Chip label={meal.mealType} size="small" color="primary" />
              <Chip label={`${meal.servings} servings`} size="small" />
              {meal.assignedCookName && (
                <Chip label={`Chef: ${meal.assignedCookName}`} size="small" variant="outlined" />
              )}
            </Box>
          </Box>

          <Divider />

          {/* Servings Multiplier */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Portion Multiplier
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Multiply servings for batch cooking (e.g., 2x = double the recipe)
            </Typography>
            <TextField
              type="number"
              value={servingsMultiplier}
              onChange={(e) => setServingsMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, max: 10, step: 0.5 }}
              size="small"
              sx={{ width: 150 }}
              helperText={`${meal.servings} × ${servingsMultiplier} = ${meal.servings * servingsMultiplier} servings per meal`}
            />
          </Box>

          {/* Date Selection */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2">
                Select Days to Schedule ({selectedDates.length} selected)
              </Typography>
              <Button size="small" onClick={handleSelectAll}>
                {selectedDates.length === availableDates.length ? 'Deselect All' : 'Select All'}
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {availableDates.map((date) => {
                const isSelected = selectedDates.some((d) => isSameDay(d, date));
                const isOriginal = isSameDay(date, originalMealDate);
                return (
                  <Tooltip
                    key={date.toISOString()}
                    title={isOriginal ? 'Original meal date' : ''}
                  >
                    <Chip
                      label={format(date, 'EEE, MMM d')}
                      onClick={() => handleDateToggle(date)}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      disabled={isOriginal}
                      sx={{
                        cursor: isOriginal ? 'not-allowed' : 'pointer',
                        opacity: isOriginal ? 0.5 : 1,
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>

          {/* Leftover Option */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={markAsLeftovers}
                  onChange={(e) => setMarkAsLeftovers(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Mark duplicated meals as leftovers</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Helps track which meals are freshly cooked vs. reheated
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Summary */}
          {selectedDates.length > 0 && (
            <Alert severity="success">
              <Typography variant="body2">
                <strong>Summary:</strong> You'll cook {meal.servings * servingsMultiplier} servings
                and schedule {selectedDates.length} meal{selectedDates.length > 1 ? 's' : ''} for a
                total of {totalServings} servings.
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || selectedDates.length === 0}
          startIcon={<ContentCopyIcon />}
        >
          {loading ? 'Batch Cooking...' : `Batch Cook to ${selectedDates.length} Days`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchCookingDialog;

// Made with Bob

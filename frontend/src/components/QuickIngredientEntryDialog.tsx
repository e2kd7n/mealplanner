/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  Autocomplete,
  Stack,
  Box,
  Typography,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, DragIndicator as DragIndicatorIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { useAppDispatch } from '../store/hooks';
import { updateRecipe } from '../store/slices/recipesSlice';
import { getApiErrorMessage } from '../utils/errorHandler';
import api from '../services/api';

interface IngredientOption {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface IngredientRow {
  rowId: string;
  text: string;
  selected: IngredientOption | null;
}

let rowIdCounter = 0;
const newRow = (text = ''): IngredientRow => ({ rowId: `row-${++rowIdCounter}`, text, selected: null });

interface QuickIngredientEntryDialogProps {
  open: boolean;
  recipe: { id: string; title: string } | null;
  onClose: () => void;
}

/**
 * Lightweight, line-by-line ingredient entry for quick-added staple recipes
 * (issue #328). Deliberately not the CreateRecipe wizard: no quantity/unit
 * fields, no instruction-step gate — every line still resolves to a real
 * RecipeIngredient row server-side (backend defaults quantity/unit when
 * omitted), never a freeform text blob.
 */
const QuickIngredientEntryDialog: React.FC<QuickIngredientEntryDialogProps> = ({
  open,
  recipe,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [rows, setRows] = useState<IngredientRow[]>([newRow()]);
  const [optionsByRow, setOptionsByRow] = useState<Record<string, IngredientOption[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (open) {
      setRows([newRow()]);
      setOptionsByRow({});
      setError('');
    }
  }, [open, recipe?.id]);

  const fetchSuggestions = useCallback(async (rowId: string, text: string) => {
    if (text.trim().length < 2) {
      setOptionsByRow((prev) => ({ ...prev, [rowId]: [] }));
      return;
    }
    try {
      const response = await api.get('/ingredients/search/suggestions', {
        params: { q: text.trim(), limit: 8 },
      });
      setOptionsByRow((prev) => ({ ...prev, [rowId]: response.data?.data || [] }));
    } catch {
      setOptionsByRow((prev) => ({ ...prev, [rowId]: [] }));
    }
  }, []);

  const handleRowTextChange = (rowId: string, text: string) => {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, text, selected: null } : r)));

    if (debounceRef.current[rowId]) clearTimeout(debounceRef.current[rowId]);
    debounceRef.current[rowId] = setTimeout(() => fetchSuggestions(rowId, text), 300);
  };

  const handleRowSelect = (rowId: string, option: IngredientOption | null) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, text: option?.name || r.text, selected: option } : r))
    );
  };

  const insertLinesAfter = (rowId: string, lines: string[]) => {
    const trimmed = lines.map((l) => l.trim()).filter(Boolean);
    if (trimmed.length === 0) return;

    setRows((prev) => {
      const index = prev.findIndex((r) => r.rowId === rowId);
      const updated = [...prev];
      updated[index] = { ...updated[index], text: trimmed[0], selected: null };
      const newRows = trimmed.slice(1).map((line) => newRow(line));
      updated.splice(index + 1, 0, ...newRows);
      return updated;
    });
  };

  const handlePaste = (rowId: string, event: React.ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData('text');
    if (pasted.includes('\n')) {
      event.preventDefault();
      insertLinesAfter(rowId, pasted.split('\n'));
    }
  };

  const handleEnter = (rowId: string) => {
    const index = rows.findIndex((r) => r.rowId === rowId);
    const isLast = index === rows.length - 1;
    if (isLast && rows[index].text.trim()) {
      setRows((prev) => [...prev, newRow()]);
    }
  };

  const handleRemoveRow = (rowId: string) => {
    setRows((prev) => (prev.length === 1 ? [newRow()] : prev.filter((r) => r.rowId !== rowId)));
  };

  const handleSave = async () => {
    if (!recipe) return;

    const ingredients = rows
      .filter((r) => r.text.trim())
      .map((r) => ({
        ingredientId: r.selected?.id,
        ingredientName: r.selected?.name || r.text.trim(),
      }));

    if (ingredients.length === 0) {
      setError('Add at least one ingredient, or close this dialog to add them later.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await dispatch(updateRecipe({ id: recipe.id, data: { ingredients } })).unwrap();
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to save ingredients'));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenFullEditor = () => {
    if (!recipe) return;
    onClose();
    navigate(`/recipes/${recipe.id}/edit`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Stack spacing={0.5}>
          <Typography variant="h6" component="span">
            Add ingredients{recipe ? ` to "${recipe.title}"` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            So this shows up in your grocery list
          </Typography>
        </Stack>
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Type or paste one ingredient per line. No quantities or units needed — just get them on the list.
        </Typography>
        <Stack spacing={1.5}>
          {rows.map((row, index) => {
            const isNew = row.text.trim().length > 0 && !row.selected;
            return (
              <Box key={row.rowId} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled', mt: 1.5 }} />
                <Stack sx={{ flexGrow: 1 }}>
                  <Autocomplete
                    freeSolo
                    options={optionsByRow[row.rowId] || []}
                    getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
                    filterOptions={(options) => options}
                    inputValue={row.text}
                    onInputChange={(_, value, reason) => {
                      if (reason === 'input') handleRowTextChange(row.rowId, value);
                    }}
                    onChange={(_, value) => {
                      if (value && typeof value !== 'string') handleRowSelect(row.rowId, value);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        autoFocus={index === rows.length - 1 && index > 0}
                        placeholder={`Ingredient ${index + 1} (e.g. ground beef)`}
                        size="small"
                        onPaste={(e) => handlePaste(row.rowId, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleEnter(row.rowId);
                          }
                        }}
                      />
                    )}
                  />
                  {isNew && (
                    <Typography variant="caption" color="primary.main" sx={{ ml: 1.5, mt: 0.25 }}>
                      Will create "{row.text.trim()}" as a new ingredient
                    </Typography>
                  )}
                </Stack>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveRow(row.rowId)}
                  aria-label={`Remove ingredient line ${index + 1}`}
                  sx={{ mt: 0.5 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </Stack>
        <Button
          size="small"
          onClick={() => setRows((prev) => [...prev, newRow()])}
          sx={{ mt: 1.5 }}
        >
          + Add line
        </Button>
        <Typography variant="body2" sx={{ mt: 3 }}>
          Want to add times, steps, or a photo too?{' '}
          <Link component="button" variant="body2" onClick={handleOpenFullEditor}>
            Open the full recipe editor
          </Link>
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? <CircularProgress size={20} /> : 'Save ingredients'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickIngredientEntryDialog;

// Made with Bob

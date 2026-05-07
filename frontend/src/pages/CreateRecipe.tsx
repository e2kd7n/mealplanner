/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  Alert,
  CircularProgress,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Save as SaveIcon,
  TextFields as TextFieldsIcon,
  FormatListNumbered as FormatListNumberedIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface InstructionStep {
  step: number;
  instruction: string;
}

interface RecipeFormData {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert')[];
  cuisineType: string;
  kidFriendly: boolean;
  isPublic: boolean;
  imageUrl: string;
  costEstimate: number;
  ingredients: RecipeIngredient[];
  instructions: InstructionStep[];
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
}

const steps = ['Basic Info', 'Ingredients', 'Instructions', 'Review'];

const cuisineTypes = [
  'American',
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Indian',
  'Thai',
  'French',
  'Mediterranean',
  'Greek',
  'Korean',
  'Vietnamese',
  'Other',
];

export default function CreateRecipe() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [instructionMode, setInstructionMode] = useState<'bulk' | 'manual'>('bulk');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkInstructions, setBulkInstructions] = useState('');
  
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'medium',
    mealTypes: ['dinner'],
    cuisineType: '',
    kidFriendly: false,
    isPublic: false,
    imageUrl: '',
    costEstimate: 0,
    ingredients: [],
    instructions: [{ step: 1, instruction: '' }],
    nutritionInfo: {},
  });

  // New ingredient form state
  const [newIngredient, setNewIngredient] = useState({
    ingredientId: '',
    ingredientName: '',
    quantity: 1,
    unit: '',
    notes: '',
  });

  useEffect(() => {
    loadIngredients();
    if (isEditMode && id) {
      loadRecipe(id);
    }
  }, [id, isEditMode]);

  const loadRecipe = async (recipeId: string) => {
    try {
      setInitialLoading(true);
      const response = await api.get(`/recipes/${recipeId}`);
      const recipe = response.data;

      // Transform recipe data to form format
      const ingredients = recipe.ingredients?.map((ri: any) => ({
        ingredientId: ri.ingredient.id,
        ingredientName: ri.ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
        notes: ri.notes || '',
      })) || [];

      const instructions = Array.isArray(recipe.instructions)
        ? recipe.instructions.map((inst: any, index: number) => ({
            step: index + 1,
            instruction: typeof inst === 'string' ? inst : inst.instruction || inst.text || '',
          }))
        : [{ step: 1, instruction: '' }];

      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        prepTime: recipe.prepTime || 15,
        cookTime: recipe.cookTime || 30,
        servings: recipe.servings || 4,
        difficulty: recipe.difficulty || 'medium',
        mealTypes: recipe.mealTypes || ['dinner'],
        cuisineType: recipe.cuisineType || '',
        kidFriendly: recipe.kidFriendly || false,
        isPublic: recipe.isPublic || false,
        imageUrl: recipe.imageUrl || '',
        costEstimate: recipe.costEstimate || 0,
        ingredients,
        instructions,
        nutritionInfo: recipe.nutritionInfo || {},
      });
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Failed to load recipe:', err);
      setError('Failed to load recipe for editing');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadIngredients = async () => {
    try {
      const response = await api.get('/ingredients');
      // Handle both direct array and nested data structure
      const ingredients = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setAvailableIngredients(ingredients);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to load ingredients:', err);
      setAvailableIngredients([]); // Set empty array on error
    }
  };

  const handleNext = () => {
    // Validate current step
    if (activeStep === 0 && !validateBasicInfo()) {
      return;
    }
    if (activeStep === 1 && formData.ingredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }
    if (activeStep === 2 && !validateInstructions()) {
      return;
    }
    
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateBasicInfo = () => {
    if (!formData.title.trim()) {
      setError('Recipe title is required');
      return false;
    }
    if (formData.prepTime < 0 || formData.cookTime < 0) {
      setError('Time values must be positive');
      return false;
    }
    if (formData.servings < 1) {
      setError('Servings must be at least 1');
      return false;
    }
    return true;
  };

  const validateInstructions = () => {
    const hasInstructions = formData.instructions.some(
      (inst) => inst.instruction.trim() !== ''
    );
    if (!hasInstructions) {
      setError('Please add at least one instruction step');
      return false;
    }
    return true;
  };

  const handleAddIngredient = () => {
    // Clear any previous errors
    setError('');
    
    // Validate ingredient name
    if (!newIngredient.ingredientName || newIngredient.ingredientName.trim() === '') {
      setError('Please enter an ingredient name');
      return;
    }

    // Validate quantity
    if (!newIngredient.quantity || newIngredient.quantity <= 0) {
      setError('Please enter a valid quantity greater than 0');
      return;
    }

    // Validate unit
    if (!newIngredient.unit || newIngredient.unit.trim() === '') {
      setError('Please enter a unit (e.g., cups, oz, grams)');
      return;
    }

    // Check if ingredient exists
    const existingIngredient = availableIngredients.find(
      (ing) => ing.id === newIngredient.ingredientId
    );

    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        {
          ingredientId: existingIngredient?.id || '', // Empty if new ingredient
          ingredientName: newIngredient.ingredientName.trim(),
          quantity: newIngredient.quantity,
          unit: newIngredient.unit.trim(),
          notes: newIngredient.notes?.trim() || '',
        },
      ],
    });

    // Reset form
    setNewIngredient({
      ingredientId: '',
      ingredientName: '',
      quantity: 1,
      unit: '',
      notes: '',
    });
    setError('');
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleAddInstructionStep = () => {
    setFormData({
      ...formData,
      instructions: [
        ...formData.instructions,
        { step: formData.instructions.length + 1, instruction: '' },
      ],
    });
  };

  const handleUpdateInstruction = (index: number, value: string) => {
    const updated = [...formData.instructions];
    updated[index].instruction = value;
    setFormData({ ...formData, instructions: updated });
  };

  const handleRemoveInstruction = (index: number) => {
    const updated = formData.instructions
      .filter((_, i) => i !== index)
      .map((inst, i) => ({ ...inst, step: i + 1 }));
    setFormData({ ...formData, instructions: updated });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Prepare data for API
      const recipeData = {
        title: formData.title,
        description: formData.description,
        prepTime: formData.prepTime,
        cookTime: formData.cookTime,
        servings: formData.servings,
        difficulty: formData.difficulty,
        mealTypes: formData.mealTypes,
        cuisineType: formData.cuisineType || null,
        kidFriendly: formData.kidFriendly,
        isPublic: formData.isPublic,
        imageUrl: formData.imageUrl || null,
        costEstimate: formData.costEstimate || null,
        source: 'custom',
        instructions: formData.instructions.filter((inst) => inst.instruction.trim()),
        nutritionInfo: Object.keys(formData.nutritionInfo || {}).length > 0
          ? formData.nutritionInfo
          : null,
        ingredients: formData.ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes || null,
        })),
      };

      let response;
      if (isEditMode && id) {
        // Update existing recipe
        response = await api.put(`/recipes/${id}`, recipeData);
        setSuccess('Recipe updated successfully!');
      } else {
        // Create new recipe
        response = await api.post('/recipes', recipeData);
        setSuccess('Recipe created successfully!');
      }
      
      // Get recipe ID from response
      const recipeId = response.data?.id || response.data?.data?.id || id;
      
      if (!recipeId) {
        if (import.meta.env.DEV) console.error('No recipe ID in response:', response.data);
        setError('Recipe saved but unable to navigate to detail page');
        return;
      }
      
      // Redirect to recipe detail page after a short delay
      setTimeout(() => {
        navigate(`/recipes/${recipeId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} recipe`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    try {
      setUploadingImage(true);
      setError('');

      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data?.data?.imageUrl || response.data?.imageUrl;
      if (imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl }));
        setSuccess('Image uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const renderBasicInfo = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          required
          label="Recipe Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Grandma's Chocolate Chip Cookies"
        />
      </Grid>
      
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of your recipe..."
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          fullWidth
          required
          type="number"
          label="Prep Time (minutes)"
          value={formData.prepTime}
          onChange={(e) => {
            const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
            setFormData({ ...formData, prepTime: isNaN(value) ? 0 : value });
          }}
          onFocus={(e) => e.target.select()}
          inputProps={{ min: 0 }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          fullWidth
          required
          type="number"
          label="Cook Time (minutes)"
          value={formData.cookTime}
          onChange={(e) => {
            const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
            setFormData({ ...formData, cookTime: isNaN(value) ? 0 : value });
          }}
          onFocus={(e) => e.target.select()}
          inputProps={{ min: 0 }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          fullWidth
          required
          type="number"
          label="Servings"
          value={formData.servings}
          onChange={(e) => {
            const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
            setFormData({ ...formData, servings: isNaN(value) ? 1 : value });
          }}
          onFocus={(e) => e.target.select()}
          inputProps={{ min: 1 }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          required
          select
          label="Difficulty"
          value={formData.difficulty}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
        >
          <MenuItem value="easy">Easy</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="hard">Hard</MenuItem>
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Autocomplete
          multiple
          options={['breakfast', 'lunch', 'dinner', 'snack', 'dessert']}
          value={formData.mealTypes}
          onChange={(_, value) => setFormData({ ...formData, mealTypes: value as ('breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert')[] })}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Meal Types"
              required
              error={formData.mealTypes.length === 0}
              helperText={formData.mealTypes.length === 0 ? 'Select at least one meal type' : ''}
            />
          )}
          getOptionLabel={(option) => option.charAt(0).toUpperCase() + option.slice(1)}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Autocomplete
          freeSolo
          options={cuisineTypes}
          value={formData.cuisineType}
          onChange={(_, value) => setFormData({ ...formData, cuisineType: value || '' })}
          renderInput={(params) => (
            <TextField {...params} label="Cuisine Type" placeholder="Select or type..." />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          type="number"
          label="Estimated Cost ($)"
          value={formData.costEstimate}
          onChange={(e) => setFormData({ ...formData, costEstimate: parseFloat(e.target.value) || 0 })}
          inputProps={{ min: 0, step: 0.01 }}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            label="Image URL"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg or upload an image"
            helperText="Enter a URL or upload an image file"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
          <Button
            variant="outlined"
            startIcon={uploadingImage ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            onClick={handleImageUploadClick}
            disabled={uploadingImage}
            sx={{ minWidth: '140px', height: '56px' }}
          >
            {uploadingImage ? 'Uploading...' : 'Upload'}
          </Button>
        </Box>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.kidFriendly}
              onChange={(e) => setFormData({ ...formData, kidFriendly: e.target.checked })}
            />
          }
          label="Kid Friendly"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            />
          }
          label="Make Public (visible to all users)"
        />
      </Grid>
    </Grid>
  );

  const renderIngredients = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Add Ingredients
        </Typography>
        <Chip
          label={`For ${formData.servings} serving${formData.servings !== 1 ? 's' : ''}`}
          color="primary"
          variant="outlined"
          size="small"
        />
      </Box>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        💡 <strong>Tip:</strong> Enter ingredient quantities for {formData.servings} serving{formData.servings !== 1 ? 's' : ''}.
        Quantities will automatically scale when users adjust servings in the recipe view.
      </Alert>
      
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <Autocomplete
            freeSolo
            options={availableIngredients}
            getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
            value={newIngredient.ingredientName || null}
            onChange={(_, value) => {
              if (typeof value === 'string') {
                // User typed a new ingredient name
                setNewIngredient({
                  ...newIngredient,
                  ingredientId: '', // Will be created on save
                  ingredientName: value,
                  unit: newIngredient.unit || 'unit',
                });
              } else if (value) {
                // User selected existing ingredient
                setNewIngredient({
                  ...newIngredient,
                  ingredientId: value.id,
                  ingredientName: value.name,
                  unit: value.unit || '',
                });
              }
            }}
            onInputChange={(_, value) => {
              // Update ingredient name as user types
              if (value) {
                setNewIngredient({
                  ...newIngredient,
                  ingredientName: value,
                });
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Ingredient"
                placeholder="Search or type new ingredient..."
                helperText="Select existing or type new ingredient name"
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            fullWidth
            type="number"
            label="Quantity"
            value={newIngredient.quantity}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
              setNewIngredient({ ...newIngredient, quantity: isNaN(value) ? 0 : value });
            }}
            onFocus={(e) => e.target.select()}
            inputProps={{ min: 0, step: 0.25 }}
            helperText="0.5 = ½, 0.25 = ¼"
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            fullWidth
            label="Unit"
            value={newIngredient.unit}
            onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
            placeholder="cup, tbsp, oz..."
            helperText="Singular form"
          />
        </Grid>

        <Grid size={{ xs: 10, sm: 2 }}>
          <TextField
            fullWidth
            label="Notes (optional)"
            value={newIngredient.notes}
            onChange={(e) => setNewIngredient({ ...newIngredient, notes: e.target.value })}
            placeholder="e.g., chopped, diced"
          />
        </Grid>

        <Grid size={{ xs: 2, sm: 1 }}>
          <IconButton
            color="primary"
            onClick={handleAddIngredient}
            sx={{ mt: 1 }}
          >
            <AddIcon />
          </IconButton>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom>
        Ingredients List ({formData.ingredients.length})
      </Typography>
      
      {formData.ingredients.length === 0 ? (
        <Alert severity="info">No ingredients added yet. Add at least one ingredient to continue.</Alert>
      ) : (
        <List>
          {formData.ingredients.map((ingredient, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={`${ingredient.quantity} ${ingredient.unit} ${ingredient.ingredientName}`}
                secondary={ingredient.notes}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleRemoveIngredient(index)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  const parseBulkInstructions = (text: string): InstructionStep[] => {
    if (!text.trim()) return [{ step: 1, instruction: '' }];
    
    // Split by newlines and filter empty lines
    const lines = text.split('\n').filter(line => line.trim());
    
    // Try to detect if it's a numbered list
    const numberedPattern = /^\d+[\.\)]\s*/;
    const bulletPattern = /^[-•*]\s*/;
    
    const steps: InstructionStep[] = [];
    
    lines.forEach((line, index) => {
      let instruction = line.trim();
      
      // Remove numbering or bullets
      instruction = instruction.replace(numberedPattern, '');
      instruction = instruction.replace(bulletPattern, '');
      
      if (instruction) {
        steps.push({
          step: index + 1,
          instruction: instruction
        });
      }
    });
    
    return steps.length > 0 ? steps : [{ step: 1, instruction: '' }];
  };

  const handleApplyBulkInstructions = () => {
    const parsed = parseBulkInstructions(bulkInstructions);
    setFormData({ ...formData, instructions: parsed });
    setError('');
  };

  const handleInstructionModeChange = (_: React.MouseEvent<HTMLElement>, newMode: 'bulk' | 'manual' | null) => {
    if (newMode !== null) {
      if (newMode === 'bulk') {
        // Convert current instructions to bulk text
        const bulkText = formData.instructions
          .filter(inst => inst.instruction.trim())
          .map(inst => inst.instruction)
          .join('\n');
        setBulkInstructions(bulkText);
      }
      setInstructionMode(newMode);
    }
  };

  const renderInstructions = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Cooking Instructions
        </Typography>
        <ToggleButtonGroup
          value={instructionMode}
          exclusive
          onChange={handleInstructionModeChange}
          size="small"
        >
          <ToggleButton value="bulk">
            <TextFieldsIcon sx={{ mr: 0.5 }} />
            Bulk Text
          </ToggleButton>
          <ToggleButton value="manual">
            <FormatListNumberedIcon sx={{ mr: 0.5 }} />
            Step-by-Step
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {instructionMode === 'bulk' ? (
        <Box>
          <TextField
            fullWidth
            multiline
            rows={12}
            value={bulkInstructions}
            onChange={(e) => setBulkInstructions(e.target.value)}
            placeholder="Paste or type instructions here. Each line will become a step.&#10;&#10;Supports:&#10;1. Numbered lists (1. 2. 3.)&#10;• Bullet points&#10;- Dashes&#10;Or plain paragraphs"
            helperText="Tip: Paste recipe instructions from any source. We'll automatically parse them into steps."
          />
          <Button
            variant="contained"
            onClick={handleApplyBulkInstructions}
            sx={{ mt: 2 }}
            disabled={!bulkInstructions.trim()}
          >
            Apply Instructions ({parseBulkInstructions(bulkInstructions).length} steps detected)
          </Button>
        </Box>
      ) : (
        <>
          {formData.instructions.map((instruction, index) => (
        <Box key={index} mb={2}>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid size={{ xs: 11 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={`Step ${instruction.step}`}
                value={instruction.instruction}
                onChange={(e) => handleUpdateInstruction(index, e.target.value)}
                placeholder="Describe this step..."
              />
            </Grid>
            <Grid size={{ xs: 1 }}>
              {formData.instructions.length > 1 && (
                <IconButton
                  color="error"
                  onClick={() => handleRemoveInstruction(index)}
                  sx={{ mt: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Grid>
          </Grid>
        </Box>
      ))}

          <Button
            startIcon={<AddIcon />}
            onClick={handleAddInstructionStep}
            variant="outlined"
          >
            Add Step
          </Button>
        </>
      )}

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Nutrition Information (Optional)
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Calories"
              value={formData.nutritionInfo?.calories || ''}
              onChange={(e) => setFormData({
                ...formData,
                nutritionInfo: { ...formData.nutritionInfo, calories: parseInt(e.target.value) || undefined }
              })}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Protein (g)"
              value={formData.nutritionInfo?.protein || ''}
              onChange={(e) => setFormData({
                ...formData,
                nutritionInfo: { ...formData.nutritionInfo, protein: parseInt(e.target.value) || undefined }
              })}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Carbs (g)"
              value={formData.nutritionInfo?.carbs || ''}
              onChange={(e) => setFormData({
                ...formData,
                nutritionInfo: { ...formData.nutritionInfo, carbs: parseInt(e.target.value) || undefined }
              })}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Fat (g)"
              value={formData.nutritionInfo?.fat || ''}
              onChange={(e) => setFormData({
                ...formData,
                nutritionInfo: { ...formData.nutritionInfo, fat: parseInt(e.target.value) || undefined }
              })}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Fiber (g)"
              value={formData.nutritionInfo?.fiber || ''}
              onChange={(e) => setFormData({
                ...formData,
                nutritionInfo: { ...formData.nutritionInfo, fiber: parseInt(e.target.value) || undefined }
              })}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  const renderReview = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Recipe
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {formData.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {formData.description}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip label={`${formData.prepTime + formData.cookTime} min total`} size="small" />
            <Chip label={`${formData.servings} servings`} size="small" />
            <Chip label={formData.difficulty} size="small" color="primary" />
            {formData.mealTypes.map((mt) => (
              <Chip key={mt} label={mt.charAt(0).toUpperCase() + mt.slice(1)} size="small" />
            ))}
            {formData.kidFriendly && <Chip label="Kid Friendly" size="small" color="success" />}
            {formData.isPublic && <Chip label="Public" size="small" color="info" />}
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" gutterBottom>
            Ingredients ({formData.ingredients.length})
          </Typography>
          <List dense>
            {formData.ingredients.map((ing, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${ing.quantity} ${ing.unit} ${ing.ingredientName}`}
                  secondary={ing.notes}
                />
              </ListItem>
            ))}
          </List>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" gutterBottom>
            Instructions ({formData.instructions.filter(i => i.instruction.trim()).length} steps)
          </Typography>
          <List dense>
            {formData.instructions
              .filter((inst) => inst.instruction.trim())
              .map((inst, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`Step ${inst.step}`}
                    secondary={inst.instruction}
                  />
                </ListItem>
              ))}
          </List>
        </Grid>
      </Grid>
    </Box>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderIngredients();
      case 2:
        return renderInstructions();
      case 3:
        return renderReview();
      default:
        return 'Unknown step';
    }
  };

  // Show loading state while fetching recipe data in edit mode
  if (initialLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/recipes')}
        sx={{ mb: 2 }}
      >
        Back to Recipes
      </Button>
      
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Edit Recipe' : 'Create New Recipe'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEditMode ? 'Update your recipe details' : 'Share your favorite recipe with the community'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box mb={4}>{getStepContent(activeStep)}</Box>

        <Box display="flex" justifyContent="space-between">
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<BackIcon />}
          >
            Back
          </Button>

          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Recipe' : 'Create Recipe')}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ForwardIcon />}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

// Made with Bob

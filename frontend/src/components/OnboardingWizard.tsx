/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Chip,
  Stack,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Restaurant as RestaurantIcon,
  People as PeopleIcon,
  Favorite as FavoriteIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DIETARY_PREFERENCES, COMMON_ALLERGENS, getDietaryLabel } from '../constants/dietaryOptions';

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  householdSize: number;
  dietaryPreferences: string[];
  cuisinePreferences: string[];
  cookingSkillLevel: string;
  weeklyBudget: string;
  completed: boolean;
}

const CUISINE_OPTIONS = [
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Indian',
  'Thai',
  'Mediterranean',
  'American',
  'French',
  'Korean',
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ open, onClose, onComplete }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(false);
  
  // Form state
  const [householdSize, setHouseholdSize] = useState<number>(2);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);
  const [cookingSkillLevel, setCookingSkillLevel] = useState<string>('intermediate');
  const [weeklyBudget, setWeeklyBudget] = useState<string>('moderate');

  const steps = [
    'Welcome',
    'Household',
    'Dietary Preferences',
    'Cuisine Preferences',
    'Cooking Profile',
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSkip = () => {
    setSkipped(true);
    const data: OnboardingData = {
      householdSize: 2,
      dietaryPreferences: [],
      cuisinePreferences: [],
      cookingSkillLevel: 'intermediate',
      weeklyBudget: 'moderate',
      completed: false,
    };
    onComplete(data);
    onClose();
  };

  const handleComplete = () => {
    const data: OnboardingData = {
      householdSize,
      dietaryPreferences,
      cuisinePreferences,
      cookingSkillLevel,
      weeklyBudget,
      completed: true,
    };
    onComplete(data);
    onClose();
    navigate('/dashboard');
  };

  const toggleDietaryPreference = (pref: string) => {
    setDietaryPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const toggleCuisinePreference = (cuisine: string) => {
    setCuisinePreferences((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <RestaurantIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom>
              Welcome to Meal Planner!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              Let's personalize your experience in just a few quick steps. This will help us provide better recipe recommendations and meal planning suggestions.
            </Typography>
            <Alert severity="info" sx={{ maxWidth: 500, mx: 'auto' }}>
              This should take less than 2 minutes. You can skip or update these preferences anytime.
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PeopleIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
              <Box>
                <Typography variant="h5" gutterBottom>
                  Household Size
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  How many people are you cooking for?
                </Typography>
              </Box>
            </Box>
            <TextField
              fullWidth
              type="number"
              label="Number of people"
              value={householdSize}
              onChange={(e) => setHouseholdSize(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, max: 20 }}
              helperText="This helps us suggest appropriate serving sizes"
              sx={{ mb: 3 }}
            />
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  💡 <strong>Tip:</strong> You can add individual family members later in your profile to track dietary restrictions and preferences for each person.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FavoriteIcon sx={{ mr: 2, color: 'error.main', fontSize: 40 }} />
              <Box>
                <Typography variant="h5" gutterBottom>
                  Dietary Preferences & Allergens
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select any dietary restrictions, preferences, or allergens (optional)
                </Typography>
              </Box>
            </Box>
            
            {/* Dietary Preferences Section */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
              Dietary Preferences
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {DIETARY_PREFERENCES.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  onClick={() => toggleDietaryPreference(option)}
                  color={dietaryPreferences.includes(option) ? 'primary' : 'default'}
                  variant={dietaryPreferences.includes(option) ? 'filled' : 'outlined'}
                  icon={dietaryPreferences.includes(option) ? <CheckCircleIcon /> : undefined}
                />
              ))}
            </Box>

            {/* Allergens Section */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 600, color: 'error.main' }}>
              ⚠️ Food Allergens
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {COMMON_ALLERGENS.map((option) => (
                <Chip
                  key={option}
                  label={getDietaryLabel(option)}
                  onClick={() => toggleDietaryPreference(option)}
                  color={dietaryPreferences.includes(option) ? 'error' : 'default'}
                  variant={dietaryPreferences.includes(option) ? 'filled' : 'outlined'}
                  icon={dietaryPreferences.includes(option) ? <CheckCircleIcon /> : undefined}
                />
              ))}
            </Box>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>Important:</strong> Allergen selections will trigger warnings when recipes contain these ingredients.
            </Alert>
            
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  💡 <strong>Tip:</strong> We'll filter recipes to match your dietary needs and highlight potential allergens.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <RestaurantIcon sx={{ mr: 2, color: 'success.main', fontSize: 40 }} />
              <Box>
                <Typography variant="h5" gutterBottom>
                  Cuisine Preferences
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  What types of cuisine do you enjoy? (optional)
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {CUISINE_OPTIONS.map((cuisine) => (
                <Chip
                  key={cuisine}
                  label={cuisine}
                  onClick={() => toggleCuisinePreference(cuisine)}
                  color={cuisinePreferences.includes(cuisine) ? 'primary' : 'default'}
                  variant={cuisinePreferences.includes(cuisine) ? 'filled' : 'outlined'}
                  icon={cuisinePreferences.includes(cuisine) ? <CheckCircleIcon /> : undefined}
                />
              ))}
            </Box>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  💡 <strong>Tip:</strong> We'll prioritize recipes from your favorite cuisines in recommendations.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Cooking Profile
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 4, width: '100%' }}>
              <FormLabel component="legend" sx={{ mb: 2 }}>
                What's your cooking skill level?
              </FormLabel>
              <RadioGroup
                value={cookingSkillLevel}
                onChange={(e) => setCookingSkillLevel(e.target.value)}
              >
                <FormControlLabel
                  value="beginner"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Beginner</Typography>
                      <Typography variant="caption" color="text.secondary">
                        I'm just starting out and prefer simple recipes
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="intermediate"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Intermediate</Typography>
                      <Typography variant="caption" color="text.secondary">
                        I'm comfortable with most cooking techniques
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="advanced"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Advanced</Typography>
                      <Typography variant="caption" color="text.secondary">
                        I enjoy complex recipes and new challenges
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <FormLabel component="legend" sx={{ mb: 2 }}>
                What's your typical weekly grocery budget?
              </FormLabel>
              <RadioGroup
                value={weeklyBudget}
                onChange={(e) => setWeeklyBudget(e.target.value)}
              >
                <FormControlLabel
                  value="budget"
                  control={<Radio />}
                  label="Budget-friendly (under $100/week)"
                />
                <FormControlLabel
                  value="moderate"
                  control={<Radio />}
                  label="Moderate ($100-200/week)"
                />
                <FormControlLabel
                  value="flexible"
                  control={<Radio />}
                  label="Flexible (over $200/week)"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        );

      default:
        return null;
    }
  };

  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={handleSkip}
          sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
          aria-label="Skip onboarding"
        >
          <CloseIcon />
        </IconButton>
        
        <LinearProgress variant="determinate" value={progress} sx={{ height: 6 }} />
        
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 400 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 4 }}>
            <Button
              onClick={handleSkip}
              variant="text"
              color="inherit"
            >
              Skip for now
            </Button>
            
            <Stack direction="row" spacing={2}>
              {activeStep > 0 && (
                <Button
                  onClick={handleBack}
                  startIcon={<ArrowBackIcon />}
                  variant="outlined"
                >
                  Back
                </Button>
              )}
              
              {activeStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                  variant="contained"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  endIcon={<CheckCircleIcon />}
                  variant="contained"
                  color="success"
                >
                  Complete Setup
                </Button>
              )}
            </Stack>
          </Stack>
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default OnboardingWizard;

// Made with Bob

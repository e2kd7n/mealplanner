/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
  Chip,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import api, { familyMemberAPI, visualAuthAPI, userAPI } from '../services/api';
import { getApiErrorMessage } from '../utils/errorHandler';
import { DIETARY_PREFERENCES, COMMON_ALLERGENS, getDietaryLabel } from '../constants/dietaryOptions';

const STEPS = ['Welcome', 'Family', 'Preferences', 'API Key', 'Done'];
const STEPS_SHORT = ['Welcome', 'Family', 'Prefs', 'API', 'Done'];

const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian',
  'Thai', 'Mediterranean', 'American', 'French', 'Korean',
];

interface PendingMember {
  name: string;
  ageGroup: 'adult' | 'teen' | 'child';
}

interface StockImage {
  id: string;
  title: string;
  imageUrl: string;
}

interface SavedMember {
  id: string;
  name: string;
  visualPasswordImageUrl?: string;
}

export default function Setup() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);

  // Family members step
  const [members, setMembers] = useState<PendingMember[]>([]);
  const [savedMembers, setSavedMembers] = useState<SavedMember[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberAgeGroup, setMemberAgeGroup] = useState<'adult' | 'teen' | 'child'>('adult');
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [stockImages, setStockImages] = useState<StockImage[]>([]);
  const [assigningMemberId, setAssigningMemberId] = useState<string | null>(null);

  // Preferences step
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);
  const [cookingSkillLevel, setCookingSkillLevel] = useState('intermediate');
  const [weeklyBudget, setWeeklyBudget] = useState('moderate');

  // Spoonacular step
  const [spoonacularKey, setSpoonacularKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'valid' | 'invalid' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    visualAuthAPI.getStockImages()
      .then((res) => setStockImages(res.data.images ?? []))
      .catch(() => {});
  }, []);

  const handleAddMember = () => {
    const trimmed = memberName.trim();
    if (!trimmed) return;
    setMembers((prev) => [...prev, { name: trimmed, ageGroup: memberAgeGroup }]);
    setMemberName('');
    setMemberAgeGroup('adult');
  };

  const handleRemoveMember = (idx: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveMembers = async () => {
    if (members.length === 0 && savedMembers.length === 0) {
      setActiveStep(2);
      return;
    }
    if (members.length === 0) {
      setActiveStep(2);
      return;
    }

    setMembersLoading(true);
    setMembersError('');

    const results = await Promise.allSettled(
      members.map((m) =>
        familyMemberAPI.create({
          name: m.name,
          ageGroup: m.ageGroup,
          dietaryRestrictions: [],
        })
      )
    );

    const newSaved: SavedMember[] = [];
    const failed: string[] = [];

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        const data = result.value.data;
        newSaved.push({ id: data.id, name: data.name ?? members[i].name });
      } else {
        failed.push(members[i].name);
      }
    });

    setSavedMembers((prev) => [...prev, ...newSaved]);
    setMembers(failed.map((name) => ({ name, ageGroup: 'adult' as const })));

    if (failed.length > 0) {
      setMembersError(`Could not save: ${failed.join(', ')}. You can retry or skip.`);
    } else {
      if (stockImages.length > 0 && newSaved.length > 0) {
        setAssigningMemberId(newSaved[0].id);
      } else {
        setActiveStep(2);
      }
    }

    setMembersLoading(false);
  };

  const handleAssignVisualPassword = async (memberId: string, imageUrl: string) => {
    try {
      await visualAuthAPI.setupStockVisualPassword(memberId, imageUrl);
      setSavedMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, visualPasswordImageUrl: imageUrl } : m))
      );
    } catch {
      // Non-fatal — they can set it up later
    }

    // Move to next unassigned member or advance to next step
    const unassigned = savedMembers.filter(
      (m) => m.id !== memberId && !m.visualPasswordImageUrl
    );
    if (unassigned.length > 0) {
      setAssigningMemberId(unassigned[0].id);
    } else {
      setAssigningMemberId(null);
      setActiveStep(2);
    }
  };

  const handleSkipVisualPassword = () => {
    const current = savedMembers.find((m) => m.id === assigningMemberId);
    const remaining = savedMembers.filter(
      (m) => m.id !== assigningMemberId && !m.visualPasswordImageUrl
    );
    if (remaining.length > 0) {
      setAssigningMemberId(remaining[0].id);
    } else {
      setAssigningMemberId(null);
      setActiveStep(2);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const budgetMap: Record<string, number> = { budget: 75, moderate: 150, flexible: 250 };
      await userAPI.updatePreferences({
        dietaryRestrictions: dietaryPreferences,
        cookingSkillLevel,
        preferredCuisines: cuisinePreferences,
        weeklyBudget: budgetMap[weeklyBudget] ?? 150,
      });
    } catch {
      // Non-fatal — they can update from Profile
    } finally {
      setSaving(false);
    }
    setActiveStep(3);
  };

  const handleTestKey = async () => {
    if (!spoonacularKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    setTestMessage('');
    try {
      await api.post('/setup/test/spoonacular', { key: spoonacularKey.trim() });
      setTestResult('valid');
      setTestMessage('API key verified successfully.');
    } catch (err: unknown) {
      setTestResult('invalid');
      setTestMessage(getApiErrorMessage(err, 'Could not verify key.'));
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    setSaveError('');
    try {
      if (spoonacularKey.trim()) {
        await api.put('/admin/settings/spoonacular_api_key', { value: spoonacularKey.trim() });
      }
      await api.put('/admin/settings/ftue_completed', { value: 'true' });
      localStorage.setItem('onboardingCompleted', 'true');
      setActiveStep(4);
    } catch (err: unknown) {
      setSaveError(getApiErrorMessage(err, 'Failed to save settings.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings/ftue_completed', { value: 'true' });
      localStorage.setItem('onboardingCompleted', 'true');
    } catch {
      // Proceed anyway
    } finally {
      setSaving(false);
    }
    setActiveStep(4);
  };

  const handleBack = () => {
    if (assigningMemberId) {
      setAssigningMemberId(null);
      return;
    }
    setActiveStep((s) => Math.max(0, s - 1));
  };

  const stepLabels = isMobile ? STEPS_SHORT : STEPS;
  const currentMemberName = savedMembers.find((m) => m.id === assigningMemberId)?.name;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }} elevation={3}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Family Meal Planner
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Let's get a few things set up before you dive in.
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} alternativeLabel={isMobile} sx={{ mb: 4 }}>
            {stepLabels.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 0: Welcome */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Welcome!
              </Typography>
              <Typography color="text.secondary" paragraph>
                This wizard will walk you through setting up your family, preferences,
                and optional integrations.
              </Typography>
              <Typography color="text.secondary">
                You can skip any step and configure it later from settings.
              </Typography>
              <Box mt={4} display="flex" justifyContent="flex-end">
                <Button variant="contained" size="large" onClick={() => setActiveStep(1)}>
                  Get Started
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 1: Family Members */}
          {activeStep === 1 && !assigningMemberId && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Who's in the family?
              </Typography>
              <Typography color="text.secondary" paragraph>
                Add everyone who'll use the app. After saving, you'll pick a login
                image for each person — no passwords needed.
              </Typography>

              {membersError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {membersError}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                  sx={{ flex: 1 }}
                  size="small"
                />
                <TextField
                  select
                  label="Age"
                  value={memberAgeGroup}
                  onChange={(e) => setMemberAgeGroup(e.target.value as 'adult' | 'teen' | 'child')}
                  sx={{ width: 110 }}
                  size="small"
                >
                  <MenuItem value="adult">Adult</MenuItem>
                  <MenuItem value="teen">Teen</MenuItem>
                  <MenuItem value="child">Child</MenuItem>
                </TextField>
                <Button
                  variant="outlined"
                  onClick={handleAddMember}
                  disabled={!memberName.trim()}
                  sx={{ whiteSpace: 'nowrap', minWidth: 0, px: 1.5 }}
                  startIcon={<PersonAddIcon />}
                >
                  Add
                </Button>
              </Box>

              {members.length > 0 && (
                <List dense sx={{ mb: 2, borderRadius: 1, border: 1, borderColor: 'divider' }}>
                  {members.map((m, i) => (
                    <ListItem key={i} divider={i < members.length - 1}>
                      <ListItemText
                        primary={m.name}
                        secondary={m.ageGroup.charAt(0).toUpperCase() + m.ageGroup.slice(1)}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" size="small" onClick={() => handleRemoveMember(i)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              {savedMembers.length > 0 && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Saved: {savedMembers.map((m) => m.name).join(', ')}
                  {savedMembers.some((m) => m.visualPasswordImageUrl) && ' (with visual login)'}
                </Alert>
              )}

              <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
                <Button variant="text" color="inherit" onClick={handleBack}>
                  Back
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="text"
                    color="inherit"
                    onClick={() => setActiveStep(2)}
                    disabled={membersLoading}
                  >
                    Skip
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSaveMembers}
                    disabled={membersLoading}
                    startIcon={membersLoading ? <CircularProgress size={16} /> : undefined}
                  >
                    {membersLoading ? 'Saving…' : members.length > 0 ? 'Save & Continue' : 'Continue'}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {/* Step 1b: Visual password picker (shown after members are saved) */}
          {activeStep === 1 && assigningMemberId && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Pick a login image for {currentMemberName}
              </Typography>
              <Typography color="text.secondary" paragraph>
                {currentMemberName} will tap this image to sign in — no password needed.
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 1.5,
                  mb: 3,
                }}
              >
                {stockImages.map((img) => (
                  <Card key={img.id} sx={{ cursor: 'pointer' }}>
                    <CardActionArea onClick={() => handleAssignVisualPassword(assigningMemberId, img.imageUrl)}>
                      <CardMedia
                        component="img"
                        height="80"
                        image={img.imageUrl}
                        alt={img.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ py: 0.5, px: 1 }}>
                        <Typography variant="caption" noWrap>{img.title}</Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Button variant="text" color="inherit" onClick={handleBack} startIcon={<ArrowBackIcon />}>
                  Back
                </Button>
                <Button variant="text" color="inherit" onClick={handleSkipVisualPassword}>
                  Skip for now
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: Preferences */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Your preferences
              </Typography>
              <Typography color="text.secondary" paragraph>
                Help us personalise recipes and meal plans. All optional.
              </Typography>

              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                Dietary Preferences
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {DIETARY_PREFERENCES.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    onClick={() =>
                      setDietaryPreferences((prev) =>
                        prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option]
                      )
                    }
                    color={dietaryPreferences.includes(option) ? 'primary' : 'default'}
                    variant={dietaryPreferences.includes(option) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 600, color: 'error.main' }}>
                Food Allergens
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {COMMON_ALLERGENS.map((option) => (
                  <Chip
                    key={option}
                    label={getDietaryLabel(option)}
                    onClick={() =>
                      setDietaryPreferences((prev) =>
                        prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option]
                      )
                    }
                    color={dietaryPreferences.includes(option) ? 'error' : 'default'}
                    variant={dietaryPreferences.includes(option) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Favourite Cuisines
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {CUISINE_OPTIONS.map((cuisine) => (
                  <Chip
                    key={cuisine}
                    label={cuisine}
                    onClick={() =>
                      setCuisinePreferences((prev) =>
                        prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
                      )
                    }
                    color={cuisinePreferences.includes(cuisine) ? 'primary' : 'default'}
                    variant={cuisinePreferences.includes(cuisine) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>

              <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
                <FormLabel component="legend">Cooking skill level</FormLabel>
                <RadioGroup
                  row
                  value={cookingSkillLevel}
                  onChange={(e) => setCookingSkillLevel(e.target.value)}
                >
                  <FormControlLabel value="beginner" control={<Radio size="small" />} label="Beginner" />
                  <FormControlLabel value="intermediate" control={<Radio size="small" />} label="Intermediate" />
                  <FormControlLabel value="advanced" control={<Radio size="small" />} label="Advanced" />
                </RadioGroup>
              </FormControl>

              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <FormLabel component="legend">Weekly grocery budget</FormLabel>
                <RadioGroup
                  row
                  value={weeklyBudget}
                  onChange={(e) => setWeeklyBudget(e.target.value)}
                >
                  <FormControlLabel value="budget" control={<Radio size="small" />} label="Under $100" />
                  <FormControlLabel value="moderate" control={<Radio size="small" />} label="$100–200" />
                  <FormControlLabel value="flexible" control={<Radio size="small" />} label="Over $200" />
                </RadioGroup>
              </FormControl>

              <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
                <Button variant="text" color="inherit" onClick={handleBack}>
                  Back
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="text" color="inherit" onClick={() => setActiveStep(3)}>
                    Skip
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSavePreferences}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : undefined}
                  >
                    {saving ? 'Saving…' : 'Save & Continue'}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {/* Step 3: Spoonacular API key */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Spoonacular API Key
              </Typography>
              <Typography color="text.secondary" paragraph>
                Spoonacular provides access to a database of 5,000+ recipes with
                nutrition data. A free tier is available with 150 points/day.
              </Typography>
              <Typography color="text.secondary" paragraph>
                Get a free key at{' '}
                <Link
                  href="https://spoonacular.com/food-api/console#Dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  spoonacular.com/food-api
                </Link>
                .
              </Typography>

              <TextField
                label="Spoonacular API Key"
                value={spoonacularKey}
                onChange={(e) => {
                  setSpoonacularKey(e.target.value);
                  setTestResult(null);
                }}
                fullWidth
                type={showKey ? 'text' : 'password'}
                placeholder="Paste your API key here"
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowKey((v) => !v)} edge="end">
                        {showKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {testResult === 'valid' && (
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                  {testMessage}
                </Alert>
              )}
              {testResult === 'invalid' && (
                <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
                  {testMessage}
                </Alert>
              )}
              {saveError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {saveError}
                </Alert>
              )}

              <Box display="flex" gap={1} mb={3}>
                <Button
                  variant="outlined"
                  onClick={handleTestKey}
                  disabled={!spoonacularKey.trim() || testing || saving}
                  startIcon={testing ? <CircularProgress size={16} /> : undefined}
                >
                  {testing ? 'Testing…' : 'Test Key'}
                </Button>
                {testResult === 'valid' && (
                  <Chip label="Key verified" color="success" variant="outlined" />
                )}
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button variant="text" color="inherit" onClick={handleBack}>
                  Back
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="text" color="inherit" onClick={handleSkip} disabled={saving}>
                    Skip for now
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSaveAndContinue}
                    disabled={saving || (!!spoonacularKey.trim() && testResult !== 'valid')}
                    startIcon={saving ? <CircularProgress size={16} /> : undefined}
                  >
                    {saving ? 'Saving…' : 'Save & Continue'}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {/* Step 4: Done */}
          {activeStep === 4 && (
            <Box textAlign="center">
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                You're all set!
              </Typography>
              <Typography color="text.secondary" paragraph>
                Setup is complete. You can update preferences and API keys any time
                from the <strong>Profile</strong> and <strong>Admin</strong> pages.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/dashboard')}
                sx={{ mt: 2 }}
              >
                Go to Dashboard
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

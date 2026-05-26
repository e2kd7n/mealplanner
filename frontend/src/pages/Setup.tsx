/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { useState } from 'react';
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
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { familyMemberAPI } from '../services/api';
import { getApiErrorMessage } from '../utils/errorHandler';

const STEPS = ['Welcome', 'Family Members', 'Recipe API Key', 'Done'];

interface PendingMember {
  name: string;
  ageGroup: 'adult' | 'teen' | 'child';
}

export default function Setup() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  // Family members step
  const [members, setMembers] = useState<PendingMember[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberAgeGroup, setMemberAgeGroup] = useState<'adult' | 'teen' | 'child'>('adult');
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');

  // Spoonacular step
  const [spoonacularKey, setSpoonacularKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'valid' | 'invalid' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

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
    if (members.length === 0) {
      setActiveStep(2);
      return;
    }
    setMembersLoading(true);
    setMembersError('');
    try {
      await Promise.all(
        members.map((m) =>
          familyMemberAPI.create({
            name: m.name,
            ageGroup: m.ageGroup,
            dietaryRestrictions: [],
          })
        )
      );
      setActiveStep(2);
    } catch {
      setMembersError('Some members could not be saved. You can add them later from Profile.');
      setActiveStep(2);
    } finally {
      setMembersLoading(false);
    }
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
      setActiveStep(3);
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
    } catch {
      // Proceed anyway
    } finally {
      setSaving(false);
    }
    setActiveStep(3);
  };

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
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Family Meal Planner
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Let's get a few things set up before you dive in.
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 5 }}>
            {STEPS.map((label) => (
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
                This wizard will help you connect optional external services that
                unlock additional features.
              </Typography>
              <Typography color="text.secondary" paragraph>
                The only optional integration right now is{' '}
                <strong>Spoonacular</strong>, which powers the{' '}
                <em>Browse Recipes</em> feature — letting you search millions of
                recipes by ingredient, cuisine, or diet.
              </Typography>
              <Typography color="text.secondary">
                You can skip any step and configure it later from the{' '}
                <strong>Admin → API Keys</strong> page.
              </Typography>
              <Box mt={4} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setActiveStep(1)}
                >
                  Get Started →
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 1: Family Members */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Who's in the family?
              </Typography>
              <Typography color="text.secondary" paragraph>
                Add everyone who'll use the app. They'll log in by tapping their name and
                picking their secret image — no password needed.
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

              <Alert severity="info" sx={{ mb: 3 }}>
                Visual login images are picked from Profile → Family Members once you've added
                some recipe photos. You can also set them up later.
              </Alert>

              <Box display="flex" justifyContent="space-between" alignItems="center">
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
          )}

          {/* Step 2: Spoonacular API key */}
          {activeStep === 2 && (
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
                <Alert
                  severity="success"
                  icon={<CheckCircleIcon />}
                  sx={{ mb: 2 }}
                >
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
                <Button
                  variant="text"
                  color="inherit"
                  onClick={handleSkip}
                  disabled={saving}
                >
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
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                You must test and verify the key before saving, or leave the field empty to skip.
              </Typography>
            </Box>
          )}

          {/* Step 3: Done */}
          {activeStep === 3 && (
            <Box textAlign="center">
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                You're all set!
              </Typography>
              <Typography color="text.secondary" paragraph>
                Setup is complete. You can update API keys at any time from the{' '}
                <strong>Admin → API Keys</strong> tab.
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

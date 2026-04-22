/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { userAPI, familyMemberAPI } from '../services/api';
import { DIETARY_PREFERENCES, COMMON_ALLERGENS, getDietaryLabel, isAllergen } from '../constants/dietaryOptions';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface UserProfile {
  id: string;
  email: string;
  familyName: string;
}

interface UserPreferences {
  dietaryRestrictions: string[];
  cookingSkillLevel: string;
  avoidedIngredients: string[];
}

interface FamilyMember {
  id: string;
  name: string;
  ageGroup: string;
  canCook?: boolean;
  dietaryRestrictions?: string[];
  cookingSkillLevel?: string;
  avoidedIngredients?: string[];
}

const skillLevels = ['beginner', 'intermediate', 'advanced'];
const ageGroups = ['child', 'teen', 'adult'];

const Profile: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ familyName: '' });

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryRestrictions: [],
    cookingSkillLevel: 'beginner',
    avoidedIngredients: [],
  });
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [preferencesForm, setPreferencesForm] = useState<UserPreferences>({
    dietaryRestrictions: [],
    cookingSkillLevel: 'beginner',
    avoidedIngredients: [],
  });
  const [newIngredient, setNewIngredient] = useState('');

  // Family members state
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [memberDialog, setMemberDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    ageGroup: 'adult',
    canCook: false,
    dietaryRestrictions: [] as string[],
    cookingSkillLevel: 'beginner',
    avoidedIngredients: [] as string[],
  });
  const [memberNewIngredient, setMemberNewIngredient] = useState('');

  useEffect(() => {
    // Only load data if we have an access token
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, preferencesRes, membersRes] = await Promise.all([
        userAPI.getProfile(),
        userAPI.getPreferences(),
        familyMemberAPI.getAll(),
      ]);

      setProfile(profileRes.data.data);
      setProfileForm({ familyName: profileRes.data.data.familyName });

      // Ensure dietaryRestrictions is always an array
      const prefsData = {
        ...preferencesRes.data.data,
        dietaryRestrictions: preferencesRes.data.data.dietaryRestrictions || [],
        avoidedIngredients: preferencesRes.data.data.avoidedIngredients || [],
      };
      setPreferences(prefsData);
      setPreferencesForm(prefsData);

      setFamilyMembers(membersRes.data.data);
    } catch (error: any) {
      // Only show error if it's not a 401 (which means user needs to login)
      if (error.response?.status !== 401) {
        showSnackbar(error.response?.data?.message || 'Failed to load profile data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await userAPI.updateProfile(profileForm);
      setProfile({ ...profile!, familyName: profileForm.familyName });
      setEditingProfile(false);
      showSnackbar('Profile updated successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      await userAPI.updatePreferences(preferencesForm);
      setPreferences(preferencesForm);
      setEditingPreferences(false);
      showSnackbar('Preferences updated successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to update preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setPreferencesForm({
        ...preferencesForm,
        avoidedIngredients: [...preferencesForm.avoidedIngredients, newIngredient.trim()],
      });
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setPreferencesForm({
      ...preferencesForm,
      avoidedIngredients: preferencesForm.avoidedIngredients.filter((i) => i !== ingredient),
    });
  };

  const handleOpenMemberDialog = (member?: FamilyMember) => {
    if (member) {
      setEditingMember(member);
      setMemberForm({
        name: member.name,
        ageGroup: member.ageGroup,
        canCook: member.canCook || false,
        dietaryRestrictions: member.dietaryRestrictions || [],
        cookingSkillLevel: member.cookingSkillLevel || 'beginner',
        avoidedIngredients: member.avoidedIngredients || [],
      });
    } else {
      setEditingMember(null);
      setMemberForm({
        name: '',
        ageGroup: 'adult',
        canCook: false,
        dietaryRestrictions: [],
        cookingSkillLevel: 'beginner',
        avoidedIngredients: [],
      });
    }
    setMemberDialog(true);
  };

  const handleCloseMemberDialog = () => {
    setMemberDialog(false);
    setEditingMember(null);
    setMemberNewIngredient('');
  };

  const handleSaveMember = async () => {
    try {
      setSaving(true);
      if (editingMember) {
        await familyMemberAPI.update(editingMember.id, memberForm);
        setFamilyMembers(familyMembers.map((m) => (m.id === editingMember.id ? { ...m, ...memberForm } : m)));
        showSnackbar('Family member updated successfully', 'success');
      } else {
        const response = await familyMemberAPI.create(memberForm);
        setFamilyMembers([...familyMembers, response.data.data]);
        showSnackbar('Family member added successfully', 'success');
      }
      handleCloseMemberDialog();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to save family member', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this family member?')) return;

    try {
      await familyMemberAPI.delete(id);
      setFamilyMembers(familyMembers.filter((m) => m.id !== id));
      showSnackbar('Family member deleted successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to delete family member', 'error');
    }
  };

  const handleAddMemberIngredient = () => {
    if (memberNewIngredient.trim()) {
      setMemberForm({
        ...memberForm,
        avoidedIngredients: [...memberForm.avoidedIngredients, memberNewIngredient.trim()],
      });
      setMemberNewIngredient('');
    }
  };

  const handleRemoveMemberIngredient = (ingredient: string) => {
    setMemberForm({
      ...memberForm,
      avoidedIngredients: memberForm.avoidedIngredients.filter((i) => i !== ingredient),
    });
  };

  if (loading) {
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
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your profile, preferences, and family members
        </Typography>
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} aria-label="profile tabs">
          <Tab label="Profile Information" />
          <Tab label="Preferences" />
          <Tab label="Family Members" />
        </Tabs>

        {/* Profile Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Email"
              value={profile?.email || ''}
              disabled
              helperText="Email cannot be changed"
            />
            <TextField
              fullWidth
              label="Family Name"
              value={editingProfile ? profileForm.familyName : profile?.familyName || ''}
              onChange={(e) => setProfileForm({ familyName: e.target.value })}
              disabled={!editingProfile}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!editingProfile ? (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setEditingProfile(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileForm({ familyName: profile?.familyName || '' });
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </Box>
          </Stack>
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3}>
            <FormControl fullWidth disabled={!editingPreferences}>
              <InputLabel>Cooking Skill Level</InputLabel>
              <Select
                value={editingPreferences ? preferencesForm.cookingSkillLevel : preferences.cookingSkillLevel}
                onChange={(e) => setPreferencesForm({ ...preferencesForm, cookingSkillLevel: e.target.value })}
                label="Cooking Skill Level"
              >
                {skillLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Dietary Preferences
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {DIETARY_PREFERENCES.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    color={
                      (editingPreferences ? preferencesForm.dietaryRestrictions : preferences.dietaryRestrictions).includes(option)
                        ? 'primary'
                        : 'default'
                    }
                    onClick={() => {
                      if (editingPreferences) {
                        const current = preferencesForm.dietaryRestrictions;
                        setPreferencesForm({
                          ...preferencesForm,
                          dietaryRestrictions: current.includes(option)
                            ? current.filter((r) => r !== option)
                            : [...current, option],
                        });
                      }
                    }}
                    disabled={!editingPreferences}
                  />
                ))}
              </Box>
              
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'error.main', fontWeight: 600 }}>
                ⚠️ Food Allergens
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Important:</strong> Allergen selections will trigger warnings when recipes contain these ingredients.
              </Alert>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {COMMON_ALLERGENS.map((option) => (
                  <Chip
                    key={option}
                    label={getDietaryLabel(option)}
                    color={
                      (editingPreferences ? preferencesForm.dietaryRestrictions : preferences.dietaryRestrictions).includes(option)
                        ? 'error'
                        : 'default'
                    }
                    onClick={() => {
                      if (editingPreferences) {
                        const current = preferencesForm.dietaryRestrictions;
                        setPreferencesForm({
                          ...preferencesForm,
                          dietaryRestrictions: current.includes(option)
                            ? current.filter((r) => r !== option)
                            : [...current, option],
                        });
                      }
                    }}
                    disabled={!editingPreferences}
                  />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Avoided Ingredients
              </Typography>
              {editingPreferences && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Add ingredient"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
                  />
                  <Button variant="outlined" onClick={handleAddIngredient}>
                    Add
                  </Button>
                </Box>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(editingPreferences ? preferencesForm.avoidedIngredients : preferences.avoidedIngredients).map((ingredient) => (
                  <Chip
                    key={ingredient}
                    label={ingredient}
                    onDelete={editingPreferences ? () => handleRemoveIngredient(ingredient) : undefined}
                  />
                ))}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!editingPreferences ? (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setEditingPreferences(true)}
                >
                  Edit Preferences
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSavePreferences}
                    disabled={saving}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      setEditingPreferences(false);
                      setPreferencesForm(preferences);
                      setNewIngredient('');
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </Box>
          </Stack>
        </TabPanel>

        {/* Family Members Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenMemberDialog()}>
              Add Family Member
            </Button>
          </Box>
          <List>
            {familyMembers.map((member) => (
              <ListItem key={member.id} divider>
                <ListItemText
                  primary={member.name}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {member.ageGroup.charAt(0).toUpperCase() + member.ageGroup.slice(1)}
                      </Typography>
                      {member.cookingSkillLevel && ` • ${member.cookingSkillLevel}`}
                      {member.dietaryRestrictions && member.dietaryRestrictions.length > 0 && (
                        <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                          {member.dietaryRestrictions.map((r) => (
                            <Chip key={r} label={r} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
                          ))}
                        </Box>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleOpenMemberDialog(member)} sx={{ mr: 1 }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDeleteMember(member.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {familyMembers.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No family members added yet
              </Typography>
            )}
          </List>
        </TabPanel>
      </Paper>

      {/* Family Member Dialog */}
      <Dialog
        open={memberDialog}
        onClose={handleCloseMemberDialog}
        maxWidth="sm"
        fullWidth
        disablePortal={false}
        keepMounted={false}
      >
        <DialogTitle>{editingMember ? 'Edit Family Member' : 'Add Family Member'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Age Group</InputLabel>
              <Select
                value={memberForm.ageGroup}
                onChange={(e) => setMemberForm({ ...memberForm, ageGroup: e.target.value })}
                label="Age Group"
              >
                {ageGroups.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={memberForm.canCook}
                  onChange={(e) => setMemberForm({ ...memberForm, canCook: e.target.checked })}
                />
              }
              label="Can Cook (will appear in chef assignment dropdown)"
            />
            <FormControl fullWidth>
              <InputLabel>Cooking Skill Level</InputLabel>
              <Select
                value={memberForm.cookingSkillLevel}
                onChange={(e) => setMemberForm({ ...memberForm, cookingSkillLevel: e.target.value })}
                label="Cooking Skill Level"
              >
                {skillLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Dietary Preferences
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {DIETARY_PREFERENCES.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    color={memberForm.dietaryRestrictions.includes(option) ? 'primary' : 'default'}
                    onClick={() => {
                      const current = memberForm.dietaryRestrictions;
                      setMemberForm({
                        ...memberForm,
                        dietaryRestrictions: current.includes(option)
                          ? current.filter((r) => r !== option)
                          : [...current, option],
                      });
                    }}
                  />
                ))}
              </Box>
              
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'error.main', fontWeight: 600 }}>
                ⚠️ Food Allergens
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {COMMON_ALLERGENS.map((option) => (
                  <Chip
                    key={option}
                    label={getDietaryLabel(option)}
                    color={memberForm.dietaryRestrictions.includes(option) ? 'error' : 'default'}
                    onClick={() => {
                      const current = memberForm.dietaryRestrictions;
                      setMemberForm({
                        ...memberForm,
                        dietaryRestrictions: current.includes(option)
                          ? current.filter((r) => r !== option)
                          : [...current, option],
                      });
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Avoided Ingredients
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add ingredient"
                  value={memberNewIngredient}
                  onChange={(e) => setMemberNewIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMemberIngredient()}
                />
                <Button variant="outlined" onClick={handleAddMemberIngredient}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {memberForm.avoidedIngredients.map((ingredient) => (
                  <Chip
                    key={ingredient}
                    label={ingredient}
                    onDelete={() => handleRemoveMemberIngredient(ingredient)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMemberDialog} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSaveMember} variant="contained" disabled={saving || !memberForm.name.trim()}>
            {saving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default Profile;

// Made with Bob

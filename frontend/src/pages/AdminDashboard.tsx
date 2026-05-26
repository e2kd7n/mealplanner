/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Pagination,
  CircularProgress,
  Tabs,
  Tab,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  Delete as DeleteIcon,
  VpnKey as ResetPasswordIcon,
  Refresh as RefreshIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { isAxiosError } from 'axios';
import { getApiErrorMessage } from '../utils/errorHandler';

interface AppSetting {
  key: string;
  value: string | null;
  isSecret: boolean;
  description: string | null;
  updatedAt: string;
  isConfigured: boolean;
}

const SETTING_LABELS: Record<string, string> = {
  spoonacular_api_key: 'Spoonacular API Key',
  edamam_app_id: 'Edamam App ID',
  edamam_app_key: 'Edamam App Key',
  ftue_completed: 'Setup Wizard Completed',
};

interface User {
  id: string;
  email: string;
  familyName: string;
  role: 'user' | 'admin' | 'superadmin';
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SystemStats {
  totalUsers: number;
  totalRecipes: number;
  totalMealPlans: number;
  totalGroceryLists: number;
  blockedUsers: number;
  adminUsers: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Users tab state
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [editRoleDialog, setEditRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // API Keys tab state
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showEditValue, setShowEditValue] = useState(false);
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<'valid' | 'invalid' | null>(null);
  const [keyTestMessage, setKeyTestMessage] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.data.filter((s: AppSetting) => s.key !== 'ftue_completed'));
    } catch {
      setSettingsError('Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [page, search, roleFilter]);

  useEffect(() => {
    if (activeTab === 1) loadSettings();
  }, [activeTab, loadSettings]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load users
      const usersResponse = await api.get('/admin/users', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          role: roleFilter || undefined,
        },
      });
      setUsers(usersResponse.data.users);
      setTotalPages(usersResponse.data.totalPages);

      // Load stats
      const statsResponse = await api.get('/admin/stats');
      setStats(statsResponse.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load data'));
      if (isAxiosError(err) && err.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/block`);
      setSuccess('User blocked successfully');
      loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to block user'));
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/unblock`);
      setSuccess('User unblocked successfully');
      loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to unblock user'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/admin/users/${userId}`);
      setSuccess('User deleted successfully');
      loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to delete user'));
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      await api.patch(`/admin/users/${selectedUser.id}/role`, { role: newRole });
      setSuccess('User role updated successfully');
      setEditRoleDialog(false);
      setSelectedUser(null);
      loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to update role'));
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      const response = await api.post(`/admin/users/${selectedUser.id}/reset-password`, {
        newPassword,
      });
      setSuccess(`Password reset successfully. New password: ${response.data.temporaryPassword}`);
      setResetPasswordDialog(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to reset password'));
    }
  };

  const startEditKey = (setting: AppSetting) => {
    setEditingKey(setting.key);
    setEditValue('');
    setShowEditValue(false);
    setKeyTestResult(null);
    setKeyTestMessage('');
    setSettingsError('');
  };

  const cancelEditKey = () => {
    setEditingKey(null);
    setEditValue('');
    setKeyTestResult(null);
    setKeyTestMessage('');
  };

  const handleTestApiKey = async () => {
    if (!editValue.trim() || editingKey !== 'spoonacular_api_key') return;
    setKeyTesting(true);
    setKeyTestResult(null);
    try {
      await api.post('/admin/settings/test/spoonacular', { key: editValue.trim() });
      setKeyTestResult('valid');
      setKeyTestMessage('API key verified.');
    } catch (err: unknown) {
      setKeyTestResult('invalid');
      setKeyTestMessage(getApiErrorMessage(err, 'Verification failed.'));
    } finally {
      setKeyTesting(false);
    }
  };

  const handleSaveKey = async () => {
    if (!editingKey) return;
    setKeySaving(true);
    setSettingsError('');
    try {
      await api.put(`/admin/settings/${editingKey}`, { value: editValue.trim() || null });
      setSettingsSuccess('Setting updated.');
      cancelEditKey();
      loadSettings();
    } catch (err: unknown) {
      setSettingsError(getApiErrorMessage(err, 'Failed to save.'));
    } finally {
      setKeySaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'error';
      case 'admin':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading && !users.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, view system statistics, and perform administrative tasks
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Users" />
        <Tab label="API Keys" icon={<KeyIcon fontSize="small" />} iconPosition="start" />
      </Tabs>

      {/* Users Tab */}
      {activeTab === 0 && (
        <>
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* System Statistics */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">{stats.totalUsers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Recipes
                </Typography>
                <Typography variant="h4">{stats.totalRecipes}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Meal Plans
                </Typography>
                <Typography variant="h4">{stats.totalMealPlans}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Grocery Lists
                </Typography>
                <Typography variant="h4">{stats.totalGroceryLists}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Blocked Users
                </Typography>
                <Typography variant="h4" color="error">
                  {stats.blockedUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Admin Users
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.adminUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* User Management */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">User Management</Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Search by email or family name"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="Filter by role"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="superadmin">SuperAdmin</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* Users Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Family Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.familyName}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Chip label="Blocked" color="error" size="small" />
                    ) : (
                      <Chip label="Active" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedUser(user);
                        setNewRole(user.role);
                        setEditRoleDialog(true);
                      }}
                      title="Edit Role"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {user.isBlocked ? (
                      <IconButton
                        size="small"
                        onClick={() => handleUnblockUser(user.id)}
                        title="Unblock User"
                        color="success"
                      >
                        <UnblockIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => handleBlockUser(user.id)}
                        title="Block User"
                        color="warning"
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedUser(user);
                        setResetPasswordDialog(true);
                      }}
                      title="Reset Password"
                      color="info"
                    >
                      <ResetPasswordIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      </Paper>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialog} onClose={() => setEditRoleDialog(false)}>
        <DialogTitle>Update User Role</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            sx={{ mt: 2, minWidth: 300 }}
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="superadmin">SuperAdmin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRoleDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateRole} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)}>
        <DialogTitle>Reset User Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 2, minWidth: 300 }}
            helperText="Minimum 8 characters"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialog(false)}>Cancel</Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={newPassword.length < 8}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
        </>
      )}

      {/* API Keys Tab */}
      {activeTab === 1 && (
        <Box>
          {settingsError && (
            <Alert severity="error" onClose={() => setSettingsError('')} sx={{ mb: 2 }}>
              {settingsError}
            </Alert>
          )}
          {settingsSuccess && (
            <Alert severity="success" onClose={() => setSettingsSuccess('')} sx={{ mb: 2 }}>
              {settingsSuccess}
            </Alert>
          )}

          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  API Keys
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage third-party service integrations. Keys are stored securely in the
                  database and never exposed in full after saving.
                </Typography>
              </Box>
              <IconButton onClick={loadSettings} disabled={settingsLoading}>
                <RefreshIcon />
              </IconButton>
            </Box>

            {settingsLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.key}>
                      <TableCell>
                        <Typography fontWeight={500}>
                          {SETTING_LABELS[setting.key] ?? setting.key}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {setting.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {setting.isConfigured ? (
                          <Chip
                            label="Configured"
                            color="success"
                            size="small"
                            icon={<CheckCircleIcon />}
                          />
                        ) : (
                          <Chip label="Not set" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => startEditKey(setting)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {setting.isConfigured && (
                          <Tooltip title="Clear key">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={async () => {
                                await api.put(`/admin/settings/${setting.key}`, { value: null });
                                setSettingsSuccess('Key cleared.');
                                loadSettings();
                              }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>

          {/* Inline edit dialog */}
          <Dialog open={!!editingKey} onClose={cancelEditKey} maxWidth="sm" fullWidth>
            <DialogTitle>
              Update {editingKey ? (SETTING_LABELS[editingKey] ?? editingKey) : ''}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                {settings.find((s) => s.key === editingKey)?.description}
              </Typography>
              <TextField
                fullWidth
                label="New value"
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  setKeyTestResult(null);
                }}
                type={showEditValue ? 'text' : 'password'}
                placeholder="Paste new key here"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowEditValue((v) => !v)} edge="end">
                        {showEditValue ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {editingKey === 'spoonacular_api_key' && (
                <Box mt={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleTestApiKey}
                    disabled={!editValue.trim() || keyTesting || keySaving}
                    startIcon={keyTesting ? <CircularProgress size={14} /> : undefined}
                  >
                    {keyTesting ? 'Testing…' : 'Test Key'}
                  </Button>
                  {keyTestResult === 'valid' && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                      {keyTestMessage}
                    </Alert>
                  )}
                  {keyTestResult === 'invalid' && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {keyTestMessage}
                    </Alert>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={cancelEditKey}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSaveKey}
                disabled={
                  keySaving ||
                  (editingKey === 'spoonacular_api_key' &&
                    !!editValue.trim() &&
                    keyTestResult !== 'valid')
                }
                startIcon={keySaving ? <CircularProgress size={14} /> : undefined}
              >
                {keySaving ? 'Saving…' : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Container>
  );
}

// Made with Bob

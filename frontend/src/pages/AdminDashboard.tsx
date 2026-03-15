/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  Delete as DeleteIcon,
  VpnKey as ResetPasswordIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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

  useEffect(() => {
    loadData();
  }, [page, search, roleFilter]);

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
      if (err.response?.status === 403) {
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/unblock`);
      setSuccess('User unblocked successfully');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unblock user');
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
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
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, view system statistics, and perform administrative tasks
        </Typography>
      </Box>

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
    </Container>
  );
}

// Made with Bob

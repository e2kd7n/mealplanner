/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  InputAdornment,
  IconButton,
  LinearProgress,
  Divider,
  Stack,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  RestaurantMenu as RestaurantMenuIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { register, clearError } from '../store/slices/authSlice';
import ErrorAlert from '../components/ErrorAlert';
import api from '../services/api';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const [checking, setChecking] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // If users already exist, this page has no business being here
  useEffect(() => {
    api.get('/auth/status').then((res) => {
      if (res.data.hasUsers) {
        navigate('/login', { replace: true });
      } else {
        setChecking(false);
      }
    }).catch(() => {
      // Server unreachable — let them try to register anyway
      setChecking(false);
    });
  }, [navigate]);

  // After registration succeeds, go straight to the admin setup wizard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/setup', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const calculatePasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25;
    if (/\d/.test(pwd)) strength += 15;
    if (/[^a-zA-Z\d]/.test(pwd)) strength += 10;
    return Math.min(strength, 100);
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    setPasswordStrength(calculatePasswordStrength(pwd));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }
    if (passwordStrength < 50) {
      setValidationError('Please choose a stronger password (mix of uppercase, lowercase, numbers, and symbols)');
      return;
    }

    await dispatch(register({ familyName: name, email, password }));
  };

  const strengthColor = () => {
    if (passwordStrength < 40) return 'error';
    if (passwordStrength < 70) return 'warning';
    return 'success';
  };

  const strengthLabel = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  if (checking) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

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
        <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <RestaurantMenuIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Family Meal Planner
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome! Looks like this is a fresh install.
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Stack spacing={1} mb={4}>
            <Typography variant="h6" fontWeight={600}>
              Create your admin account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The first account gets admin access so you can manage the app,
              add family members, and configure settings.
            </Typography>
          </Stack>

          {(error || validationError) && (
            <ErrorAlert
              error={validationError || error || 'Registration failed'}
              title="Could not create account"
              onClose={() => {
                dispatch(clearError());
                setValidationError('');
              }}
              additionalContext="FTUE first-user registration"
              sx={{ mb: 3 }}
            />
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Family Name"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              helperText='e.g. "Smith Family" — shown on the login screen'
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              onBlur={handleEmailBlur}
              error={!!emailError}
              helperText={emailError || 'Used to log in with email and password'}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              disabled={loading}
              helperText="At least 8 characters with letters, numbers, and symbols"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {password && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Password Strength: {strengthLabel()}
                  </Typography>
                  {passwordStrength >= 70 && <CheckCircle color="success" sx={{ fontSize: 16 }} />}
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength}
                  color={strengthColor()}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              error={confirmPassword.length > 0 && password !== confirmPassword}
              helperText={
                confirmPassword.length > 0 && password !== confirmPassword
                  ? 'Passwords do not match'
                  : 'Re-enter your password to confirm'
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 4 }}
              disabled={
                loading ||
                !!emailError ||
                passwordStrength < 50 ||
                password !== confirmPassword
              }
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Creating Account…' : 'Create Admin Account'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Welcome;

// Made with Bob

/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { useAppSelector } from '../store/hooks';
import ErrorAlert from '../components/ErrorAlert';
import api from '../services/api';

/**
 * Add a Household Member — admin only.
 *
 * Public sign-up closes once the first (admin) account exists, so anyone who
 * can reach the app (guests on the Wi-Fi included) can't give themselves a
 * login. Further email sign-ins are created here by a signed-in admin, who
 * stays signed in as themselves afterwards.
 */
const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, loading: authLoading } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // True when linked here from the end of the admin Welcome/Setup flow
  // ("Add a Household Member") rather than from the Admin page.
  const fromFtue = Boolean((location.state as { fromFtue?: boolean } | null)?.fromFtue);

  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // On a fresh install with no users yet, send visitors to /welcome — the
  // actual first-run flow, which is the only place public sign-up still works.
  useEffect(() => {
    api.get('/auth/status').then((res) => {
      if (!res.data.hasUsers) {
        navigate('/welcome', { replace: true });
      } else {
        setChecking(false);
      }
    }).catch(() => {
      setChecking(false);
    });
  }, [navigate]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPasswordStrength(0);
    setPasswordTouched(false);
    setConfirmPasswordTouched(false);
    setValidationError('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setError(null);

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters for better security');
      return;
    }
    if (passwordStrength < 50) {
      setValidationError('Please choose a stronger password (mix of uppercase, lowercase, numbers, and symbols)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/admin/users', { familyName: name, email, password });
      setCreated(res.data.user?.email ?? email);
      resetForm();
    } catch (err) {
      const data = (err as { response?: { data?: { error?: { message?: string } | string; message?: string } } })
        .response?.data;
      setError(
        (typeof data?.error === 'object' ? data.error?.message : data?.error)
          ?? data?.message
          ?? 'Could not create the sign-in'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'error';
    if (passwordStrength < 70) return 'warning';
    return 'success';
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  if (checking || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const header = (
    <>
      <Typography component="h1" variant="h4" align="center" gutterBottom>
        Family Meal Planner
      </Typography>
      <Typography component="h2" variant="h6" align="center" color="text.secondary" gutterBottom>
        Add a Household Member
      </Typography>
    </>
  );

  if (!isAdmin) {
    return (
      <Container component="main" maxWidth="xs">
        <Box sx={{ marginTop: 8 }}>
          <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
            {header}
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              Sign-ups are closed. Ask your household admin to create a sign-in for you
              from the Admin page.
            </Alert>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to={isAuthenticated ? '/dashboard' : '/login'} variant="body2">
                {isAuthenticated ? 'Back to Dashboard' : 'Already have an account? Sign In'}
              </Link>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          {header}
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 1 }}>
            Give another person in your household their own sign-in. You'll stay
            signed in as yourself; they can sign in with these details right away.
          </Typography>

          {created && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setCreated(null)}>
              Sign-in created for {created}.
            </Alert>
          )}

          {(error || validationError) && (
            <ErrorAlert
              error={validationError || error || 'Could not create the sign-in'}
              title="Couldn't Add Member"
              onClose={() => {
                setError(null);
                setValidationError('');
              }}
              additionalContext={fromFtue ? 'Admin attempted to add household member from FTUE' : 'Admin attempted to add household member'}
              sx={{ mt: 2, mb: 2 }}
            />
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Name"
              name="name"
              autoComplete="off"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              helperText="Their name, as it should appear in the app"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="off"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              onBlur={handleEmailBlur}
              error={!!emailError}
              helperText={emailError || 'They\'ll use this to sign in'}
              disabled={submitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              disabled={submitting}
              error={passwordTouched && password.length > 0 && passwordStrength < 50}
              helperText="At least 8 characters with mix of letters, numbers, and symbols"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        disabled={submitting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            {password && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Password Strength: {getPasswordStrengthLabel()}
                  </Typography>
                  {passwordStrength >= 70 && (
                    <CheckCircle color="success" sx={{ fontSize: 16 }} />
                  )}
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength}
                  color={getPasswordStrengthColor()}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                {passwordTouched && passwordStrength < 50 && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    Too weak to continue
                    {password.length < 12 && ' — try a longer password'}
                    {!/[A-Z]/.test(password) && ', add uppercase'}
                    {!/\d/.test(password) && ', add a number'}
                    {!/[^a-zA-Z\d]/.test(password) && ', add a symbol'}
                  </Typography>
                )}
              </Box>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setConfirmPasswordTouched(true)}
              disabled={submitting}
              error={confirmPasswordTouched && confirmPassword.length > 0 && password !== confirmPassword}
              helperText={
                confirmPasswordTouched && confirmPassword.length > 0 && password !== confirmPassword
                  ? 'Passwords do not match'
                  : 'Re-enter the password to confirm'
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        disabled={submitting}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={submitting || !!emailError || passwordStrength < 50 || password !== confirmPassword}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {submitting ? 'Creating Sign-in...' : 'Create Sign-in'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to={fromFtue ? '/dashboard' : '/admin'} variant="body2">
                {fromFtue ? 'Skip for now — go to Dashboard' : 'Back to Admin'}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;

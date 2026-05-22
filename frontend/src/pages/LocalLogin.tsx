/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Avatar,
  CircularProgress,
  Alert,
  Button,
  Skeleton,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Stack,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import api, { visualAuthAPI, authAPI, recipeAPI } from '../services/api';

interface UserEntry {
  id: string;
  name: string;
}

interface ChallengeImage {
  id: string;
  title: string;
  imageUrl: string | null;
}

const STEPS_NORMAL = ['Who are you?', 'Pick your image'];
const STEPS_SETUP  = ['Who are you?', 'Sign in to set up', 'Pick your image'];

const LocalLogin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState(0);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserEntry | null>(null);
  const [challenge, setChallenge] = useState<ChallengeImage[]>([]);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Setup mode — entered when user has no visual password yet
  const [setupMode, setSetupMode] = useState(false);
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  const steps = setupMode ? STEPS_SETUP : STEPS_NORMAL;

  // On mount: try device token first (silent, no UI flash)
  useEffect(() => {
    visualAuthAPI.deviceLogin()
      .then((res) => {
        const { user } = res.data;
        dispatch(setCredentials({ user: { ...user, name: user.name } }));
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        // No valid device token — show the normal picker
        loadUsers();
      });
  }, []);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await visualAuthAPI.listUsers();
      const userList = res.data.users ?? [];
      if (userList.length === 0) {
        navigate('/welcome', { replace: true });
        return;
      }
      setUsers(userList);
    } catch {
      // If the users endpoint fails, check whether this is a fresh install
      // (no users exist). A server error on a fresh DB should still land on /welcome.
      try {
        const statusRes = await api.get('/auth/status');
        if (!statusRes.data.hasUsers) {
          navigate('/welcome', { replace: true });
          return;
        }
      } catch {
        // status check also failed — server is genuinely unreachable
      }
      setError('Could not load users. Is the server running?');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSelectUser = useCallback(async (user: UserEntry) => {
    setSelectedUser(user);
    setError(null);
    setChallengeLoading(true);
    setStep(1);
    try {
      const res = await visualAuthAPI.getVisualChallenge(user.id);
      setChallenge(res.data.images ?? []);
      setSetupMode(false);
    } catch (err: any) {
      if (err?.response?.status === 400) {
        // No visual password set — enter first-time setup flow
        setSetupMode(true);
        setChallenge([]);
      } else {
        setError('Failed to load visual challenge. Please try again.');
        setStep(0);
        setSelectedUser(null);
      }
    } finally {
      setChallengeLoading(false);
    }
  }, []);

  const handleSetupSignIn = async () => {
    setSetupLoading(true);
    setError(null);
    try {
      const loginRes = await authAPI.login({ email: setupEmail, password: setupPassword });
      dispatch(setCredentials({ user: loginRes.data.user }));

      const recipesRes = await recipeAPI.getAll({ limit: 100 });
      const withImages = (recipesRes.data.recipes ?? []).filter((r: any) => r.imageUrl);
      if (withImages.length === 0) {
        // Authenticated but no recipe images yet — send to dashboard so they can add one,
        // then return here to complete visual login setup.
        navigate('/dashboard', { replace: true, state: { visualLoginSetupPending: true } });
        return;
      }
      setChallenge(withImages.map((r: any) => ({ id: r.id, title: r.title, imageUrl: r.imageUrl })));
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sign-in failed. Check your email and password.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handlePickImage = useCallback(async (recipeId: string) => {
    if (!selectedUser || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      if (setupMode) {
        await visualAuthAPI.setupVisualPassword(selectedUser.id, recipeId);
        navigate('/dashboard', { replace: true });
      } else {
        const res = await visualAuthAPI.visualLogin({ memberId: selectedUser.id, recipeId });
        const { user } = res.data;
        dispatch(setCredentials({ user: { ...user, name: user.name } }));
        const ftueDone = localStorage.getItem('mealplanner_member_ftue_done');
        navigate(ftueDone ? '/dashboard' : '/member-welcome', { replace: true });
      }
    } catch {
      setError(setupMode ? 'Failed to save. Please try again.' : 'Wrong image — tap the one you chose during setup.');
      setVerifying(false);
    }
  }, [selectedUser, verifying, dispatch, navigate, setupMode]);

  const handleBack = () => {
    setStep(0);
    setSelectedUser(null);
    setChallenge([]);
    setError(null);
    setSetupMode(false);
    setSetupEmail('');
    setSetupPassword('');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Family Kitchen
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tap your name, then pick your image
        </Typography>
      </Box>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step 0 — User picker */}
      {step === 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: users.length > 3 ? '1fr 1fr' : 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 2,
          }}
        >
          {usersLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              ))
            : users.map((user) => (
                <Card
                  key={user.id}
                  sx={{ textAlign: 'center' }}
                >
                  <CardActionArea onClick={() => handleSelectUser(user)} sx={{ p: 2 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        mx: 'auto',
                        mb: 1,
                        bgcolor: 'primary.main',
                        fontSize: '1.5rem',
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body1" fontWeight={500}>
                      {user.name}
                    </Typography>
                  </CardActionArea>
                </Card>
              ))}
        </Box>
      )}

      {/* Step 1 (normal) — Visual challenge */}
      {step === 1 && !setupMode && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              size="small"
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Typography variant="body1">
              Hi <strong>{selectedUser?.name}</strong> — tap the image you chose
            </Typography>
          </Box>

          {challengeLoading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, position: 'relative' }}>
              {verifying && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255,255,255,0.7)',
                    zIndex: 1,
                    borderRadius: 2,
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
              {challenge.map((img) => (
                <Card key={img.id} sx={{ cursor: 'pointer' }}>
                  <CardActionArea onClick={() => handlePickImage(img.id)} disabled={verifying}>
                    <CardMedia
                      component="img"
                      height="160"
                      image={img.imageUrl ?? '/placeholder-recipe.jpg'}
                      alt={img.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="caption" noWrap>{img.title}</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Step 1 (setup) — Sign in to authenticate before picking visual password */}
      {step === 1 && setupMode && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack} size="small" sx={{ mr: 1 }}>
              Back
            </Button>
            <Typography variant="body1">
              First-time setup for <strong>{selectedUser?.name}</strong>
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in with your account email and password, then pick a recipe image as your visual login.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={setupEmail}
              onChange={(e) => setSetupEmail(e.target.value)}
              disabled={setupLoading}
              autoComplete="email"
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={setupPassword}
              onChange={(e) => setSetupPassword(e.target.value)}
              disabled={setupLoading}
              autoComplete="current-password"
              onKeyDown={(e) => e.key === 'Enter' && !setupLoading && setupEmail && setupPassword && handleSetupSignIn()}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleSetupSignIn}
              disabled={setupLoading || !setupEmail || !setupPassword}
            >
              {setupLoading ? <CircularProgress size={24} /> : 'Continue'}
            </Button>
          </Stack>
        </Box>
      )}

      {/* Step 2 (setup) — Pick recipe as visual password */}
      {step === 2 && setupMode && (
        <Box>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Pick your image, <strong>{selectedUser?.name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tap the recipe you want to use as your visual login. You'll tap it every time you sign in.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, position: 'relative' }}>
            {verifying && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,0.7)',
                  zIndex: 1,
                  borderRadius: 2,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            {challenge.map((img) => (
              <Card key={img.id} sx={{ cursor: 'pointer' }}>
                <CardActionArea onClick={() => handlePickImage(img.id)} disabled={verifying}>
                  <CardMedia
                    component="img"
                    height="160"
                    image={img.imageUrl ?? '/placeholder-recipe.jpg'}
                    alt={img.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="caption" noWrap>{img.title}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Fallback to classic login */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Need email/password login?{' '}
          <RouterLink to="/login/classic" style={{ color: 'inherit' }}>
            Classic sign-in
          </RouterLink>
        </Typography>
      </Box>
    </Container>
  );
};

export default LocalLogin;

// Made with Bob

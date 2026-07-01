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
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import api, { visualAuthAPI } from '../services/api';
import { useTheme } from '@mui/material/styles';

interface UserEntry {
  id: string;
  name: string;
}

interface ChallengeImage {
  id: string;
  title: string;
  imageUrl: string | null;
}

const STEPS = ['Who are you?', 'Pick your image'];

const LocalLogin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const [step, setStep] = useState(0);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserEntry | null>(null);
  const [challenge, setChallenge] = useState<ChallengeImage[]>([]);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    visualAuthAPI.deviceLogin()
      .then((res) => {
        const { user, memberName } = res.data;
        dispatch(setCredentials({ user: { ...user, name: memberName ?? user.name } }));
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
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
      try {
        const statusRes = await api.get('/auth/status');
        if (!statusRes.data.hasUsers) {
          navigate('/welcome', { replace: true });
          return;
        }
      } catch {
        // Server genuinely unreachable
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
    } catch {
      setError('Visual login not set up yet. Ask the admin to assign a login image from Profile → Family Members.');
      setStep(0);
      setSelectedUser(null);
    } finally {
      setChallengeLoading(false);
    }
  }, []);

  const handlePickImage = useCallback(async (imageId: string) => {
    if (!selectedUser || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await visualAuthAPI.visualLogin({ memberId: selectedUser.id, recipeId: imageId });
      const { user, memberName } = res.data;
      dispatch(setCredentials({ user: { ...user, name: memberName ?? user.name } }));
      const ftueDone = localStorage.getItem(`mealplanner_member_ftue_done_${selectedUser.id}`);
      navigate(ftueDone ? '/dashboard' : '/member-welcome', { replace: true });
    } catch {
      setError('Wrong image — tap the one you chose during setup.');
      setVerifying(false);
    }
  }, [selectedUser, verifying, dispatch, navigate]);

  const handleBack = () => {
    setStep(0);
    setSelectedUser(null);
    setChallenge([]);
    setError(null);
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Family Meal Planner
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tap your name, then pick your image
        </Typography>
      </Box>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
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
                <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} aria-label="Loading family member" />
              ))
            : users.map((user) => (
                <Card key={user.id} sx={{ textAlign: 'center' }}>
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

      {/* Step 1 — Visual challenge */}
      {step === 1 && (
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
                <Skeleton key={i} variant="rectangular" height={160} sx={{ borderRadius: 2 }} aria-label="Loading login image" />
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
                  <CircularProgress aria-label="Verifying login" />
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

      {/* Fallback to classic login */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Need email/password login?{' '}
          <RouterLink to="/login/classic" style={{ color: theme.palette.primary.main }}>
            Classic sign-in
          </RouterLink>
        </Typography>
      </Box>
    </Container>
  );
};

export default LocalLogin;

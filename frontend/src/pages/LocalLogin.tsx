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

interface UserEntry {
  id: string;
  familyName: string;
  hasVisualPassword: boolean;
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

  const [step, setStep] = useState(0);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserEntry | null>(null);
  const [challenge, setChallenge] = useState<ChallengeImage[]>([]);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // On mount: try device token first (silent, no UI flash)
  useEffect(() => {
    visualAuthAPI.deviceLogin()
      .then((res) => {
        const { accessToken, refreshToken, user } = res.data;
        localStorage.setItem('accessToken', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);
        dispatch(setCredentials({ user: { ...user, name: user.name }, accessToken }));
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
    if (!user.hasVisualPassword) {
      setError(`${user.familyName} hasn't set a visual password yet — use the classic login instead.`);
      return;
    }
    setSelectedUser(user);
    setError(null);
    setChallengeLoading(true);
    setStep(1);
    try {
      const res = await visualAuthAPI.getVisualChallenge(user.id);
      setChallenge(res.data.images ?? []);
    } catch {
      setError('Failed to load visual challenge. Please try again.');
      setStep(0);
    } finally {
      setChallengeLoading(false);
    }
  }, []);

  const handlePickImage = useCallback(async (recipeId: string) => {
    if (!selectedUser || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await visualAuthAPI.visualLogin({ userId: selectedUser.id, recipeId });
      const { accessToken, refreshToken, user } = res.data;
      localStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', refreshToken);
      dispatch(setCredentials({ user: { ...user, name: user.name }, accessToken }));
      navigate('/dashboard', { replace: true });
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
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
                  sx={{
                    textAlign: 'center',
                    opacity: user.hasVisualPassword ? 1 : 0.5,
                  }}
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
                      {user.familyName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body1" fontWeight={500}>
                      {user.familyName}
                    </Typography>
                    {!user.hasVisualPassword && (
                      <Typography variant="caption" color="text.secondary">
                        No visual password
                      </Typography>
                    )}
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
              Hi <strong>{selectedUser?.familyName}</strong> — tap the image you chose
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

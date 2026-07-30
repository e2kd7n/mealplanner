/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, MobileStepper, useTheme } from '@mui/material';
import {
  RestaurantMenu as RestaurantMenuIcon,
  CalendarMonth as CalendarMonthIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  KeyboardArrowRight,
  KeyboardArrowLeft,
} from '@mui/icons-material';
import { useAppSelector } from '../store/hooks';

const FTUE_KEY_PREFIX = 'mealplanner_member_ftue_done';

interface Slide {
  icon: React.ReactNode;
  heading: string;
  body: string;
  bg: string;
  color: string;
}

export default function MemberWelcome() {
  const navigate = useNavigate();
  const theme = useTheme();
  const userName = useAppSelector((s) => s.auth.user?.name ?? 'there');
  const userId = useAppSelector((s) => s.auth.user?.id);
  const [step, setStep] = useState(0);

  const slides: Slide[] = [
    {
      icon: <RestaurantMenuIcon sx={{ fontSize: 80 }} />,
      heading: `Hey, ${userName}!`,
      body: "You're part of the family kitchen. Here's a quick look at what you can do.",
      bg: theme.palette.primary.main,
      color: '#fff',
    },
    {
      icon: <CalendarMonthIcon sx={{ fontSize: 80 }} />,
      heading: "What's for dinner?",
      body: "See the week's meal plan, check who's cooking, and never be surprised at the table.",
      bg: '#2e7d32',
      color: '#fff',
    },
    {
      icon: <ShoppingCartIcon sx={{ fontSize: 80 }} />,
      heading: 'Shopping, sorted.',
      body: 'Grocery lists build themselves from the meal plan. Tick things off as you go.',
      bg: '#1565c0',
      color: '#fff',
    },
    {
      icon: <CheckCircleIcon sx={{ fontSize: 80 }} />,
      heading: "You're all set.",
      body: "That's the tour. Dig in — dinner won't plan itself.",
      bg: '#4a148c',
      color: '#fff',
    },
  ];

  const total = slides.length;
  const current = slides[step];

  const finish = () => {
    if (userId) {
      localStorage.setItem(`${FTUE_KEY_PREFIX}_${userId}`, '1');
    }
    navigate('/dashboard', { replace: true });
  };

  const next = () => {
    if (step < total - 1) setStep((s) => s + 1);
    else finish();
  };

  const back = () => setStep((s) => s - 1);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: current.bg,
        color: current.color,
        transition: 'background-color 0.4s ease',
        px: 3,
        py: 4,
        userSelect: 'none',
      }}
    >
      {/* Skip */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          onClick={finish}
          sx={{ color: 'rgba(255,255,255,0.75)', textTransform: 'none', fontSize: '0.95rem' }}
        >
          Skip
        </Button>
      </Box>

      {/* Slide content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 3,
          maxWidth: 420,
          width: '100%',
        }}
      >
        <Box sx={{ opacity: 0.9 }}>{current.icon}</Box>
        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {current.heading}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.85, fontSize: '1.1rem', lineHeight: 1.6 }}>
          {current.body}
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <MobileStepper
          variant="dots"
          steps={total}
          position="static"
          activeStep={step}
          sx={{
            bgcolor: 'transparent',
            '& .MuiMobileStepper-dot': { bgcolor: 'rgba(255,255,255,0.4)' },
            '& .MuiMobileStepper-dotActive': { bgcolor: '#fff' },
            justifyContent: 'center',
            mb: 2,
            pb: 0,
          }}
          nextButton={null}
          backButton={null}
        />

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {step > 0 && (
            <Button
              onClick={back}
              variant="outlined"
              size="large"
              startIcon={<KeyboardArrowLeft />}
              sx={{
                flex: 1,
                borderColor: 'rgba(255,255,255,0.5)',
                color: '#fff',
                borderRadius: 3,
                py: 1.5,
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Back
            </Button>
          )}
          <Button
            onClick={next}
            variant="contained"
            size="large"
            endIcon={step < total - 1 ? <KeyboardArrowRight /> : undefined}
            sx={{
              flex: 1,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              borderRadius: 3,
              py: 1.5,
              fontWeight: 700,
              backdropFilter: 'blur(4px)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            }}
          >
            {step < total - 1 ? 'Next' : "Let's go"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// Made with Bob

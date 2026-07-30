/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import api from '../services/api';

interface Props {
  children: React.ReactNode;
}

export default function SetupGuard({ children }: Props) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/setup/status')
      .then((res) => {
        if (!cancelled && !res.data.ftueComplete && res.data.isAdmin) {
          navigate('/setup', { replace: true });
        }
      })
      .catch(() => {
        // If the check fails (e.g. network error) just proceed normally
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!checked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}

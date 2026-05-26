/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Typography,
  Box,
  Alert,
  IconButton,
  Stack,
  CircularProgress,
  Paper,
  Divider,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import type { Options as Html2CanvasOptions } from 'html2canvas';
import api from '../services/api';

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const FEEDBACK_TYPE_TOOLTIPS: Record<string, string> = {
  bug: 'Report bugs or unexpected behavior',
  feature: 'Suggest new features',
  improvement: 'Suggest improvements to existing features',
  question: 'Ask questions about the app',
  other: 'General feedback or comments',
};

interface RateLimitInfo {
  remaining: number;
  resetAt: Date;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ open, onClose, onSuccess }) => {
  const location = useLocation();
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 500px)');
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [feedbackType, setFeedbackType] = useState<string>('improvement');
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<Date | null>(null);
  const rateLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!rateLimitedUntil) return;

    const tick = () => {
      const secsLeft = Math.max(0, Math.ceil((rateLimitedUntil.getTime() - Date.now()) / 1000));
      if (secsLeft === 0) {
        setRateLimitedUntil(null);
        setRateLimitInfo(null);
        setError(null);
        if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current);
      } else {
        const mins = Math.floor(secsLeft / 60);
        const secs = secsLeft % 60;
        setTimeRemaining(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
      }
    };

    tick();
    rateLimitTimerRef.current = setInterval(tick, 1000);
    return () => {
      if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current);
    };
  }, [rateLimitedUntil]);

  const handleClose = () => {
    if (!submitting) {
      setFeedbackType('improvement');
      setRating(null);
      setMessage('');
      setScreenshot(null);
      setError(null);
      onClose();
    }
  };

  const captureScreenshot = async () => {
    try {
      setError(null);
      const html2canvasModule = await import('html2canvas');
      const html2canvas = (html2canvasModule.default ??
        (html2canvasModule as unknown as {
          default?: (element: HTMLElement, options?: Partial<Html2CanvasOptions>) => Promise<HTMLCanvasElement>;
        })) as (element: HTMLElement, options?: Partial<Html2CanvasOptions>) => Promise<HTMLCanvasElement>;

      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scale: 1,
      });
      const dataUrl = canvas.toDataURL('image/png');
      setScreenshot(dataUrl);
    } catch (err) {
      console.error('Screenshot capture failed:', err);
      if (isIOS) {
        setError('Screenshot capture is not supported on iOS Safari. Please describe your feedback in text.');
      } else {
        setError('Failed to capture screenshot. Please try again.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please provide feedback message');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await api.post('/feedback', {
        page: location.pathname,
        feedbackType,
        rating,
        message: message.trim(),
        screenshot,
      });

      const remaining = parseInt(response.headers['ratelimit-remaining'] ?? '5', 10);
      const resetSecs = parseInt(response.headers['ratelimit-reset'] ?? '0', 10);
      if (!isNaN(remaining) && resetSecs > 0) {
        const resetAt = new Date(Date.now() + resetSecs * 1000);
        setRateLimitInfo({ remaining, resetAt });
      }

      setFeedbackType('improvement');
      setRating(null);
      setMessage('');
      setScreenshot(null);

      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.error('Feedback submission error:', err);
      if (err.response?.status === 429) {
        const retryAfter = parseInt(err.response.headers['retry-after'] ?? '900', 10);
        const until = new Date(Date.now() + retryAfter * 1000);
        setRateLimitedUntil(until);
        setRateLimitInfo({ remaining: 0, resetAt: until });
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={isLandscape ? 'md' : 'sm'}
      fullWidth
      aria-labelledby="feedback-dialog-title"
    >
      <DialogTitle id="feedback-dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Share Your Feedback</Typography>
          <IconButton
            edge="end"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close feedback dialog"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          maxHeight: isLandscape ? '52vh' : 'none',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Stack spacing={isLandscape ? 1.5 : 3}>
          {rateLimitedUntil ? (
            <Alert severity="error">
              Submission limit reached. You can submit again in {timeRemaining || '…'}.
            </Alert>
          ) : rateLimitInfo && rateLimitInfo.remaining <= 2 ? (
            <Alert severity={rateLimitInfo.remaining === 0 ? 'error' : rateLimitInfo.remaining === 1 ? 'warning' : 'info'}>
              {rateLimitInfo.remaining === 0
                ? 'No submissions remaining in this window.'
                : `${rateLimitInfo.remaining} submission${rateLimitInfo.remaining !== 1 ? 's' : ''} remaining in this window.`}
            </Alert>
          ) : null}

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            We value your input! Please share your thoughts, report bugs, or suggest improvements.
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="feedback-type-label">Feedback Type</InputLabel>
            <Select
              labelId="feedback-type-label"
              id="feedback-type"
              value={feedbackType}
              label="Feedback Type"
              onChange={(e) => setFeedbackType(e.target.value)}
              disabled={submitting}
              aria-describedby="feedback-type-helper"
            >
              {(['bug', 'feature', 'improvement', 'question', 'other'] as const).map((type) => {
                const labels: Record<string, string> = {
                  bug: '🐛 Bug Report',
                  feature: '💡 Feature Request',
                  improvement: '✨ Improvement',
                  question: '❓ Question',
                  other: '📝 Other',
                };
                return (
                  <MenuItem key={type} value={type} aria-label={labels[type]}>
                    <Tooltip title={FEEDBACK_TYPE_TOOLTIPS[type]} placement="right" disableInteractive>
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <span aria-hidden="true">{labels[type].split(' ')[0]}</span>&nbsp;
                        {labels[type].split(' ').slice(1).join(' ')}
                      </Box>
                    </Tooltip>
                  </MenuItem>
                );
              })}
            </Select>
            <Typography
              id="feedback-type-helper"
              variant="caption"
              sx={{ mt: 0.5, display: 'block', color: 'text.primary' }}
            >
              Select the category that best describes your feedback
            </Typography>
          </FormControl>

          <Box>
            <Typography component="legend" gutterBottom id="rating-label">
              How would you rate your experience? (Optional)
            </Typography>
            <Rating
              name="rating"
              value={rating}
              onChange={(_, newValue) => setRating(newValue)}
              disabled={submitting}
              size="large"
              aria-label="Rate your experience from 1 to 5 stars"
              aria-labelledby="rating-label"
              aria-describedby="rating-helper"
            />
            <Typography
              variant="caption"
              sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}
            >
              1 = Very Poor · 2 = Poor · 3 = Average · 4 = Good · 5 = Excellent
            </Typography>
            <Typography
              id="rating-helper"
              variant="caption"
              sx={{ display: 'block', mt: 0.5, color: 'text.primary' }}
            >
              {rating ? `You rated ${rating} out of 5 stars` : 'No rating selected'}
            </Typography>
          </Box>

          <TextField
            label="Your Feedback"
            multiline
            rows={isLandscape ? 2 : 4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please describe your feedback in detail..."
            disabled={submitting}
            required
            fullWidth
            inputProps={{
              maxLength: 2000,
              'aria-describedby': 'feedback-message-helper',
            }}
            helperText={`${message.length}/2000 characters`}
            aria-describedby="feedback-message-helper"
          />
          <Typography
            id="feedback-message-helper"
            variant="caption"
            sx={{ display: 'block', mt: 0.5, color: 'text.primary' }}
          >
            Please describe your feedback in detail (required, maximum 2000 characters)
          </Typography>

          <Box>
            <Button
              startIcon={<CameraIcon />}
              onClick={captureScreenshot}
              disabled={submitting || !!screenshot}
              variant="outlined"
              size="small"
              aria-label={screenshot ? 'Screenshot captured successfully' : 'Capture screenshot of current page'}
              aria-describedby="screenshot-helper"
            >
              {screenshot ? 'Screenshot Captured' : 'Capture Screenshot (Optional)'}
            </Button>

            {/* #155 — Privacy notice for screenshot feature */}
            <Typography
              variant="caption"
              display="block"
              sx={{ mt: 0.75, color: 'text.secondary' }}
            >
              Screenshots may include personal data visible on screen. Review before submitting.
            </Typography>

            <Typography
              id="screenshot-helper"
              variant="caption"
              display="block"
              sx={{ mt: 0.5, color: 'text.primary' }}
            >
              {screenshot
                ? 'Screenshot will be included with your feedback'
                : 'Optionally capture a screenshot to help illustrate your feedback'}
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'background.default',
              }}
              aria-live="polite"
            >
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary' }}>
                Included context
              </Typography>
              <Stack spacing={1.5} divider={<Divider flexItem />}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.primary' }} component="div">
                    Current page path
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      color: 'text.primary',
                    }}
                  >
                    {location.pathname}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.primary' }} component="div">
                    Screenshot attachment
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    {screenshot ? 'Attached to this feedback submission' : 'Not attached'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !message.trim() || !!rateLimitedUntil || rateLimitInfo?.remaining === 0}
          startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackDialog;

// Made with Bob

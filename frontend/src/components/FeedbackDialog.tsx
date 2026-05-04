/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useState } from 'react';
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
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ open, onClose }) => {
  const location = useLocation();
  const [feedbackType, setFeedbackType] = useState<string>('improvement');
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    if (!submitting) {
      // Reset form
      setFeedbackType('improvement');
      setRating(null);
      setMessage('');
      setScreenshot(null);
      setError(null);
      setSuccess(false);
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
      setError('Failed to capture screenshot. Please try again.');
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

      await api.post('/feedback', {
        page: location.pathname,
        feedbackType,
        rating,
        message: message.trim(),
        screenshot,
      });

      setSuccess(true);
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error('Feedback submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
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

      <DialogContent dividers>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Thank you for your feedback! It helps us improve the app.
          </Alert>
        ) : (
          <Stack spacing={3}>
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
                <MenuItem value="bug" aria-label="Bug Report">
                  <span aria-hidden="true">🐛</span> Bug Report
                </MenuItem>
                <MenuItem value="feature" aria-label="Feature Request">
                  <span aria-hidden="true">💡</span> Feature Request
                </MenuItem>
                <MenuItem value="improvement" aria-label="Improvement">
                  <span aria-hidden="true">✨</span> Improvement
                </MenuItem>
                <MenuItem value="question" aria-label="Question">
                  <span aria-hidden="true">❓</span> Question
                </MenuItem>
                <MenuItem value="other" aria-label="Other">
                  <span aria-hidden="true">📝</span> Other
                </MenuItem>
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
              rows={4}
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
              <Typography
                id="screenshot-helper"
                variant="caption"
                display="block"
                sx={{ mt: 1, color: 'text.primary' }}
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
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || success || !message.trim()}
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

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
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
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
      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        logging: false,
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
            aria-label="close"
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

            <Typography variant="body2" color="text.secondary">
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
              >
                <MenuItem value="bug">🐛 Bug Report</MenuItem>
                <MenuItem value="feature">💡 Feature Request</MenuItem>
                <MenuItem value="improvement">✨ Improvement</MenuItem>
                <MenuItem value="question">❓ Question</MenuItem>
                <MenuItem value="other">📝 Other</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography component="legend" gutterBottom>
                How would you rate your experience? (Optional)
              </Typography>
              <Rating
                name="rating"
                value={rating}
                onChange={(_, newValue) => setRating(newValue)}
                disabled={submitting}
                size="large"
              />
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
              }}
              helperText={`${message.length}/2000 characters`}
            />

            <Box>
              <Button
                startIcon={<CameraIcon />}
                onClick={captureScreenshot}
                disabled={submitting || !!screenshot}
                variant="outlined"
                size="small"
              >
                {screenshot ? 'Screenshot Captured' : 'Capture Screenshot (Optional)'}
              </Button>
              {screenshot && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Screenshot will be included with your feedback
                </Typography>
              )}
            </Box>

            <Typography variant="caption" color="text.secondary">
              Current page: {location.pathname}
            </Typography>
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

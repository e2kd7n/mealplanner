/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  /** Shown on the confirm button while `loading` is true, e.g. "Deleting…". */
  confirmingLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'error' | 'primary' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Standard destructive-action confirmation dialog (see design principle:
 * "Delete actions require confirmation to prevent accidental data loss").
 * Pair with `useConfirmDialog` rather than managing open/message state ad hoc.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  confirmingLabel = 'Deleting…',
  cancelLabel = 'Cancel',
  confirmColor = 'error',
  loading = false,
  onConfirm,
  onCancel,
}) => (
  <Dialog open={open} onClose={() => !loading && onCancel()} maxWidth="sm" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText component="div">{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button onClick={onConfirm} variant="contained" color={confirmColor} disabled={loading}>
        {loading ? confirmingLabel : confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;

// Made with Bob

/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const shortcuts = getKeyboardShortcuts();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      aria-labelledby="keyboard-shortcuts-title"
    >
      <DialogTitle id="keyboard-shortcuts-title">
        Keyboard Shortcuts
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <List disablePadding>
          {shortcuts.map((shortcut) => (
            <ListItem key={shortcut.keys} disableGutters divider>
              <ListItemText primary={shortcut.description} />
              <Chip label={shortcut.keys} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;

// Made with Bob

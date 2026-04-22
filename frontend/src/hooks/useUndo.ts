/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { useState, useCallback, useRef } from 'react';

interface UndoAction {
  type: string;
  data: any;
  undo: () => Promise<void> | void;
  message: string;
}

interface UseUndoReturn {
  showUndo: (action: UndoAction) => void;
  hideUndo: () => void;
  performUndo: () => Promise<void>;
  undoAction: UndoAction | null;
  isUndoing: boolean;
}

export const useUndo = (autoHideDuration: number = 5000): UseUndoReturn => {
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideUndo = useCallback(() => {
    setUndoAction(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showUndo = useCallback((action: UndoAction) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setUndoAction(action);

    // Auto-hide after duration
    timeoutRef.current = setTimeout(() => {
      hideUndo();
    }, autoHideDuration);
  }, [autoHideDuration, hideUndo]);

  const performUndo = useCallback(async () => {
    if (!undoAction) return;

    setIsUndoing(true);
    try {
      await undoAction.undo();
      hideUndo();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error performing undo:', error);
      throw error;
    } finally {
      setIsUndoing(false);
    }
  }, [undoAction, hideUndo]);

  return {
    showUndo,
    hideUndo,
    performUndo,
    undoAction,
    isUndoing,
  };
};

// Made with Bob
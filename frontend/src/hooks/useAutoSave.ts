/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoSaveOptions {
  key: string;
  data: any;
  delay?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  savedData: any;
  clearSaved: () => void;
  lastSaved: Date | null;
  isSaving: boolean;
}

export const useAutoSave = ({
  key,
  data,
  delay = 30000, // 30 seconds default
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDataRef = useRef<string>('');

  // Load saved data on mount
  const [savedData, setSavedData] = useState(() => {
    if (!enabled) return null;
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading autosave data:', error);
      return null;
    }
  });

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !data) return;

    const currentData = JSON.stringify(data);
    
    // Don't save if data hasn't changed
    if (currentData === previousDataRef.current) return;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      try {
        setIsSaving(true);
        localStorage.setItem(`autosave_${key}`, currentData);
        previousDataRef.current = currentData;
        setLastSaved(new Date());
        setSavedData(data);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error auto-saving data:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, key]);

  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(`autosave_${key}`);
      setSavedData(null);
      setLastSaved(null);
      previousDataRef.current = '';
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error clearing autosave data:', error);
    }
  }, [key]);

  return {
    savedData,
    clearSaved,
    lastSaved,
    isSaving,
  };
};

// Made with Bob
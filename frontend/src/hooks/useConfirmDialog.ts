/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React, { useCallback, useRef, useState } from 'react';

export interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  confirmingLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'error' | 'primary' | 'warning';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

/**
 * Promise-based destructive-action confirmation, pairing with `<ConfirmDialog />`:
 *
 *   const { confirm, confirmDialogProps } = useConfirmDialog();
 *   const ok = await confirm({ title: 'Delete Item', message: `Delete "${name}"?` });
 *   if (!ok) return;
 *   ...
 *   <ConfirmDialog {...confirmDialogProps} />
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setState((s) => (s ? { ...s, open: false } : s));
  }, []);

  const handleConfirm = useCallback(() => close(true), [close]);
  const handleCancel = useCallback(() => close(false), [close]);

  return {
    confirm,
    confirmDialogProps: {
      open: state?.open ?? false,
      title: state?.title ?? '',
      message: state?.message ?? '',
      confirmLabel: state?.confirmLabel,
      confirmingLabel: state?.confirmingLabel,
      cancelLabel: state?.cancelLabel,
      confirmColor: state?.confirmColor,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}

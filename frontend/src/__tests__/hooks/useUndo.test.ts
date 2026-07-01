import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndo } from '../../hooks/useUndo';

describe('useUndo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no undo action', () => {
    const { result } = renderHook(() => useUndo());
    expect(result.current.undoAction).toBeNull();
    expect(result.current.isUndoing).toBe(false);
  });

  it('showUndo sets the undo action', () => {
    const { result } = renderHook(() => useUndo());
    const action = {
      type: 'delete',
      data: { id: '1' },
      undo: vi.fn(),
      message: 'Item deleted',
    };

    act(() => { result.current.showUndo(action); });

    expect(result.current.undoAction).toEqual(action);
  });

  it('hideUndo clears the undo action', () => {
    const { result } = renderHook(() => useUndo());
    const action = {
      type: 'delete',
      data: { id: '1' },
      undo: vi.fn(),
      message: 'Item deleted',
    };

    act(() => { result.current.showUndo(action); });
    act(() => { result.current.hideUndo(); });

    expect(result.current.undoAction).toBeNull();
  });

  it('auto-hides after duration', () => {
    const { result } = renderHook(() => useUndo(3000));
    const action = {
      type: 'delete',
      data: { id: '1' },
      undo: vi.fn(),
      message: 'Item deleted',
    };

    act(() => { result.current.showUndo(action); });
    expect(result.current.undoAction).not.toBeNull();

    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.undoAction).toBeNull();
  });

  it('uses default 5000ms auto-hide duration', () => {
    const { result } = renderHook(() => useUndo());
    const action = {
      type: 'delete',
      data: { id: '1' },
      undo: vi.fn(),
      message: 'Item deleted',
    };

    act(() => { result.current.showUndo(action); });

    act(() => { vi.advanceTimersByTime(4999); });
    expect(result.current.undoAction).not.toBeNull();

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.undoAction).toBeNull();
  });

  it('performUndo calls the undo function', async () => {
    const undoFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useUndo());
    const action = {
      type: 'delete',
      data: { id: '1' },
      undo: undoFn,
      message: 'Item deleted',
    };

    act(() => { result.current.showUndo(action); });
    await act(async () => { await result.current.performUndo(); });

    expect(undoFn).toHaveBeenCalledOnce();
    expect(result.current.undoAction).toBeNull();
  });

  it('performUndo does nothing when no action is set', async () => {
    const { result } = renderHook(() => useUndo());
    await act(async () => { await result.current.performUndo(); });
    expect(result.current.undoAction).toBeNull();
  });

  it('replaces previous undo action when showUndo called again', () => {
    const { result } = renderHook(() => useUndo());
    const action1 = { type: 'a', data: {}, undo: vi.fn(), message: 'First' };
    const action2 = { type: 'b', data: {}, undo: vi.fn(), message: 'Second' };

    act(() => { result.current.showUndo(action1); });
    act(() => { result.current.showUndo(action2); });

    expect(result.current.undoAction?.message).toBe('Second');
  });
});

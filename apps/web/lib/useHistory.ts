"use client";

import { useCallback, useState } from "react";

type HistoryState<T> = { past: T[]; present: T; future: T[] };

// Command-based history over an arbitrary state value (here, the page's
// block tree).
export function useHistory<T>(initial: T) {
  const [state, setState] = useState<HistoryState<T>>({ past: [], present: initial, future: [] });

  const update = useCallback((updater: (prev: T) => T) => {
    setState((s) => {
      const next = updater(s.present);
      if (next === s.present) return s;
      return { past: [...s.past, s.present], present: next, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setState((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      return { past: s.past.slice(0, -1), present: previous, future: [s.present, ...s.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      if (s.future.length === 0) return s;
      const [next, ...rest] = s.future;
      return { past: [...s.past, s.present], present: next, future: rest };
    });
  }, []);

  return {
    present: state.present,
    update,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}

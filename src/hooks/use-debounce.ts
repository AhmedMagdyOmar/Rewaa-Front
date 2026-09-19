/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";

/**
 * Custom hook that returns a debounced version of the provided value.
 * @param value The value to debounce.
 * @param delay The debounce delay in milliseconds (default: 400ms).
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook that returns a debounced version of a callback function.
 * @param callback The function to debounce.
 * @param delay The debounce delay in milliseconds (default: 400ms).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 400,
): ((...args: Parameters<T>) => void) & { cancel: () => void; flush: () => void } {
  const callbackRef = React.useRef(callback);

  React.useEffect(() => {
    callbackRef.current = callback;
  });

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestArgsRef = React.useRef<Parameters<T> | null>(null);

  const cancel = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flush = React.useCallback(() => {
    if (timerRef.current && latestArgsRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      callbackRef.current(...latestArgsRef.current);
      latestArgsRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  const debounced = React.useMemo(() => {
    const fn = (...args: Parameters<T>) => {
      latestArgsRef.current = args;
      cancel();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        callbackRef.current(...args);
        latestArgsRef.current = null;
      }, delay);
    };

    fn.cancel = cancel;
    fn.flush = flush;

    return fn;
  }, [delay, cancel, flush]);

  return debounced;
}

/**
 * Centralized hook for debounced search inputs tied to URL search parameters or state.
 * Manages instant local typing state while debouncing propagation to external callbacks.
 */
export function useDebouncedSearch({
  value,
  onChange,
  delay = 400,
}: {
  value: string;
  onChange: (search: string) => void;
  delay?: number;
}) {
  const [localValue, setLocalValue] = React.useState(value);

  // Keep local value in sync if parent value changes externally (e.g. reset filters)
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedOnChange = useDebouncedCallback(onChange, delay);

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | string) => {
      const nextVal = typeof e === "string" ? e : e.target.value;
      setLocalValue(nextVal);
      debouncedOnChange(nextVal);
    },
    [debouncedOnChange],
  );

  const handleClear = React.useCallback(() => {
    setLocalValue("");
    debouncedOnChange.cancel();
    onChange("");
  }, [debouncedOnChange, onChange]);

  return {
    value: localValue,
    setValue: setLocalValue,
    onChange: handleInputChange,
    onClear: handleClear,
  };
}

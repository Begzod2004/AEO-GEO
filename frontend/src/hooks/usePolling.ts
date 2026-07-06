import { useEffect, useRef } from "react";

/**
 * Poll `fn` on an interval until `done` is satisfied (or `enabled` is false).
 * Used for the async 202 flows (document embedding, scan) where the backend
 * returns immediately and we watch a status/list endpoint.
 */
export function usePolling<T>(
  fn: () => Promise<T>,
  {
    enabled,
    interval = 2000,
    done,
    onTick,
    onError,
  }: {
    enabled: boolean;
    interval?: number;
    done: (value: T) => boolean;
    onTick?: (value: T) => void;
    onError?: (err: unknown) => void;
  },
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const doneRef = useRef(done);
  doneRef.current = done;
  const tickRef = useRef(onTick);
  tickRef.current = onTick;
  const errRef = useRef(onError);
  errRef.current = onError;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: number | undefined;

    const loop = async () => {
      try {
        const value = await fnRef.current();
        if (cancelled) return;
        tickRef.current?.(value);
        if (doneRef.current(value)) return;
      } catch (e) {
        if (cancelled) return;
        errRef.current?.(e);
      }
      if (!cancelled) timer = window.setTimeout(loop, interval);
    };

    void loop();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [enabled, interval]);
}

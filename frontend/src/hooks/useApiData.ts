import { useCallback, useEffect, useState } from "react";
import { apiError } from "@/lib/http";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch data from an async function, re-running when `deps` change.
 * Returns the current state plus a `refetch` that can run silently (no spinner).
 */
export function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const [state, setState] = useState<State<T>>({ data: null, loading: enabled, error: null });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFetch = useCallback(fetcher, deps);

  const load = useCallback(
    async (silent = false) => {
      if (!enabled) return;
      setState((s) => ({ ...s, loading: !silent, error: null }));
      try {
        const data = await stableFetch();
        setState({ data, loading: false, error: null });
      } catch (err) {
        setState((s) => ({ data: s.data, loading: false, error: apiError(err) }));
      }
    },
    [stableFetch, enabled],
  );

  useEffect(() => {
    if (enabled) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, enabled]);

  return {
    ...state,
    refetch: (silent = false) => load(silent),
    setData: (updater: (prev: T | null) => T | null) =>
      setState((s) => ({ ...s, data: updater(s.data) })),
  };
}

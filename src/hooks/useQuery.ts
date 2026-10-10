import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../lib/api";

interface QueryState<T> {
  key: string;
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

export interface QueryResult<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  retry: () => void;
}

export function useQuery<T>(
  key: string,
  queryFn: (fresh: boolean) => Promise<T>,
  refreshToken: number,
): QueryResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<QueryState<T>>({
    key: "",
    data: null,
    error: null,
    loading: true,
  });
  const requestId = useRef(0);
  const seenRefresh = useRef(refreshToken);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    const id = ++requestId.current;
    const fresh = seenRefresh.current !== refreshToken;
    seenRefresh.current = refreshToken;

    setState((current) => ({
      key,
      data: current.key === key ? current.data : null,
      error: null,
      loading: true,
    }));

    queryFn(fresh)
      .then((data) => {
        if (requestId.current !== id) return;
        setState({ key, data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (requestId.current !== id) return;
        const apiError =
          error instanceof ApiError ? error : new ApiError("Something went wrong while loading market data.");
        setState((current) => ({
          key,
          data: current.key === key ? current.data : null,
          error: apiError,
          loading: false,
        }));
      });
  }, [attempt, key, queryFn, refreshToken]);

  return {
    data: state.data,
    error: state.error,
    loading: state.loading,
    retry,
  };
}

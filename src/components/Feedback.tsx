import { AlertTriangle, RefreshCw } from "lucide-react";
import type { ApiError } from "../lib/api";

interface FeedbackProps {
  error: ApiError;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: FeedbackProps) {
  const rateLimited = error.status === 429;

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/5 px-6 py-12 text-center"
    >
      <AlertTriangle className="h-6 w-6 text-rose-300" aria-hidden="true" />
      <h3 className="mt-3 text-base font-medium text-zinc-100">
        {rateLimited ? "Rate limit reached" : "Unable to load data"}
      </h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-zinc-400">{error.message}</p>
      <button type="button" onClick={onRetry} className="btn-solid mt-5">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

export function InlineAlert({ error, onRetry }: FeedbackProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-rose-100">{error.message}</p>
      <button type="button" onClick={onRetry} className="btn-tiny">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

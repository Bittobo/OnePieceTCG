import type { ApiErrorPayload } from '@one-piece-tcg/shared';

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    let payload: ApiErrorPayload | undefined;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = undefined;
    }

    throw new ApiClientError(
      response.status,
      payload?.error.code ?? 'request_failed',
      payload?.error.message ?? `Request failed with status ${response.status}`,
      payload?.error.details,
    );
  }

  return (await response.json()) as T;
}

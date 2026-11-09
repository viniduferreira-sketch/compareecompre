export const ALGOLIA_SERVER_TIMEOUTS = { connect: 10_000, read: 30_000, write: 60_000 } as const;
export const ALGOLIA_CONNECTION_ATTEMPTS = 3;

/** The SDK wraps a single failed gateway host in RetryError. Data/auth errors must not retry. */
export function isAlgoliaConnectionError(error: unknown): boolean {
  return error instanceof Error && (error.name === "RetryError" || error.message.includes("Unreachable hosts"));
}

/** A fresh client clears the SDK's temporarily-down host cache between attempts. */
export async function withAlgoliaConnectionRetry<T, C>(
  operation: (config: C) => Promise<T>,
  getConfig: () => C,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= ALGOLIA_CONNECTION_ATTEMPTS; attempt += 1) {
    try {
      return await operation(getConfig());
    } catch (error) {
      lastError = error;
      if (!isAlgoliaConnectionError(error) || attempt === ALGOLIA_CONNECTION_ATTEMPTS) throw error;
      console.warn("Algolia connection failed; retrying with a fresh client", { attempt });
      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }
  throw lastError;
}

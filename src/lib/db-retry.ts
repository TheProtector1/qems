const TRANSIENT_PRISMA_CODES = new Set([
  "P1001", // database server unreachable
  "P1002", // connection timed out
  "P1008", // operations timed out
  "P1017", // server closed the connection
  "P2024", // timed out fetching a connection from the pool
  "P2034", // transaction conflict / deadlock
]);

function isTransientDbError(error: unknown) {
  const err = error as { code?: string; message?: string };
  if (err?.code && TRANSIENT_PRISMA_CODES.has(err.code)) return true;

  const message = err?.message?.toLowerCase() || "";
  return (
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("socket") ||
    message.includes("prepared statement")
  );
}

export async function withDbRetry<T>(
  label: string,
  operation: () => Promise<T>,
  attempts = 2
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !isTransientDbError(error)) break;

      const delayMs = 150 * attempt;
      console.warn(`[DB_RETRY] ${label} failed; retrying in ${delayMs}ms`, error);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

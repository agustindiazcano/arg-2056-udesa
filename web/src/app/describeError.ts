/** A message for anything that was thrown: it never throws itself, so logging a failure cannot become a second failure. */
export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'symbol') return error.toString();
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error) ?? 'error desconocido';
    } catch {
      return 'error desconocido';
    }
  }
  return 'error desconocido';
}

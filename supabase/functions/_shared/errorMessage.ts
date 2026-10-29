/** Supabase/PostgREST can throw plain objects rather than Error instances. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return typeof error === 'string' ? error : 'Error desconocido';
}

import type { Json } from '@/integrations/supabase/types';

export const jsonObject = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};

/** Serialize typed application records at the JSON persistence boundary. */
export const toJson = (value: unknown): Json => JSON.parse(JSON.stringify(value));

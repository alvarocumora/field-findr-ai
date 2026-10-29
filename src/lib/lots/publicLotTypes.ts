import type { Database } from '@/integrations/supabase/types';

/** The public RPC deliberately excludes private buyer fields. */
export type PublicLot = Database['public']['Functions']['get_public_lots']['Returns'][number];

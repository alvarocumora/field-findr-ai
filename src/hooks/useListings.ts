import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json, Tables, TablesUpdate } from '@/integrations/supabase/types';

export interface Listing {
  contact_phone?: string | null;
  owner_phone?: string | null;
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  type: string;
  price: number;
  currency: string;
  area_m2: number | null;
  area_ha: number | null;
  location: string;
  country: string | null;
  region: string | null;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  images: string[];
  tags: string[];
  utilities: Json;
  zoning: string | null;
  rol: string | null;
  subdivision_eligible: boolean;
  legal_status: string;
  featured: boolean;
  views_count: number;
  status: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListingFilters {
  type?: string[];
  region?: string[];
  country?: string[];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  tags?: string[];
  featured?: boolean;
  /** Include individual lots of a loteo (tagged `loteo`) in the feed. */
  includeLoteoLots?: boolean;
  /** Free-text search resolved server-side over the whole inventory. */
  search?: string;
  /** Exact currency (CLP/UF). Price ranges are only meaningful within one currency. */
  currency?: string;
  status?: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export const useListings = (filters?: ListingFilters) => {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .eq('is_demo', false);

      if (!filters?.includeLoteoLots) {
        query = query.not('tags', 'cs', '{loteo}');
      }

      query = query
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }

      if (filters?.region && filters.region.length > 0) {
        query = query.in('region', filters.region);
      }

      if (filters?.country && filters.country.length > 0) {
        query = query.in('country', filters.country);
      }

      if (filters?.priceMin) {
        query = query.gte('price', filters.priceMin);
      }

      if (filters?.priceMax) {
        query = query.lte('price', filters.priceMax);
      }

      if (filters?.areaMin) {
        query = query.gte('area_m2', filters.areaMin);
      }

      if (filters?.areaMax) {
        query = query.lte('area_m2', filters.areaMax);
      }

      if (filters?.bounds) {
        query = query
          .gte('lat', filters.bounds.south)
          .lte('lat', filters.bounds.north)
          .gte('lng', filters.bounds.west)
          .lte('lng', filters.bounds.east);
      }

      if (filters?.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Listing[];
    },
  });
};

export const useListing = (id: string) => {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Listing | null;
    },
    enabled: !!id,
  });
};

export const useFeaturedListings = (limit = 8) => {
  return useQuery({
    queryKey: ['listings', 'featured', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .eq('is_demo', false)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Listing[];
    },
  });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (listing: {
      title: string;
      type: string;
      price: number;
      location: string;
      user_id?: string;
      country?: string;
      description?: string;
      currency?: string;
      area_m2?: number;
      area_ha?: number;
      region?: string;
      city?: string;
      address?: string;
      lat?: number;
      lng?: number;
      images?: string[];
      tags?: string[];
      utilities?: Json;
      zoning?: string;
      rol?: string;
      subdivision_eligible?: boolean;
      legal_status?: string;
      featured?: boolean;
      status?: string;
      is_demo?: boolean;
    }) => {
      // Server-side quota enforcement via edge function.
      // Returns 403 with { error: 'plan_quota_exceeded', message, limit, used } when over plan.
      const { data, error } = await supabase.functions.invoke('publish-listing', {
        body: { listing },
      });

      if (error) {
        // supabase-js exposes function HTTP errors via FunctionsHttpError with a Response context.
        // Try to surface the server-provided message when available.
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const payload = await ctx.json();
            const message =
              (payload && typeof payload === 'object' && 'message' in payload
                ? String((payload as { message: unknown }).message)
                : (payload as { error?: unknown })?.error) || error.message;
            throw new Error(String(message));
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message) throw parseErr;
          }
        }
        throw error;
      }

      const created = (data as { listing?: unknown })?.listing;
      if (!created) throw new Error('No se recibió la propiedad creada del servidor');
      return created as Tables<'listings'>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      const inReview = (data as { status?: string })?.status === 'pending_review';
      toast({
        title: inReview ? 'Enviada a revisión' : 'Propiedad publicada',
        description: inReview
          ? 'Nuestro equipo revisará tu propiedad y la aprobará en breve. Recibirás una notificación.'
          : 'Tu propiedad ha sido publicada exitosamente.',
      });
    },

    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo publicar la propiedad. Intenta de nuevo.',
        variant: 'destructive',
      });
      console.error('Error creating listing:', error);
    },
  });
};

export const useUpdateListing = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<'listings'> }) => {
      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', data.id] });
      toast({
        title: 'Propiedad actualizada',
        description: 'Los cambios han sido guardados.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la propiedad.',
        variant: 'destructive',
      });
      console.error('Error updating listing:', error);
    },
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast({
        title: 'Propiedad eliminada',
        description: 'La propiedad ha sido eliminada.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la propiedad.',
        variant: 'destructive',
      });
      console.error('Error deleting listing:', error);
    },
  });
};

// Helper functions
export const formatPrice = (price: number, currency = 'CLP') => {
  if (currency === 'CLP') {
    return `$${price.toLocaleString('es-CL')}`;
  }
  if (currency === 'UF') {
    return `UF ${price.toLocaleString('es-CL')}`;
  }
  return `$${price.toLocaleString('en-US')} ${currency}`;
};

export const formatPriceShort = (price: number, currency = 'CLP') => {
  if (currency === 'UF') return `${price.toLocaleString('es-CL', { maximumFractionDigits: 0 })} UF`;
  if (price >= 1_000_000_000) return `$${(price / 1_000_000_000).toFixed(1)}B`;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(0)}M`;
  if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K`;
  return `$${price}`;
};

export const getPricePerM2 = (price: number, areaM2: number | null): number | null => {
  if (!areaM2 || areaM2 <= 0) return null;
  return Math.round(price / areaM2);
};

export const getCountryFlag = (country: string | null): string => {
  if (!country) return '🌎';
  const flags: Record<string, string> = {
    Chile: '🇨🇱', Argentina: '🇦🇷', Colombia: '🇨🇴', México: '🇲🇽', Peru: '🇵🇪', Perú: '🇵🇪',
    Brasil: '🇧🇷', Uruguay: '🇺🇾', Paraguay: '🇵🇾', Ecuador: '🇪🇨', Bolivia: '🇧🇴',
    'Costa Rica': '🇨🇷', Panamá: '🇵🇦', 'República Dominicana': '🇩🇴',
  };
  return flags[country] || '🌎';
};

export const formatArea = (areaM2: number | null, areaHa: number | null) => {
  const ha = areaHa && areaHa > 0 ? areaHa : areaM2 && areaM2 >= 10000 ? areaM2 / 10000 : null;
  if (ha && ha >= 1) {
    return `${ha.toLocaleString('es-CL', { maximumFractionDigits: 2 })} ha`;
  }
  if (areaM2) {
    return `${areaM2.toLocaleString('es-CL')} m²`;
  }
  return 'N/A';
};

export const getListingTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    parcela_rural: 'Parcela Rural',
    sitio_industrial: 'Sitio Industrial',
    campo_agricola: 'Campo Agrícola',
    terreno_urbano: 'Terreno Urbano',
    terreno_costero: 'Terreno Costero',
    terreno_montana: 'Terreno de Montaña',
    inversion: 'Inversión',
  };
  return types[type] || type;
};

export const getLegalStatusLabel = (status: string) => {
  const statuses: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400' },
    reviewing: { label: 'En Revisión', color: 'bg-blue-500/20 text-blue-400' },
    verified: { label: 'Verificado', color: 'bg-green-500/20 text-green-400' },
    rejected: { label: 'Rechazado', color: 'bg-red-500/20 text-red-400' },
  };
  return statuses[status] || { label: status, color: 'bg-muted text-muted-foreground' };
};

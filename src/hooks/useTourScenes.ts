import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface TourHotspot {
  id: string;
  yaw: number;
  pitch: number;
  target_scene_id: string;
  tooltip: string;
  icon?: string;
}

export interface PolygonOverlay {
  id: string;
  name: string;
  lot_id?: string;
  points: { yaw: number; pitch: number }[];
  color: string;
  opacity: number;
}

export interface TourScene {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string | null;
  panorama_url: string;
  thumbnail_url: string | null;
  position_index: number;
  yaw_default: number;
  pitch_default: number;
  hotspots: TourHotspot[];
  polygon_overlays: PolygonOverlay[];
  created_at: string;
}

export function useTourScenes(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const scenesQuery = useQuery({
    queryKey: ['tour-scenes', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('tour_scenes' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('position_index', { ascending: true });
      if (error) throw error;
      return (data || []).map((s: any) => ({
        ...s,
        hotspots: Array.isArray(s.hotspots) ? s.hotspots : [],
        polygon_overlays: Array.isArray(s.polygon_overlays) ? s.polygon_overlays : [],
      })) as TourScene[];
    },
    enabled: !!projectId,
  });

  const uploadPanorama = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${projectId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from('tour-panoramas')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from('tour-panoramas')
      .getPublicUrl(path);
    return urlData.publicUrl;
  };

  const addScene = useMutation({
    mutationFn: async (params: { name: string; file: File; description?: string }) => {
      if (!user || !projectId) throw new Error('No auth');
      const panorama_url = await uploadPanorama(params.file);
      const { data, error } = await supabase
        .from('tour_scenes' as any)
        .insert({
          project_id: projectId,
          user_id: user.id,
          name: params.name,
          description: params.description || null,
          panorama_url,
          position_index: (scenesQuery.data?.length || 0),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-scenes', projectId] });
      toast.success('Escena agregada al tour');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateScene = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<TourScene> }) => {
      const { data, error } = await supabase
        .from('tour_scenes' as any)
        .update(params.updates as any)
        .eq('id', params.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-scenes', projectId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteScene = useMutation({
    mutationFn: async (sceneId: string) => {
      const { error } = await supabase
        .from('tour_scenes' as any)
        .delete()
        .eq('id', sceneId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-scenes', projectId] });
      toast.success('Escena eliminada');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    scenes: scenesQuery.data || [],
    isLoading: scenesQuery.isLoading,
    addScene,
    updateScene,
    deleteScene,
    uploadPanorama,
  };
}

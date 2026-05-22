import { supabase } from '@/integrations/supabase/client';

export const VISUAL_SCENARIOS_STORAGE_BUCKET = 'visual-scenarios';

export const buildVisualScenarioStoragePath = (
  propertyId: string,
  fileName: string,
  folder: 'base' | 'overlay' | 'thumbnail' = 'base',
) => {
  const safePropertyId = propertyId.replace(/[^a-zA-Z0-9-_]/g, '');
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  return `${safePropertyId}/${folder}/${timestamp}-${safeName}`;
};

export const uploadVisualScenarioAsset = async ({
  propertyId,
  file,
  folder = 'base',
}: {
  propertyId: string;
  file: File;
  folder?: 'base' | 'overlay' | 'thumbnail';
}) => {
  const path = buildVisualScenarioStoragePath(propertyId, file.name, folder);

  const storage = (supabase as unknown as {
    storage: {
      from: (bucket: string) => {
        upload: (
          path: string,
          file: File,
          options?: { upsert?: boolean; contentType?: string },
        ) => Promise<{ error: Error | null }>;
        getPublicUrl: (path: string) => {
          data: { publicUrl: string };
        };
        remove: (paths: string[]) => Promise<{ error: Error | null }>;
      };
    };
  }).storage;

  const bucket = storage.from(VISUAL_SCENARIOS_STORAGE_BUCKET);

  const { error } = await bucket.upload(path, file, {
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  });

  if (error) throw error;

  const { data } = bucket.getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
  };
};

export const deleteVisualScenarioAsset = async (path?: string | null) => {
  if (!path) return;

  const storage = (supabase as unknown as {
    storage: {
      from: (bucket: string) => {
        remove: (paths: string[]) => Promise<{ error: Error | null }>;
      };
    };
  }).storage;

  const { error } = await storage
    .from(VISUAL_SCENARIOS_STORAGE_BUCKET)
    .remove([path]);

  if (error) throw error;
};

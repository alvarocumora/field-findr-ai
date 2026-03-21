import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BrochureAIContent } from '@/lib/brochurePdfGenerator';

interface ProjectBrochureInput {
  name: string;
  description?: string;
  location: string;
  region: string;
  city?: string;
  totalLots: number;
  availableLots: number;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  conditions?: {
    min_down_payment_pct?: number;
    max_term_months?: number;
    interest_rate?: number;
    payment_methods?: string[];
    includes_urbanization?: boolean;
    delivery_date?: string;
  };
  features?: string[];
}

export const useBrochureGenerator = () => {
  const [aiContent, setAiContent] = useState<BrochureAIContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateBrochureContent = useCallback(async (projectData: ProjectBrochureInput): Promise<BrochureAIContent | null> => {
    setIsLoading(true);
    setAiContent(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { type: 'generate-brochure', projectData },
      });

      if (error) throw error;
      setAiContent(data as BrochureAIContent);
      return data as BrochureAIContent;
    } catch (error) {
      console.error('Brochure generation error:', error);
      toast.error('Error al generar contenido del brochure');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearContent = useCallback(() => {
    setAiContent(null);
  }, []);

  return { aiContent, isLoading, generateBrochureContent, clearContent };
};

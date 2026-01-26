import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PropertyData {
  area: number;
  location: string;
  features?: string[];
  type?: string;
}

interface PropertyInfo {
  title: string;
  area: string;
  location: string;
  features: string[];
  price?: number;
}

interface PricePrediction {
  estimatedPrice: number;
  pricePerSqm: number;
  confidence: 'alta' | 'media' | 'baja';
  factors: Array<{ factor: string; impact: 'positivo' | 'negativo'; weight: number }>;
  marketAnalysis: string;
  recommendation: string;
}

interface SearchResult {
  intent: 'comprar' | 'arrendar' | 'invertir' | 'información';
  propertyType: string[] | null;
  location: string | null;
  priceRange: { min: number | null; max: number | null };
  areaRange: { min: number | null; max: number | null };
  features: string[];
  keywords: string[];
  suggestion: string;
}

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export const useAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = '';

    try {
      const resp = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'chat',
          messages: [...messages, userMsg],
        }),
      });

      if (!resp.ok || !resp.body) {
        const error = await resp.json();
        throw new Error(error.error || 'Error al conectar con el asistente');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const updateAssistant = (content: string) => {
        assistantContent = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
          }
          return [...prev, { role: 'assistant', content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateAssistant(assistantContent);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al enviar mensaje');
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
};

export const usePricePredictor = () => {
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const predictPrice = useCallback(async (propertyData: PropertyData) => {
    setIsLoading(true);
    setPrediction(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { type: 'predict-price', propertyData },
      });

      if (error) throw error;
      setPrediction(data);
      return data;
    } catch (error) {
      console.error('Price prediction error:', error);
      toast.error('Error al predecir precio');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { prediction, isLoading, predictPrice };
};

export const useSmartSearch = () => {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { type: 'search', searchQuery: query },
      });

      if (error) throw error;
      setResult(data);
      return data;
    } catch (error) {
      console.error('Smart search error:', error);
      toast.error('Error en la búsqueda');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { result, isLoading, search };
};

export const useContentGenerator = () => {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateContent = useCallback(async (
    propertyInfo: PropertyInfo,
    contentType: 'description' | 'marketing' | 'features' = 'description'
  ) => {
    setIsLoading(true);
    setContent(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { type: 'generate-content', propertyInfo, contentType },
      });

      if (error) throw error;
      setContent(data.content);
      return data.content;
    } catch (error) {
      console.error('Content generation error:', error);
      toast.error('Error al generar contenido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { content, isLoading, generateContent };
};

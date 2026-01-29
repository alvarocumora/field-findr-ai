import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PropertyData {
  id: string;
  title: string;
  price: number;
  area_m2?: number | null;
  area_ha?: number | null;
  location: string;
  region?: string | null;
  type: string;
  zoning?: string | null;
  legal_status?: string | null;
  utilities?: Record<string, boolean> | null;
  subdivision_eligible?: boolean | null;
  tags?: string[] | null;
}

interface ScoreBreakdown {
  score: number;
  peso: number;
  comentario: string;
}

export interface InvestmentAnalysis {
  investmentScore: number;
  scoreBreakdown: {
    ubicacion: ScoreBreakdown;
    precio: ScoreBreakdown;
    potencial: ScoreBreakdown;
    legalidad: ScoreBreakdown;
    infraestructura: ScoreBreakdown;
    liquidez: ScoreBreakdown;
  };
  riskLevel: 'bajo' | 'medio' | 'alto';
  riskFactors: string[];
  opportunities: string[];
  plusvaliaProjection: {
    year1: number;
    year3: number;
    year5: number;
    year10: number;
  };
  recommendation: string;
  idealBuyerProfile: string;
}

export interface DueDiligenceItem {
  category: 'Legal' | 'Técnico' | 'Financiero' | 'Ambiental' | 'Urbanístico';
  item: string;
  description: string;
  priority: 'crítico' | 'importante' | 'recomendado';
  estimatedCost: number | null;
  estimatedTime: string;
  whereToGet: string;
  redFlags: string[];
}

export interface DueDiligenceResult {
  checklist: DueDiligenceItem[];
  legalStatus: {
    currentStatus: string;
    concerns: string[];
    recommendations: string[];
  };
  estimatedTotalCost: number;
  estimatedTotalTime: string;
  criticalAlerts: string[];
  nextSteps: string[];
}

export interface MarketComparison {
  pricePerSqm: number;
  marketAverage: number;
  pricePosition: 'por debajo' | 'en promedio' | 'por encima';
  percentageDiff: number;
  comparableProperties: number;
  marketTrend: 'alcista' | 'estable' | 'bajista';
  demandLevel: 'alta' | 'media' | 'baja';
  timeToSell: string;
  negotiationRoom: number;
  seasonalFactors: string;
  competitiveAdvantages: string[];
  competitiveDisadvantages: string[];
}

export interface ROIProjection {
  scenarios: {
    conservador: { roi5Years: number; roi10Years: number; assumptions: string[] };
    moderado: { roi5Years: number; roi10Years: number; assumptions: string[] };
    optimista: { roi5Years: number; roi10Years: number; assumptions: string[] };
  };
  breakEvenPoint: string;
  cashFlowAnalysis: {
    holdingCosts: number;
    potentialIncome: number | null;
    netCashFlow: number;
  };
  exitStrategies: Array<{
    strategy: string;
    description: string;
    expectedReturn: number;
    timeframe: string;
    risk: 'bajo' | 'medio' | 'alto';
  }>;
  recommendation: string;
}

export const useInvestmentCopilot = () => {
  const [investmentAnalysis, setInvestmentAnalysis] = useState<InvestmentAnalysis | null>(null);
  const [dueDiligence, setDueDiligence] = useState<DueDiligenceResult | null>(null);
  const [marketComparison, setMarketComparison] = useState<MarketComparison | null>(null);
  const [roiProjection, setRoiProjection] = useState<ROIProjection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);

  const analyzeInvestment = useCallback(async (property: PropertyData) => {
    setIsLoading(true);
    setActiveAnalysis('investment');
    setInvestmentAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-investment-copilot', {
        body: { type: 'analyze-investment', property },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setInvestmentAnalysis(data);
      return data;
    } catch (error) {
      console.error('Investment analysis error:', error);
      toast.error('Error al analizar la inversión');
      return null;
    } finally {
      setIsLoading(false);
      setActiveAnalysis(null);
    }
  }, []);

  const getDueDiligence = useCallback(async (property: PropertyData) => {
    setIsLoading(true);
    setActiveAnalysis('due-diligence');
    setDueDiligence(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-investment-copilot', {
        body: { type: 'due-diligence', property },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setDueDiligence(data);
      return data;
    } catch (error) {
      console.error('Due diligence error:', error);
      toast.error('Error al generar checklist de due diligence');
      return null;
    } finally {
      setIsLoading(false);
      setActiveAnalysis(null);
    }
  }, []);

  const getMarketComparison = useCallback(async (property: PropertyData) => {
    setIsLoading(true);
    setActiveAnalysis('market');
    setMarketComparison(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-investment-copilot', {
        body: { type: 'market-comparison', property },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setMarketComparison(data);
      return data;
    } catch (error) {
      console.error('Market comparison error:', error);
      toast.error('Error al analizar el mercado');
      return null;
    } finally {
      setIsLoading(false);
      setActiveAnalysis(null);
    }
  }, []);

  const getROIProjection = useCallback(async (property: PropertyData) => {
    setIsLoading(true);
    setActiveAnalysis('roi');
    setRoiProjection(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-investment-copilot', {
        body: { type: 'roi-projection', property },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setRoiProjection(data);
      return data;
    } catch (error) {
      console.error('ROI projection error:', error);
      toast.error('Error al proyectar ROI');
      return null;
    } finally {
      setIsLoading(false);
      setActiveAnalysis(null);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setInvestmentAnalysis(null);
    setDueDiligence(null);
    setMarketComparison(null);
    setRoiProjection(null);
  }, []);

  return {
    investmentAnalysis,
    dueDiligence,
    marketComparison,
    roiProjection,
    isLoading,
    activeAnalysis,
    analyzeInvestment,
    getDueDiligence,
    getMarketComparison,
    getROIProjection,
    clearAnalysis,
  };
};

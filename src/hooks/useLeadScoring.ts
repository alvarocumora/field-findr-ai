import { useMemo } from 'react';
import { Lead } from './useLeads';

export interface LeadScoreInfo {
  score: number;
  level: 'hot' | 'warm' | 'cold';
  label: string;
  color: string;
  bgColor: string;
  breakdown: Record<string, number>;
}

const SCORE_LABELS: Record<string, string> = {
  email: 'Email registrado',
  phone: 'Teléfono registrado',
  budget: 'Presupuesto definido',
  area_pref: 'Preferencia de área',
  status: 'Estado del lead',
  follow_up: 'Seguimiento agendado',
  notes: 'Notas de interacción',
  project: 'Proyecto asociado',
  lot: 'Lote específico',
};

export const getScoreLevel = (score: number): LeadScoreInfo['level'] => {
  if (score >= 60) return 'hot';
  if (score >= 30) return 'warm';
  return 'cold';
};

export const getScoreConfig = (score: number) => {
  const level = getScoreLevel(score);
  switch (level) {
    case 'hot':
      return { level, label: '🔥 Caliente', color: 'text-red-600', bgColor: 'bg-red-100' };
    case 'warm':
      return { level, label: '🌤️ Tibio', color: 'text-amber-600', bgColor: 'bg-amber-100' };
    case 'cold':
      return { level, label: '❄️ Frío', color: 'text-blue-600', bgColor: 'bg-blue-100' };
  }
};

export const getLeadScoreInfo = (lead: Lead): LeadScoreInfo => {
  const score = (lead as any).lead_score ?? 0;
  const breakdown = ((lead as any).score_breakdown as Record<string, number>) ?? {};
  const config = getScoreConfig(score);
  return { score, breakdown, ...config };
};

export const SCORE_LABEL_MAP = SCORE_LABELS;

export const useLeadScoring = (leads: Lead[]) => {
  const scoredLeads = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      scoreInfo: getLeadScoreInfo(lead),
    })).sort((a, b) => b.scoreInfo.score - a.scoreInfo.score);
  }, [leads]);

  const stats = useMemo(() => {
    const hot = scoredLeads.filter(l => l.scoreInfo.level === 'hot').length;
    const warm = scoredLeads.filter(l => l.scoreInfo.level === 'warm').length;
    const cold = scoredLeads.filter(l => l.scoreInfo.level === 'cold').length;
    const avgScore = scoredLeads.length > 0
      ? Math.round(scoredLeads.reduce((acc, l) => acc + l.scoreInfo.score, 0) / scoredLeads.length)
      : 0;
    return { hot, warm, cold, avgScore };
  }, [scoredLeads]);

  return { scoredLeads, stats };
};

import { memo, useState, useCallback } from 'react';
import { Zap, TrendingUp, Scissors, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '@/hooks/useListings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Opportunity {
  listing_id: string;
  type: 'below_market' | 'high_growth' | 'subdivision' | 'urgent';
  title: string;
  reason: string;
  confidence: number;
}

interface OpportunityAlertsProps {
  listings: Listing[];
  onSelectListing?: (listing: Listing) => void;
  className?: string;
}

const typeConfig = {
  below_market: { icon: TrendingUp, label: 'Bajo mercado', color: 'text-emerald-500 bg-emerald-500/10' },
  high_growth: { icon: Sparkles, label: 'Alto crecimiento', color: 'text-blue-500 bg-blue-500/10' },
  subdivision: { icon: Scissors, label: 'Subdivisión', color: 'text-purple-500 bg-purple-500/10' },
  urgent: { icon: AlertTriangle, label: 'Urgente', color: 'text-amber-500 bg-amber-500/10' },
};

const OpportunityAlerts = memo(({ listings, onSelectListing, className }: OpportunityAlertsProps) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const detectOpportunities = useCallback(async () => {
    if (listings.length === 0) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-opportunity-alerts', {
        body: { listings },
      });
      if (error) throw error;
      setOpportunities(data?.opportunities || []);
      setHasLoaded(true);
      if (!data?.opportunities?.length) {
        toast.info('No se detectaron oportunidades destacadas en estos terrenos');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al analizar oportunidades');
    } finally {
      setIsLoading(false);
    }
  }, [listings]);

  const handleClick = useCallback((opp: Opportunity) => {
    const listing = listings.find(l => l.id === opp.listing_id);
    if (listing && onSelectListing) onSelectListing(listing);
  }, [listings, onSelectListing]);

  if (!hasLoaded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={detectOpportunities}
        disabled={isLoading || listings.length === 0}
        className={cn('gap-2 h-8 text-xs', className)}
      >
        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
        {isLoading ? 'Analizando...' : 'Detectar oportunidades IA'}
      </Button>
    );
  }

  if (opportunities.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-semibold">Oportunidades detectadas</span>
        <Button variant="ghost" size="sm" onClick={detectOpportunities} disabled={isLoading} className="h-6 text-[10px] ml-auto">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Actualizar'}
        </Button>
      </div>
      <AnimatePresence>
        {opportunities.map((opp, i) => {
          const config = typeConfig[opp.type] || typeConfig.below_market;
          const Icon = config.icon;
          return (
            <motion.button
              key={opp.listing_id + opp.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleClick(opp)}
              className="w-full text-left p-2.5 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-accent/50 transition-all"
            >
              <div className="flex items-start gap-2">
                <div className={cn('p-1 rounded-md', config.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold truncate">{opp.title}</span>
                    <Badge variant="outline" className="text-[9px] h-4 flex-shrink-0">{opp.confidence}%</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{opp.reason}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

OpportunityAlerts.displayName = 'OpportunityAlerts';
export default OpportunityAlerts;

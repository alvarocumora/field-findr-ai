import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLots, Lot } from '@/hooks/useLots';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { RefreshCw, Circle, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface RealtimeInventoryPanelProps {
  projectId: string;
}

const STATUS_CONFIG = {
  available: { label: 'Disponible', color: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  reserved: { label: 'Reservado', color: 'bg-amber-500', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  sold: { label: 'Vendido', color: 'bg-rose-500', border: 'border-rose-500/30', text: 'text-rose-400', glow: 'shadow-rose-500/20' },
};

const RealtimeInventoryPanel = ({ projectId }: RealtimeInventoryPanelProps) => {
  const { lots, isLoading, updateLot } = useLots(projectId);
  const [realtimeLots, setRealtimeLots] = useState<Lot[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Sync initial data
  useEffect(() => {
    setRealtimeLots(lots);
  }, [lots]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`lots-realtime-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lots', filter: `project_id=eq.${projectId}` },
        (payload) => {
          setLastUpdate(new Date());
          
          if (payload.eventType === 'UPDATE') {
            setRealtimeLots(prev =>
              prev.map(lot => lot.id === (payload.new as Lot).id ? (payload.new as Lot) : lot)
            );
            const updated = payload.new as Lot;
            toast.info(`Lote #${updated.lot_number} → ${STATUS_CONFIG[updated.status as keyof typeof STATUS_CONFIG]?.label || updated.status}`);
          } else if (payload.eventType === 'INSERT') {
            setRealtimeLots(prev => [...prev, payload.new as Lot]);
          } else if (payload.eventType === 'DELETE') {
            setRealtimeLots(prev => prev.filter(l => l.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  const handleStatusChange = useCallback(async (lotId: string, newStatus: string) => {
    try {
      await updateLot.mutateAsync({ id: lotId, status: newStatus });
    } catch (err) {
      // Error handled by mutation
    }
  }, [updateLot]);

  const stats = {
    available: realtimeLots.filter(l => l.status === 'available').length,
    reserved: realtimeLots.filter(l => l.status === 'reserved').length,
    sold: realtimeLots.filter(l => l.status === 'sold').length,
    total: realtimeLots.length,
  };

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Inventario en Tiempo Real</h3>
            {lastUpdate && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Última actualización: {lastUpdate.toLocaleTimeString('es-CL')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">LIVE</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className={cn('rounded-lg p-2 border', cfg.border, 'bg-background/30')}>
              <div className="flex items-center gap-1.5">
                <div className={cn('h-2 w-2 rounded-full', cfg.color)} />
                <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
              </div>
              <p className={cn('text-lg font-bold mt-0.5', cfg.text)}>
                {stats[key as keyof typeof stats]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lot grid */}
      <ScrollArea className="h-[400px]">
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {realtimeLots
            .sort((a, b) => a.lot_number.localeCompare(b.lot_number, undefined, { numeric: true }))
            .map(lot => {
              const status = (lot.status || 'available') as keyof typeof STATUS_CONFIG;
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.available;
              
              return (
                <div
                  key={lot.id}
                  className={cn(
                    'rounded-xl border p-3 transition-all hover:shadow-lg cursor-pointer',
                    cfg.border, cfg.glow, 'bg-background/40 backdrop-blur-sm'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground">#{lot.lot_number}</span>
                    <div className={cn('h-2.5 w-2.5 rounded-full', cfg.color)} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-1">
                    {lot.area.toLocaleString('es-CL')} m²
                  </p>
                  {lot.price && (
                    <p className="text-[11px] font-medium text-foreground">
                      ${lot.price.toLocaleString('es-CL')}
                    </p>
                  )}

                  {/* Quick status buttons */}
                  <div className="flex gap-1 mt-2">
                    {Object.entries(STATUS_CONFIG).map(([s, sc]) => (
                      <button
                        key={s}
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(lot.id, s); }}
                        disabled={lot.status === s}
                        className={cn(
                          'flex-1 h-5 rounded text-[8px] font-medium transition-all border',
                          lot.status === s
                            ? cn(sc.color, 'text-white border-transparent')
                            : 'bg-transparent border-border/30 text-muted-foreground hover:border-border'
                        )}
                      >
                        {sc.label.substring(0, 4)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default RealtimeInventoryPanel;

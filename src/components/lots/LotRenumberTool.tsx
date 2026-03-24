import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Hash, Check, X, RotateCcw, ArrowRight } from 'lucide-react';

interface LotRenumberToolProps {
  lots: { id: string; lot_number: string; area: number; status: string | null }[];
  selectedLot: { id: string; lot_number: string } | null;
  onLotUpdated: () => void;
  onFinish: () => void;
}

interface ChangeLog {
  lotId: string;
  oldNumber: string;
  newNumber: string;
}

export const LotRenumberTool = ({ lots, selectedLot, onLotUpdated, onFinish }: LotRenumberToolProps) => {
  const [newNumber, setNewNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [changeLog, setChangeLog] = useState<ChangeLog[]>([]);

  const isDuplicate = newNumber && lots.some(
    l => l.lot_number === newNumber && l.id !== selectedLot?.id
  );

  const handleConfirm = async () => {
    if (!selectedLot || !newNumber || isDuplicate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('lots')
        .update({ lot_number: newNumber, name: `Lote-${newNumber}` })
        .eq('id', selectedLot.id);

      if (error) throw error;

      setChangeLog(prev => [...prev, {
        lotId: selectedLot.id,
        oldNumber: selectedLot.lot_number,
        newNumber,
      }]);
      setNewNumber('');
      toast.success(`Lote ${selectedLot.lot_number} → ${newNumber}`);
      onLotUpdated();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 glass rounded-lg space-y-4 w-72">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Hash className="h-4 w-4 text-primary" />
          Renumerar Lotes
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onFinish}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Haz clic en un polígono del mapa para seleccionarlo, luego escribe el número correcto del plano.
      </p>

      {selectedLot ? (
        <div className="space-y-3 border border-border rounded-lg p-3 bg-card">
          <div className="text-sm">
            <span className="text-muted-foreground">Seleccionado: </span>
            <span className="font-semibold">Lote {selectedLot.lot_number}</span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nuevo número</Label>
            <div className="flex gap-2">
              <Input
                value={newNumber}
                onChange={e => setNewNumber(e.target.value)}
                placeholder="Ej: 1"
                className="h-8 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              />
              <Button
                size="sm"
                className="h-8 px-3"
                onClick={handleConfirm}
                disabled={!newNumber || isDuplicate || saving}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
            {isDuplicate && (
              <p className="text-xs text-destructive">Ese número ya existe en otro lote</p>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground">
          Selecciona un polígono en el mapa
        </div>
      )}

      {/* Change log */}
      {changeLog.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Cambios ({changeLog.length})</Label>
          <ScrollArea className="max-h-32">
            <div className="space-y-1">
              {changeLog.map((c, i) => (
                <div key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted">
                  <span className="text-muted-foreground">Lote {c.oldNumber}</span>
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <span className="font-medium">{c.newNumber}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full gap-2" onClick={onFinish}>
        <RotateCcw className="h-4 w-4" />
        Finalizar Renumeración
      </Button>
    </div>
  );
};

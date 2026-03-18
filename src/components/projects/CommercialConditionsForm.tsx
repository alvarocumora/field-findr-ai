import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Percent, Calendar, CreditCard, Landmark, X } from 'lucide-react';
import { useState } from 'react';

export interface CommercialConditions {
  min_down_payment_pct: number;
  max_term_months: number;
  interest_rate: number;
  payment_methods: string[];
  currency: string;
  includes_urbanization: boolean;
  delivery_date: string;
  notes: string;
}

const DEFAULT_CONDITIONS: CommercialConditions = {
  min_down_payment_pct: 20,
  max_term_months: 120,
  interest_rate: 0.8,
  payment_methods: ['transferencia'],
  currency: 'CLP',
  includes_urbanization: false,
  delivery_date: '',
  notes: '',
};

const PAYMENT_OPTIONS = ['transferencia', 'cheque', 'financiamiento directo', 'crédito hipotecario', 'tarjeta'];

interface Props {
  value: CommercialConditions;
  onChange: (v: CommercialConditions) => void;
}

export const CommercialConditionsForm = ({ value, onChange }: Props) => {
  const data = { ...DEFAULT_CONDITIONS, ...value };
  const update = (partial: Partial<CommercialConditions>) => onChange({ ...data, ...partial });

  const toggleMethod = (method: string) => {
    const methods = data.payment_methods.includes(method)
      ? data.payment_methods.filter(m => m !== method)
      : [...data.payment_methods, method];
    update({ payment_methods: methods });
  };

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Define las condiciones comerciales que verán los compradores en la ficha del proyecto.
      </p>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5" /> Pie Mínimo (%)
          </Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={data.min_down_payment_pct}
            onChange={e => update({ min_down_payment_pct: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Plazo Máximo (meses)
          </Label>
          <Input
            type="number"
            min={1}
            value={data.max_term_months}
            onChange={e => update({ max_term_months: parseInt(e.target.value) || 12 })}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Landmark className="h-3.5 w-3.5" /> Tasa Mensual (%)
          </Label>
          <Input
            type="number"
            step={0.01}
            min={0}
            value={data.interest_rate}
            onChange={e => update({ interest_rate: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" /> Métodos de Pago
        </Label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map(method => (
            <Badge
              key={method}
              variant={data.payment_methods.includes(method) ? 'default' : 'outline'}
              className="cursor-pointer capitalize"
              onClick={() => toggleMethod(method)}
            >
              {method}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha Estimada de Entrega</Label>
          <Input
            type="date"
            value={data.delivery_date}
            onChange={e => update({ delivery_date: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch
            checked={data.includes_urbanization}
            onCheckedChange={v => update({ includes_urbanization: v })}
          />
          <Label>Incluye urbanización</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notas Comerciales</Label>
        <Textarea
          placeholder="Ej: Precios incluyen IVA. Escrituración a cargo del comprador..."
          value={data.notes}
          onChange={e => update({ notes: e.target.value })}
          rows={2}
        />
      </div>
    </div>
  );
};

export { DEFAULT_CONDITIONS };

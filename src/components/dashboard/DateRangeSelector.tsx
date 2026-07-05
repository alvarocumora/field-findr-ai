import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DateRange } from '@/hooks/useDashboardData';

export type RangePreset = 'today' | '7d' | '30d' | '90d' | 'ytd' | 'custom';

export const presetToRange = (preset: RangePreset, custom?: DateRange): DateRange => {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'today':
      return { from, to };
    case '7d':
      from.setDate(from.getDate() - 6);
      return { from, to };
    case '30d':
      from.setDate(from.getDate() - 29);
      return { from, to };
    case '90d':
      from.setDate(from.getDate() - 89);
      return { from, to };
    case 'ytd':
      return { from: new Date(new Date().getFullYear(), 0, 1), to };
    case 'custom':
      return custom ?? { from, to };
  }
};

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: '90d', label: '90 días' },
  { id: 'ytd', label: 'YTD' },
];

interface Props {
  preset: RangePreset;
  range: DateRange;
  onChange: (preset: RangePreset, range: DateRange) => void;
  className?: string;
}

export const DateRangeSelector = ({ preset, range, onChange, className }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {PRESETS.map(p => (
        <Button
          key={p.id}
          size="sm"
          variant={preset === p.id ? 'default' : 'outline'}
          onClick={() => onChange(p.id, presetToRange(p.id))}
          className="h-8 text-xs"
        >
          {p.label}
        </Button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={preset === 'custom' ? 'default' : 'outline'}
            className="h-8 text-xs gap-1.5"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {preset === 'custom'
              ? `${format(range.from, 'd MMM', { locale: es })} – ${format(range.to, 'd MMM', { locale: es })}`
              : 'Personalizado'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={{ from: range.from, to: range.to }}
            onSelect={(r) => {
              if (r?.from && r?.to) {
                const from = new Date(r.from);
                from.setHours(0, 0, 0, 0);
                const to = new Date(r.to);
                to.setHours(23, 59, 59, 999);
                onChange('custom', { from, to });
                setOpen(false);
              }
            }}
            numberOfMonths={2}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangeSelector;

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllCurrencies } from '@/lib/latam';

interface CurrencySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  currencies?: string[];
  className?: string;
}

export const CurrencySelector = ({
  value,
  onValueChange,
  currencies = ['CLP', 'UF', 'USD'],
  className,
}: CurrencySelectorProps) => {
  const allCurrencies = getAllCurrencies();
  const filtered = allCurrencies.filter(c => currencies.includes(c.code));

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {filtered.map(c => (
          <SelectItem key={c.code} value={c.code}>
            {c.symbol} {c.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

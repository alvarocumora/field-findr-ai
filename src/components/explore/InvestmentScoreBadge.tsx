import { memo, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { Listing } from '@/hooks/useListings';
import { calculateInvestmentScore } from '@/lib/investmentScore';
import { cn } from '@/lib/utils';

interface InvestmentScoreBadgeProps {
  listing: Listing;
  className?: string;
}

const InvestmentScoreBadge = memo(({ listing, className }: InvestmentScoreBadgeProps) => {
  const { score, color } = useMemo(() => calculateInvestmentScore(listing), [listing]);

  const bgColor = score >= 75 ? 'bg-emerald-500/20' : score >= 55 ? 'bg-blue-500/20' : score >= 35 ? 'bg-amber-500/20' : 'bg-red-500/20';

  return (
    <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold', bgColor, color, className)}>
      <TrendingUp className="h-2.5 w-2.5" />
      {score}
    </div>
  );
});

InvestmentScoreBadge.displayName = 'InvestmentScoreBadge';
export default InvestmentScoreBadge;

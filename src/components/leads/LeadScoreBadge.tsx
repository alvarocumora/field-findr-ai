import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { getLeadScoreInfo, SCORE_LABEL_MAP } from '@/hooks/useLeadScoring';
import { Lead } from '@/hooks/useLeads';

interface LeadScoreBadgeProps {
  lead: Lead;
  showBreakdown?: boolean;
}

const LeadScoreBadge = ({ lead, showBreakdown = true }: LeadScoreBadgeProps) => {
  const info = getLeadScoreInfo(lead);

  const badge = (
    <Badge className={`${info.bgColor} ${info.color} border-0 font-semibold gap-1 cursor-default`}>
      {info.label} · {info.score}
    </Badge>
  );

  if (!showBreakdown) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="bottom" className="w-64 p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Lead Score</span>
              <span className={info.color}>{info.score}/100</span>
            </div>
            <Progress value={info.score} className="h-2" />
            <div className="space-y-1 pt-1">
              {Object.entries(info.breakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{SCORE_LABEL_MAP[key] || key}</span>
                  <span className="font-medium">+{value}</span>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LeadScoreBadge;

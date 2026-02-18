import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DemandHeatmapToggleProps {
  active: boolean;
  onToggle: () => void;
}

const DemandHeatmapToggle = ({ active, onToggle }: DemandHeatmapToggleProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant={active ? 'default' : 'secondary'}
            onClick={onToggle}
            className="shadow-lg"
          >
            <Flame className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{active ? 'Ocultar' : 'Mostrar'} mapa de demanda</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DemandHeatmapToggle;

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface InventoryStatsProps {
  distribution: {
    name: string;
    value: number;
    color: string;
  }[];
  totalValue?: number;
  averagePrice?: number;
  priceChange?: number;
  totalArea?: number;
  className?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

const formatArea = (value: number) => {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)} há`;
  }
  return `${value.toLocaleString()} m²`;
};

export const InventoryStats = ({
  distribution,
  totalValue,
  averagePrice,
  priceChange,
  totalArea,
  className
}: InventoryStatsProps) => {
  const total = distribution.reduce((sum, item) => sum + item.value, 0);
  
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: InventoryStatsProps['distribution'][number] }[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-popover border rounded-lg px-3 py-2 shadow-lg">
          <p className="font-medium text-sm">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            {data.value} propiedades ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-4', className)}>
      {/* Distribution Chart */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Distribución por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {distribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-muted-foreground">{item.name}</span>
                <span className="font-medium ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Key Metrics */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Métricas Clave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Total Value */}
            {totalValue !== undefined && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">Valor Total Inventario</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(totalValue)}
                </p>
              </div>
            )}
            
            {/* Average Price */}
            {averagePrice !== undefined && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/10">
                <p className="text-xs text-muted-foreground mb-1">Precio Promedio</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-accent">
                    {formatCurrency(averagePrice)}
                  </p>
                  {priceChange !== undefined && (
                    <span className={cn(
                      'flex items-center text-xs font-medium mb-1',
                      priceChange > 0 ? 'text-green-600' : 
                      priceChange < 0 ? 'text-red-600' : 'text-muted-foreground'
                    )}>
                      {priceChange > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                      ) : priceChange < 0 ? (
                        <TrendingDown className="h-3 w-3 mr-0.5" />
                      ) : (
                        <Minus className="h-3 w-3 mr-0.5" />
                      )}
                      {Math.abs(priceChange)}%
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Total Area */}
            {totalArea !== undefined && (
              <div className="p-4 rounded-xl bg-muted/50 border col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Área Total Disponible</p>
                    <p className="text-2xl font-bold">{formatArea(totalArea)}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Promedio por lote</p>
                    <p className="font-medium text-foreground">
                      {total > 0 ? formatArea(Math.round(totalArea / total)) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryStats;

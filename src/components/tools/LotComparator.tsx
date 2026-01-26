import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Scale, MapPin, DollarSign, Maximize2, Droplets, Zap, Check, Minus } from 'lucide-react';

interface Lot {
  id: string;
  name: string;
  location: string;
  area: number;
  price: number;
  pricePerSqm: number;
  status: 'available' | 'reserved' | 'sold';
  features: string[];
  hasWater: boolean;
  hasElectricity: boolean;
  hasRoad: boolean;
}

interface LotComparatorProps {
  lots?: Lot[];
  onRemove?: (id: string) => void;
  onAdd?: () => void;
  maxLots?: number;
}

const DEMO_LOTS: Lot[] = [
  {
    id: '1',
    name: 'Lote A-1 Premium',
    location: 'Casablanca, Valparaíso',
    area: 5000,
    price: 85000000,
    pricePerSqm: 17000,
    status: 'available',
    features: ['Vista panorámica', 'Orientación norte', 'Plano'],
    hasWater: true,
    hasElectricity: true,
    hasRoad: true,
  },
  {
    id: '2',
    name: 'Lote B-2 Vista',
    location: 'Pirque, Santiago',
    area: 6500,
    price: 120000000,
    pricePerSqm: 18461,
    status: 'available',
    features: ['Vista cordillera', 'Bosque nativo', 'Quebrada'],
    hasWater: true,
    hasElectricity: false,
    hasRoad: true,
  },
  {
    id: '3',
    name: 'Lote C-3 Agrícola',
    location: 'Melipilla, Santiago',
    area: 10000,
    price: 95000000,
    pricePerSqm: 9500,
    status: 'available',
    features: ['Riego por goteo', 'Galpón', 'Cerco completo'],
    hasWater: true,
    hasElectricity: true,
    hasRoad: false,
  },
];

export const LotComparator = ({ 
  lots = DEMO_LOTS, 
  onRemove, 
  onAdd,
  maxLots = 4 
}: LotComparatorProps) => {
  const [selectedLots, setSelectedLots] = useState<Lot[]>(lots.slice(0, 3));

  const handleRemove = (id: string) => {
    setSelectedLots(prev => prev.filter(lot => lot.id !== id));
    onRemove?.(id);
  };

  const findBestValue = (accessor: (lot: Lot) => number, lowest = true) => {
    if (selectedLots.length === 0) return null;
    const values = selectedLots.map(accessor);
    return lowest ? Math.min(...values) : Math.max(...values);
  };

  const bestPricePerSqm = findBestValue(l => l.pricePerSqm, true);
  const bestArea = findBestValue(l => l.area, false);
  const bestPrice = findBestValue(l => l.price, true);

  const FeatureIcon = ({ value }: { value: boolean }) => (
    value ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <Minus className="h-4 w-4 text-muted-foreground" />
    )
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Comparador de Lotes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Compara hasta {maxLots} lotes lado a lado
              </p>
            </div>
          </div>
          {selectedLots.length < maxLots && (
            <Button variant="outline" size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar lote
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[600px]">
            {/* Headers */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedLots.length}, 1fr)` }}>
              <div className="font-medium text-sm text-muted-foreground py-2">Características</div>
              {selectedLots.map(lot => (
                <Card key={lot.id} className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm"
                    onClick={() => handleRemove(lot.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <CardContent className="p-4">
                    <h4 className="font-semibold truncate">{lot.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {lot.location}
                    </div>
                    <Badge 
                      variant={lot.status === 'available' ? 'default' : 'secondary'}
                      className="mt-2"
                    >
                      {lot.status === 'available' ? 'Disponible' : lot.status === 'reserved' ? 'Reservado' : 'Vendido'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Price */}
            <div className="grid gap-4 items-center py-2" style={{ gridTemplateColumns: `200px repeat(${selectedLots.length}, 1fr)` }}>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Precio
              </div>
              {selectedLots.map(lot => (
                <div key={lot.id} className="text-center">
                  <span className={`font-bold ${lot.price === bestPrice ? 'text-green-600' : ''}`}>
                    ${lot.price.toLocaleString('es-CL')}
                  </span>
                  {lot.price === bestPrice && (
                    <Badge variant="outline" className="ml-2 text-xs">Mejor</Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Area */}
            <div className="grid gap-4 items-center py-2 bg-muted/30 rounded" style={{ gridTemplateColumns: `200px repeat(${selectedLots.length}, 1fr)` }}>
              <div className="flex items-center gap-2 text-sm pl-2">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
                Superficie
              </div>
              {selectedLots.map(lot => (
                <div key={lot.id} className="text-center">
                  <span className={lot.area === bestArea ? 'font-bold text-green-600' : ''}>
                    {lot.area.toLocaleString()} m²
                  </span>
                  {lot.area === bestArea && (
                    <Badge variant="outline" className="ml-2 text-xs">Mayor</Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Price per sqm */}
            <div className="grid gap-4 items-center py-2" style={{ gridTemplateColumns: `200px repeat(${selectedLots.length}, 1fr)` }}>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Precio/m²
              </div>
              {selectedLots.map(lot => (
                <div key={lot.id} className="text-center">
                  <span className={lot.pricePerSqm === bestPricePerSqm ? 'font-bold text-green-600' : ''}>
                    ${lot.pricePerSqm.toLocaleString('es-CL')}
                  </span>
                  {lot.pricePerSqm === bestPricePerSqm && (
                    <Badge variant="outline" className="ml-2 text-xs">Mejor</Badge>
                  )}
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Services */}
            <div className="grid gap-4 items-center py-2" style={{ gridTemplateColumns: `200px repeat(${selectedLots.length}, 1fr)` }}>
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                Agua
              </div>
              {selectedLots.map(lot => (
                <div key={lot.id} className="flex justify-center">
                  <FeatureIcon value={lot.hasWater} />
                </div>
              ))}
            </div>

            <div className="grid gap-4 items-center py-2 bg-muted/30 rounded" style={{ gridTemplateColumns: `200px repeat(${selectedLots.length}, 1fr)` }}>
              <div className="flex items-center gap-2 text-sm pl-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                Electricidad
              </div>
              {selectedLots.map(lot => (
                <div key={lot.id} className="flex justify-center">
                  <FeatureIcon value={lot.hasElectricity} />
                </div>
              ))}
            </div>

            <div className="grid gap-4 items-center py-2" style={{ gridTemplateColumns: `200px repeat(${selectedLots.length}, 1fr)` }}>
              <div className="flex items-center gap-2 text-sm">
                🛣️ Acceso
              </div>
              {selectedLots.map(lot => (
                <div key={lot.id} className="flex justify-center">
                  <FeatureIcon value={lot.hasRoad} />
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Features */}
            <div className="grid gap-4 py-2" style={{ gridTemplateColumns: `200px repeat(${selectedLots.length}, 1fr)` }}>
              <div className="text-sm font-medium">Características</div>
              {selectedLots.map(lot => (
                <div key={lot.id} className="flex flex-wrap gap-1">
                  {lot.features.map((feature, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

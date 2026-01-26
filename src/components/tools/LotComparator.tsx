import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { X, Plus, Scale, MapPin, DollarSign, Maximize2, Droplets, Zap, Check, Minus, Loader2 } from 'lucide-react';
import { useLots, Lot, parseLotFeatures } from '@/hooks/useLots';
import { useProjects } from '@/hooks/useProjects';

export const LotComparator = () => {
  const { lots, isLoading } = useLots();
  const { projects } = useProjects();
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const maxLots = 4;

  const selectedLots = lots.filter(l => selectedLotIds.includes(l.id));
  const availableToAdd = lots.filter(l => !selectedLotIds.includes(l.id));

  const handleRemove = (id: string) => {
    setSelectedLotIds(prev => prev.filter(lid => lid !== id));
  };

  const handleAdd = (id: string) => {
    if (selectedLotIds.length < maxLots) {
      setSelectedLotIds(prev => [...prev, id]);
      setIsAddDialogOpen(false);
    }
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Sin proyecto';
  };

  const findBestValue = (accessor: (lot: Lot) => number, lowest = true) => {
    if (selectedLots.length === 0) return null;
    const values = selectedLots.map(accessor);
    return lowest ? Math.min(...values) : Math.max(...values);
  };

  const bestPricePerSqm = findBestValue(l => Number(l.price_per_sqm || 0), true);
  const bestArea = findBestValue(l => Number(l.area || 0), false);
  const bestPrice = findBestValue(l => Number(l.price || 0), true);

  const FeatureIcon = ({ value }: { value: boolean }) => (
    value ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <Minus className="h-4 w-4 text-muted-foreground" />
    )
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (lots.length === 0) {
    return (
      <Card>
        <CardHeader>
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
        </CardHeader>
        <CardContent className="text-center py-12">
          <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay lotes disponibles</h3>
          <p className="text-muted-foreground">
            Agrega lotes a tus proyectos para poder compararlos
          </p>
        </CardContent>
      </Card>
    );
  }

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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar lote
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Seleccionar Lote</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {availableToAdd.map(lot => (
                      <Card 
                        key={lot.id} 
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleAdd(lot.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{lot.name || lot.lot_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {getProjectName(lot.project_id)} • {Number(lot.area).toLocaleString()} m²
                              </p>
                            </div>
                            <Badge variant={lot.status === 'available' ? 'default' : 'secondary'}>
                              {lot.status === 'available' ? 'Disponible' : lot.status === 'reserved' ? 'Reservado' : 'Vendido'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {availableToAdd.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No hay más lotes disponibles para agregar
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {selectedLots.length === 0 ? (
          <div className="text-center py-12">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecciona lotes para comparar</h3>
            <p className="text-muted-foreground mb-4">
              Haz clic en "Agregar lote" para comenzar a comparar
            </p>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar primer lote
            </Button>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="min-w-[600px]">
              {/* Headers */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedLots.length}, 1fr)` }}>
                <div className="font-medium text-sm text-muted-foreground py-2">Características</div>
                {selectedLots.map(lot => {
                  const features = parseLotFeatures(lot.features);
                  return (
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
                        <h4 className="font-semibold truncate">{lot.name || lot.lot_number}</h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {getProjectName(lot.project_id)}
                        </div>
                        <Badge 
                          variant={lot.status === 'available' ? 'default' : 'secondary'}
                          className="mt-2"
                        >
                          {lot.status === 'available' ? 'Disponible' : lot.status === 'reserved' ? 'Reservado' : 'Vendido'}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
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
                    <span className={`font-bold ${Number(lot.price) === bestPrice ? 'text-green-600' : ''}`}>
                      ${Number(lot.price || 0).toLocaleString('es-CL')}
                    </span>
                    {Number(lot.price) === bestPrice && bestPrice > 0 && (
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
                    <span className={Number(lot.area) === bestArea ? 'font-bold text-green-600' : ''}>
                      {Number(lot.area).toLocaleString()} m²
                    </span>
                    {Number(lot.area) === bestArea && (
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
                    <span className={Number(lot.price_per_sqm) === bestPricePerSqm ? 'font-bold text-green-600' : ''}>
                      ${Number(lot.price_per_sqm || 0).toLocaleString('es-CL')}
                    </span>
                    {Number(lot.price_per_sqm) === bestPricePerSqm && bestPricePerSqm > 0 && (
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
                {selectedLots.map(lot => {
                  const features = parseLotFeatures(lot.features);
                  return (
                    <div key={lot.id} className="flex justify-center">
                      <FeatureIcon value={features.hasWater || false} />
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 items-center py-2 bg-muted/30 rounded" style={{ gridTemplateColumns: `200px repeat(${selectedLots.length}, 1fr)` }}>
                <div className="flex items-center gap-2 text-sm pl-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  Electricidad
                </div>
                {selectedLots.map(lot => {
                  const features = parseLotFeatures(lot.features);
                  return (
                    <div key={lot.id} className="flex justify-center">
                      <FeatureIcon value={features.hasElectricity || false} />
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 items-center py-2" style={{ gridTemplateColumns: `200px repeat(${selectedLots.length}, 1fr)` }}>
                <div className="flex items-center gap-2 text-sm">
                  🛣️ Acceso
                </div>
                {selectedLots.map(lot => {
                  const features = parseLotFeatures(lot.features);
                  return (
                    <div key={lot.id} className="flex justify-center">
                      <FeatureIcon value={features.hasRoad || false} />
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

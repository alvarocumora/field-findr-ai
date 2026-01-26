
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MapPin, 
  Filter, 
  Search, 
  Zap, 
  X, 
  ChevronDown,
  Sliders,
  Target,
  Maximize
} from 'lucide-react';

const AdvancedFilters = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500000000]);
  const [areaRange, setAreaRange] = useState([1, 1000]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const propertyTypes = [
    'Agrícola', 'Industrial', 'Comercial', 'Residencial', 
    'Forestal', 'Ganadero', 'Parcela', 'Terreno'
  ];

  const regions = [
    'Región Metropolitana', 'Valparaíso', 'O\'Higgins', 'Maule',
    'Biobío', 'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
  ];

  const features = [
    { id: 'water', label: 'Derechos de Agua', icon: '💧' },
    { id: 'electricity', label: 'Electricidad', icon: '⚡' },
    { id: 'access', label: 'Acceso Pavimentado', icon: '🛣️' },
    { id: 'irrigation', label: 'Riego Tecnificado', icon: '🌱' },
    { id: 'buildings', label: 'Construcciones', icon: '🏢' },
    { id: 'organic', label: 'Certificación Orgánica', icon: '🌿' }
  ];

  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setPriceRange([0, 500000000]);
    setAreaRange([1, 1000]);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Quick Search Bar */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Buscar por ubicación, tipo de propiedad o características..."
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button size="lg" className="bg-green-600 hover:bg-green-700 px-8">
              <Zap className="h-5 w-5 mr-2" />
              Buscar con IA
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-6"
            >
              <Sliders className="h-5 w-5 mr-2" />
              Filtros
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Filtros activos:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="cursor-pointer hover:bg-red-100 hover:text-red-800"
              onClick={() => removeFilter(filter)}
            >
              {filter}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700"
          >
            Limpiar todo
          </Button>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros Avanzados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Property Type */}
              <div className="space-y-2">
                <Label>Tipo de Propiedad</Label>
                <Select onValueChange={(value) => addFilter(`Tipo: ${value}`)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region */}
              <div className="space-y-2">
                <Label>Región</Label>
                <Select onValueChange={(value) => addFilter(`Región: ${value}`)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar región" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Legal Status */}
              <div className="space-y-2">
                <Label>Estado Legal</Label>
                <Select onValueChange={(value) => addFilter(`Estado: ${value}`)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado legal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saneado">Saneado</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="proceso">En Proceso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <Label>Rango de Precio</Label>
              <div className="px-3">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={500000000}
                  min={0}
                  step={1000000}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
            </div>

            {/* Area Range */}
            <div className="space-y-3">
              <Label>Superficie (hectáreas)</Label>
              <div className="px-3">
                <Slider
                  value={areaRange}
                  onValueChange={setAreaRange}
                  max={1000}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{areaRange[0]} ha</span>
                <span>{areaRange[1]} ha</span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <Label>Características</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {features.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature.id}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          addFilter(feature.label);
                        } else {
                          removeFilter(feature.label);
                        }
                      }}
                    />
                    <Label htmlFor={feature.id} className="text-sm cursor-pointer">
                      {feature.icon} {feature.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Target className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">Recomendaciones IA</span>
              </div>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:text-green-800 h-auto p-1"
                  onClick={() => addFilter('IA: Alto Potencial')}
                >
                  🎯 Propiedades con alto potencial de revalorización
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:text-green-800 h-auto p-1"
                  onClick={() => addFilter('IA: Precio Atractivo')}
                >
                  💰 Propiedades con precio por debajo del mercado
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:text-green-800 h-auto p-1"
                  onClick={() => addFilter('IA: Similares')}
                >
                  🔍 Propiedades similares a las que has visto
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedFilters;

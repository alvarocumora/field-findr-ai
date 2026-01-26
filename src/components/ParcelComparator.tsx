import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  DollarSign,
  Ruler,
  Droplet,
  Zap,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Plus
} from 'lucide-react';
import Layout from './Layout';

const ParcelComparator = () => {
  const [selectedParcels, setSelectedParcels] = useState([
    {
      id: 1,
      name: 'Parcela Valle Verde',
      location: 'Casablanca, Valparaíso',
      price: 185000000,
      pricePerHa: 3700000,
      area: '50 hectáreas',
      waterRights: true,
      electricity: 'Disponible',
      road: 'Pavimentado',
      legalStatus: 'Saneado',
      topography: 'Plano',
      soilType: 'Franco arcilloso',
      climate: 'Mediterráneo',
      aiScore: 92,
      pros: ['Riego tecnificado', 'Certificación orgánica', 'Excelente acceso'],
      cons: ['Precio premium', 'Zona ventosa'],
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef'
    },
    {
      id: 2,
      name: 'Parcela Los Robles',
      location: 'Pirque, Santiago',
      price: 125000000,
      pricePerHa: 12500000,
      area: '10 hectáreas',
      waterRights: true,
      electricity: 'Monofásica',
      road: 'Ripio',
      legalStatus: 'Saneado',
      topography: 'Suave pendiente',
      soilType: 'Franco',
      climate: 'Templado',
      aiScore: 85,
      pros: ['Cerca de Santiago', 'Vista cordillera', 'Pozo profundo'],
      cons: ['Tamaño limitado', 'Acceso mejorable'],
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43'
    }
  ]);

  const comparisonCategories = [
    { name: 'Ubicación', key: 'location', icon: MapPin },
    { name: 'Precio', key: 'price', icon: DollarSign },
    { name: 'Superficie', key: 'area', icon: Ruler },
    { name: 'Servicios', key: 'services', icon: Zap },
    { name: 'Características', key: 'features', icon: Target }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Comparador de Parcelas</h1>
            <p className="text-muted-foreground mt-1">Compara hasta 3 propiedades lado a lado</p>
          </div>
          <Button className="bg-gradient-primary text-white">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Parcela
          </Button>
        </div>

        {/* AI Comparison Summary */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Análisis Comparativo IA
                </CardTitle>
                <CardDescription>Recomendación basada en tu perfil de inversión</CardDescription>
              </div>
              <Badge className="bg-gradient-primary text-white">AI-Powered</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Mejor Inversión: Parcela Valle Verde</h4>
                    <p className="text-sm text-muted-foreground">
                      Ofrece mejor relación precio/potencial con una puntuación IA de 92/100. 
                      Ideal para proyecto agrícola de mediano-largo plazo con alta rentabilidad proyectada.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {selectedParcels.map((parcel) => (
            <Card key={parcel.id} className="overflow-hidden">
              <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${parcel.image})` }}>
                <div className="h-full bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-white font-bold text-xl">{parcel.name}</h3>
                    <p className="text-white/90 text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {parcel.location}
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                {/* AI Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Puntuación IA</span>
                  <Badge className={getScoreColor(parcel.aiScore)}>
                    {parcel.aiScore}/100
                  </Badge>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Precio Total</span>
                    <span className="text-xl font-bold text-primary">{formatPrice(parcel.price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Precio por Hectárea</span>
                    <span className="text-sm font-semibold">{formatPrice(parcel.pricePerHa)}</span>
                  </div>
                </div>

                {/* Key Features */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Superficie</span>
                    <span className="font-medium">{parcel.area}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Derechos de Agua</span>
                    {parcel.waterRights ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Electricidad</span>
                    <span className="font-medium">{parcel.electricity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Acceso</span>
                    <span className="font-medium">{parcel.road}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Topografía</span>
                    <span className="font-medium">{parcel.topography}</span>
                  </div>
                </div>

                {/* Pros & Cons */}
                <Tabs defaultValue="pros" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pros">Ventajas</TabsTrigger>
                    <TabsTrigger value="cons">Desventajas</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pros" className="space-y-2 mt-4">
                    {parcel.pros.map((pro, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{pro}</span>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="cons" className="space-y-2 mt-4">
                    {parcel.cons.map((con, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>{con}</span>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>

                <Button className="w-full bg-gradient-primary text-white">
                  Ver Detalles
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Comparación Detallada</CardTitle>
            <CardDescription>Análisis técnico completo de las propiedades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Característica</th>
                    {selectedParcels.map((parcel) => (
                      <th key={parcel.id} className="text-left p-4 font-semibold">{parcel.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4 text-muted-foreground">Estado Legal</td>
                    {selectedParcels.map((parcel) => (
                      <td key={parcel.id} className="p-4">
                        <Badge variant="outline">{parcel.legalStatus}</Badge>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 text-muted-foreground">Tipo de Suelo</td>
                    {selectedParcels.map((parcel) => (
                      <td key={parcel.id} className="p-4">{parcel.soilType}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 text-muted-foreground">Clima</td>
                    {selectedParcels.map((parcel) => (
                      <td key={parcel.id} className="p-4">{parcel.climate}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-muted-foreground">Puntuación IA</td>
                    {selectedParcels.map((parcel) => (
                      <td key={parcel.id} className="p-4">
                        <Badge className={getScoreColor(parcel.aiScore)}>
                          {parcel.aiScore}/100
                        </Badge>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ParcelComparator;

type PricePrediction = { price: number; pricePerHectare: number; confidence: string; range: { min: number; max: number; }; factors: { name: string; impact: string; positive: boolean; }[]; comparables: { location: string; price: number; area: number; distance: string; }[]; };
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MapPin, DollarSign, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const PricePredictor = () => {
  const [location, setLocation] = useState("");
  const [areaHectares, setAreaHectares] = useState([5]);
  const [landType, setLandType] = useState("");
  const [hasWater, setHasWater] = useState("");
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);

  const historicalData = [
    { month: "Ene 2024", price: 3200000 },
    { month: "Feb 2024", price: 3350000 },
    { month: "Mar 2024", price: 3500000 },
    { month: "Abr 2024", price: 3600000 },
    { month: "May 2024", price: 3800000 },
    { month: "Jun 2024", price: 4000000 },
  ];

  const projectionData = [
    { period: "Actual", min: 3800000, avg: 4000000, max: 4200000 },
    { period: "6 meses", min: 4100000, avg: 4350000, max: 4600000 },
    { period: "1 año", min: 4400000, avg: 4750000, max: 5100000 },
    { period: "2 años", min: 5000000, avg: 5500000, max: 6000000 },
  ];

  const handlePredict = () => {
    // Simulación de predicción IA
    const basePrice = 4000000;
    const areaMultiplier = areaHectares[0];
    const typeMultiplier = landType === "agricultural" ? 1.0 : landType === "residential" ? 1.3 : 0.8;
    const waterMultiplier = hasWater === "yes" ? 1.2 : 1.0;
    
    const predictedPrice = basePrice * areaMultiplier * typeMultiplier * waterMultiplier;
    const confidence = 85 + Math.random() * 10;

    setPrediction({
      price: predictedPrice,
      pricePerHectare: predictedPrice / areaHectares[0],
      confidence: confidence.toFixed(1),
      range: {
        min: predictedPrice * 0.9,
        max: predictedPrice * 1.1,
      },
      factors: [
        { name: "Ubicación", impact: "+15%", positive: true },
        { name: "Disponibilidad de agua", impact: hasWater === "yes" ? "+20%" : "-10%", positive: hasWater === "yes" },
        { name: "Tipo de terreno", impact: "+8%", positive: true },
        { name: "Desarrollo urbano cercano", impact: "+12%", positive: true },
        { name: "Tamaño de parcela", impact: "-5%", positive: false },
      ],
      comparables: [
        { location: "Valle Central, Los Ángeles", price: 3800000, area: 5, distance: "3 km" },
        { location: "Sector Rural, Nacimiento", price: 4200000, area: 6, distance: "8 km" },
        { location: "Camino a Tucapel", price: 3600000, area: 4.5, distance: "5 km" },
      ],
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Predictor de Precios IA</h1>
          <p className="text-muted-foreground">Valuación inteligente basada en análisis de mercado y machine learning</p>
        </div>
        <Badge variant="secondary" className="text-lg">
          <Activity className="mr-2 h-4 w-4" />
          Modelo actualizado
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Entrada */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Datos del Terreno</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="Ej: Los Ángeles, Bio Bio"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div>
              <Label>Área: {areaHectares[0]} hectáreas</Label>
              <Slider
                value={areaHectares}
                onValueChange={setAreaHectares}
                min={1}
                max={50}
                step={0.5}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="landType">Tipo de Terreno</Label>
              <Select value={landType} onValueChange={setLandType}>
                <SelectTrigger id="landType">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agricultural">Agrícola</SelectItem>
                  <SelectItem value="residential">Residencial</SelectItem>
                  <SelectItem value="forestry">Forestal</SelectItem>
                  <SelectItem value="mixed">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="water">Derechos de Agua</Label>
              <Select value={hasWater} onValueChange={setHasWater}>
                <SelectTrigger id="water">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sí, tiene derechos</SelectItem>
                  <SelectItem value="no">No tiene</SelectItem>
                  <SelectItem value="pending">En trámite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handlePredict} className="w-full" size="lg">
              <TrendingUp className="mr-2 h-4 w-4" />
              Predecir Precio
            </Button>
          </div>
        </Card>

        {/* Resultado de Predicción */}
        <Card className="p-6 lg:col-span-2">
          {prediction ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2 text-foreground">Valuación Estimada</h2>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-bold text-primary">
                    ${(prediction.price / 1000000).toFixed(1)}M
                  </span>
                  <span className="text-muted-foreground">
                    ${(prediction.pricePerHectare / 1000).toFixed(0)}k por hectárea
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">
                    Confianza: {prediction.confidence}%
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Rango: ${(prediction.range.min / 1000000).toFixed(1)}M - ${(prediction.range.max / 1000000).toFixed(1)}M
                  </span>
                </div>
              </div>

              {/* Factores de Influencia */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Factores que Influyen en el Precio</h3>
                <div className="space-y-2">
                  {prediction.factors.map((factor, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {factor.positive ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                        )}
                        <span className="text-sm">{factor.name}</span>
                      </div>
                      <Badge variant={factor.positive ? "default" : "secondary"}>
                        {factor.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparables */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Propiedades Comparables</h3>
                <div className="space-y-2">
                  {prediction.comparables.map((comp, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{comp.location}</p>
                          <p className="text-xs text-muted-foreground">{comp.area} há • {comp.distance}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${(comp.price / 1000000).toFixed(1)}M</p>
                        <p className="text-xs text-muted-foreground">${(comp.price / comp.area / 1000).toFixed(0)}k/há</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Complete los datos para obtener la valuación</h3>
              <p className="text-muted-foreground">
                Nuestro modelo de IA analizará múltiples factores para dar una estimación precisa
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Gráficos de Tendencias */}
      {prediction && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 text-foreground">Tendencia Histórica de Precios</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 text-foreground">Proyección de Plusvalía</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Area type="monotone" dataKey="min" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                <Area type="monotone" dataKey="avg" stackId="2" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.4)" />
                <Area type="monotone" dataKey="max" stackId="3" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.6)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PricePredictor;

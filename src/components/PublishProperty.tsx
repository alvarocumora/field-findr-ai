import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, MapPin, FileText, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PublishProperty = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    region: "",
    commune: "",
    areaHectares: "",
    price: "",
    landType: "",
    waterRights: "",
    electricity: "",
    waterSupply: "",
    roadAccess: "",
    topography: "",
    rolSii: "",
    cbr: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePublish = () => {
    toast({
      title: "Propiedad publicada exitosamente",
      description: "Tu parcela ya está visible en el sistema",
    });
  };

  const steps = [
    { number: 1, title: "Info Básica", icon: FileText },
    { number: 2, title: "Ubicación", icon: MapPin },
    { number: 3, title: "Características", icon: CheckCircle },
    { number: 4, title: "Precio", icon: DollarSign },
    { number: 5, title: "Fotos", icon: Upload },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Publicar Nueva Parcela</h1>
          <p className="text-muted-foreground">Complete la información para agregar una parcela al inventario</p>
        </div>
        <Badge variant="secondary">Paso {currentStep} de 5</Badge>
      </div>

      {/* Progress Steps */}
      <Card className="p-6">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  currentStep >= step.number 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                <span className="text-xs mt-2 font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 w-24 mx-4 ${
                  currentStep > step.number ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Form Content */}
      <Card className="p-6">
        <Tabs value={`step-${currentStep}`} className="w-full">
          {/* Step 1: Info Básica */}
          <TabsContent value="step-1" className="space-y-4">
            <div>
              <Label htmlFor="title">Título de la publicación *</Label>
              <Input
                id="title"
                placeholder="Ej: Parcela agrícola en Valle Verde"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder="Describe las características principales del terreno..."
                rows={6}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="landType">Tipo de Terreno *</Label>
              <Select value={formData.landType} onValueChange={(value) => handleInputChange("landType", value)}>
                <SelectTrigger id="landType">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agricultural">Agrícola</SelectItem>
                  <SelectItem value="residential">Residencial</SelectItem>
                  <SelectItem value="forestry">Forestal</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="mixed">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Step 2: Ubicación */}
          <TabsContent value="step-2" className="space-y-4">
            <div>
              <Label htmlFor="location">Dirección o Referencia *</Label>
              <Input
                id="location"
                placeholder="Ej: Camino a Tucapel Km 15"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="region">Región *</Label>
                <Select value={formData.region} onValueChange={(value) => handleInputChange("region", value)}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Seleccionar región" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="biobio">Bío Bío</SelectItem>
                    <SelectItem value="araucania">La Araucanía</SelectItem>
                    <SelectItem value="losrios">Los Ríos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="commune">Comuna *</Label>
                <Input
                  id="commune"
                  placeholder="Ej: Los Ángeles"
                  value={formData.commune}
                  onChange={(e) => handleInputChange("commune", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rolSii">ROL SII</Label>
                <Input
                  id="rolSii"
                  placeholder="Ej: 1234-5678"
                  value={formData.rolSii}
                  onChange={(e) => handleInputChange("rolSii", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cbr">CBR</Label>
                <Input
                  id="cbr"
                  placeholder="Ej: 123456789"
                  value={formData.cbr}
                  onChange={(e) => handleInputChange("cbr", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Step 3: Características */}
          <TabsContent value="step-3" className="space-y-4">
            <div>
              <Label htmlFor="areaHectares">Superficie (hectáreas) *</Label>
              <Input
                id="areaHectares"
                type="number"
                placeholder="Ej: 5.5"
                value={formData.areaHectares}
                onChange={(e) => handleInputChange("areaHectares", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="topography">Topografía</Label>
              <Select value={formData.topography} onValueChange={(value) => handleInputChange("topography", value)}>
                <SelectTrigger id="topography">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Plano</SelectItem>
                  <SelectItem value="gentle">Suave</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="steep">Pronunciado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="waterRights">Derechos de Agua</Label>
              <Select value={formData.waterRights} onValueChange={(value) => handleInputChange("waterRights", value)}>
                <SelectTrigger id="waterRights">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sí, tiene derechos</SelectItem>
                  <SelectItem value="no">No tiene</SelectItem>
                  <SelectItem value="pending">En trámite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="electricity">Electricidad</Label>
                <Select value={formData.electricity} onValueChange={(value) => handleInputChange("electricity", value)}>
                  <SelectTrigger id="electricity">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="planned">Proyectada</SelectItem>
                    <SelectItem value="none">No tiene</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="waterSupply">Agua Potable</Label>
                <Select value={formData.waterSupply} onValueChange={(value) => handleInputChange("waterSupply", value)}>
                  <SelectTrigger id="waterSupply">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="well">Pozo</SelectItem>
                    <SelectItem value="planned">Proyectada</SelectItem>
                    <SelectItem value="none">No tiene</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="roadAccess">Acceso</Label>
                <Select value={formData.roadAccess} onValueChange={(value) => handleInputChange("roadAccess", value)}>
                  <SelectTrigger id="roadAccess">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paved">Pavimentado</SelectItem>
                    <SelectItem value="gravel">Ripio</SelectItem>
                    <SelectItem value="dirt">Tierra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Step 4: Precio */}
          <TabsContent value="step-4" className="space-y-4">
            <div>
              <Label htmlFor="price">Precio Total *</Label>
              <Input
                id="price"
                type="number"
                placeholder="Ej: 35000000"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Precio sugerido por IA: $32.500.000 - $38.000.000
              </p>
            </div>
            {formData.price && formData.areaHectares && (
              <Card className="p-4 bg-muted/50">
                <h4 className="font-semibold mb-2 text-foreground">Análisis de Precio</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio por hectárea:</span>
                    <span className="font-semibold">
                      ${((parseFloat(formData.price) / parseFloat(formData.areaHectares)) / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vs promedio mercado:</span>
                    <Badge variant="default">+8% sobre mercado</Badge>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Step 5: Fotos */}
          <TabsContent value="step-5" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2 text-foreground">Arrastra fotos aquí</h3>
              <p className="text-sm text-muted-foreground mb-4">o haz clic para seleccionar archivos</p>
              <Button variant="outline">Seleccionar Fotos</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Sube al menos 5 fotos de calidad. Las primeras 3 serán las destacadas.
            </p>
          </TabsContent>
        </Tabs>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Anterior
          </Button>
          {currentStep < 5 ? (
            <Button onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}>
              Siguiente
            </Button>
          ) : (
            <Button onClick={handlePublish}>
              Publicar Parcela
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PublishProperty;

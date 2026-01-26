import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MapPin, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  Droplets,
  Zap,
  Car,
  Sparkles,
  ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateListing } from "@/hooks/useListings";
import { useAuth } from "@/hooks/useAuth";
import LocationPicker from "./LocationPicker";
import ImageUploader from "./ImageUploader";

const PROPERTY_TYPES = [
  { value: 'parcela_rural', label: 'Parcela Rural' },
  { value: 'sitio_industrial', label: 'Sitio Industrial' },
  { value: 'campo_agricola', label: 'Campo Agrícola' },
  { value: 'terreno_urbano', label: 'Terreno Urbano' },
  { value: 'terreno_costero', label: 'Terreno Costero' },
  { value: 'terreno_montana', label: 'Terreno de Montaña' },
];

const REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío',
  'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
];

const AVAILABLE_TAGS = [
  { value: 'agua', label: 'Agua', icon: Droplets },
  { value: 'luz', label: 'Electricidad', icon: Zap },
  { value: 'camino', label: 'Camino', icon: Car },
  { value: 'riego', label: 'Riego' },
  { value: 'bosque', label: 'Bosque' },
  { value: 'vista', label: 'Vista panorámica' },
  { value: 'playa', label: 'Playa' },
  { value: 'lago', label: 'Lago' },
];

interface FormData {
  title: string;
  description: string;
  type: string;
  price: string;
  currency: string;
  area_ha: string;
  location: string;
  region: string;
  city: string;
  lat: number | null;
  lng: number | null;
  rol: string;
  tags: string[];
  utilities: {
    water: boolean;
    electricity: string;
    road_access: string;
  };
  subdivision_eligible: boolean;
  images: string[];
}

const PublishForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const createListing = useCreateListing();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    type: "",
    price: "",
    currency: "CLP",
    area_ha: "",
    location: "",
    region: "",
    city: "",
    lat: null,
    lng: null,
    rol: "",
    tags: [],
    utilities: {
      water: false,
      electricity: "",
      road_access: "",
    },
    subdivision_eligible: false,
    images: [],
  });

  const steps = [
    { number: 1, title: "Información", icon: FileText },
    { number: 2, title: "Ubicación", icon: MapPin },
    { number: 3, title: "Precio", icon: DollarSign },
    { number: 4, title: "Fotos", icon: ImageIcon },
  ];

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUtilityChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      utilities: { ...prev.utilities, [field]: value }
    }));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleLocationSelect = (lat: number, lng: number, address?: { address: string; city?: string; region?: string }) => {
    setFormData(prev => ({
      ...prev,
      lat,
      lng,
      // Auto-fill location if address was geocoded
      location: address?.address || prev.location,
      // Auto-fill city if available and not already set
      city: address?.city || prev.city,
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.title && !!formData.type && !!formData.area_ha;
      case 2:
        return !!formData.location && !!formData.region;
      case 3:
        return !!formData.price;
      default:
        return true;
    }
  };

  const handlePublish = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para publicar una propiedad",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      await createListing.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        price: parseFloat(formData.price),
        currency: formData.currency,
        area_ha: parseFloat(formData.area_ha),
        area_m2: parseFloat(formData.area_ha) * 10000,
        location: formData.location,
        region: formData.region,
        city: formData.city || undefined,
        lat: formData.lat || undefined,
        lng: formData.lng || undefined,
        rol: formData.rol || undefined,
        tags: formData.tags,
        utilities: formData.utilities,
        subdivision_eligible: formData.subdivision_eligible,
        images: formData.images,
        user_id: user.id,
        status: 'active',
        legal_status: 'pending',
      });
      navigate('/explorar');
    } catch {
      // Error handled by mutation
    }
  };

  const canAdvance = validateStep(currentStep);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Publicar propiedad
              </h1>
              <p className="text-muted-foreground mt-1">
                Completa los datos de tu terreno
              </p>
            </div>
            <Badge className="glass border-primary/30 text-primary">
              Paso {currentStep} de 4
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <button
                onClick={() => currentStep > step.number && setCurrentStep(step.number)}
                disabled={currentStep < step.number}
                className="flex flex-col items-center group"
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${currentStep > step.number 
                    ? "bg-primary text-primary-foreground" 
                    : currentStep === step.number
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }
                `}>
                  {currentStep > step.number ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium hidden sm:block ${
                  currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${
                  currentStep > step.number ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <Card className="glass border-white/10 p-6">
          {/* Step 1: Info Básica */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <Label htmlFor="title" className="text-foreground">
                  Título de la publicación *
                </Label>
                <Input
                  id="title"
                  placeholder="Ej: Parcela agrícola en Valle Verde"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mt-2 glass border-white/10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type" className="text-foreground">
                    Tipo de terreno *
                  </Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger className="mt-2 glass border-white/10">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="area_ha" className="text-foreground">
                    Superficie (hectáreas) *
                  </Label>
                  <Input
                    id="area_ha"
                    type="number"
                    step="0.1"
                    placeholder="Ej: 5.5"
                    value={formData.area_ha}
                    onChange={(e) => handleInputChange("area_ha", e.target.value)}
                    className="mt-2 glass border-white/10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-foreground">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe las características principales del terreno..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="mt-2 glass border-white/10"
                />
              </div>

              <div>
                <Label className="text-foreground mb-3 block">
                  Características
                </Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <Button
                      key={tag.value}
                      type="button"
                      variant={formData.tags.includes(tag.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTag(tag.value)}
                      className={formData.tags.includes(tag.value) 
                        ? "" 
                        : "glass border-white/10"
                      }
                    >
                      {tag.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="subdivision"
                  checked={formData.subdivision_eligible}
                  onCheckedChange={(checked) => 
                    handleInputChange("subdivision_eligible", checked)
                  }
                />
                <Label htmlFor="subdivision" className="text-foreground cursor-pointer">
                  Apto para subdivisión
                </Label>
              </div>
            </div>
          )}

          {/* Step 2: Ubicación */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region" className="text-foreground">
                    Región *
                  </Label>
                  <Select 
                    value={formData.region} 
                    onValueChange={(value) => handleInputChange("region", value)}
                  >
                    <SelectTrigger className="mt-2 glass border-white/10">
                      <SelectValue placeholder="Seleccionar región" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map(region => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city" className="text-foreground">
                    Ciudad / Comuna
                  </Label>
                  <Input
                    id="city"
                    placeholder="Ej: Los Ángeles"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="mt-2 glass border-white/10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location" className="text-foreground">
                  Dirección o referencia *
                </Label>
                <Input
                  id="location"
                  placeholder="Ej: Camino a Tucapel Km 15"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="mt-2 glass border-white/10"
                />
              </div>

              <div>
                <Label htmlFor="rol" className="text-foreground">
                  ROL SII
                </Label>
                <Input
                  id="rol"
                  placeholder="Ej: 1234-5678"
                  value={formData.rol}
                  onChange={(e) => handleInputChange("rol", e.target.value)}
                  className="mt-2 glass border-white/10"
                />
              </div>

              <div>
                <Label className="text-foreground mb-3 block">
                  Ubicación en el mapa
                </Label>
                <LocationPicker
                  lat={formData.lat}
                  lng={formData.lng}
                  onLocationSelect={handleLocationSelect}
                />
                {formData.lat && formData.lng && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Coordenadas: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-foreground mb-3 block">
                  Servicios
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg glass border border-white/10">
                    <Checkbox
                      id="water"
                      checked={formData.utilities.water}
                      onCheckedChange={(checked) => 
                        handleUtilityChange("water", checked)
                      }
                    />
                    <Label htmlFor="water" className="flex items-center gap-2 cursor-pointer">
                      <Droplets className="h-4 w-4 text-blue-400" />
                      Agua
                    </Label>
                  </div>

                  <Select 
                    value={formData.utilities.electricity} 
                    onValueChange={(value) => handleUtilityChange("electricity", value)}
                  >
                    <SelectTrigger className="glass border-white/10">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-400" />
                        <SelectValue placeholder="Electricidad" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conectado">Conectado</SelectItem>
                      <SelectItem value="disponible">Disponible</SelectItem>
                      <SelectItem value="sin_acceso">Sin acceso</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={formData.utilities.road_access} 
                    onValueChange={(value) => handleUtilityChange("road_access", value)}
                  >
                    <SelectTrigger className="glass border-white/10">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Acceso" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pavimentado">Pavimentado</SelectItem>
                      <SelectItem value="ripiado">Ripiado</SelectItem>
                      <SelectItem value="tierra">Tierra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Precio */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="price" className="text-foreground">
                    Precio *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="Ej: 35000000"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className="mt-2 glass border-white/10 text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="currency" className="text-foreground">
                    Moneda
                  </Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value) => handleInputChange("currency", value)}
                  >
                    <SelectTrigger className="mt-2 glass border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLP">CLP (Pesos)</SelectItem>
                      <SelectItem value="UF">UF</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.price && formData.area_ha && (
                <Card className="p-4 glass border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Análisis de precio</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio por hectárea:</span>
                      <span className="font-semibold text-foreground">
                        ${((parseFloat(formData.price) / parseFloat(formData.area_ha)) / 1000000).toFixed(2)}M {formData.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio por m²:</span>
                      <span className="font-semibold text-foreground">
                        ${((parseFloat(formData.price) / (parseFloat(formData.area_ha) * 10000))).toFixed(0)} {formData.currency}
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Step 4: Fotos */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <ImageUploader
                images={formData.images}
                onImagesChange={(images) => handleInputChange("images", images)}
                userId={user?.id}
                maxImages={10}
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="glass border-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            {currentStep < 4 ? (
              <Button 
                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                disabled={!canAdvance}
                className="btn-glow"
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handlePublish}
                disabled={createListing.isPending}
                className="btn-glow"
              >
                {createListing.isPending ? "Publicando..." : "Publicar propiedad"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PublishForm;

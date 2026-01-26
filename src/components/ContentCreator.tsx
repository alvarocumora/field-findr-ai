
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wand2, 
  Image, 
  FileText, 
  Share2, 
  Download,
  Copy,
  Sparkles,
  Target,
  TrendingUp,
  MapPin,
  Camera,
  Video,
  Globe,
  Zap
} from 'lucide-react';

const ContentCreator = () => {
  const [property, setProperty] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    area: '',
    type: 'Agrícola'
  });

  const [generatedContent, setGeneratedContent] = useState({
    title: '',
    description: '',
    highlights: [],
    socialMedia: {
      facebook: '',
      instagram: '',
      whatsapp: ''
    },
    seoKeywords: []
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const generateContent = async () => {
    setIsGenerating(true);
    
    // Simulate AI content generation
    setTimeout(() => {
      const generatedTitle = `${property.type} Premium en ${property.location} - ${property.area} de Oportunidad`;
      const generatedDescription = `Excepcional ${property.type.toLowerCase()} ubicado en ${property.location}. Con ${property.area} de extensión, esta propiedad ofrece un potencial único para desarrollo ${property.type === 'Agrícola' ? 'agrícola' : 'industrial'}. 

Características destacadas:
• Ubicación estratégica en ${property.location}
• Superficie total: ${property.area}
• Acceso a servicios básicos
• Documentación al día
• Excelente conectividad

Ideal para inversionistas que buscan oportunidades de alto potencial en el sector ${property.type.toLowerCase()}. La propiedad cuenta con todas las facilidades necesarias para el desarrollo inmediato del proyecto.`;

      const highlights = [
        'Ubicación estratégica',
        'Documentación saneada',
        'Acceso a servicios',
        'Alto potencial de desarrollo',
        'Conectividad excelente'
      ];

      const socialMedia = {
        facebook: `🏞️ ${generatedTitle}\n\n${generatedDescription.substring(0, 200)}...\n\n#Terrenos #${property.location} #Inversión`,
        instagram: `🌱 ${generatedTitle}\n\n📍 ${property.location}\n📏 ${property.area}\n💰 ${property.price}\n\n#Terrenos #PropiedadRural #Inversión #${property.location}`,
        whatsapp: `🏞️ *${generatedTitle}*\n\n${generatedDescription.substring(0, 300)}...\n\n¡Consulta más detalles! 📲`
      };

      const seoKeywords = [
        `terreno ${property.type.toLowerCase()} ${property.location}`,
        `propiedad rural ${property.location}`,
        `inversión ${property.type.toLowerCase()}`,
        `terreno ${property.area} ${property.location}`,
        `venta terreno ${property.location}`
      ];

      setGeneratedContent({
        title: generatedTitle,
        description: generatedDescription,
        highlights,
        socialMedia,
        seoKeywords
      });
      
      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wand2 className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Creador de Contenido IA</h2>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <Sparkles className="h-3 w-3 mr-1" />
          Beta
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Información de la Propiedad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título</label>
              <Input
                value={property.title}
                onChange={(e) => setProperty({...property, title: e.target.value})}
                placeholder="Ej: Terreno Agrícola en Casablanca"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Ubicación</label>
              <Input
                value={property.location}
                onChange={(e) => setProperty({...property, location: e.target.value})}
                placeholder="Ej: Casablanca, Valparaíso"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Precio</label>
                <Input
                  value={property.price}
                  onChange={(e) => setProperty({...property, price: e.target.value})}
                  placeholder="$185.000.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Superficie</label>
                <Input
                  value={property.area}
                  onChange={(e) => setProperty({...property, area: e.target.value})}
                  placeholder="50 hectáreas"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={property.type}
                onChange={(e) => setProperty({...property, type: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="Agrícola">Agrícola</option>
                <option value="Industrial">Industrial</option>
                <option value="Forestal">Forestal</option>
                <option value="Ganadero">Ganadero</option>
                <option value="Parcela">Parcela</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción Básica</label>
              <Textarea
                value={property.description}
                onChange={(e) => setProperty({...property, description: e.target.value})}
                placeholder="Describe las características principales..."
                rows={3}
              />
            </div>

            <Button 
              onClick={generateContent}
              disabled={isGenerating || !property.title || !property.location}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Generando Contenido...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generar Contenido con IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              Contenido Generado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedContent.title ? (
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="content">Contenido</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Título Optimizado</label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.title)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md text-sm">
                      {generatedContent.title}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Descripción Completa</label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.description)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md text-sm max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{generatedContent.description}</pre>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Puntos Destacados</label>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.highlights.map((highlight, index) => (
                        <Badge key={index} variant="secondary">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Facebook</label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.socialMedia.facebook)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-md text-sm">
                      <pre className="whitespace-pre-wrap">{generatedContent.socialMedia.facebook}</pre>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Instagram</label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.socialMedia.instagram)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-md text-sm">
                      <pre className="whitespace-pre-wrap">{generatedContent.socialMedia.instagram}</pre>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">WhatsApp</label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.socialMedia.whatsapp)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-green-50 rounded-md text-sm">
                      <pre className="whitespace-pre-wrap">{generatedContent.socialMedia.whatsapp}</pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Keywords SEO</label>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.seoKeywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-md">
                    <h4 className="font-medium text-sm mb-2">Recomendaciones SEO</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Incluir ubicación en el título</li>
                      <li>• Usar palabras clave naturalmente</li>
                      <li>• Optimizar meta descripción</li>
                      <li>• Agregar texto alternativo a imágenes</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="flex items-center">
                      <Camera className="h-4 w-4 mr-2" />
                      Generar Fotos IA
                    </Button>
                    <Button variant="outline" className="flex items-center">
                      <Video className="h-4 w-4 mr-2" />
                      Video Tour
                    </Button>
                    <Button variant="outline" className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Mapa 3D
                    </Button>
                    <Button variant="outline" className="flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      Vista 360°
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-md">
                    <h4 className="font-medium text-sm mb-2">Sugerencias de Contenido Visual</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Foto aérea del terreno</li>
                      <li>• Vista panorámica del entorno</li>
                      <li>• Accesos y vías de comunicación</li>
                      <li>• Servicios básicos disponibles</li>
                      <li>• Comparación con propiedades similares</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wand2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Completa la información de la propiedad para generar contenido automatizado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentCreator;

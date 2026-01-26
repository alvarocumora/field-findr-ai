import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Megaphone, List, Loader2, Copy, Check, Wand2 } from 'lucide-react';
import { useContentGenerator } from '@/hooks/useAI';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export const ContentGeneratorPanel = () => {
  const { content, isLoading, generateContent } = useContentGenerator();
  const [copied, setCopied] = useState(false);
  const [contentType, setContentType] = useState<'description' | 'marketing' | 'features'>('description');
  
  const [formData, setFormData] = useState({
    title: '',
    area: '',
    location: '',
    features: '',
    price: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location) return;

    generateContent(
      {
        title: formData.title,
        area: formData.area,
        location: formData.location,
        features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
        price: formData.price ? parseInt(formData.price) : undefined,
      },
      contentType
    );
  };

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Contenido copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Generador de Contenido IA</CardTitle>
              <CardDescription>Crea descripciones y contenido de marketing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs value={contentType} onValueChange={(v) => setContentType(v as typeof contentType)}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="description" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Descripción
                </TabsTrigger>
                <TabsTrigger value="marketing" className="gap-2">
                  <Megaphone className="h-4 w-4" />
                  Marketing
                </TabsTrigger>
                <TabsTrigger value="features" className="gap-2">
                  <List className="h-4 w-4" />
                  Características
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="title">Título de la Propiedad</Label>
              <Input
                id="title"
                placeholder="Parcela Premium en Casablanca"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Superficie</Label>
                <Input
                  id="area"
                  placeholder="5.000 m²"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Casablanca, Valparaíso"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio (opcional)</Label>
              <Input
                id="price"
                type="number"
                placeholder="85000000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Características (separadas por coma)</Label>
              <Textarea
                id="features"
                placeholder="Derechos de agua, vista panorámica, acceso pavimentado"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generar Contenido
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contenido Generado</CardTitle>
            {content && (
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Wand2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>El contenido generado aparecerá aquí</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

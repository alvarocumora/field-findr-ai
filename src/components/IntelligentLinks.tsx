
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Link, 
  QrCode, 
  Share2, 
  TrendingUp, 
  Eye,
  MapPin,
  Calendar,
  ExternalLink,
  Copy,
  Download,
  BarChart3,
  Target,
  Globe,
  MessageCircle,
  Mail,
  Phone
} from 'lucide-react';

const IntelligentLinks = () => {
  const [links, setLinks] = useState([
    {
      id: 1,
      title: 'Terreno Agrícola Casablanca',
      shortUrl: 'oferta.land/agri-cas-001',
      originalUrl: 'https://ofertaterrenos.com/property/terreno-agricola-casablanca-001',
      clicks: 342,
      conversions: 12,
      sources: {
        whatsapp: 156,
        facebook: 89,
        instagram: 67,
        email: 30
      },
      created: '2024-01-15',
      qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iYmxhY2siLz4KPC9zdmc+',
      performance: {
        ctr: 3.2,
        conversionRate: 3.5,
        avgTimeOnPage: '2:45'
      }
    },
    {
      id: 2,
      title: 'Sitio Industrial Quilicura',
      shortUrl: 'oferta.land/ind-qui-002',
      originalUrl: 'https://ofertaterrenos.com/property/sitio-industrial-quilicura-002',
      clicks: 218,
      conversions: 8,
      sources: {
        whatsapp: 98,
        facebook: 45,
        instagram: 38,
        email: 37
      },
      created: '2024-01-18',
      qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iYmxhY2siLz4KPC9zdmc+',
      performance: {
        ctr: 2.8,
        conversionRate: 3.7,
        avgTimeOnPage: '3:12'
      }
    }
  ]);

  const [newLink, setNewLink] = useState({
    title: '',
    originalUrl: '',
    customSlug: '',
    campaign: '',
    source: ''
  });

  const [selectedLink, setSelectedLink] = useState(links[0]);

  const generateShortUrl = () => {
    const slug = newLink.customSlug || `prop-${Date.now()}`;
    const shortUrl = `oferta.land/${slug}`;
    
    const link = {
      id: links.length + 1,
      title: newLink.title,
      shortUrl,
      originalUrl: newLink.originalUrl,
      clicks: 0,
      conversions: 0,
      sources: {
        whatsapp: 0,
        facebook: 0,
        instagram: 0,
        email: 0
      },
      created: new Date().toISOString().split('T')[0],
      qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iYmxhY2siLz4KPC9zdmc+',
      performance: {
        ctr: 0,
        conversionRate: 0,
        avgTimeOnPage: '0:00'
      }
    };

    setLinks([...links, link]);
    setNewLink({ title: '', originalUrl: '', customSlug: '', campaign: '', source: '' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateQRCode = (url: string) => {
    // In a real implementation, this would generate actual QR codes
    return selectedLink.qrCode;
  };

  const getTotalClicks = () => {
    return links.reduce((sum, link) => sum + link.clicks, 0);
  };

  const getTotalConversions = () => {
    return links.reduce((sum, link) => sum + link.conversions, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Enlaces Inteligentes</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{getTotalClicks()}</div>
            <div className="text-sm text-gray-500">Clicks Totales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{getTotalConversions()}</div>
            <div className="text-sm text-gray-500">Conversiones</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="links" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="links">Enlaces</TabsTrigger>
          <TabsTrigger value="create">Crear</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="qr">QR Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {links.map((link) => (
              <Card key={link.id} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{link.title}</h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {link.shortUrl}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(`https://${link.shortUrl}`)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{link.originalUrl}</p>
                      
                      <div className="grid grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{link.clicks}</div>
                          <div className="text-xs text-gray-500">Clicks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{link.conversions}</div>
                          <div className="text-xs text-gray-500">Conversiones</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{link.performance.ctr}%</div>
                          <div className="text-xs text-gray-500">CTR</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{link.performance.conversionRate}%</div>
                          <div className="text-xs text-gray-500">Conv. Rate</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          WhatsApp: {link.sources.whatsapp}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Facebook: {link.sources.facebook}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Share2 className="h-3 w-3 mr-1" />
                          Instagram: {link.sources.instagram}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          Email: {link.sources.email}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Analíticas
                      </Button>
                      <Button variant="outline" size="sm">
                        <QrCode className="h-4 w-4 mr-1" />
                        QR Code
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Abrir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crear Nuevo Enlace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título de la Propiedad</label>
                <Input
                  value={newLink.title}
                  onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                  placeholder="Ej: Terreno Agrícola Premium en Casablanca"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL Original</label>
                <Input
                  value={newLink.originalUrl}
                  onChange={(e) => setNewLink({...newLink, originalUrl: e.target.value})}
                  placeholder="https://ofertaterrenos.com/property/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug Personalizado (Opcional)</label>
                <Input
                  value={newLink.customSlug}
                  onChange={(e) => setNewLink({...newLink, customSlug: e.target.value})}
                  placeholder="terreno-casablanca-premium"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Será: oferta.land/{newLink.customSlug || 'prop-xxx'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Campaña</label>
                  <Input
                    value={newLink.campaign}
                    onChange={(e) => setNewLink({...newLink, campaign: e.target.value})}
                    placeholder="invierno-2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fuente</label>
                  <select
                    value={newLink.source}
                    onChange={(e) => setNewLink({...newLink, source: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Seleccionar fuente</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="email">Email</option>
                    <option value="website">Website</option>
                  </select>
                </div>
              </div>

              <Button 
                onClick={generateShortUrl}
                disabled={!newLink.title || !newLink.originalUrl}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Link className="h-4 w-4 mr-2" />
                Generar Enlace Corto
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Clicks Totales</p>
                    <p className="text-2xl font-bold text-green-600">{getTotalClicks()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12% vs mes anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Conversiones</p>
                    <p className="text-2xl font-bold text-blue-600">{getTotalConversions()}</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">+8% vs mes anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">CTR Promedio</p>
                    <p className="text-2xl font-bold text-purple-600">3.0%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600">+5% vs mes anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Enlaces Activos</p>
                    <p className="text-2xl font-bold text-orange-600">{links.length}</p>
                  </div>
                  <Link className="h-8 w-8 text-orange-600" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600">+2 este mes</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fuentes de Tráfico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-sm">WhatsApp</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-sm font-medium">254 clicks</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-sm">Facebook</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                    <span className="text-sm font-medium">134 clicks</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Share2 className="h-4 w-4 mr-2 text-pink-600" />
                    <span className="text-sm">Instagram</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-pink-600 h-2 rounded-full" style={{ width: '19%' }}></div>
                    </div>
                    <span className="text-sm font-medium">105 clicks</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-purple-600" />
                    <span className="text-sm">Email</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                    <span className="text-sm font-medium">67 clicks</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Enlace</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedLink.id === link.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedLink(link)}
                    >
                      <div className="font-medium text-sm">{link.title}</div>
                      <div className="text-xs text-gray-500">{link.shortUrl}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Código QR</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4">
                  <img 
                    src={selectedLink.qrCode} 
                    alt="QR Code"
                    className="w-48 h-48 mx-auto border rounded-lg bg-white"
                  />
                </div>
                <p className="text-sm text-gray-600 mb-4">{selectedLink.shortUrl}</p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar QR PNG
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar QR SVG
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Enlace
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligentLinks;

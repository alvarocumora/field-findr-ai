import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  Filter,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Tag,
  Grid3X3,
  List,
  Search
} from 'lucide-react';

const PropertyInventory = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const properties = [
    {
      id: 'PROP-001',
      title: 'Terreno Agrícola Premium Casablanca',
      type: 'Agrícola',
      status: 'Disponible',
      price: 185000000,
      area: 50,
      location: 'Casablanca, Valparaíso',
      project: 'Condominio Las Palmas',
      dateAdded: '2024-01-15',
      lastUpdate: '2024-01-18',
      agent: 'María González',
      views: 1247,
      inquiries: 23,
      photos: 12,
      features: ['Riego tecnificado', 'Certificación orgánica', 'Bodega incluida'],
      legalStatus: 'Saneado',
      waterRights: true,
      priceHistory: [
        { date: '2024-01-15', price: 185000000 },
        { date: '2024-01-10', price: 190000000 }
      ]
    },
    {
      id: 'PROP-002',
      title: 'Sitio Industrial Quilicura',
      type: 'Industrial',
      status: 'Reservado',
      price: 290000000,
      area: 20,
      location: 'Quilicura, Santiago',
      project: 'Zona Industrial Norte',
      dateAdded: '2024-01-12',
      lastUpdate: '2024-01-17',
      agent: 'Carlos Mendoza',
      views: 892,
      inquiries: 18,
      photos: 8,
      features: ['Zona franca', 'Electricidad trifásica', 'Cercano aeropuerto'],
      legalStatus: 'Saneado',
      waterRights: false,
      priceHistory: [
        { date: '2024-01-12', price: 290000000 }
      ]
    },
    {
      id: 'PROP-003',
      title: 'Campo Ganadero Temuco',
      type: 'Ganadero',
      status: 'Vendido',
      price: 420000000,
      area: 150,
      location: 'Temuco, Araucanía',
      project: 'Desarrollo Rural Sur',
      dateAdded: '2024-01-08',
      lastUpdate: '2024-01-16',
      agent: 'Ana Sepúlveda',
      views: 756,
      inquiries: 31,
      photos: 15,
      features: ['Praderas naturales', 'Corrales techados', 'Casa patronal'],
      legalStatus: 'Saneado',
      waterRights: true,
      priceHistory: [
        { date: '2024-01-16', price: 420000000 },
        { date: '2024-01-08', price: 435000000 }
      ]
    },
    {
      id: 'PROP-004',
      title: 'Parcela de Agrado Pirque',
      type: 'Parcela',
      status: 'En Proceso',
      price: 125000000,
      area: 10,
      location: 'Pirque, Santiago',
      project: 'Parcelas Premium',
      dateAdded: '2024-01-18',
      lastUpdate: '2024-01-18',
      agent: 'Jorge Ruiz',
      views: 234,
      inquiries: 8,
      photos: 6,
      features: ['Vista cordillera', 'Pozo profundo', 'Luz trifásica'],
      legalStatus: 'Saneado',
      waterRights: true,
      priceHistory: [
        { date: '2024-01-18', price: 125000000 }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponible': return 'bg-green-100 text-green-800';
      case 'Reservado': return 'bg-orange-100 text-orange-800';
      case 'Vendido': return 'bg-gray-100 text-gray-800';
      case 'En Proceso': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Disponible': return <CheckCircle className="h-4 w-4" />;
      case 'Reservado': return <Clock className="h-4 w-4" />;
      case 'Vendido': return <CheckCircle className="h-4 w-4" />;
      case 'En Proceso': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesType = typeFilter === 'all' || property.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const inventoryStats = {
    total: properties.length,
    available: properties.filter(p => p.status === 'Disponible').length,
    reserved: properties.filter(p => p.status === 'Reservado').length,
    sold: properties.filter(p => p.status === 'Vendido').length,
    totalValue: properties.reduce((sum, p) => sum + p.price, 0),
    avgPrice: properties.reduce((sum, p) => sum + p.price, 0) / properties.length,
    totalArea: properties.reduce((sum, p) => sum + p.area, 0)
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Inventario de Propiedades</h1>
          <p className="text-muted-foreground">Gestiona y controla tu inventario inmobiliario completo</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-gradient-primary text-white">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nueva Propiedad
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="card-elegant">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Total Propiedades</p>
                <p className="text-2xl font-bold">{inventoryStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold">{inventoryStats.available}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Reservadas</p>
                <p className="text-2xl font-bold">{inventoryStats.reserved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">${(inventoryStats.totalValue / 1000000000).toFixed(1)}B</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Precio Promedio</p>
                <p className="text-2xl font-bold">${(inventoryStats.avgPrice / 1000000).toFixed(0)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Search and Filters */}
          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por título, código o ubicación..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Disponible">Disponible</SelectItem>
                    <SelectItem value="Reservado">Reservado</SelectItem>
                    <SelectItem value="En Proceso">En Proceso</SelectItem>
                    <SelectItem value="Vendido">Vendido</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Agrícola">Agrícola</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Ganadero">Ganadero</SelectItem>
                    <SelectItem value="Parcela">Parcela</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex space-x-2">
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'grid' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Properties List/Grid */}
          {viewMode === 'list' ? (
            <Card className="card-elegant">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Propiedad</th>
                        <th className="text-left p-4 font-medium">Estado</th>
                        <th className="text-left p-4 font-medium">Precio</th>
                        <th className="text-left p-4 font-medium">Área</th>
                        <th className="text-left p-4 font-medium">Agente</th>
                        <th className="text-left p-4 font-medium">Performance</th>
                        <th className="text-left p-4 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProperties.map((property) => (
                        <tr key={property.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{property.title}</p>
                                <p className="text-sm text-muted-foreground">{property.id}</p>
                                <p className="text-sm text-muted-foreground flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {property.location}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(property.status)}>
                              {getStatusIcon(property.status)}
                              <span className="ml-1">{property.status}</span>
                            </Badge>
                          </td>
                          <td className="p-4">
                            <p className="font-medium">${(property.price / 1000000).toFixed(0)}M</p>
                            <p className="text-sm text-muted-foreground">
                              ${(property.price / property.area / 1000000).toFixed(1)}M/há
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium">{property.area} há</p>
                            <Badge variant="outline" className="text-xs">
                              {property.type}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">{property.agent}</p>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <p className="text-sm">
                                <Eye className="h-3 w-3 inline mr-1" />
                                {property.views} vistas
                              </p>
                              <p className="text-sm">
                                <Tag className="h-3 w-3 inline mr-1" />
                                {property.inquiries} consultas
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="card-elegant hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(property.status)}>
                          {getStatusIcon(property.status)}
                          <span className="ml-1">{property.status}</span>
                        </Badge>
                        <span className="text-sm text-muted-foreground">{property.id}</span>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {property.location}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Precio</p>
                          <p className="text-xl font-bold text-green-600">
                            ${(property.price / 1000000).toFixed(0)}M
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Área</p>
                          <p className="text-lg font-semibold">{property.area} há</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {property.views}
                        </span>
                        <span className="flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {property.inquiries}
                        </span>
                        <span>{property.photos} fotos</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Performance por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Agrícola</span>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm">45% vendido</div>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Industrial</span>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm">38% vendido</div>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Parcelas</span>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm">62% vendido</div>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Tiempo Promedio en Mercado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">4.2 meses</div>
                  <p className="text-muted-foreground">Tiempo promedio desde publicación hasta venta</p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-lg font-semibold">3.1m</p>
                      <p className="text-sm text-muted-foreground">Más rápido</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">6.8m</p>
                      <p className="text-sm text-muted-foreground">Más lento</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Análisis de Precios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${(inventoryStats.avgPrice / 1000000).toFixed(1)}M</div>
                  <p className="text-sm text-muted-foreground">Precio Promedio</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">15%</div>
                  <p className="text-sm text-muted-foreground">Margen Promedio</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">+8.5%</div>
                  <p className="text-sm text-muted-foreground">Crecimiento Anual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Reportes Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Reporte de Inventario Completo
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Análisis de Performance
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Proyección de Ventas
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Análisis de Precios
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Exportar Datos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Formato de Exportación</label>
                    <Select defaultValue="excel">
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-gradient-primary text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Inventario
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

export default PropertyInventory;
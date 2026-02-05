import { useState } from 'react';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Shield, 
  Settings,
  BarChart3,
  Bell,
  Search,
  Filter,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import Layout from '@/components/Layout';
import { useAdminStats, useAdminUsers, useAdminListings } from '@/hooks/useDashboardStats';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const DashboardAdmin = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers(searchQuery);
  const { data: listings, isLoading: listingsLoading } = useAdminListings();

  const statsConfig = [
    { label: 'Usuarios Totales', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500' },
    { label: 'Propiedades Activas', value: stats?.activeListings || 0, icon: Building2, color: 'text-emerald-500' },
    { label: 'Total Propiedades', value: stats?.totalListings || 0, icon: TrendingUp, color: 'text-purple-500' },
    { label: 'Alertas Pendientes', value: stats?.pendingAlerts || 0, icon: AlertTriangle, color: 'text-amber-500' },
  ];

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      agent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      buyer: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    };
    return styles[role as keyof typeof styles] || styles.buyer;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000000) return `$${(price / 1000000000).toFixed(1)}B`;
    if (price >= 1000000) return `$${(price / 1000000).toFixed(0)}M`;
    return `$${price.toLocaleString('es-CL')}`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container py-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
              <p className="text-muted-foreground mt-1">Gestiona usuarios, propiedades y configuración del sistema</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="rounded-xl">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-xl">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsConfig.map((stat, index) => (
              <Card key={index} className="border-border/40 bg-card/50 backdrop-blur">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground">
                          {typeof stat.value === 'number' ? stat.value.toLocaleString('es-CL') : stat.value}
                        </p>
                      )}
                    </div>
                    <div className={`h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="users" className="rounded-lg gap-2">
                <Users className="h-4 w-4" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="properties" className="rounded-lg gap-2">
                <Building2 className="h-4 w-4" />
                Propiedades
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg gap-2">
                <BarChart3 className="h-4 w-4" />
                Analíticas
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg gap-2">
                <Shield className="h-4 w-4" />
                Seguridad
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
                <Button variant="outline" className="rounded-xl gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
              </div>

              {/* Users Table */}
              <Card className="border-border/40">
                <ScrollArea className="h-[400px]">
                  {usersLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : users && users.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className={getRoleBadge(user.role)}>
                              {user.role}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              <span className="text-muted-foreground">
                                {formatDistanceToNow(new Date(user.joined), { addSuffix: true, locale: es })}
                              </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <Users className="h-8 w-8 mb-2" />
                      <p>No se encontraron usuarios</p>
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4">
              <Card className="border-border/40">
                <ScrollArea className="h-[400px]">
                  {listingsLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : listings && listings.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {listings.map((listing) => (
                        <div key={listing.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{listing.title}</p>
                              <p className="text-sm text-muted-foreground">{listing.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-semibold text-primary">{formatPrice(listing.price)}</p>
                            <Badge variant="secondary" className={
                              listing.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 
                              listing.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : ''
                            }>
                              {listing.status === 'active' ? 'Activa' : listing.status}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <Building2 className="h-8 w-8 mb-2" />
                      <p>No hay propiedades registradas</p>
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="border-border/40 p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Analíticas Avanzadas</h3>
                <p className="text-muted-foreground mt-2">Próximamente: Métricas detalladas y reportes</p>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="border-border/40 p-8 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Centro de Seguridad</h3>
                <p className="text-muted-foreground mt-2">Próximamente: Logs de auditoría y configuración de permisos</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardAdmin;

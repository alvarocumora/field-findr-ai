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
  ChevronRight,
  UserCheck,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import Layout from '@/components/Layout';

const DashboardAdmin = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Placeholder stats
  const stats = [
    { label: 'Usuarios Totales', value: '1,247', change: '+12%', icon: Users, color: 'text-blue-500' },
    { label: 'Propiedades Activas', value: '438', change: '+8%', icon: Building2, color: 'text-emerald-500' },
    { label: 'Ingresos Mensuales', value: '$24.5M', change: '+23%', icon: TrendingUp, color: 'text-purple-500' },
    { label: 'Alertas Pendientes', value: '7', change: '-3', icon: AlertTriangle, color: 'text-amber-500' },
  ];

  // Placeholder recent users
  const recentUsers = [
    { id: '1', name: 'Carlos Mendoza', email: 'carlos@email.com', role: 'agent', status: 'active', joined: '2024-01-15' },
    { id: '2', name: 'María González', email: 'maria@email.com', role: 'buyer', status: 'pending', joined: '2024-01-14' },
    { id: '3', name: 'Juan Pérez', email: 'juan@email.com', role: 'agent', status: 'active', joined: '2024-01-13' },
    { id: '4', name: 'Ana Silva', email: 'ana@email.com', role: 'admin', status: 'active', joined: '2024-01-12' },
  ];

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      agent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      buyer: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    };
    return styles[role as keyof typeof styles] || styles.buyer;
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
            {stats.map((stat, index) => (
              <Card key={index} className="border-border/40 bg-card/50 backdrop-blur">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <Badge variant="secondary" className="text-xs">
                        {stat.change}
                      </Badge>
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
                  <div className="divide-y divide-border/40">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name.split(' ').map(n => n[0]).join('')}
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
                            {user.status === 'active' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="text-muted-foreground capitalize">{user.status}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="properties">
              <Card className="border-border/40 p-8 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Gestión de Propiedades</h3>
                <p className="text-muted-foreground mt-2">Próximamente: Moderación y verificación de listings</p>
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

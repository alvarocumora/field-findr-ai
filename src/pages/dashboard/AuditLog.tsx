import { useState } from 'react';
import { Shield, Search, Filter, Loader2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-blue-500/10 text-blue-500',
  role_change: 'bg-purple-500/10 text-purple-500',
  reservation: 'bg-emerald-500/10 text-emerald-500',
  price_change: 'bg-amber-500/10 text-amber-500',
  cancellation: 'bg-destructive/10 text-destructive',
  document: 'bg-cyan-500/10 text-cyan-500',
};

const AuditLog = () => {
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs-full', actionFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (actionFilter !== 'all') {
        query = query.ilike('action', `%${actionFilter}%`);
      }
      if (searchQuery) {
        query = query.or(`action.ilike.%${searchQuery}%,entity_type.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const exportCSV = () => {
    if (!logs?.length) return;
    const headers = ['Fecha', 'Acción', 'Tipo Entidad', 'ID Entidad', 'IP', 'Detalles'];
    const rows = logs.map((l) => [
      format(new Date(l.created_at), 'dd/MM/yyyy HH:mm'),
      l.action,
      l.entity_type || '',
      l.entity_id || '',
      l.ip_address || '',
      JSON.stringify(l.details || {}),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Auditoría y Seguridad
          </h1>
          <p className="text-muted-foreground mt-1">Registro de acciones críticas del sistema</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por acción o entidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="role_change">Cambio de rol</SelectItem>
            <SelectItem value="reservation">Reservas</SelectItem>
            <SelectItem value="price_change">Cambios de precio</SelectItem>
            <SelectItem value="cancellation">Cancelaciones</SelectItem>
            <SelectItem value="document">Documentos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{logs?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total registros</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">
              {logs?.filter((l) => l.action?.includes('login')).length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Logins</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">
              {logs?.filter((l) => l.action?.includes('price')).length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Cambios precio</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {logs?.filter((l) => l.action?.includes('cancel')).length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Cancelaciones</p>
          </CardContent>
        </Card>
      </div>

      {/* Log Table */}
      <Card className="border-border/40">
        <ScrollArea className="h-[600px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="divide-y divide-border/40">
              {logs.map((log) => {
                const actionColor = Object.entries(ACTION_COLORS).find(
                  ([key]) => log.action?.toLowerCase().includes(key)
                )?.[1] || 'bg-muted text-muted-foreground';

                return (
                  <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className={actionColor}>
                              {log.action}
                            </Badge>
                            {log.entity_type && (
                              <span className="text-xs text-muted-foreground">{log.entity_type}</span>
                            )}
                          </div>
                          {log.entity_id && (
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                              ID: {log.entity_id}
                            </p>
                          )}
                          {log.ip_address && (
                            <p className="text-xs text-muted-foreground">IP: {log.ip_address}</p>
                          )}
                          {log.details && Object.keys(log.details).length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/30 px-2 py-1 rounded truncate max-w-md">
                              {JSON.stringify(log.details).slice(0, 150)}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Shield className="h-8 w-8 mb-2" />
              <p>No hay registros de auditoría</p>
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

export default AuditLog;

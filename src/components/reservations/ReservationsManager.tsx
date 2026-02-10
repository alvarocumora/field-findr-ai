import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  Calendar,
  User,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

type ReservationStatus = 'pending_payment' | 'paid' | 'expired' | 'cancelled' | 'converted';

const STATUS_CONFIG: Record<ReservationStatus, { label: string; icon: typeof Clock; className: string }> = {
  pending_payment: { label: 'Pendiente', icon: Clock, className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  paid: { label: 'Pagada', icon: CheckCircle2, className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  expired: { label: 'Expirada', icon: AlertTriangle, className: 'bg-red-500/10 text-red-600 border-red-500/20' },
  cancelled: { label: 'Cancelada', icon: XCircle, className: 'bg-muted text-muted-foreground border-border' },
  converted: { label: 'Convertida', icon: ArrowUpRight, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
};

const ReservationsManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['admin-reservations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get reservations for lots owned by the user (via projects)
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          lots!inner (
            lot_number,
            name,
            area,
            price,
            project_id,
            projects!inner (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' as ReservationStatus })
        .eq('id', reservationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      toast.success('Reserva cancelada exitosamente');
    },
    onError: () => toast.error('Error al cancelar la reserva'),
  });

  const confirmMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'paid' as ReservationStatus, paid_at: new Date().toISOString() })
        .eq('id', reservationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      toast.success('Pago confirmado manualmente');
    },
    onError: () => toast.error('Error al confirmar el pago'),
  });

  const convertMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'converted' as ReservationStatus, converted_at: new Date().toISOString() })
        .eq('id', reservationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      toast.success('Reserva convertida a venta');
    },
    onError: () => toast.error('Error al convertir la reserva'),
  });

  const filtered = reservations.filter((r: any) => {
    const matchesSearch = searchQuery === '' ||
      r.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.buyer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: reservations.length,
    pending: reservations.filter((r: any) => r.status === 'pending_payment').length,
    paid: reservations.filter((r: any) => r.status === 'paid').length,
    expired: reservations.filter((r: any) => r.status === 'expired').length,
    totalAmount: reservations
      .filter((r: any) => r.status === 'paid')
      .reduce((sum: number, r: any) => sum + (r.reservation_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Reservas', value: stats.total, icon: Calendar, color: 'text-primary' },
          { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'text-amber-500' },
          { label: 'Pagadas', value: stats.paid, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Ingresos Señas', value: `$${(stats.totalAmount / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-primary' },
        ].map((stat, i) => (
          <Card key={i} className="border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending_payment">Pendientes</SelectItem>
            <SelectItem value="paid">Pagadas</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
            <SelectItem value="converted">Convertidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reservations List */}
      <Card className="border-border/40">
        <ScrollArea className="max-h-[600px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Calendar className="h-8 w-8 mb-2" />
              <p>No se encontraron reservas</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((reservation: any) => {
                const config = STATUS_CONFIG[reservation.status as ReservationStatus] || STATUS_CONFIG.pending_payment;
                const StatusIcon = config.icon;
                const lot = reservation.lots;
                const project = lot?.projects;
                const isExpired = new Date(reservation.expires_at) < new Date() && reservation.status === 'pending_payment';

                return (
                  <div key={reservation.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${config.className}`}>
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-foreground">{reservation.buyer_name}</h4>
                            <Badge variant="outline" className={config.className}>
                              {config.label}
                            </Badge>
                            {isExpired && (
                              <Badge variant="destructive" className="text-xs">Expirada</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {reservation.buyer_email}
                            {reservation.buyer_phone && ` • ${reservation.buyer_phone}`}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${reservation.reservation_amount?.toLocaleString('es-CL')}
                            </span>
                            <span>
                              {lot?.name || `Lote ${lot?.lot_number}`}
                            </span>
                            {project?.name && (
                              <span className="text-primary">{project.name}</span>
                            )}
                            <span>
                              {formatDistanceToNow(new Date(reservation.created_at), { addSuffix: true, locale: es })}
                            </span>
                          </div>
                          {reservation.status === 'pending_payment' && (
                            <p className="text-xs text-amber-600 mt-1">
                              Expira: {format(new Date(reservation.expires_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {reservation.status === 'pending_payment' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-500/30 hover:bg-green-500/10"
                            onClick={() => confirmMutation.mutate(reservation.id)}
                            disabled={confirmMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Confirmar Pago
                          </Button>
                        )}
                        {reservation.status === 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                            onClick={() => convertMutation.mutate(reservation.id)}
                            disabled={convertMutation.isPending}
                          >
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            Convertir a Venta
                          </Button>
                        )}
                        {(reservation.status === 'pending_payment' || reservation.status === 'paid') && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción liberará el lote y cancelará la reserva de {reservation.buyer_name}. 
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>No, mantener</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelMutation.mutate(reservation.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Sí, cancelar reserva
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

export default ReservationsManager;

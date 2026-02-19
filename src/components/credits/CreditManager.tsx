import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCredits, Credit } from '@/hooks/useCredits';
import { CreditDetail } from './CreditDetail';
import { CreateCreditDialog } from './CreateCreditDialog';
import { formatPriceLatam } from '@/lib/latam';
import {
  DollarSign, TrendingUp, AlertTriangle, CreditCard,
  PlusCircle, ChevronRight, FileText,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', completed: 'Completado', defaulted: 'Moroso', cancelled: 'Cancelado',
};
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600 border-green-500/20',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  defaulted: 'bg-red-500/10 text-red-600 border-red-500/20',
  cancelled: 'bg-muted text-muted-foreground',
};

const CreditManager = () => {
  const { data: credits = [], isLoading, stats } = useCredits();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);

  if (selectedCredit) {
    return <CreditDetail credit={selectedCredit} onBack={() => setSelectedCredit(null)} />;
  }

  const filtered = statusFilter === 'all' ? credits : credits.filter(c => c.status === statusFilter);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Créditos</h1>
          <p className="text-sm text-muted-foreground">Financiamiento directo a compradores</p>
        </div>
        <CreateCreditDialog
          trigger={
            <Button className="rounded-xl gap-2">
              <PlusCircle className="h-4 w-4" />
              Nuevo Crédito
            </Button>
          }
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Financiado</p>
            <p className="text-xl font-bold text-foreground">${stats.totalFinanced.toLocaleString('es-CL')}</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Créditos Activos</p>
            <p className="text-xl font-bold text-foreground">{stats.activeCount}</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Morosos</p>
            <p className="text-xl font-bold text-foreground">{stats.defaultedCount}</p>
          </div>
        </CardContent></Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="defaulted">Morosos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Credits List */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
      <Card className="p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin créditos aún</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Los créditos se crean desde una reserva pagada. Primero necesitas una reserva confirmada para ofrecer financiamiento directo.
          </p>
          <Button variant="outline" className="mt-4 gap-2" asChild>
            <a href="/asesor/reservations">
              <FileText className="h-4 w-4" />
              Ir a Reservas
            </a>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(credit => (
            <Card
              key={credit.id}
              className="cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setSelectedCredit(credit)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {(credit as any).lots?.projects?.name || 'Proyecto'} — Lote {(credit as any).lots?.lot_number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatPriceLatam(Number(credit.financed_amount), credit.currency || 'CLP')} · {credit.term_months} cuotas · {credit.interest_rate}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={STATUS_COLORS[credit.status]}>{STATUS_LABELS[credit.status]}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreditManager;

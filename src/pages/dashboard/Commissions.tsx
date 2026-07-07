import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { DollarSign, Handshake, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { useAgentCommissions, useMarkCommissionPaid } from '@/hooks/useAgentCommissions';
import {
  useReferralCommissionsEarned,
  useReferralCommissionsOwed,
  useMarkReferralPaid,
} from '@/hooks/useReferrals.commissions';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    pending: { label: 'Pendiente', variant: 'secondary' },
    paid: { label: 'Pagada', variant: 'default' },
    cancelled: { label: 'Cancelada', variant: 'outline' },
    none: { label: '—', variant: 'outline' },
  };
  const cfg = map[status] ?? map.none;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

const CommissionsPage = () => {
  const { data: mine = [] } = useAgentCommissions();
  const { data: earned = [] } = useReferralCommissionsEarned();
  const { data: owed = [] } = useReferralCommissionsOwed();
  const markPaid = useMarkCommissionPaid();
  const markReferralPaid = useMarkReferralPaid();

  // My commissions net of any referral split I owe out
  const mineNet = useMemo(
    () => mine.map(c => ({
      ...c,
      net_amount: (c.commission_amount || 0) - ((c as any).referral_amount || 0),
    })),
    [mine],
  );

  const totals = useMemo(() => {
    const myPending = mineNet.filter(c => c.status === 'pending')
      .reduce((s, c) => s + c.net_amount, 0);
    const myPaid = mineNet.filter(c => c.status === 'paid')
      .reduce((s, c) => s + c.net_amount, 0);
    const earnedPending = earned.filter(c => c.referral_status === 'pending')
      .reduce((s, c) => s + (c.referral_amount || 0), 0);
    const earnedPaid = earned.filter(c => c.referral_status === 'paid')
      .reduce((s, c) => s + (c.referral_amount || 0), 0);
    return { myPending, myPaid, earnedPending, earnedPaid };
  }, [mineNet, earned]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comisiones</h1>
        <p className="text-muted-foreground">
          Ventas propias y referidos entre corredores.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Mis ventas · pagadas" value={fmt(totals.myPaid)} tone="emerald" />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Mis ventas · por cobrar" value={fmt(totals.myPending)} tone="amber" />
        <StatCard icon={<Handshake className="h-5 w-5" />} label="Referidos · cobradas" value={fmt(totals.earnedPaid)} tone="emerald" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Referidos · por cobrar" value={fmt(totals.earnedPending)} tone="amber" />
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">Mis ventas</TabsTrigger>
          <TabsTrigger value="earned">Referidos ganados</TabsTrigger>
          <TabsTrigger value="owed">Referidos a pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="mine">
          <Card>
            <CardHeader><CardTitle>Comisiones de mis ventas</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Venta</TableHead>
                    <TableHead>% / Comisión</TableHead>
                    <TableHead>Referido</TableHead>
                    <TableHead>Neto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mineNet.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin comisiones aún</TableCell></TableRow>
                  )}
                  {mineNet.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>{new Date(c.created_at).toLocaleDateString('es-CL')}</TableCell>
                      <TableCell>{fmt(c.sale_amount)}</TableCell>
                      <TableCell>{c.commission_rate}% · {fmt(c.commission_amount)}</TableCell>
                      <TableCell>{(c as any).referral_amount > 0 ? `-${fmt((c as any).referral_amount)}` : '—'}</TableCell>
                      <TableCell className="font-medium">{fmt(c.net_amount)}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-right">
                        {c.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => markPaid.mutate(c.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar pagada
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earned">
          <Card>
            <CardHeader><CardTitle>Comisiones que ganaste por referir clientes</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Venta</TableHead>
                    <TableHead>% referido</TableHead>
                    <TableHead>Tu comisión</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earned.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aún no has recibido comisiones por referidos.</TableCell></TableRow>
                  )}
                  {earned.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>{new Date(c.created_at).toLocaleDateString('es-CL')}</TableCell>
                      <TableCell>{fmt(c.sale_amount)}</TableCell>
                      <TableCell>{c.referral_rate}%</TableCell>
                      <TableCell className="font-medium">{fmt(c.referral_amount)}</TableCell>
                      <TableCell><StatusBadge status={c.referral_status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owed">
          <Card>
            <CardHeader><CardTitle>Referidos que debes pagar a otros corredores</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Venta</TableHead>
                    <TableHead>% referido</TableHead>
                    <TableHead>A pagar</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owed.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No debes comisiones por referidos.</TableCell></TableRow>
                  )}
                  {owed.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>{new Date(c.created_at).toLocaleDateString('es-CL')}</TableCell>
                      <TableCell>{fmt(c.sale_amount)}</TableCell>
                      <TableCell>{c.referral_rate}%</TableCell>
                      <TableCell className="font-medium">{fmt(c.referral_amount)}</TableCell>
                      <TableCell><StatusBadge status={c.referral_status} /></TableCell>
                      <TableCell className="text-right">
                        {c.referral_status === 'pending' && (
                          <Button size="sm" onClick={() => markReferralPaid.mutate(c.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar pagada
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'emerald' | 'amber' }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={tone === 'emerald' ? 'text-emerald-500' : 'text-amber-500'}>{icon}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default CommissionsPage;

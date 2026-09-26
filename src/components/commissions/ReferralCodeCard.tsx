import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Share2, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useMyBrokerProfile } from '@/hooks/useBrokers';
import { getCanonicalUrl, getShareUrl } from '@/lib/publicUrls';

interface Props {
  pendingBalance: number;
  paidBalance: number;
  referredSales: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

/** Tarjeta con el código de referido del corredor y su saldo de comisiones. */
export const ReferralCodeCard = ({ pendingBalance, paidBalance, referredSales }: Props) => {
  const { data: profile } = useMyBrokerProfile();
  const [copied, setCopied] = useState(false);

  const code = profile?.invite_code ?? null;
  const link = useMemo(
    () => (code ? getShareUrl('/comunidad', { ref: code }) : ''),
    [code],
  );

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link de referido copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!link) return;
    if (navigator.share) {
      await navigator.share({ title: 'Únete a la red de corredores', url: link }).catch(() => undefined);
    } else {
      copy();
    }
  };

  if (!profile) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-primary" aria-hidden />
          Mi código de referido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <code className="rounded-md border bg-background px-3 py-2 font-mono text-lg tracking-widest">
            {code ?? '—'}
          </code>
          <Badge variant="secondary">Override {(profile.network_override_rate ?? 0)}%</Badge>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copy} disabled={!link}>
              {copied ? <Check className="h-4 w-4 mr-2" aria-hidden /> : <Copy className="h-4 w-4 mr-2" aria-hidden />}
              Copiar link
            </Button>
            <Button size="sm" onClick={share} disabled={!link}>
              <Share2 className="h-4 w-4 mr-2" aria-hidden />Compartir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Ventas referidas</p>
            <p className="text-xl font-bold">{referredSales}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Saldo por cobrar</p>
            <p className="text-xl font-bold text-amber-500">{fmt(pendingBalance)}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Ya pagado</p>
            <p className="text-xl font-bold text-emerald-500">{fmt(paidBalance)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCodeCard;

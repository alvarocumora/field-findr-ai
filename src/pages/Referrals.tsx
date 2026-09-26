import PublicLayout from '@/components/layouts/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useMyReferrals, useReferralStats, useCreateReferral } from '@/hooks/useReferrals';
import { Gift, Users, DollarSign, Copy, Share2, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCanonicalUrl, getShareUrl } from '@/lib/publicUrls';

const Referrals = () => {
  const { user } = useAuth();
  const { total, registered, converted, pendingRewards, referrals } = useReferralStats();
  const createReferral = useCreateReferral();

  const copyCode = (code: string) => {
    const url = getShareUrl('/auth', { ref: code });
    navigator.clipboard.writeText(url);
    toast({ title: 'Enlace copiado', description: 'Comparte este enlace con tus amigos.' });
  };

  const shareCode = (code: string) => {
    const url = getShareUrl('/auth', { ref: code });
    const text = `¡Únete a Ofertaterrenos! Usa mi código de referido: ${code}`;
    if (navigator.share) {
      navigator.share({ title: 'Ofertaterrenos - Referido', text, url });
    } else {
      copyCode(code);
    }
  };

  if (!user) {
    return (
      <PublicLayout>
        <div className="container px-4 py-16 text-center">
          <Gift className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Programa de Referidos</h1>
          <p className="text-muted-foreground mb-6">Inicia sesión para generar tu código de referido y ganar recompensas.</p>
          <Button asChild><Link to="/auth">Ingresar</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Programa de Referidos</h1>
          </div>
          <p className="text-muted-foreground">
            Invita amigos a Ofertaterrenos y gana recompensas cuando se registren o realicen su primera compra.
          </p>
        </div>

        {/* How it works */}
        <Card className="glass border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'Genera tu código', desc: 'Crea un código único de referido', icon: Gift },
                { step: '2', title: 'Comparte', desc: 'Envíalo a amigos interesados en terrenos', icon: Share2 },
                { step: '3', title: 'Gana recompensas', desc: 'Recibe beneficios cuando se registren', icon: DollarSign },
              ].map(item => (
                <div key={item.step} className="text-center p-4 rounded-lg bg-muted/30">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Invitaciones', value: total, icon: Users },
            { label: 'Registrados', value: registered, icon: ArrowRight },
            { label: 'Convertidos', value: converted, icon: DollarSign },
            { label: 'Recompensas', value: `$${pendingRewards.toLocaleString()}`, icon: Gift },
          ].map(stat => (
            <Card key={stat.label} className="glass border-border/50">
              <CardContent className="p-4 text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Generate + List */}
        <Card className="glass border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Mis Códigos</CardTitle>
              <Button size="sm" onClick={() => createReferral.mutate()} disabled={createReferral.isPending}>
                <Gift className="h-4 w-4 mr-2" />
                Generar código
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aún no tienes códigos. ¡Genera uno para empezar!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map(ref => (
                  <div key={ref.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <code className="text-sm font-mono font-bold text-primary">{ref.referral_code}</code>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {ref.status === 'converted' ? 'Convertido' : ref.status === 'registered' ? 'Registrado' : 'Pendiente'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(ref.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyCode(ref.referral_code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => shareCode(ref.referral_code)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default Referrals;

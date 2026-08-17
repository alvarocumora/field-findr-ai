import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PublicLayout from '@/components/layouts/PublicLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Mail, Phone, Building2 } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

const useBrokerBySlug = (slug?: string) =>
  useQuery({
    queryKey: ['broker-showcase', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('broker_profiles')
        .select('slug,display_name,company_name,bio,avatar_url,level,zones,phone,email')
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('is_public', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

const BrokerShowcase = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: broker, isLoading } = useBrokerBySlug(slug);

  useSEO({
    title: broker
      ? `${broker.display_name} · Broker de terrenos y loteos`
      : 'Broker | Oferta Terrenos',
    description: broker?.bio
      ? broker.bio.slice(0, 155)
      : 'Perfil de broker especializado en loteos, parcelas y terrenos en Chile y LATAM.',
    canonicalUrl: `/b/${slug ?? ''}`,
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container px-4 py-12 max-w-3xl space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </PublicLayout>
    );
  }

  if (!broker) {
    return (
      <PublicLayout>
        <div className="container px-4 py-24 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Broker no encontrado</h1>
          <p className="text-muted-foreground mb-6">
            Este perfil no existe o no está disponible públicamente.
          </p>
          <Button asChild><Link to="/brokers/ranking">Ver la comunidad</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <main className="container px-4 py-12 max-w-3xl space-y-6">
        <header className="text-center">
          {broker.avatar_url && (
            <img src={broker.avatar_url} alt={broker.display_name}
              className="h-24 w-24 rounded-full object-cover mx-auto mb-4" loading="lazy" />
          )}
          <h1 className="text-3xl font-bold mb-1">{broker.display_name}</h1>
          {broker.company_name && (
            <p className="text-muted-foreground flex items-center justify-center gap-1">
              <Building2 className="h-4 w-4" aria-hidden="true" /> {broker.company_name}
            </p>
          )}
          <Badge variant="secondary" className="mt-3">Broker {broker.level}</Badge>
        </header>

        {broker.bio && (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground whitespace-pre-line">{broker.bio}</p>
            </CardContent>
          </Card>
        )}

        {broker.zones && broker.zones.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden="true" /> Zonas de trabajo
              </h2>
              <div className="flex flex-wrap gap-2">
                {broker.zones.map((z: string) => (
                  <Badge key={z} variant="outline">{z}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6 flex flex-wrap gap-3 justify-center">
            {broker.phone && (
              <Button asChild>
                <a href={`https://wa.me/${broker.phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer">
                  <Phone className="h-4 w-4 mr-2" /> Contactar por WhatsApp
                </a>
              </Button>
            )}
            {broker.email && (
              <Button variant="outline" asChild>
                <a href={`mailto:${broker.email}`}>
                  <Mail className="h-4 w-4 mr-2" /> Enviar email
                </a>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/explorar">Ver terrenos disponibles</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </PublicLayout>
  );
};

export default BrokerShowcase;

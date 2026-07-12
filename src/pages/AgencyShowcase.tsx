import { useParams, Link } from 'react-router-dom';
import { Loader2, Building2, MapPin, ArrowLeft, Grid3X3, MessageCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgencyShowcase } from '@/hooks/useAgencyShowcase';
import { AgencyContactDialog } from '@/components/agency/AgencyContactDialog';

/** Public branded showcase for an inmobiliaria: /inmobiliaria/:slug */
const AgencyShowcase = () => {
  const { slug } = useParams<{ slug: string }>();
  const { agency, projects, isLoading, notFound } = useAgencyShowcase(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !agency) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Vitrina no encontrada</h1>
          <p className="text-sm text-muted-foreground">Esta inmobiliaria no existe o su vitrina no es pública.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Ir al inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-5xl mx-auto px-4 py-10 flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-card border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
            {agency.logo_url ? (
              <img src={agency.logo_url} alt={agency.company_name ?? 'Logo'} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-9 w-9 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{agency.company_name || 'Inmobiliaria'}</h1>
            {agency.bio && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{agency.bio}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Badge variant="secondary" className="gap-1">
                <Grid3X3 className="h-3 w-3" />
                {projects.length} proyecto{projects.length === 1 ? '' : 's'}
              </Badge>
              <AgencyContactDialog slug={slug ?? ''} agencyName={agency.company_name || 'la inmobiliaria'} />
              {agency.phone && (
                <a
                  href={`https://wa.me/${agency.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${agency.company_name || ''}, vi su vitrina en Ofertaterrenos y me interesan sus proyectos.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-sm font-medium text-white hover:brightness-95"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Projects */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {projects.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Esta inmobiliaria aún no tiene proyectos publicados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/proyecto/${p.id}`}
                className="group rounded-xl border border-border/50 bg-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[16/10] bg-muted overflow-hidden relative">
                  {p.featured && (
                    <Badge className="absolute top-2 left-2 z-10 gap-1 bg-amber-500 text-white border-0">
                      <Star className="h-3 w-3 fill-current" /> Destacado
                    </Badge>
                  )}
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <Building2 className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-1.5">
                  <h3 className="font-semibold text-foreground line-clamp-1">{p.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[p.city, p.region].filter(Boolean).join(', ') || p.location || 'Chile'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span>{p.total_lots ?? 0} lotes</span>
                    {typeof p.available_lots === 'number' && (
                      <span className="text-green-600 font-medium">{p.available_lots} disponibles</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border/40 py-6 text-center">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">Ofertaterrenos</Link>
        </Button>
      </footer>
    </div>
  );
};

export default AgencyShowcase;

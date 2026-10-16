import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, CalendarDays, CheckCircle2, MapPin, Mail, MessageCircle, Phone, Ruler, Store, Trees,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LotMapView } from '@/components/lots/LotMapView';
import MapErrorBoundary from '@/components/map/MapErrorBoundary';
import { LotSalesSheet, type SalesLot } from '@/components/sales/LotSalesSheet';
import { LotReserveDialog } from '@/components/sales/LotReserveDialog';
import { ProjectConversionBar } from '@/components/sales/ProjectConversionBar';
import { supabase } from '@/integrations/supabase/client';
import { parseLandingConfig, summarizeLots } from '@/lib/landing/config';
import { LandingLeadForm } from './LandingLeadForm';
import { bespokeLandings, canonicalPathForSlug } from '@/lib/landing/registry';
import { useSEO, buildProjectJsonLd } from '@/hooks/useSEO';
import { ProjectDownloads } from '@/components/projects/ProjectDownloads';
import { ShareButtons } from '@/components/social/ShareButtons';
import { projectSocial } from '@/lib/landing/projectSocial';


const clp = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

/**
 * Landing genérica de proyecto (/p/:slug): una sola página premium para TODOS
 * los loteos, alimentada por la base (projects + get_public_lots) y afinada
 * por projects.landing_config. Reemplaza el patrón de landings hardcodeadas
 * por proyecto, cuyos datos divergían de la plataforma.
 */
const ProjectLanding = ({ slug: slugProp }: { slug?: string } = {}) => {
  const params = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const sharedLotId = searchParams.get('lote');
  const openedSharedLot = useRef<string | null>(null);
  const slug = slugProp ?? params.slug;
  const Bespoke = slug ? bespokeLandings[slug] : undefined;
  const [leadLot, setLeadLot] = useState<{ id: string; lot_number?: string | null } | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [lotSheetOpen, setLotSheetOpen] = useState(false);
  const [reserveLot, setReserveLot] = useState<SalesLot | null>(null);
  const [reserveOpen, setReserveOpen] = useState(false);
  const masterplanRef = useRef<HTMLDivElement>(null);



  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['landing-project', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug' as never, slug as never)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug && !Bespoke,
  });

  const { data: lots = [], isLoading: lotsLoading, error: lotsError } = useQuery({
    queryKey: ['landing-lots', project?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_lots', { p_project_id: project!.id });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string; lot_number: string | null; status: string | null;
        area: number | null; price: number | null;
        slope_category?: string | null; elevation_avg?: number | null; images?: string[] | null;
      }>;
    },
    enabled: !!project?.id && !Bespoke,
  });


  const cfg = useMemo(() => parseLandingConfig(project?.landing_config), [project?.landing_config]);
  const stats = useMemo(() => summarizeLots(lots), [lots]);

  useEffect(() => {
    const key = `${project?.id}:${sharedLotId}`;
    if (!sharedLotId || openedSharedLot.current === key || !lots.some(lot => lot.id === sharedLotId)) return;
    openedSharedLot.current = key;
    setOnlyAvailable(false);
    setSelectedLotId(sharedLotId);
    setLotSheetOpen(true);
  }, [sharedLotId, lots, project?.id]);

  const social = project ? projectSocial(project, lotsLoading || lotsError ? undefined : lots) : undefined;

  // SEO único por proyecto + canónica histórica cuando existe.
  const seoTitle = project
    ? `${(cfg.hero.title as string | undefined) ?? project.name}`
    : 'Proyecto de lotes';
  useSEO({
    title: seoTitle,
    description: social?.description,
    type: 'website',
    url: slug ? `https://ofertaterrenos.com${canonicalPathForSlug(slug)}` : undefined,
    canonicalUrl: slug ? `https://ofertaterrenos.com${canonicalPathForSlug(slug)}` : undefined,
    image: (cfg.hero.image as string | undefined) ??
      ((Array.isArray(project?.images) ? (project?.images as string[])[0] : undefined) || undefined),
    jsonLd: project
      ? buildProjectJsonLd({
          id: project.id,
          slug: project.slug,
          name: project.name,
          description: (project.description as string | null) ?? null,
          city: (project.location as string | null) ?? null,
          region: (project.region as string | null) ?? null,
          images: Array.isArray(project.images) ? (project.images as string[]) : null,
          total_lots: stats.total || null,
          available_lots: stats.available,
        })
      : undefined,
  });


  if (Bespoke) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Bespoke />
      </Suspense>
    );
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-[420px] w-full rounded-2xl" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Trees className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Proyecto no encontrado</h1>
        <p className="text-muted-foreground">El enlace puede haber cambiado o el proyecto ya no está publicado.</p>
        <Button asChild><Link to="/explorar">Explorar terrenos<ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
      </div>
    );
  }

  const images = (Array.isArray(project.images) ? project.images : []) as string[];
  const gallery = cfg.gallery.length > 0 ? cfg.gallery : images;
  const heroImage = cfg.hero.image ?? gallery[0];
  const title = cfg.hero.title ?? project.name;
  const location = [project.location, project.region].filter(Boolean).join(', ');
  const subtitle = cfg.hero.subtitle ?? (project.description as string | null) ?? undefined;
  const openLead = (lot?: { id: string; lot_number?: string | null }) => {
    setLeadLot(lot ?? null);
    setLeadOpen(true);
  };
  const goMasterplan = () => masterplanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const visibleLots = onlyAvailable
    ? lots.filter((l) => l.status === 'available')
    : lots;
  const selectedIndex = visibleLots.findIndex((l) => l.id === selectedLotId);
  const selectedLot = (selectedIndex >= 0 ? visibleLots[selectedIndex] : null) as SalesLot | null;
  const openLot = (id: string) => { setSelectedLotId(id); setLotSheetOpen(true); };
  const areaLabel = stats.areaMin
    ? `${Math.round(stats.areaMin).toLocaleString('es-CL')}–${Math.round(stats.areaMax!).toLocaleString('es-CL')} m²`
    : '—';

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero — sala de ventas */}
      <header className="relative min-h-[62vh] flex items-end">
        {heroImage && (
          <img src={heroImage} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25" />
        <div className="relative container max-w-5xl pb-12 pt-28 text-white">
          <Badge className="bg-primary text-primary-foreground mb-3">Venta de lotes</Badge>
          <h1 className="text-4xl md:text-5xl font-bold drop-shadow">{title}</h1>
          {location && (
            <p className="mt-2 flex items-center gap-1.5 text-white/90"><MapPin className="h-4 w-4" />{location}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/90">
            <span><strong className="font-semibold">{stats.available}</strong> lotes disponibles</span>
            {stats.priceFrom && <span>Desde <strong className="font-semibold">{clp(stats.priceFrom)}</strong></span>}
            {stats.areaMin && <span>Parcelas desde <strong className="font-semibold">{Math.round(stats.areaMin).toLocaleString('es-CL')} m²</strong></span>}
          </div>
          {subtitle && <p className="mt-3 max-w-2xl text-white/80 line-clamp-3">{subtitle}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <ShareButtons title={project.name} description={social?.description} url={social?.url} />
            <Button size="lg" className="min-h-11" onClick={goMasterplan}>
              Ver lotes disponibles<ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="secondary" className="min-h-11" onClick={() => openLead()}>
              <CalendarDays className="h-4 w-4 mr-2" />{cfg.hero.cta ?? 'Agendar visita'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-h-11 border-white/40 bg-white/10 text-white hover:bg-white/20"
              asChild
            >
              <Link to={`/proyecto/${project.id}/experiencia`}>Recorrido virtual</Link>
            </Button>

            {cfg.contact.whatsapp && (
              <Button
                size="lg"
                variant="outline"
                className="min-h-11 border-white/40 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <a
                  href={`https://wa.me/${cfg.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, quiero información de ${title}. ${social?.url}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />Hablar con un asesor
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-10 space-y-14">
        {/* Ficha comercial */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-20 relative z-10">
          {[
            { label: 'Lotes', value: `${stats.available} disponibles de ${stats.total}` },
            { label: 'Superficies', value: areaLabel },
            { label: 'Desde', value: stats.priceFrom ? clp(stats.priceFrom) : 'Consultar' },
            { label: 'Ubicación', value: location || '—' },
          ].map((s) => (
            <Card key={s.label} className="border-border/60 bg-card/95 backdrop-blur">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="font-semibold text-foreground mt-1 text-sm md:text-base">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Highlights */}
        {cfg.highlights.length > 0 && (
          <section className="grid sm:grid-cols-2 gap-2">
            {cfg.highlights.map((h) => (
              <p key={h} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />{h}
              </p>
            ))}
          </section>
        )}

        {/* Masterplan interactivo con lotes reales */}
        {cfg.sections.masterplan && lots.length > 0 && (
          <section ref={masterplanRef} className="scroll-mt-20">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-1">
              <h2 className="text-2xl font-bold text-foreground">Plano de lotes</h2>
              <div className="inline-flex rounded-full border border-border/60 p-0.5" role="group" aria-label="Filtrar lotes">
                {([
                  { key: true, label: `Disponibles (${stats.available})` },
                  { key: false, label: `Todos (${stats.total})` },
                ] as const).map((opt) => (
                  <button
                    key={String(opt.key)}
                    type="button"
                    aria-pressed={onlyAvailable === opt.key}
                    onClick={() => setOnlyAvailable(opt.key)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      onlyAvailable === opt.key
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Toca un lote para ver su ficha comercial. Verde: disponible · Ámbar: reservado · Gris: vendido.
            </p>
            <div className="h-[420px] md:h-[520px] rounded-2xl overflow-hidden border border-border/60">
              {/* Sin WebGL, mapbox-gl lanza al inicializar — sin este boundary
                  se perdía toda la ficha (precio, documentos, contacto), no
                  solo el mapa (G03, docs/PLATFORM_EXPERIENCE_AUDIT_2026-10-14.md). */}
              <MapErrorBoundary>
                <LotMapView
                  lots={visibleLots as never}
                  projectCenter={{
                    lat: (project.latitude as number | null) ?? -33.45,
                    lng: (project.longitude as number | null) ?? -70.66,
                  }}
                  selectedLotId={selectedLotId}
                  onLotClick={(lot) => openLot(lot.id)}
                  readOnly
                />
              </MapErrorBoundary>
            </div>
          </section>
        )}



        {/* Galería */}
        {cfg.sections.gallery && gallery.length > 1 && (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Galería</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.slice(0, 9).map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`${title} — foto ${i + 1}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {/* Amenities */}
        {cfg.sections.amenities && cfg.amenities.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">El proyecto</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cfg.amenities.map((a) => (
                <Card key={a.title} className="border-border/60">
                  <CardContent className="p-4">
                    <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-primary" />{a.title}
                    </p>
                    {a.text && <p className="text-xs text-muted-foreground mt-1">{a.text}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Material descargable (dossier, precios, plano) */}
        <ProjectDownloads
          project={{
            id: project.id,
            name: title,
            slug: slug ?? null,
            description: (project.description as string | null) ?? null,
            location: (project.location as string | null) ?? null,
            region: (project.region as string | null) ?? null,
            latitude: (project.latitude as number | null) ?? null,
            longitude: (project.longitude as number | null) ?? null,
            images: [heroImage, ...gallery].filter((src): src is string => Boolean(src)),
            highlights: cfg.highlights,
            contact: cfg.contact,
          }}
          lots={lots}
          projectOwnerId={project.user_id}
        />

        {/* Contacto */}

        {cfg.sections.contact && (
          <section className="grid md:grid-cols-2 gap-6 items-start">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Conversemos</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Déjanos tus datos y el equipo del proyecto te contacta. Sin compromiso.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                {cfg.contact.whatsapp && (
                  <a className="flex items-center gap-2 text-primary hover:underline" href={`https://wa.me/${cfg.contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" />WhatsApp directo
                  </a>
                )}
                {cfg.contact.phone && (
                  <a className="flex items-center gap-2 text-primary hover:underline" href={`tel:${cfg.contact.phone}`}>
                    <Phone className="h-4 w-4" />{cfg.contact.phone}
                  </a>
                )}
                {cfg.contact.email && (
                  <a className="flex items-center gap-2 text-primary hover:underline" href={`mailto:${cfg.contact.email}`}>
                    <Mail className="h-4 w-4" />{cfg.contact.email}
                  </a>
                )}
              </div>
            </div>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <LandingLeadForm
                  projectId={project.id}
                  projectOwnerId={project.user_id}
                  projectSlug={slug!}
                />
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="container max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{title}{location ? ` · ${location}` : ''}</span>
          <Link to="/explorar" className="hover:text-foreground">Publicado en Oferta Terrenos →</Link>
        </div>
      </footer>

      {/* Diálogo de consulta (hero y clic en lote) */}
      <Dialog open={leadOpen} onOpenChange={setLeadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Consultar por {title}</DialogTitle>
          </DialogHeader>
          <LandingLeadForm
            projectId={project.id}
            projectOwnerId={project.user_id}
            projectSlug={slug!}
            lot={leadLot}
            onSuccess={() => setLeadOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Ficha comercial del lote: bottom-sheet en mobile, panel en escritorio */}
      <LotSalesSheet
        lot={selectedLot}
        open={lotSheetOpen && !!selectedLot}
        onOpenChange={setLotSheetOpen}
        projectName={title}
        projectUrl={social?.url}
        whatsapp={cfg.contact.whatsapp}
        onLead={(lot) => {
          setLotSheetOpen(false);
          openLead({ id: lot.id, lot_number: lot.lot_number });
        }}
        onReserve={(lot) => {
          setLotSheetOpen(false);
          setReserveLot(lot);
          setReserveOpen(true);
        }}
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex >= 0 && selectedIndex < visibleLots.length - 1}
        onPrev={() => selectedIndex > 0 && setSelectedLotId(visibleLots[selectedIndex - 1].id)}
        onNext={() =>
          selectedIndex >= 0 &&
          selectedIndex < visibleLots.length - 1 &&
          setSelectedLotId(visibleLots[selectedIndex + 1].id)
        }
      />

      {/* Barra sticky de conversión (mobile) */}
      <ProjectConversionBar
        projectName={title}
        priceFrom={stats.priceFrom}
        availableLots={stats.available}
        whatsapp={cfg.contact.whatsapp}
        onLead={() => openLead()}
        onSeeLots={goMasterplan}
      />

      {/* Reserva real: escribe en reservations vía create_public_reservation */}
      <LotReserveDialog
        lot={reserveLot}
        open={reserveOpen && !!reserveLot}
        onOpenChange={setReserveOpen}
        projectName={title}
      />

    </div>
  );

};

export default ProjectLanding;

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LotMapView } from '@/components/lots/LotMapView';
import { EnhancedLotCard } from '@/components/lots/EnhancedLotCard';
import { LotDetailSheet } from '@/components/lots/LotDetailSheet';
import { LotDesigner3DDialog } from '@/components/lots/LotDesigner3DDialog';
import { LotReservationDialog } from '@/components/lots/LotReservationDialog';
import { useTrackEvent } from '@/hooks/useTrackEvent';
import {
  ArrowLeft,
  Bookmark,
  Box,
  Compass,
  DollarSign,
  Eye,
  List,
  Map,
  MapPin,
  Ruler,
  Sparkles,
} from 'lucide-react';

const formatPrice = (price: number | null | undefined) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);
};

const statusLabel = (status: string | null | undefined) => {
  if (status === 'available') return 'Disponible';
  if (status === 'reserved') return 'Reservado';
  if (status === 'sold') return 'Vendido';
  return status || 'Sin estado';
};

const statusClass = (status: string | null | undefined) => {
  if (status === 'available') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (status === 'reserved') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-white/5 text-white/50 border-white/10';
};

const ProjectExperience = () => {
  const { id } = useParams();
  const { track } = useTrackEvent();
  const [activeView, setActiveView] = useState('masterplan');
  const [selectedLot, setSelectedLot] = useState<any | null>(null);
  const [inspectorLot, setInspectorLot] = useState<any | null>(null);
  const [designerLot, setDesignerLot] = useState<any | null>(null);
  const [reservationLot, setReservationLot] = useState<any | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ['terrain-view-project', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: lots = [], isLoading: lotsLoading } = useQuery({
    queryKey: ['terrain-view-lots', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_lots', { p_project_id: id! });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (id) void track('terrain_view_opened', { project_id: id, surface: 'atlas' });
  }, [id, track]);

  const sortedLots = useMemo(
    () => [...lots].sort((a: any, b: any) => (parseInt(a.lot_number) || 0) - (parseInt(b.lot_number) || 0)),
    [lots],
  );

  const availableLots = useMemo(() => lots.filter((lot: any) => lot.status === 'available'), [lots]);
  const reservedLots = useMemo(() => lots.filter((lot: any) => lot.status === 'reserved'), [lots]);
  const soldLots = useMemo(() => lots.filter((lot: any) => lot.status === 'sold'), [lots]);

  const prices = useMemo(
    () => availableLots.map((lot: any) => Number(lot.price)).filter((price: number) => price > 0),
    [availableLots],
  );

  const minPrice = prices.length ? Math.min(...prices) : null;

  const selectLot = (lot: any, openInspector = true) => {
    setSelectedLot(lot);
    void track('terrain_view_lot_selected', {
      project_id: id,
      lot_id: lot.id,
      lot_number: lot.lot_number,
      source: activeView,
    });
    if (openInspector) setInspectorLot(lot);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080a0b] text-white">
        <div className="animate-pulse text-sm uppercase tracking-[0.2em] text-white/45">Cargando Terrain View...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080a0b] text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">Proyecto no encontrado</p>
          <Button asChild variant="outline" className="mt-4 border-white/15 bg-white/5 text-white">
            <Link to="/explorar">Volver a explorar</Link>
          </Button>
        </div>
      </div>
    );
  }

  const location = [project.city, project.region].filter(Boolean).join(', ') || project.location || 'Chile';
  const legalDocuments = (project as any)?.legal_documents || [];

  return (
    <div className="min-h-screen bg-[#080a0b] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080a0b]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="shrink-0 text-white/70 hover:bg-white/10 hover:text-white">
              <Link to={`/proyecto/${id}`} aria-label="Volver a la ficha del proyecto">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400 sm:inline">OfertaTerrenos</span>
                <span className="hidden text-white/25 sm:inline">/</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  <Compass className="h-3.5 w-3.5" /> Terrain View
                </span>
              </div>
              <p className="mt-0.5 truncate font-semibold text-white">{project.name}</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Badge variant="outline" className="border-white/10 bg-white/5 text-white/60">
              <MapPin className="mr-1 h-3 w-3" /> {location}
            </Badge>
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              {availableLots.length} disponibles
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1680px] px-4 py-5 md:px-6 md:py-6">
        <section className="mb-5 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-white/[0.035] to-transparent p-5 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-400">Masterplan vivo</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">Explora el proyecto. Elige la parcela. Decide sin salir del contexto.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50 md:text-base">
                Mapa, inventario, ficha y diseño 3D comparten la misma selección de lote. Cambia de vista sin perder la parcela que estás evaluando.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[560px]">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/35">Disponibles</p>
                <p className="mt-1 text-xl font-bold text-emerald-300">{availableLots.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/35">Reservados</p>
                <p className="mt-1 text-xl font-bold text-amber-300">{reservedLots.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/35">Vendidos</p>
                <p className="mt-1 text-xl font-bold">{soldLots.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/35">Desde</p>
                <p className="mt-1 truncate text-base font-bold">{formatPrice(minPrice)}</p>
              </div>
            </div>
          </div>
        </section>

        {selectedLot ? (
          <section className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 md:p-4" aria-label="Lote seleccionado">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-400">Lote seleccionado</p>
                  <p className="text-lg font-bold">Lote {selectedLot.lot_number}</p>
                </div>
                <Badge variant="outline" className={statusClass(selectedLot.status)}>{statusLabel(selectedLot.status)}</Badge>
                <span className="inline-flex items-center gap-1.5 text-sm text-white/65">
                  <Ruler className="h-4 w-4" /> {Number(selectedLot.area).toLocaleString('es-CL')} m²
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                  <DollarSign className="h-4 w-4 text-emerald-400" /> {formatPrice(selectedLot.price)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setActiveView('masterplan')}>
                  <Map className="mr-1.5 h-4 w-4" /> Ver en mapa
                </Button>
                <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setInspectorLot(selectedLot)}>
                  <Eye className="mr-1.5 h-4 w-4" /> Lot Inspector
                </Button>
                <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setDesignerLot(selectedLot)}>
                  <Box className="mr-1.5 h-4 w-4" /> Diseñar en 3D
                </Button>
                {selectedLot.status === 'available' && (
                  <Button size="sm" onClick={() => setReservationLot(selectedLot)}>
                    <Bookmark className="mr-1.5 h-4 w-4" /> Reservar
                  </Button>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/45">
            <Sparkles className="h-4 w-4 text-emerald-400" /> Selecciona una parcela en el masterplan o en el inventario para mantenerla activa en todas las vistas.
          </section>
        )}

        <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.035] p-1.5">
            <TabsTrigger value="masterplan" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">
              <Map className="h-4 w-4" /> Masterplan
            </TabsTrigger>
            <TabsTrigger value="lots" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">
              <List className="h-4 w-4" /> Lotes ({lots.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="masterplan" className="mt-0">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
              {lotsLoading ? (
                <div className="flex h-[68vh] items-center justify-center text-sm text-white/40">Cargando masterplan...</div>
              ) : (
                <LotMapView
                  lots={lots as any}
                  projectCenter={{
                    lat: project.latitude || -34.9767,
                    lng: project.longitude || -71.7856,
                  }}
                  onLotClick={(lot) => selectLot(lot, true)}
                  selectedLotId={selectedLot?.id ?? null}
                  projectId={project.id}
                  kmzFileUrl={(project as any).kmz_file_url}
                  planImages={(project as any).plan_images || []}
                  readOnly
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="lots" className="mt-0">
            {lotsLoading ? (
              <div className="flex min-h-[420px] items-center justify-center text-sm text-white/40">Cargando inventario...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedLots.map((lot: any, index: number) => (
                  <EnhancedLotCard
                    key={lot.id}
                    lot={lot}
                    index={index}
                    totalAvailable={availableLots.length}
                    isSelected={selectedLot?.id === lot.id}
                    projectName={project.name}
                    onView={(item) => selectLot(item, true)}
                    onView3D={(item) => {
                      setSelectedLot(item);
                      setInspectorLot(item);
                    }}
                    onSimulateFinancing={(item) => selectLot(item, true)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <LotDetailSheet
        lot={inspectorLot}
        open={!!inspectorLot}
        onOpenChange={(open) => !open && setInspectorLot(null)}
        projectName={project.name}
        legalDocuments={legalDocuments}
        project={project as any}
        onReserve={(lot) => {
          setInspectorLot(null);
          setSelectedLot(lot);
          setReservationLot(lot);
        }}
        onDesign={(lot) => {
          setInspectorLot(null);
          setSelectedLot(lot);
          setDesignerLot(lot);
        }}
      />

      <LotDesigner3DDialog
        lot={designerLot}
        open={!!designerLot}
        onOpenChange={(open) => !open && setDesignerLot(null)}
      />

      <LotReservationDialog
        lot={reservationLot}
        projectName={project.name}
        open={!!reservationLot}
        onOpenChange={(open) => !open && setReservationLot(null)}
        reservationAmount={(project as any).reservation_deposit || 500000}
      />
    </div>
  );
};

export default ProjectExperience;

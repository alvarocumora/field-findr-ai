import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
  Crosshair,
  DollarSign,
  Eye,
  List,
  Map,
  MapPin,
  Maximize2,
  Ruler,
  Sparkles,
} from 'lucide-react';

type FocusTransitionPhase = 'idle' | 'departing' | 'arriving' | 'settled';

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

const getLotCenter = (lot: any): { lat: number; lng: number } | null => {
  if (Number.isFinite(Number(lot?.latitude)) && Number.isFinite(Number(lot?.longitude))) {
    return { lat: Number(lot.latitude), lng: Number(lot.longitude) };
  }

  if (Array.isArray(lot?.polygon) && lot.polygon.length >= 3) {
    const valid = lot.polygon.filter((point: any) => Array.isArray(point) && point.length >= 2);
    if (!valid.length) return null;
    const sum = valid.reduce(
      (acc: { lat: number; lng: number }, point: any) => ({
        lat: acc.lat + Number(point[1]),
        lng: acc.lng + Number(point[0]),
      }),
      { lat: 0, lng: 0 },
    );
    return { lat: sum.lat / valid.length, lng: sum.lng / valid.length };
  }

  return null;
};

const ProjectExperience = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { track } = useTrackEvent();
  const stageRef = useRef<HTMLDivElement>(null);
  const didHydrateDeepLink = useRef(false);
  const travelTimersRef = useRef<number[]>([]);
  const [activeView, setActiveView] = useState('masterplan');
  const [selectedLot, setSelectedLot] = useState<any | null>(null);
  const [selectionSource, setSelectionSource] = useState<'masterplan' | 'inventory' | 'deeplink'>('masterplan');
  const [focusPulse, setFocusPulse] = useState(0);
  const [cinematicFocus, setCinematicFocus] = useState(false);
  const [focusVersion, setFocusVersion] = useState(0);
  const [focusTransition, setFocusTransition] = useState<FocusTransitionPhase>('idle');
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

  useEffect(() => () => {
    travelTimersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const clearTravelTimers = () => {
    travelTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    travelTimersRef.current = [];
  };

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

  const focusLots = useMemo(() => {
    if (!cinematicFocus || !selectedLot) return lots;
    const selectedCenter = getLotCenter(selectedLot);
    if (!selectedCenter) return [selectedLot];

    return [...lots]
      .map((lot: any) => {
        const center = getLotCenter(lot);
        const distance = center
          ? Math.hypot(center.lat - selectedCenter.lat, center.lng - selectedCenter.lng)
          : Number.POSITIVE_INFINITY;
        return { lot, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 9)
      .map(({ lot }) => lot);
  }, [cinematicFocus, lots, selectedLot]);

  const focusCenter = useMemo(() => {
    if (cinematicFocus && selectedLot) return getLotCenter(selectedLot);
    return null;
  }, [cinematicFocus, selectedLot]);

  const updateLotDeepLink = (lot: any) => {
    const next = new URLSearchParams(searchParams);
    next.set('lote', String(lot.lot_number));
    setSearchParams(next, { replace: true });
  };

  const selectLot = (
    lot: any,
    options: { openInspector?: boolean; source?: 'masterplan' | 'inventory' | 'deeplink'; syncUrl?: boolean } = {},
  ) => {
    const { openInspector = false, source = activeView === 'lots' ? 'inventory' : 'masterplan', syncUrl = true } = options;
    clearTravelTimers();
    setSelectedLot(lot);
    setSelectionSource(source);
    setCinematicFocus(false);
    setFocusTransition('idle');
    setFocusPulse((value) => value + 1);
    if (syncUrl) updateLotDeepLink(lot);
    void track('terrain_view_lot_selected', {
      project_id: id,
      lot_id: lot.id,
      lot_number: lot.lot_number,
      source,
    });
    if (openInspector) setInspectorLot(lot);
  };

  useEffect(() => {
    if (didHydrateDeepLink.current || lots.length === 0) return;
    const requestedLot = searchParams.get('lote');
    if (!requestedLot) {
      didHydrateDeepLink.current = true;
      return;
    }
    const deepLinkedLot = lots.find((lot: any) => String(lot.lot_number) === requestedLot || lot.id === requestedLot);
    if (deepLinkedLot) {
      selectLot(deepLinkedLot, { source: 'deeplink', syncUrl: false });
    }
    didHydrateDeepLink.current = true;
  }, [lots, searchParams]);

  useEffect(() => {
    if (!selectedLot || activeView !== 'lots') return;
    const timer = window.setTimeout(() => {
      document.getElementById(`terrain-lot-${selectedLot.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [activeView, selectedLot?.id]);

  const focusSelectedLot = (view: 'masterplan' | 'lots') => {
    if (!selectedLot) return;
    clearTravelTimers();
    setActiveView(view);
    setFocusPulse((value) => value + 1);

    if (view === 'masterplan') {
      setFocusTransition('departing');
      setCinematicFocus(false);
      stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      travelTimersRef.current.push(window.setTimeout(() => {
        setCinematicFocus(true);
        setFocusVersion((value) => value + 1);
        setFocusTransition('arriving');
      }, 320));

      travelTimersRef.current.push(window.setTimeout(() => {
        setFocusTransition('settled');
      }, 1150));
    } else {
      setCinematicFocus(false);
      setFocusTransition('idle');
      window.setTimeout(() => {
        stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }

    void track('terrain_view_focus_parcel', {
      project_id: id,
      lot_id: selectedLot.id,
      lot_number: selectedLot.lot_number,
      destination: view,
      mode: view === 'masterplan' ? 'cinematic_transition' : 'inventory',
    });
  };

  const resetMasterplan = () => {
    clearTravelTimers();
    setFocusTransition('idle');
    setCinematicFocus(false);
    setFocusVersion((value) => value + 1);
    void track('terrain_view_focus_reset', {
      project_id: id,
      lot_id: selectedLot?.id,
    });
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
  const isTraveling = focusTransition === 'departing' || focusTransition === 'arriving';

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
                Mapa, inventario, ficha y diseño 3D comparten la misma selección. El lote activo permanece sincronizado mientras cambias de vista.
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
          <section
            key={`${selectedLot.id}-${focusPulse}`}
            className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] p-3 shadow-[0_0_40px_rgba(16,185,129,0.08)] animate-in fade-in zoom-in-95 duration-300 md:p-4"
            aria-label="Lote seleccionado"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-400">Parcela activa · {selectionSource === 'inventory' ? 'inventario' : selectionSource === 'deeplink' ? 'enlace directo' : 'masterplan'}</p>
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
                <Button size="sm" className="gap-1.5" disabled={isTraveling} onClick={() => focusSelectedLot('masterplan')}>
                  <Crosshair className={`h-4 w-4 ${isTraveling ? 'animate-pulse' : ''}`} /> {isTraveling ? 'Viajando...' : 'Viajar al lote'}
                </Button>
                <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => focusSelectedLot('lots')}>
                  <List className="mr-1.5 h-4 w-4" /> Ver tarjeta
                </Button>
                <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setInspectorLot(selectedLot)}>
                  <Eye className="mr-1.5 h-4 w-4" /> Ver ficha
                </Button>

                <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setDesignerLot(selectedLot)}>
                  <Box className="mr-1.5 h-4 w-4" /> 3D
                </Button>
                {selectedLot.status === 'available' && (
                  <Button size="sm" variant="secondary" onClick={() => setReservationLot(selectedLot)}>
                    <Bookmark className="mr-1.5 h-4 w-4" /> Reservar
                  </Button>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/45">
            <Sparkles className="h-4 w-4 text-emerald-400" /> Selecciona una parcela en el masterplan o inventario. La selección se mantendrá activa en toda la experiencia.
          </section>
        )}

        <div ref={stageRef} className="scroll-mt-20">
          <Tabs value={activeView} onValueChange={(view) => { clearTravelTimers(); setFocusTransition('idle'); setActiveView(view); if (view !== 'masterplan') setCinematicFocus(false); }} className="space-y-4">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.035] p-1.5">
              <TabsTrigger value="masterplan" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">
                <Map className="h-4 w-4" /> Masterplan
              </TabsTrigger>
              <TabsTrigger value="lots" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">
                <List className="h-4 w-4" /> Lotes ({lots.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="masterplan" className="mt-0">
              <div className={`relative overflow-hidden rounded-3xl border bg-black/30 transition-all duration-700 ${selectedLot ? 'border-emerald-500/30 shadow-[0_0_55px_rgba(16,185,129,0.10)]' : 'border-white/10'}`}>
                {selectedLot && (
                  <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
                    <div className="pointer-events-none rounded-full border border-emerald-400/30 bg-black/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300 backdrop-blur-md">
                      <Crosshair className="mr-1.5 inline h-3 w-3" /> {cinematicFocus ? `Vista parcela · Lote ${selectedLot.lot_number}` : `Lote ${selectedLot.lot_number} activo`}
                    </div>
                    {cinematicFocus && focusTransition === 'settled' && (
                      <Button size="sm" variant="secondary" className="h-8 rounded-full px-3 text-xs animate-in fade-in slide-in-from-left-2 duration-500" onClick={resetMasterplan}>
                        <Maximize2 className="mr-1.5 h-3.5 w-3.5" /> Ver loteo completo
                      </Button>
                    )}
                  </div>
                )}

                {selectedLot && isTraveling && (
                  <div className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden transition-all duration-500 ${focusTransition === 'departing' ? 'bg-black/70 backdrop-blur-[1px]' : 'bg-black/30'}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_48%)]" />
                    <div className="relative w-full max-w-md px-6 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-300">OfertaTerrenos Atlas</p>
                      <div className="mx-auto mt-5 flex max-w-xs items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">
                        <span className={focusTransition === 'departing' ? 'text-white' : 'text-emerald-300'}>Proyecto</span>
                        <span className="h-px flex-1 bg-gradient-to-r from-white/15 via-emerald-400/80 to-white/15" />
                        <span className={focusTransition === 'arriving' ? 'text-emerald-300' : 'text-white/45'}>Sector</span>
                        <span className="h-px flex-1 bg-gradient-to-r from-white/15 via-emerald-400/80 to-white/15" />
                        <span className={focusTransition === 'arriving' ? 'text-white' : 'text-white/45'}>Lote {selectedLot.lot_number}</span>
                      </div>
                      <div className="mx-auto mt-6 h-14 w-14 rounded-full border border-emerald-400/40 bg-emerald-400/10 p-3 shadow-[0_0_60px_rgba(16,185,129,0.25)]">
                        <Crosshair className="h-full w-full animate-pulse text-emerald-300" />
                      </div>
                      <p className="mt-5 text-xl font-semibold tracking-tight">
                        {focusTransition === 'departing' ? 'Localizando tu parcela...' : `Entrando al Lote ${selectedLot.lot_number}`}
                      </p>
                      <p className="mt-1 text-sm text-white/45">
                        {focusTransition === 'departing' ? 'Reduciendo el masterplan al contexto que importa.' : 'Superficie, precio y acciones comerciales aparecerán al llegar.'}
                      </p>
                    </div>
                  </div>
                )}

                {cinematicFocus && selectedLot && focusTransition === 'settled' && (
                  <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/80 px-4 py-3 shadow-2xl backdrop-blur-xl md:px-5 md:py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Atlas · Llegaste a tu parcela</p>
                          <p className="mt-1 text-base font-semibold">Lote {selectedLot.lot_number}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/55">
                            <span>{Number(selectedLot.area).toLocaleString('es-CL')} m²</span>
                            <span className="font-semibold text-white">{formatPrice(selectedLot.price)}</span>
                            <span>{focusLots.length} parcelas en contexto</span>
                          </div>
                        </div>
                        <div className="pointer-events-auto flex gap-2">
                          <Button size="sm" variant="outline" className="border-white/15 bg-white/5 text-white" onClick={() => setInspectorLot(selectedLot)}>
                            <Eye className="mr-1.5 h-4 w-4" /> Ver lote
                          </Button>
                          {selectedLot.status === 'available' && (
                            <Button size="sm" onClick={() => setReservationLot(selectedLot)}>
                              <Bookmark className="mr-1.5 h-4 w-4" /> Reservar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {lotsLoading ? (
                  <div className="flex h-[68vh] items-center justify-center text-sm text-white/40">Cargando masterplan...</div>
                ) : (
                  <div className={`transition-all duration-700 ${focusTransition === 'departing' ? 'scale-[0.985] opacity-45' : focusTransition === 'arriving' ? 'scale-[1.015] opacity-90' : 'scale-100 opacity-100'}`}>
                    <LotMapView
                      key={`terrain-map-${cinematicFocus ? selectedLot?.id : 'all'}-${focusVersion}`}
                      lots={(cinematicFocus ? focusLots : lots) as any}
                      projectCenter={{
                        lat: focusCenter?.lat ?? project.latitude ?? -34.9767,
                        lng: focusCenter?.lng ?? project.longitude ?? -71.7856,
                      }}
                      onLotClick={(lot) => selectLot(lot, { source: 'masterplan', openInspector: true })}
                      selectedLotId={selectedLot?.id ?? null}
                      projectId={project.id}
                      kmzFileUrl={(project as any).kmz_file_url}
                      planImages={(project as any).plan_images || []}
                      readOnly
                      tourMode
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="lots" className="mt-0">
              {lotsLoading ? (
                <div className="flex min-h-[420px] items-center justify-center text-sm text-white/40">Cargando inventario...</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sortedLots.map((lot: any, index: number) => (
                    <div
                      id={`terrain-lot-${lot.id}`}
                      key={lot.id}
                      className={`scroll-mt-28 rounded-2xl transition-all duration-300 ${selectedLot?.id === lot.id ? 'ring-2 ring-emerald-400/70 ring-offset-4 ring-offset-[#080a0b]' : ''}`}
                    >
                      <EnhancedLotCard
                        lot={lot}
                        index={index}
                        totalAvailable={availableLots.length}
                        isSelected={selectedLot?.id === lot.id}
                        projectName={project.name}
                        onView={(item) => selectLot(item, { source: 'inventory', openInspector: true })}
                        onView3D={(item) => {
                          selectLot(item, { source: 'inventory' });
                          setDesignerLot(item);
                        }}
                        onSimulateFinancing={(item) => selectLot(item, { source: 'inventory', openInspector: true })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
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
          selectLot(lot, { source: selectionSource });
          setReservationLot(lot);
        }}
        onDesign={(lot) => {
          setInspectorLot(null);
          selectLot(lot, { source: selectionSource });
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
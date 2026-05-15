import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Download, FileBarChart, MapPin, Ruler, Layers, Droplets, Zap, Cable, Flame, Wifi, Route, CheckCircle2, XCircle, Building2, Calculator, Scale, Trophy, Pencil, RotateCcw, Loader2, Info } from 'lucide-react';
import { generateTasacionPdf, type TasacionData } from '@/lib/tasacionPdfGenerator';
import { buildTasacionData, applyUfRate, UF_REF } from '@/lib/buildTasacionData';
import { useComparables } from '@/hooks/useComparables';
import { useUfRate } from '@/hooks/useUfRate';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TENO_TASACION: TasacionData = {
  fecha: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }),
  solicitante: 'Propietario del predio',
  tasador: 'Field-Findr AI · Departamento de Tasaciones',
  proposito: 'Determinar valor comercial referencial para venta directa, garantía bancaria o evaluación de inversión.',
  rol: 'Por verificar en SII',
  inscripcionCBR: 'CBR Curicó (por inscribir referencia comprador)',
  propietario: 'Reservado',
  direccion: 'Sector Ruta 5 Sur, km referencial Teno',
  comuna: 'Teno',
  region: 'Maule',
  coordenadas: '34°50\'17.9"S 71°06\'10.7"W (-34.83831, -71.10297)',
  deslindes: {
    norte: 'Predio agrícola colindante',
    sur: 'Camino interior y predios agrícolas',
    oriente: 'Faja vial Ruta 5 Sur',
    poniente: 'Canal de regadío y predios agrícolas',
  },
  superficieTerreno: 70000,
  superficieConstruida: 0,
  descripcionSector: 'Sector consolidado de uso agroindustrial e industrial liviano en la comuna de Teno, Provincia de Curicó. Zona caracterizada por la presencia de plantas de packing de frutas, agroindustrias, viñas y centros logísticos asociados a la Ruta 5 Sur. Crecimiento sostenido de inversión por su posición estratégica entre Santiago y la zona productora frutícola del Maule.',
  accesos: 'Acceso directo desde Ruta 5 Sur (autopista). Distancia 2 hrs a Santiago, 25 min a Curicó.',
  equipamiento: 'Estaciones de servicio, bodegas frigoríficas y servicios productivos en radio < 5 km.',
  topografia: 'Plana, sin pendientes significativas. Apta para construcción industrial inmediata.',
  forma: 'Polígono regular cuadrangular, con frente largo a vía estructurante.',
  tipoSuelo: 'Suelo agrícola Clase II/III con buen drenaje, soporte adecuado para fundaciones industriales convencionales.',
  frente: 'Frente continuo > 300 m hacia faja vial.',
  servicios: { agua: true, electricidad: true, alcantarillado: false, gas: false, telecom: true, pavimento: true },
  zonificacion: 'Industrial / Agroindustrial (uso compatible con packing, bodegaje y planta productiva).',
  usoSuelo: 'IFC industrial aprobado para destino agroindustrial.',
  coefConstructibilidad: 'Referencial 0,6 (sujeto a PRC vigente y permisos DOM Teno).',
  avaluoFiscalTerreno: 245_000_000, // 70.000 × ~$3.500/m² estimado
  avaluoFiscalConstruccion: 0,
  avaluoFiscalTotal: 245_000_000,
  valorUnitarioSII: 3500,
  comparables: [
    // Referencias reales de mercado (MercadoLibre / Vivax / Engel & Völkers)
    { ubicacion: 'Curicó – Pío XI 505 (Vivax)', superficie: 52800, valorUF: 78000, valorM2UF: 1.477, fuente: 'Mercado Libre – Vivax Corredores' },
    { ubicacion: 'Ruta 5 Sur / Ruta J-55 (E&V)', superficie: 154700, valorUF: 147000, valorM2UF: 0.950, fuente: 'Mercado Libre – Engel & Völkers Commercial' },
    { ubicacion: 'Romeral – Ruta 5', superficie: 50000, valorUF: 22500, valorM2UF: 0.45, fuente: 'Portal Inmobiliario' },
    { ubicacion: 'Molina – Salida sur', superficie: 60000, valorUF: 27000, valorM2UF: 0.45, fuente: 'Corretaje local' },
  ],
  valorComercialUF: 35000,
  valorComercialCLP: 35000 * UF_REF,
  valorM2UF: 0.5,
  valorM2CLP: 0.5 * UF_REF,
  observaciones: 'El valor de UF 0,50/m² se ubica en el rango medio-alto del mercado comparable, justificado por: (a) acceso directo a Ruta 5 Sur, (b) IFC industrial aprobado, (c) servicios básicos disponibles, (d) topografía plana lista para construir, y (e) demanda creciente de plataformas logísticas y cadena de frío en la zona Curicó-Teno-Molina.',
};

const SectionCard = ({ icon: Icon, n, title, children }: { icon: any; n: number; title: string; children: React.ReactNode }) => (
  <Card className="glass border-border/50">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-3 text-base md:text-lg">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary text-sm font-bold">{n}</span>
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">{children}</CardContent>
  </Card>
);

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 py-1.5 border-b border-border/30 last:border-0">
    <span className="text-muted-foreground">{k}</span>
    <span className="font-medium text-right">{v}</span>
  </div>
);

const ServiceBadge = ({ ok, icon: Icon, label }: { ok: boolean; icon: any; label: string }) => (
  <div className={`flex items-center gap-2 rounded-md px-2.5 py-2 border text-xs ${ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : 'border-border/50 bg-muted/30 text-muted-foreground'}`}>
    <Icon className="h-3.5 w-3.5" />
    <span className="flex-1">{label}</span>
    {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5 opacity-50" />}
  </div>
);

const fmtCLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;
const fmtUF = (n: number) => `UF ${n.toLocaleString('es-CL', { maximumFractionDigits: 2 })}`;

interface TasacionInformeProps {
  listing?: any;
  data?: TasacionData;
}

export default function TasacionTeno({ listing, data }: TasacionInformeProps = {}) {
  const { today: ufToday, presets: ufHistoricos, loading: ufLoading, error: ufError } = useUfRate();
  const [ufRate, setUfRate] = useState<number>(UF_REF);
  const [userTouchedRate, setUserTouchedRate] = useState(false);
  const [editing, setEditing] = useState(false);
  const [overrides, setOverrides] = useState<Partial<TasacionData>>({});

  // Cuando llega la UF de hoy desde el Banco Central, sincroniza el valor por defecto
  useMemo(() => {
    if (!userTouchedRate && ufToday && ufToday !== ufRate) setUfRate(ufToday);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ufToday]);

  const ufPresets = useMemo(
    () => [{ label: ufLoading ? 'Hoy…' : 'Hoy', value: ufToday }, ...ufHistoricos],
    [ufToday, ufHistoricos, ufLoading]
  );

  const base: TasacionData = useMemo(() => {
    if (data) return applyUfRate(data, ufRate);
    if (listing) return buildTasacionData(listing, ufRate);
    return applyUfRate(TENO_TASACION, ufRate);
  }, [data, listing, ufRate]);

  // Comparables reales desde listings (misma región/comuna), con ponderación.
  const comparablesData = useComparables(
    listing
      ? { id: listing.id, region: listing.region, city: listing.city, type: listing.type, area_m2: listing.area_m2, lat: listing.lat, lng: listing.lng }
      : null,
    ufRate
  );

  // Merge overrides on top of auto-built data, recomputing derived CLP fields
  const d: TasacionData = useMemo(() => {
    const merged: TasacionData = {
      ...base,
      ...overrides,
      deslindes: { ...base.deslindes, ...(overrides.deslindes || {}) },
      servicios: { ...base.servicios, ...(overrides.servicios || {}) },
    };
    // Si hay comparables reales, reemplazan los estáticos (a menos que el usuario los haya editado)
    if (!overrides.comparables && comparablesData.items.length > 0) {
      merged.comparables = comparablesData.items.map((c) => ({
        ubicacion: c.ubicacion,
        superficie: c.superficie,
        valorUF: c.valorUF,
        valorM2UF: c.valorM2UF,
        fuente: c.fuente,
      }));
    }
    merged.valorComercialCLP = Math.round(merged.valorComercialUF * ufRate);
    merged.valorM2CLP = Math.round(merged.valorM2UF * ufRate);
    if (merged.superficieTerreno > 0) {
      merged.valorM2UF = +(merged.valorComercialUF / merged.superficieTerreno).toFixed(3);
      merged.valorM2CLP = Math.round(merged.valorM2UF * ufRate);
    }
    merged.avaluoFiscalTotal = (merged.avaluoFiscalTerreno || 0) + (merged.avaluoFiscalConstruccion || 0);
    return merged;
  }, [base, overrides, ufRate, comparablesData.items]);

  const setField = <K extends keyof TasacionData>(k: K, v: TasacionData[K]) =>
    setOverrides((o) => ({ ...o, [k]: v }));
  const setDeslinde = (k: keyof TasacionData['deslindes'], v: string) =>
    setOverrides((o) => ({ ...o, deslindes: { ...(o.deslindes || base.deslindes), [k]: v } as any }));
  const setServicio = (k: keyof TasacionData['servicios'], v: boolean) =>
    setOverrides((o) => ({ ...o, servicios: { ...(o.servicios || base.servicios), [k]: v } as any }));

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-b border-border/40">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <FileBarChart className="h-6 w-6 text-primary" />
              Informe de Tasación Comercial
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Predio agroindustrial · {d.comuna}, {d.region} · {d.fecha}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={editing ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditing((v) => !v)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" /> {editing ? 'Cerrar edición' : 'Editar campos'}
            </Button>
            {Object.keys(overrides).length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setOverrides({})} className="gap-2 text-muted-foreground">
                <RotateCcw className="h-4 w-4" /> Restablecer
              </Button>
            )}
            <Button onClick={() => generateTasacionPdf(d)} className="gap-2">
              <Download className="h-4 w-4" /> Descargar PDF
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-4">
        {/* Selector tasa UF→CLP */}
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <Label htmlFor="uf-rate" className="text-xs text-muted-foreground">
                Tasa UF → CLP (a la fecha de tasación)
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  id="uf-rate"
                  type="number"
                  min={1000}
                  step={10}
                  value={ufRate}
                  onChange={(e) => {
                    setUserTouchedRate(true);
                    setUfRate(Math.max(1, Number(e.target.value) || UF_REF));
                  }}
                  className="h-9"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">/ UF</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ufPresets.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant={ufRate === p.value ? 'default' : 'outline'}
                  className="h-8 text-xs"
                  onClick={() => {
                    setUserTouchedRate(true);
                    setUfRate(p.value);
                  }}
                  disabled={ufLoading && p.label.startsWith('Hoy')}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            {ufLoading ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Consultando UF al Banco Central…</>
            ) : ufError ? (
              <><Info className="h-3 w-3" /> {ufError}</>
            ) : (
              <><Info className="h-3 w-3" /> Valores oficiales obtenidos desde mindicador.cl (Banco Central de Chile).</>
            )}
          </p>
        </div>

        {/* Editor de campos */}
        {editing && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                Editar datos del informe
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Los campos se prellenan desde la ficha de la propiedad. Modifica lo que necesites antes de generar el PDF.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Propietario</Label>
                  <Input value={d.propietario} onChange={(e) => setField('propietario', e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Rol SII</Label>
                  <Input value={d.rol} onChange={(e) => setField('rol', e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Inscripción CBR</Label>
                  <Input value={d.inscripcionCBR} onChange={(e) => setField('inscripcionCBR', e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Solicitante</Label>
                  <Input value={d.solicitante} onChange={(e) => setField('solicitante', e.target.value)} className="h-9 mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Dirección</Label>
                  <Input value={d.direccion} onChange={(e) => setField('direccion', e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Comuna</Label>
                  <Input value={d.comuna} onChange={(e) => setField('comuna', e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Región</Label>
                  <Input value={d.region} onChange={(e) => setField('region', e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Superficie terreno (m²)</Label>
                  <Input type="number" value={d.superficieTerreno} onChange={(e) => setField('superficieTerreno', Number(e.target.value) || 0)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Superficie construida (m²)</Label>
                  <Input type="number" value={d.superficieConstruida} onChange={(e) => setField('superficieConstruida', Number(e.target.value) || 0)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Valor comercial (UF)</Label>
                  <Input type="number" value={d.valorComercialUF} onChange={(e) => setField('valorComercialUF', Number(e.target.value) || 0)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Avalúo fiscal terreno (CLP)</Label>
                  <Input type="number" value={d.avaluoFiscalTerreno} onChange={(e) => setField('avaluoFiscalTerreno', Number(e.target.value) || 0)} className="h-9 mt-1" />
                </div>
              </div>

              <Separator />
              <div>
                <Label className="text-xs mb-2 block">Deslindes</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['norte', 'sur', 'oriente', 'poniente'] as const).map((dir) => (
                    <div key={dir}>
                      <Label className="text-xs capitalize text-muted-foreground">{dir}</Label>
                      <Input value={d.deslindes[dir]} onChange={(e) => setDeslinde(dir, e.target.value)} className="h-9 mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />
              <div>
                <Label className="text-xs mb-2 block">Servicios disponibles</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    ['agua', 'Agua potable'],
                    ['electricidad', 'Electricidad'],
                    ['alcantarillado', 'Alcantarillado'],
                    ['gas', 'Gas'],
                    ['telecom', 'Telecom'],
                    ['pavimento', 'Pavimento'],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
                      <span className="text-xs">{label}</span>
                      <Switch checked={d.servicios[key]} onCheckedChange={(v) => setServicio(key, v)} />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label className="text-xs">Zonificación</Label>
                  <Input value={d.zonificacion} onChange={(e) => setField('zonificacion', e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Uso de suelo</Label>
                  <Input value={d.usoSuelo} onChange={(e) => setField('usoSuelo', e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Constructibilidad</Label>
                  <Input value={d.coefConstructibilidad} onChange={(e) => setField('coefConstructibilidad', e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Topografía</Label>
                  <Textarea value={d.topografia} onChange={(e) => setField('topografia', e.target.value)} rows={2} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Tipo de suelo</Label>
                  <Textarea value={d.tipoSuelo} onChange={(e) => setField('tipoSuelo', e.target.value)} rows={2} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Accesos</Label>
                  <Textarea value={d.accesos} onChange={(e) => setField('accesos', e.target.value)} rows={2} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Equipamiento</Label>
                  <Textarea value={d.equipamiento} onChange={(e) => setField('equipamiento', e.target.value)} rows={2} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Descripción del sector</Label>
                  <Textarea value={d.descripcionSector} onChange={(e) => setField('descripcionSector', e.target.value)} rows={4} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Observaciones / conclusión</Label>
                  <Textarea value={d.observaciones} onChange={(e) => setField('observaciones', e.target.value)} rows={4} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen ejecutivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
            <p className="text-xs text-muted-foreground">Valor comercial</p>
            <p className="text-2xl font-bold text-emerald-500">{fmtUF(d.valorComercialUF)}</p>
            <p className="text-xs text-muted-foreground mt-1">≈ {fmtCLP(d.valorComercialCLP)}</p>
          </div>
          <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
            <p className="text-xs text-muted-foreground">Valor unitario</p>
            <p className="text-2xl font-bold text-primary">{fmtUF(d.valorM2UF)} / m²</p>
            <p className="text-xs text-muted-foreground mt-1">≈ {fmtCLP(d.valorM2CLP)} / m²</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
            <p className="text-xs text-muted-foreground">Avalúo fiscal SII</p>
            <p className="text-2xl font-bold text-amber-500">{fmtCLP(d.avaluoFiscalTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">{fmtCLP(d.valorUnitarioSII)} / m²</p>
          </div>
        </div>

        <SectionCard n={1} icon={FileBarChart} title="Antecedentes generales">
          <Row k="Fecha de tasación" v={d.fecha} />
          <Row k="Solicitante" v={d.solicitante} />
          <Row k="Tasador" v={d.tasador} />
          <Row k="Propósito" v={d.proposito} />
        </SectionCard>

        <SectionCard n={2} icon={MapPin} title="Identificación del inmueble">
          <Row k="Propietario" v={d.propietario} />
          <Row k="Dirección" v={d.direccion} />
          <Row k="Comuna / Región" v={`${d.comuna}, ${d.region}`} />
          <Row k="Rol SII" v={d.rol} />
          <Row k="Inscripción CBR" v={d.inscripcionCBR} />
          <Row k="Coordenadas" v={d.coordenadas} />
        </SectionCard>

        <SectionCard n={3} icon={Layers} title="Deslindes">
          <Row k="Norte" v={d.deslindes.norte} />
          <Row k="Sur" v={d.deslindes.sur} />
          <Row k="Oriente" v={d.deslindes.oriente} />
          <Row k="Poniente" v={d.deslindes.poniente} />
        </SectionCard>

        <SectionCard n={4} icon={Ruler} title="Superficies">
          <Row k="Terreno" v={`${d.superficieTerreno.toLocaleString('es-CL')} m² (${(d.superficieTerreno/10000).toFixed(2)} ha)`} />
          <Row k="Construida" v={`${d.superficieConstruida.toLocaleString('es-CL')} m²`} />
        </SectionCard>

        <SectionCard n={5} icon={Building2} title="Descripción del sector">
          <p className="text-sm text-muted-foreground leading-relaxed">{d.descripcionSector}</p>
          <Separator className="my-2" />
          <Row k="Accesos" v={d.accesos} />
          <Row k="Equipamiento" v={d.equipamiento} />
        </SectionCard>

        <SectionCard n={6} icon={Layers} title="Características del terreno">
          <Row k="Topografía" v={d.topografia} />
          <Row k="Forma" v={d.forma} />
          <Row k="Tipo de suelo" v={d.tipoSuelo} />
          <Row k="Frente" v={d.frente} />
        </SectionCard>

        <SectionCard n={7} icon={Droplets} title="Servicios básicos">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <ServiceBadge ok={d.servicios.agua} icon={Droplets} label="Agua potable" />
            <ServiceBadge ok={d.servicios.electricidad} icon={Zap} label="Electricidad" />
            <ServiceBadge ok={d.servicios.alcantarillado} icon={Cable} label="Alcantarillado" />
            <ServiceBadge ok={d.servicios.gas} icon={Flame} label="Gas" />
            <ServiceBadge ok={d.servicios.telecom} icon={Wifi} label="Telecom" />
            <ServiceBadge ok={d.servicios.pavimento} icon={Route} label="Pavimento" />
          </div>
        </SectionCard>

        <SectionCard n={8} icon={Scale} title="Normativa y zonificación">
          <Row k="Zonificación" v={d.zonificacion} />
          <Row k="Uso de suelo" v={d.usoSuelo} />
          <Row k="Constructibilidad" v={d.coefConstructibilidad} />
        </SectionCard>

        <SectionCard n={9} icon={Calculator} title="Avalúo fiscal SII">
          <Row k="Avalúo terreno" v={fmtCLP(d.avaluoFiscalTerreno)} />
          <Row k="Avalúo construcción" v={fmtCLP(d.avaluoFiscalConstruccion)} />
          <Row k="Avalúo total" v={<span className="font-bold text-amber-500">{fmtCLP(d.avaluoFiscalTotal)}</span>} />
          <Row k="Valor unitario SII" v={`${fmtCLP(d.valorUnitarioSII)} / m²`} />
        </SectionCard>

        <SectionCard n={10} icon={Scale} title="Análisis comparativo de mercado">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <p className="text-xs text-muted-foreground">
              {comparablesData.items.length > 0
                ? `Comparables activos en ${d.region}${d.comuna ? ` y comunas cercanas a ${d.comuna}` : ''}.`
                : 'Comparables referenciales del sector.'}
            </p>
            {comparablesData.loading && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Calculando…
              </span>
            )}
            {comparablesData.weightedAvgM2UF > 0 && (
              <Badge variant="outline" className="text-xs">
                Promedio ponderado: {comparablesData.weightedAvgM2UF.toFixed(3)} UF/m²
              </Badge>
            )}
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border/40">
                  <th className="text-left py-2 px-2 font-medium">Ubicación</th>
                  <th className="text-right py-2 px-2 font-medium">Sup. m²</th>
                  <th className="text-right py-2 px-2 font-medium">Dist.</th>
                  <th className="text-right py-2 px-2 font-medium">Valor UF</th>
                  <th className="text-right py-2 px-2 font-medium">UF/m²</th>
                  <th className="text-right py-2 px-2 font-medium">Peso</th>
                </tr>
              </thead>
              <tbody>
                {d.comparables.map((c, i) => {
                  const scored = comparablesData.items[i];
                  return (
                    <tr key={i} className="border-b border-border/20">
                      <td className="py-2 px-2">
                        <div className="font-medium">{c.ubicacion}</div>
                        <div className="text-[10px] text-muted-foreground">{c.fuente}</div>
                      </td>
                      <td className="py-2 px-2 text-right">{c.superficie.toLocaleString('es-CL')}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">
                        {scored?.distanciaKm != null ? `${scored.distanciaKm} km` : '—'}
                      </td>
                      <td className="py-2 px-2 text-right">{c.valorUF.toLocaleString('es-CL')}</td>
                      <td className="py-2 px-2 text-right font-medium">{c.valorM2UF.toFixed(3)}</td>
                      <td className="py-2 px-2 text-right">
                        {scored ? (
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{ background: `hsl(var(--primary) / ${0.15 + scored.weight * 0.5})`, color: 'hsl(var(--primary))' }}
                            title={`tipo ${scored.weightBreakdown.tipo} × área ${scored.weightBreakdown.area} × dist ${scored.weightBreakdown.distancia}`}
                          >
                            {scored.weight.toFixed(2)}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Supuestos y ponderaciones */}
          <div className="mt-4 rounded-md border border-border/40 bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
              <Info className="h-3.5 w-3.5 text-primary" />
              Supuestos y ponderaciones
            </div>
            <ul className="space-y-1 text-[11px] text-muted-foreground list-disc pl-4">
              {comparablesData.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </SectionCard>


        <SectionCard n={11} icon={Calculator} title="Metodología de tasación">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Se aplica el <strong>Método Comparativo de Mercado</strong>, contrastando el valor SII del predio con
            transacciones de inmuebles equivalentes en la zona. Factores de ajuste: (i) frente a Ruta 5,
            (ii) superficie y forma, (iii) servicios básicos, (iv) zonificación industrial vigente, y
            (v) potencial productivo (packing, agroindustria, logística, cadena de frío).
          </p>
        </SectionCard>

        <SectionCard n={12} icon={Trophy} title="Conclusión – Valor comercial">
          <div className="rounded-lg bg-gradient-to-br from-emerald-500/20 to-primary/10 border border-emerald-500/30 p-4">
            <Badge className="bg-emerald-500 text-white mb-2">Valor final</Badge>
            <p className="text-3xl font-bold text-emerald-500">{fmtUF(d.valorComercialUF)}</p>
            <p className="text-sm text-muted-foreground mt-1">≈ {fmtCLP(d.valorComercialCLP)} ({fmtUF(d.valorM2UF)}/m²)</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">{d.observaciones}</p>
        </SectionCard>

        <p className="text-[11px] text-muted-foreground italic text-center pt-2">
          Tasación comercial referencial generada por Field-Findr AI. Para uso bancario o judicial se requiere
          ratificación por tasador acreditado y antecedentes registrales actualizados (CBR, SII, DOM).
        </p>
      </CardContent>
    </Card>
  );
}

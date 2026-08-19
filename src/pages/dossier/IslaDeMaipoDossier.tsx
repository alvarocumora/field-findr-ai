import { useMemo, useState } from 'react';
import { Download, FileText, Link2, MapPin, Printer, Check, ExternalLink, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import { useStaticMapToken } from '@/hooks/useStaticMapToken';
import { generateIslaMaipoDossierPdf } from '@/lib/dossierPdf';
import { DOCUMENTOS, PROPIEDAD, type DossierDoc } from './islaMaipoData';
import OtLiveValuation from './OtLiveValuation';


const clp = (n: number) => '$' + n.toLocaleString('es-CL');
const m2 = (n: number) => n.toLocaleString('es-CL') + ' m²';

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground md:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function IslaDeMaipoDossier() {
  const [active, setActive] = useState<DossierDoc>(DOCUMENTOS[0]);
  const [copied, setCopied] = useState(false);
  const [filtro, setFiltro] = useState<string>('Todos');
  const [generating, setGenerating] = useState(false);
  const token = useStaticMapToken();

  const downloadResumenPdf = async () => {
    setGenerating(true);
    try {
      await generateIslaMaipoDossierPdf({ mapboxToken: token });
      toast.success('Resumen PDF generado');
    } catch {
      toast.error('No se pudo generar el resumen PDF');
    } finally {
      setGenerating(false);
    }
  };


  useSEO({
    title: 'Ficha Financiera · Predio Gálvez 1458, Isla de Maipo',
    description:
      'Ficha técnica, legal y de valoración del predio Gálvez 1458 (Lotes 4 y 5), Isla de Maipo: 18,41 ha, tasación UF 184.036 y data room documental descargable.',
    type: 'article',
  });

  const mapUrl = useMemo(() => {
    if (!token) return null;
    const { lng, lat } = PROPIEDAD;
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-l+22c55e(${lng},${lat})/${lng},${lat},13.6,0/1000x480@2x?access_token=${token}`;
  }, [token]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Enlace copiado — listo para enviar a la entidad financiera');
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadAll = () => {
    DOCUMENTOS.forEach((d, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = d.url;
        a.download = d.filename;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 400);
    });
    toast.success(`Descargando ${DOCUMENTOS.length} documentos`);
  };

  const categorias = useMemo(
    () => ['Todos', ...Array.from(new Set(DOCUMENTOS.map((d) => d.categoria)))],
    []
  );
  const docsFiltrados = useMemo(
    () => (filtro === 'Todos' ? DOCUMENTOS : DOCUMENTOS.filter((d) => d.categoria === filtro)),
    [filtro]
  );

  const ufPorM2 = (PROPIEDAD.tasacionUf / PROPIEDAD.superficieTotalM2).toFixed(2);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">
            Expediente de presentación · Entidad financiera
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-foreground md:text-5xl">
            {PROPIEDAD.nombre}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {PROPIEDAD.direccion} · Sector {PROPIEDAD.sector} · {PROPIEDAD.region}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={downloadResumenPdf} disabled={generating} variant="default">
              <FileDown className="mr-2 h-4 w-4" />
              {generating ? 'Generando resumen…' : 'Descargar resumen PDF'}
            </Button>
            <Button onClick={copyLink} variant="secondary">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Link2 className="mr-2 h-4 w-4" />}
              Copiar enlace
            </Button>

            <Button onClick={downloadAll} variant="secondary">
              <Download className="mr-2 h-4 w-4" /> Descargar expediente ({DOCUMENTOS.length})
            </Button>
            <Button onClick={() => window.print()} variant="outline">
              <Printer className="mr-2 h-4 w-4" /> Imprimir ficha
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {/* KPIs */}
        <section aria-label="Indicadores principales" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Superficie total" value="18,41 ha" sub={m2(PROPIEDAD.superficieTotalM2)} />
          <KpiCard
            label="Tasación comercial"
            value={`UF ${PROPIEDAD.tasacionUf.toLocaleString('es-CL')}`}
            sub={`${ufPorM2} UF/m² · ${PROPIEDAD.tasacionFecha}`}
          />
          <KpiCard
            label="Avalúo fiscal (3 roles)"
            value={clp(PROPIEDAD.avaluoFiscal)}
            sub={PROPIEDAD.avaluoFecha}
          />
          <KpiCard label="ROL(es) SII" value={PROPIEDAD.roles} sub={`Destino ${PROPIEDAD.destinoSii}`} />
        </section>

        {/* Mapa */}
        <section className="mt-8 overflow-hidden rounded-xl border" aria-label="Ubicación">
          {mapUrl ? (
            <img
              src={mapUrl}
              alt={`Vista satelital del predio Gálvez 1458 en ${PROPIEDAD.comuna}`}
              className="h-56 w-full object-cover md:h-80"
              loading="lazy"
            />
          ) : (
            <div className="h-56 w-full animate-pulse bg-muted md:h-80" />
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Coordenadas referenciales {PROPIEDAD.lat.toFixed(5)}, {PROPIEDAD.lng.toFixed(5)}
            </span>
            <a
              href={`https://www.google.com/maps?q=${PROPIEDAD.lat},${PROPIEDAD.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              Ver en Google Maps <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        {/* Predios urbanos de la misma sociedad */}
        <section className="mt-8" aria-label="Predios urbanos de la misma sociedad">
          <h2 className="text-lg font-semibold text-foreground">
            Predios urbanos de la misma sociedad
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Roles adicionales inscritos a nombre de {PROPIEDAD.sociedad.razonSocial} (RUT{' '}
            {PROPIEDAD.sociedad.rut}), colindantes al predio principal y con antecedentes vigentes en
            el data room.
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {PROPIEDAD.prediosUrbanos.map((p) => (
              <Card key={p.rol}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3 text-base">
                    <span>ROL {p.rol}</span>
                    <Badge variant="secondary">{p.destino}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">{p.direccion}</p>
                  <p className="text-muted-foreground">Propietario: {p.propietario}</p>
                  <Separator />
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-muted-foreground">Avalúo fiscal ({p.periodo})</span>
                    <span className="tabular-nums font-medium text-foreground">{clp(p.avaluoTotal)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-muted-foreground">Avalúo actualizado</span>
                    <span className="tabular-nums text-foreground">{clp(p.avaluoActualizado)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-muted-foreground">Contribución semestral</span>
                    <span className="tabular-nums text-foreground">{clp(p.contribucionSemestral)}</span>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground">{p.expropiacion}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p.docs
                      .map((id) => DOCUMENTOS.find((d) => d.id === id))
                      .filter((d): d is (typeof DOCUMENTOS)[number] => Boolean(d))
                      .map((d) => (
                        <a
                          key={d.id}
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {d.categoria} <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      generatePredioUrbanoFicha(
                        {
                          rol: p.rol,
                          direccion: p.direccion,
                          destino: p.destino,
                          propietario: p.propietario,
                          avaluoTotal: p.avaluoTotal,
                          avaluoActualizado: p.avaluoActualizado,
                          contribucionSemestral: p.contribucionSemestral,
                          periodo: p.periodo,
                          expropiacion: p.expropiacion,
                          comuna: PROPIEDAD.comuna,
                          documentos: p.docs
                            .map((id) => DOCUMENTOS.find((d) => d.id === id)?.titulo)
                            .filter((t): t is string => Boolean(t)),
                        },
                        { qrUrl: '/ficha/isla-de-maipo-galvez-1458', sociedad: p.propietario }
                      )
                    }
                  >
                    <FileDown className="mr-2 h-4 w-4" /> Ficha PDF del predio
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Ficha */}

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Ficha técnica">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identificación y dominio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Propietarios (según SII)</p>
                {PROPIEDAD.propietarios.map((p) => (
                  <p key={p.rut} className="font-medium text-foreground">
                    {p.nombre} — {p.rut} · {p.pct}
                  </p>
                ))}
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Deslindes</p>
                <ul className="mt-1 space-y-1">
                  {PROPIEDAD.deslindes.map((d) => (
                    <li key={d.lado} className="text-foreground">
                      <span className="font-medium">{d.lado}:</span> {d.con} ({d.metros})
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sociedad propietaria e inscripción</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-foreground">{PROPIEDAD.sociedad.razonSocial}</p>
                <p className="text-muted-foreground">
                  RUT {PROPIEDAD.sociedad.rut} · Constituida el {PROPIEDAD.sociedad.constitucion}
                </p>
                <p className="text-muted-foreground">Domicilio: {PROPIEDAD.sociedad.domicilio}</p>
                <p className="text-xs text-muted-foreground">{PROPIEDAD.sociedad.registro}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Inscripción de dominio</p>
                <p className="font-medium text-foreground">
                  Fojas {PROPIEDAD.inscripcion.fojas} N°{PROPIEDAD.inscripcion.numero} ·{' '}
                  {PROPIEDAD.inscripcion.registro} {PROPIEDAD.inscripcion.anio}
                </p>
                <p className="text-muted-foreground">
                  {PROPIEDAD.inscripcion.cbr} · vigente al {PROPIEDAD.inscripcion.vigenciaAl}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Avalúos fiscales por rol</p>
                <ul className="mt-1 space-y-1">
                  {PROPIEDAD.avaluosDetalle.map((a) => (
                    <li key={a.rol} className="flex items-baseline justify-between gap-3">
                      <span className="text-foreground">
                        <span className="font-medium">ROL {a.rol}</span>{' '}
                        <span className="text-muted-foreground">· {a.destino}</span>
                      </span>
                      <span className="tabular-nums font-medium text-foreground">{clp(a.monto)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Normativa aplicable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Badge variant="secondary">Lote 4 · Urbano {m2(PROPIEDAD.superficieUrbanaM2)}</Badge>
                <p className="mt-2 leading-relaxed text-muted-foreground">{PROPIEDAD.normativa.urbana}</p>
              </div>
              <Separator />
              <div>
                <Badge variant="outline">Lote 5 · Rural {m2(PROPIEDAD.superficieRuralM2)}</Badge>
                <p className="mt-2 leading-relaxed text-muted-foreground">{PROPIEDAD.normativa.rural}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Urbanización y antecedentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ul className="space-y-1 text-foreground">
                {PROPIEDAD.urbanizacion.map((u) => (
                  <li key={u}>· {u}</li>
                ))}
              </ul>
              <Separator />
              <ul className="space-y-1 text-muted-foreground">
                {PROPIEDAD.antecedentesTecnicos.map((a) => (
                  <li key={a}>· {a}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Data room */}
        <section className="mt-12" aria-label="Documentos">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Data room documental</h2>
              <p className="text-sm text-muted-foreground">
                {DOCUMENTOS.length} antecedentes legales, tributarios, urbanísticos y de valoración.
              </p>
            </div>
            <Button onClick={downloadAll} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Descargar todo
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setFiltro(c)}
                aria-pressed={filtro === c}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  filtro === c
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-accent'
                }`}
              >
                {c}
                <span className="ml-1.5 opacity-70">
                  {c === 'Todos' ? DOCUMENTOS.length : DOCUMENTOS.filter((d) => d.categoria === c).length}
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
            <ul className="max-h-[760px] space-y-2 overflow-y-auto pr-1">
              {docsFiltrados.map((d) => {
                const isActive = d.id === active.id;
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => setActive(d)}
                      aria-current={isActive}
                      className={`w-full rounded-lg border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isActive ? 'border-primary bg-accent' : 'bg-card hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] uppercase">
                              {d.categoria}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{d.fecha}</span>
                          </div>
                          <p className="mt-1 text-sm font-medium leading-snug text-foreground">{d.titulo}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{d.emisor}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="overflow-hidden rounded-lg border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{active.titulo}</p>
                  <p className="text-xs text-muted-foreground">{active.descripcion}</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={active.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir
                    </a>
                  </Button>
                  <Button asChild size="sm">
                    <a href={active.url} download={active.filename}>
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Descargar
                    </a>
                  </Button>
                </div>
              </div>
              <iframe
                key={active.id}
                src={`${active.url}#view=FitH`}
                title={`Visualizador: ${active.titulo}`}
                className="h-[520px] w-full bg-muted md:h-[760px]"
              />
            </div>
          </div>
        </section>

        <OtLiveValuation />



        <footer className="mt-12 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
          <p>
            Documento informativo preparado para evaluación financiera. Los antecedentes se entregan tal como
            fueron emitidos por los organismos competentes. La tasación comercial referida corresponde al informe{' '}
            {PROPIEDAD.tasador} y no constituye oferta ni compromiso de crédito.
          </p>
          <p className="mt-2">
            OFERTA TERRENOS · ofertaterrenos.com · Generado el {new Date().toLocaleDateString('es-CL')}
          </p>
        </footer>
      </div>
    </main>
  );
}

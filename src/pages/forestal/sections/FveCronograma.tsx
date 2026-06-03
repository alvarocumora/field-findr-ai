import { CalendarClock, CheckCircle2 } from 'lucide-react';

// Cronograma de desembolsos (Memoria de Inversión · Doc 2 · Item 23)
const TRAMOS = [
  {
    id: 'T1',
    momento: 'Firma',
    mesLabel: 'Mes 0',
    monto_clp_m: 620,
    pct_acum: 30,
    hito: 'Cierre y constitución de garantía · movilización temprana · reservas (DSRA)',
    estado: 'inicio' as const,
  },
  {
    id: 'T2',
    momento: 'Mes 4',
    mesLabel: 'Mes 4',
    monto_clp_m: 730,
    pct_acum: 65,
    hito: 'Caminos Etapa A ejecutados · inicio electrificación CGE · acceso Ruta J-70',
    estado: 'obra' as const,
  },
  {
    id: 'T3',
    momento: 'Mes 10',
    mesLabel: 'Mes 10',
    monto_clp_m: 520,
    pct_acum: 90,
    hito: 'Factibilidad eléctrica + agua certificada · subdivisión pipeline (hij. 6/9/11) en trámite',
    estado: 'obra' as const,
  },
  {
    id: 'T4',
    momento: 'Mes 16',
    mesLabel: 'Mes 16',
    monto_clp_m: 210,
    pct_acum: 100,
    hito: 'Cierre urbanización Fase 1 · habilitación pipeline completada',
    estado: 'cierre' as const,
  },
];

// Cronograma comercial (Etapas Fase 1)
const ETAPAS_COMERCIAL = [
  { etapa: 'A · Lanzamiento',    ventana: 'Mes 3 → Mes 10',  hijuela: 'Hijuela 7',  lotes: 68, color: '#3F7D54' },
  { etapa: 'B · Consolidación',  ventana: 'Mes 8 → Mes 20',  hijuela: 'Hijuela 8',  lotes: 69, color: '#C8983F' },
  { etapa: 'C · Premium',        ventana: 'Mes 14 → Mes 30', hijuela: 'Hijuela 10', lotes: 40, color: '#1F3D2B' },
];

const fmtCLP = (m: number) => `CLP $ ${m.toLocaleString('de-DE')}M`;

export default function FveCronograma() {
  return (
    <section
      id="cronograma"
      className="fve-section py-24 md:py-32"
      style={{ background: 'hsl(var(--fve-offwhite))' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
              08 · Cronograma · Desembolsos y Comercialización
            </p>
            <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight">
              Desembolsos atados a hitos verificables.
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 text-[hsl(var(--fve-charcoal))]/75 text-base leading-relaxed">
            La facilidad de <strong>EUR 2,0M</strong> ({fmtCLP(2080)}) se dispone en cuatro tramos
            ligados a hitos físicos (caminos, factibilidad, cierre) auditados por ITO independiente.
            Plazo bullet 36 meses, repago auto-liquidante con el avance comercial de las tres etapas.
          </div>
        </div>

        {/* Tramos de desembolso */}
        <div className="grid md:grid-cols-4 gap-px bg-black/10 border border-black/10 mb-14">
          {TRAMOS.map((t, i) => (
            <div key={t.id} className="bg-white p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[hsl(var(--fve-charcoal))]/50">
                  {t.id} · {t.mesLabel}
                </span>
                {t.estado === 'cierre' ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'hsl(var(--fve-gold))' }} />
                ) : (
                  <CalendarClock className="w-4 h-4" style={{ color: 'hsl(var(--fve-gold))' }} />
                )}
              </div>
              <p className="font-serif-fve text-3xl text-[hsl(var(--fve-forest-deep))] mb-1">
                {fmtCLP(t.monto_clp_m)}
              </p>
              <p className="text-xs text-[hsl(var(--fve-charcoal))]/55 mb-4">
                {t.pct_acum}% acumulado
              </p>

              {/* Barra progreso */}
              <div className="h-1 bg-black/8 mb-4 overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${t.pct_acum}%`,
                    background: 'hsl(var(--fve-forest))',
                  }}
                />
              </div>

              <p className="text-xs text-[hsl(var(--fve-charcoal))]/75 leading-relaxed">
                {t.hito}
              </p>

              {i < TRAMOS.length - 1 && (
                <div
                  className="hidden md:block absolute top-1/2 -right-px w-px h-8 -translate-y-1/2"
                  style={{ background: 'hsl(var(--fve-gold))' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Cronograma comercial por etapa */}
        <div className="border border-black/10 bg-white p-6 md:p-8">
          <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
            <h3 className="font-serif-fve text-2xl text-[hsl(var(--fve-forest-deep))]">
              Ventanas comerciales por etapa
            </h3>
            <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--fve-charcoal))]/55">
              GDV Fase 1 · CLP $ 2.303M
            </p>
          </div>

          <div className="space-y-3">
            {ETAPAS_COMERCIAL.map((e) => (
              <div
                key={e.etapa}
                className="grid grid-cols-12 gap-4 items-center py-3 border-t border-black/8 first:border-t-0"
              >
                <div className="col-span-12 md:col-span-3">
                  <p
                    className="text-[10px] uppercase tracking-[0.18em] font-medium mb-0.5"
                    style={{ color: e.color }}
                  >
                    {e.hijuela}
                  </p>
                  <p className="font-serif-fve text-base text-[hsl(var(--fve-forest-deep))]">
                    Etapa {e.etapa.split(' · ')[0]} · {e.etapa.split(' · ')[1]}
                  </p>
                </div>
                <div className="col-span-6 md:col-span-2 text-xs text-[hsl(var(--fve-charcoal))]/70 font-mono">
                  {e.ventana}
                </div>
                <div className="col-span-6 md:col-span-1 text-xs text-[hsl(var(--fve-charcoal))]/70 font-mono">
                  {e.lotes} lotes
                </div>
                <div className="col-span-12 md:col-span-6">
                  {/* Timeline bar 0-36 meses */}
                  <div className="relative h-2 bg-black/6">
                    {(() => {
                      // parse "Mes X → Mes Y"
                      const m = e.ventana.match(/Mes (\d+) → Mes (\d+)/);
                      if (!m) return null;
                      const start = (parseInt(m[1]) / 36) * 100;
                      const end = (parseInt(m[2]) / 36) * 100;
                      return (
                        <div
                          className="absolute inset-y-0"
                          style={{
                            left: `${start}%`,
                            width: `${end - start}%`,
                            background: e.color,
                          }}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4 text-[10px] font-mono text-[hsl(var(--fve-charcoal))]/45 px-[27%] md:pl-[50%] md:pr-0">
            <span>M 0</span>
            <span className="hidden md:inline">M 12</span>
            <span className="hidden md:inline">M 24</span>
            <span>M 36</span>
          </div>
        </div>

        <p className="mt-6 text-xs text-[hsl(var(--fve-charcoal))]/55 max-w-4xl">
          Cronograma extendido (Gantt mensual de 60 meses con sensibilidad), modelo financiero
          3-way y term sheet detallado disponibles en el data room privado — documentos 3, 5 y 7
          del paquete LUC Financing.
        </p>
      </div>
    </section>
  );
}

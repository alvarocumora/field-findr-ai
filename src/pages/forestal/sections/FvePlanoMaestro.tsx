import { useState } from 'react';
import {
  ETAPAS, LOTES_DESTACADOS, FASE1_LOTES, FASE1_SUPERFICIE_HA, FASE1_GDV_CLP_M,
  type LoteEstado, type Lote,
} from '../data/lotes';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const COLOR_BY_STATE: Record<LoteEstado, string> = {
  disponible: '#3F7D54',
  reservado:  '#C8983F',
  vendido:    '#7A7A7A',
};

const LABEL_BY_STATE: Record<LoteEstado, string> = {
  disponible: 'Disponible',
  reservado:  'Reservado',
  vendido:    'Vendido',
};

const fmtCLP = (m: number) =>
  `CLP $ ${m.toLocaleString('de-DE', { maximumFractionDigits: 1 })}M`;

export default function FvePlanoMaestro() {
  const [etapaFiltro, setEtapaFiltro] = useState<'todas' | 'A' | 'B' | 'C'>('todas');
  const [selected, setSelected] = useState<string | null>(null);

  const lotesVisibles: Lote[] =
    etapaFiltro === 'todas'
      ? LOTES_DESTACADOS
      : LOTES_DESTACADOS.filter((l) => l.etapa === etapaFiltro);

  const disponiblesFase1 = ETAPAS.reduce((s, e) => s + e.lotes, 0); // 177
  const disponiblesVitrina = LOTES_DESTACADOS.filter((l) => l.estado === 'disponible').length;

  return (
    <section id="plano" className="fve-no-print py-24 md:py-32" style={{ background: 'hsl(var(--fve-sand-soft))' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-10 grid md:grid-cols-12 gap-8">
          <div className="md:col-span-7">
            <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
              02 · Plano Maestro · Fase 1
            </p>
            <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight">
              {FASE1_LOTES} parcelas con rol SII propio en {FASE1_SUPERFICIE_HA} ha.
            </h2>
          </div>
          <div className="md:col-span-5 text-[hsl(var(--fve-charcoal))]/75 text-sm md:text-base leading-relaxed">
            Tres etapas comerciales escalonadas — una por hijuela inscrita en el CBR de Licantén
            (Hij. 7, 8 y 10) — con precio creciente alineado al avance de urbanización.
            GDV Fase 1: <strong>{fmtCLP(FASE1_GDV_CLP_M)}</strong>.
          </div>
        </div>

        {/* Tarjetas por etapa */}
        <div className="grid md:grid-cols-3 gap-3 mb-10">
          {ETAPAS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEtapaFiltro(etapaFiltro === e.id ? 'todas' : e.id)}
              className={`text-left bg-white p-5 border transition-colors ${
                etapaFiltro === e.id
                  ? 'border-[hsl(var(--fve-forest-deep))]'
                  : 'border-black/10 hover:border-[hsl(var(--fve-forest))]/40'
              }`}
              style={{ borderTop: `3px solid ${e.color}` }}
            >
              <p className="text-[10px] uppercase tracking-[0.18em] font-medium mb-2" style={{ color: e.color }}>
                Etapa {e.id} · {e.nombre}
              </p>
              <h3 className="font-serif-fve text-lg text-[hsl(var(--fve-forest-deep))] leading-tight mb-2">
                {e.hijuela} · {e.lotes} lotes
              </h3>
              <p className="font-mono text-xs text-[hsl(var(--fve-charcoal))]/70 mb-1">
                ~{e.tamanoHa.toLocaleString('es-CL')} ha · {fmtCLP(e.precioCLP_M)} por lote
              </p>
              <p className="text-[11px] text-[hsl(var(--fve-charcoal))]/55">
                Rol matriz {e.rolMatriz} · {e.certSAG}
              </p>
              <p className="text-xs mt-3 font-mono text-[hsl(var(--fve-forest-deep))]">
                Subtotal {fmtCLP(e.subtotalCLP_M)}
              </p>
            </button>
          ))}
        </div>

        {/* Plano vitrina + tabla */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Vitrina visual: mosaico de lotes destacados */}
          <div className="lg:col-span-7 bg-white p-5 md:p-6 shadow-sm">
            <div className="flex items-baseline justify-between mb-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--fve-charcoal))]/60">
                Vitrina · {lotesVisibles.length} lotes representativos
                {etapaFiltro !== 'todas' && ` · Etapa ${etapaFiltro}`}
              </p>
              {etapaFiltro !== 'todas' && (
                <button
                  type="button"
                  onClick={() => setEtapaFiltro('todas')}
                  className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--fve-gold))] hover:underline"
                >
                  Ver todas
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {lotesVisibles.map((l) => {
                const isSel = selected === l.numero;
                const etapa = ETAPAS.find((e) => e.id === l.etapa)!;
                return (
                  <button
                    key={l.numero}
                    type="button"
                    onClick={() => setSelected(l.numero)}
                    className="aspect-square flex flex-col items-center justify-center transition-all"
                    style={{
                      background: COLOR_BY_STATE[l.estado],
                      opacity: isSel ? 1 : 0.82,
                      outline: isSel ? `2px solid ${etapa.color}` : 'none',
                      outlineOffset: 2,
                    }}
                    title={`${l.numero} · ${LABEL_BY_STATE[l.estado]}`}
                  >
                    <span className="text-[10px] font-mono text-white/85 leading-none">{l.etapa}</span>
                    <span className="text-xs font-semibold text-white leading-tight mt-0.5">
                      {l.numero.split('-').slice(-1)[0]}
                    </span>
                    <span className="text-[9px] text-white/85 mt-1 font-mono">
                      ${l.precioCLP_M.toFixed(1)}M
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-5 mt-5 pt-4 border-t border-black/8 text-[11px]">
              {(['disponible', 'reservado', 'vendido'] as LoteEstado[]).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3" style={{ background: COLOR_BY_STATE[s] }} />
                  <span className="text-[hsl(var(--fve-charcoal))]/75">{LABEL_BY_STATE[s]}</span>
                </div>
              ))}
              <div className="ml-auto text-[hsl(var(--fve-charcoal))]/55">
                {disponiblesVitrina} disponibles en vitrina · {disponiblesFase1} totales Fase 1
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="lg:col-span-5 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs uppercase tracking-wider">Lote</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">m²</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Orient.</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">CLP $</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotesVisibles.map((l) => (
                    <TableRow
                      key={l.numero}
                      className={`cursor-pointer ${
                        selected === l.numero ? 'bg-[hsl(var(--fve-sand-soft))]' : ''
                      }`}
                      onClick={() => setSelected(l.numero)}
                    >
                      <TableCell className="font-medium">{l.numero}</TableCell>
                      <TableCell>{l.superficie.toLocaleString('es-CL')}</TableCell>
                      <TableCell>{l.orientacion}</TableCell>
                      <TableCell className="font-mono">${l.precioCLP_M.toFixed(1)}M</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ background: COLOR_BY_STATE[l.estado] }} />
                          {LABEL_BY_STATE[l.estado]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-[hsl(var(--fve-charcoal))]/55 max-w-3xl">
          Inventario completo de las 177 unidades disponible bajo NDA a través del data room
          de OFERTA TERRENOS. Cada lote cuenta con rol SII preasignado (series 08078, 08079 y 08088),
          subdivisión SAG vigente y dominio inscrito a nombre de Forestal Valle Escondido SpA.
        </p>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { LOTES, type LoteEstado } from '../data/lotes';
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

export default function FvePlanoMaestro() {
  const [selected, setSelected] = useState<string | null>(null);

  // grid layout: 5 cols x 3 rows, padding/gap
  const COLS = 5;
  const ROWS = 3;
  const W = 800;
  const H = 480;
  const PAD = 30;
  const GAP = 14;
  const cellW = (W - PAD * 2 - GAP * (COLS - 1)) / COLS;
  const cellH = (H - PAD * 2 - GAP * (ROWS - 1)) / ROWS;

  return (
    <section id="plano" className="fve-no-print py-24 md:py-32" style={{ background: 'hsl(var(--fve-sand-soft))' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
            02 · Plano Maestro
          </p>
          <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight max-w-3xl">
            Disposición de las 15 parcelas del loteo A.
          </h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 bg-white p-4 md:p-6 shadow-sm">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-auto"
              role="img"
              aria-label="Plano maestro Forestal Valle Escondido"
            >
              {/* road labels */}
              <text x={W/2} y={18} textAnchor="middle" fontSize="11" fill="#666" letterSpacing="2">
                ACCESO PRINCIPAL — CAMINO J-602
              </text>
              <line x1={PAD} y1={24} x2={W-PAD} y2={24} stroke="#1F3D2B" strokeWidth="2" strokeDasharray="6 4" />

              {LOTES.map((l) => {
                const x = PAD + l.col * (cellW + GAP);
                const y = PAD + l.row * (cellH + GAP);
                const isSel = selected === l.numero;
                return (
                  <g
                    key={l.numero}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(l.numero)}
                  >
                    <rect
                      x={x} y={y} width={cellW} height={cellH}
                      fill={COLOR_BY_STATE[l.estado]}
                      fillOpacity={isSel ? 0.95 : 0.78}
                      stroke={isSel ? '#1A1A1A' : 'white'}
                      strokeWidth={isSel ? 3 : 2}
                    />
                    <text
                      x={x + cellW/2} y={y + cellH/2 - 6}
                      textAnchor="middle" fill="white"
                      fontSize="18" fontWeight="600" fontFamily="Fraunces, serif"
                    >
                      {l.numero}
                    </text>
                    <text
                      x={x + cellW/2} y={y + cellH/2 + 14}
                      textAnchor="middle" fill="white" fillOpacity="0.85"
                      fontSize="11"
                    >
                      UF {l.precioUF.toLocaleString('es-CL')}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 mt-6 px-2">
              {(['disponible', 'reservado', 'vendido'] as LoteEstado[]).map((s) => (
                <div key={s} className="flex items-center gap-2.5">
                  <span className="inline-block w-4 h-4" style={{ background: COLOR_BY_STATE[s] }} />
                  <span className="text-sm text-[hsl(var(--fve-charcoal))]/80">
                    {LABEL_BY_STATE[s]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="lg:col-span-5 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs uppercase tracking-wider">Lote</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">m²</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Orient.</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">UF</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LOTES.map((l) => (
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
                      <TableCell>{l.precioUF.toLocaleString('es-CL')}</TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center gap-1.5 text-xs"
                        >
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
      </div>
    </section>
  );
}

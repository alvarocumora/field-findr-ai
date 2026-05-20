import { FASES, CAPEX, CAPEX_TOTAL } from '../data/capex';

const MONTHS = 12;

export default function FveInversion() {
  return (
    <section
      id="inversion"
      className="fve-section py-24 md:py-32"
      style={{ background: 'hsl(var(--fve-forest-deep))', color: 'hsl(var(--fve-offwhite))' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-12 gap-10 mb-14">
          <div className="md:col-span-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
              04 · Estructura de la Inversión
            </p>
            <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight text-white">
              Cronograma de desembolsos y uso de fondos.
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 text-white/75 text-base md:text-lg leading-relaxed">
            <p>
              El proyecto se ejecuta en cuatro fases secuenciales de 12 meses, con desembolsos
              calibrados por hito verificable. La estructura permite trazar cada peso desembolsado
              contra una entrega física, legal o comercial concreta.
            </p>
            <p className="mt-4 text-sm text-white/55">
              Memoria de inversión detallada disponible bajo NDA.
            </p>
          </div>
        </div>

        {/* Gantt */}
        <div className="mb-14 bg-white/5 border border-white/10 p-5 md:p-7 overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid items-center text-xs text-white/55 mb-3" style={{ gridTemplateColumns: '260px repeat(12, 1fr)' }}>
              <div />
              {Array.from({ length: MONTHS }, (_, i) => (
                <div key={i} className="text-center">M{i + 1}</div>
              ))}
            </div>
            {FASES.map((f) => (
              <div
                key={f.nombre}
                className="grid items-center py-2 border-t border-white/10"
                style={{ gridTemplateColumns: '260px repeat(12, 1fr)' }}
              >
                <div className="text-sm text-white/85 pr-4">{f.nombre}</div>
                {Array.from({ length: MONTHS }, (_, i) => {
                  const m = i + 1;
                  const active = m >= f.startMonth && m < f.startMonth + f.durationMonths;
                  return (
                    <div key={i} className="px-0.5">
                      <div
                        className="h-6"
                        style={{
                          background: active ? 'hsl(var(--fve-gold))' : 'transparent',
                          opacity: active ? 0.9 : 0,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* CAPEX table */}
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-8">
            <h3 className="font-serif-fve text-2xl mb-5 text-white">CAPEX por partida</h3>
            <div className="border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-left text-white/55 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Partida</th>
                    <th className="px-4 py-3 text-right">Monto UF</th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {CAPEX.map((c) => (
                    <tr key={c.partida} className="border-t border-white/10">
                      <td className="px-4 py-3 text-white/90">{c.partida}</td>
                      <td className="px-4 py-3 text-right text-white tabular-nums">
                        {c.montoUF.toLocaleString('es-CL')}
                      </td>
                      <td className="px-4 py-3 text-right text-white/55 tabular-nums hidden sm:table-cell">
                        {((c.montoUF / CAPEX_TOTAL) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-white/30 bg-white/5">
                    <td className="px-4 py-3 font-semibold text-white">CAPEX Total</td>
                    <td className="px-4 py-3 text-right font-semibold text-white tabular-nums">
                      UF {CAPEX_TOTAL.toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-3 text-right text-white hidden sm:table-cell">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="md:col-span-4">
            <h3 className="font-serif-fve text-2xl mb-5 text-white">Estructura financiera</h3>
            <ul className="space-y-4 text-sm text-white/80 leading-relaxed">
              <li>
                <span className="block text-white/55 text-xs uppercase tracking-wider mb-1">Aporte de capital</span>
                Equity del desarrollador y socios estratégicos.
              </li>
              <li>
                <span className="block text-white/55 text-xs uppercase tracking-wider mb-1">Deuda senior</span>
                Línea bancaria o SBLC respaldando urbanización primaria.
              </li>
              <li>
                <span className="block text-white/55 text-xs uppercase tracking-wider mb-1">Flujo de caja</span>
                Preventa de parcelas amortiza deuda durante fase comercial.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

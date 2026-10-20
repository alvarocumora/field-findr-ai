import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
  project: any;
  totalAreaHa?: number | null;
  lotCount: number | null;
}

/**
 * Narrativa comercial común a todos los proyectos, alimentada solo por datos
 * reales: landing_config (highlights/amenities), descripción y estado legal.
 * Reemplaza las secciones narrativas de las antiguas landings a medida.
 */
export function ProjectNarrative({ project, lotCount }: Props) {
  const cfg = (project?.landing_config ?? {}) as any;
  const highlights: string[] = Array.isArray(cfg.highlights) ? cfg.highlights.filter((h: unknown) => typeof h === 'string') : [];
  const amenities: { title: string; text?: string }[] = Array.isArray(cfg.amenities)
    ? cfg.amenities.filter((a: any) => a && typeof a.title === 'string') : [];
  const subtitle: string | undefined = cfg.hero?.subtitle ?? project?.description ?? undefined;

  const rows: [string, string][] = [
    ['Ubicación', [project?.city, project?.region].filter(Boolean).join(', ') || 'No informado'],
    ['Superficie total', project?.total_area ? `${Number(project.total_area).toLocaleString('es-CL')} ha` : 'No informado'],
    ['Parcelas', lotCount != null ? String(lotCount) : 'No informado'],
    ['Régimen legal', project?.legal_status && project.legal_status !== 'pending' ? project.legal_status : 'No informado'],
  ];
  if (project?.rol_number) rows.push(['ROL', project.rol_number]);

  if (!subtitle && highlights.length === 0 && amenities.length === 0) return null;

  return (
    <section aria-labelledby="project-narrative" className="container px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">El proyecto</p>
          <h2 id="project-narrative" className="mt-2 font-editorial text-3xl md:text-4xl text-foreground">
            {project?.name}
          </h2>
          {subtitle && <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{subtitle}</p>}
          {amenities.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {amenities.map(a => (
                <div key={a.title} className="rounded-xl border bg-card p-4">
                  <p className="font-medium text-foreground">{a.title}</p>
                  {a.text && <p className="mt-1 text-sm text-muted-foreground">{a.text}</p>}
                </div>
              ))}
            </div>
          )}
          {highlights.length > 0 && (
            <ul className="mt-6 space-y-2">
              {highlights.map(h => (
                <li key={h} className="flex gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{h}
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="h-fit rounded-2xl border bg-card p-5">
          <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Ficha técnica
          </p>
          <dl className="divide-y">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}

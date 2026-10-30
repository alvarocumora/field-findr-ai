import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Logo from "@/components/brand/Logo";

export default function LandingFooter() {
  const location = useLocation();
  return (
    <footer
      aria-label="Información del sitio"
      className="border-t bg-background"
    >
      <div className="container grid gap-8 px-4 py-9 sm:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Link to="/" className="inline-block rounded focus-ring">
            <Logo size="md" />
          </Link>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Tu próximo lugar empieza aquí.
          </p>
          <a
            href="mailto:ventas@ofertaterrenos.com"
            className="mt-3 inline-flex min-h-9 break-all text-xs text-muted-foreground underline-offset-4 hover:underline focus-ring"
          >
            ventas@ofertaterrenos.com
          </a>
        </div>
        <nav aria-label="Siguiente paso para comprar" className="text-sm">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            A tu manera
          </p>
          <Link
            to="/explorar?view=map"
            className="flex min-h-10 items-center gap-2 font-medium hover:text-primary focus-ring"
          >
            Explorar el mapa{" "}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link
            to="/agendar?meeting_type=visita_terreno&source=portada"
            className="flex min-h-10 items-center hover:text-primary focus-ring"
          >
            Solicitar una visita
          </Link>
          <Link
            to={{
              pathname: "/",
              search: location.search,
              hash: "#simula-tu-cuota",
            }}
            className="flex min-h-10 items-center hover:text-primary focus-ring"
          >
            Simular cuota
          </Link>
        </nav>
        <nav aria-label="Profesionales" className="text-sm">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Haz crecer tu negocio
          </p>
          <Link
            to="/brokers"
            className="flex min-h-10 items-center hover:text-primary focus-ring"
          >
            Ser parte de la red de ventas
          </Link>
          <Link
            to="/planes-loteos"
            className="flex min-h-10 items-center hover:text-primary focus-ring"
          >
            Publicar un proyecto
          </Link>
          <Link
            to="/contacto"
            className="flex min-h-10 items-center hover:text-primary focus-ring"
          >
            Contacto y consultas legales
          </Link>
        </nav>
      </div>
      <div className="container flex flex-wrap justify-between gap-3 border-t px-4 py-5 text-[11px] text-muted-foreground">
        <p>© {new Date().getFullYear()} OfertaTerrenos</p>
        <p>Parcelas, campos y proyectos rurales en Chile.</p>
      </div>
    </footer>
  );
}

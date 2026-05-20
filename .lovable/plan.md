
# Plan — Landing "Forestal Valle Escondido"

Sitio single-page institucional en español de Chile, doble audiencia (compradores + analistas bancarios), montado dentro del proyecto existente como rutas públicas nuevas. Sin backend: contacto vía `mailto:`. Print CSS para generar Dossier PDF.

## Rutas nuevas (en `src/routes/publicRoutes.tsx`)

- `/forestal-valle-escondido` → `pages/forestal/ForestalLanding.tsx` (single page, scroll suave)
- `/forestal-valle-escondido/investors` → `pages/forestal/InvestorsLogin.tsx` (mock login, sin auth)

No se toca el Layout global ni el sidebar; estas páginas se renderizan full-bleed sin `Layout` para mantener identidad propia (similar a `ProjectExperience`).

## Design system local (scoped, no rompe el global)

Tokens propios inyectados vía clase wrapper `.fve-theme` en el root de la landing — define CSS vars locales sin tocar `index.css` global:

- `--fve-forest: 31 31% 20%` (#1F3D2B aprox HSL)
- `--fve-sand: 38 38% 75%` (#D9C7A7)
- `--fve-charcoal: 0 0% 10%` (#1A1A1A)
- `--fve-offwhite: 40 33% 95%` (#F7F4EE)
- `--fve-gold: 40 47% 50%` (#B89348)

Fuentes vía `<link>` en `index.html` (Fraunces 400/600 + Inter 400/500/600). Clases utilitarias `font-serif-fve` y `font-sans-fve` definidas en un CSS local `forestal.css` importado solo por la landing.

## Estructura de archivos

```
src/pages/forestal/
  ForestalLanding.tsx          # compone las 12 secciones
  InvestorsLogin.tsx           # mock login
  forestal.css                 # tokens locales + print CSS
  data/
    lotes.ts                   # 15 lotes con precios UF 1.200–2.800
    faqs.ts                    # 8 Q&A
    capex.ts                   # tabla CAPEX + fases gantt
    dueDiligence.ts            # 7 items checklist legal
  sections/
    FveNav.tsx                 # nav fijo + "Acceso Inversionistas"
    FveHero.tsx
    FveProyecto.tsx
    FvePlanoMaestro.tsx        # SVG grid lotes + tabla
    FveUbicacion.tsx           # iframe Google Maps + pills
    FveInversion.tsx           # gantt + CAPEX (PRINT)
    FveProyecciones.tsx
    FveDueDiligence.tsx        # checklist + modal "Solicitar documento" (PRINT)
    FveDesarrollador.tsx       # (PRINT)
    FveProceso.tsx
    FveFaqs.tsx                # shadcn Accordion
    FveContacto.tsx            # form mailto:
    FveFooter.tsx
    DocRequestModal.tsx        # shadcn Dialog reutilizable
```

Cada sección recibe `id` para scroll anchors. Nav usa `<a href="#proyecto">` con `scroll-behavior: smooth`.

## Comportamiento clave

- **Hero**: imagen Unsplash full-bleed (`https://images.unsplash.com/...?q=maule+vineyards`), overlay gradient verde→transparente, H1 serif grande, 2 CTAs (gold primario + outline). Strip de confianza debajo en banda arena.
- **Plano Maestro**: SVG 5×3 grid de rectángulos (15 lotes) con `fill` por estado (disponible/reservado/vendido), hover→tooltip con nro + UF, click→selecciona fila en tabla. Tabla shadcn `Table` con 15 filas hardcoded en `data/lotes.ts`. Leyenda con tres swatches.
- **Ubicación**: `<iframe>` Google Maps embed centrado en -35.0, -72.0; pills shadcn `Badge` para distancias; grid de servicios cercanos.
- **Inversión** (sección 5): Gantt simple en CSS grid — 4 filas (fases) × 12 columnas (meses), barras con `background` gold/sand. Tabla CAPEX abajo con 6–8 partidas en UF.
- **Due Diligence** (sección 7): 7 items con `CheckCircle2` verde, cada uno con botón "Solicitar documento" → abre `DocRequestModal` (shadcn Dialog) con form mailto pre-llenado. Cada item tiene placeholder de referencia ("Ref. doc. físico: ___").
- **Desarrollador**: card con RUT placeholder (`76.XXX.XXX-K`), métricas, bio corta.
- **Proceso**: 4 pasos con icons `lucide` (FileSignature, Handshake, ScrollText, Landmark) en línea horizontal con conectores.
- **FAQs**: shadcn `Accordion` con 8 entradas redactadas (DL 3.516, construcción, urbanización, formas de pago, hipotecario, plusvalía, impuestos, entrega).
- **Contacto**: form controlado React; submit construye `mailto:ventas@ofertaterrenos.cl?subject=...&body=...` con `window.location.href`. Side panel con datos oficina + email IR separado.
- **Nav fijo**: `position: sticky top-0`, backdrop-blur, transparente en hero (detect scroll Y > 80), sólido al hacer scroll. Botón "Acceso Inversionistas" link a `/forestal-valle-escondido/investors`.

## Print CSS (`forestal.css`)

```css
@media print {
  .fve-no-print { display: none !important; }     /* nav, footer, hero, contacto, faq, ubicación, proyecciones, plano interactivo, proceso */
  .fve-print-only { display: block !important; }
  .fve-section { break-inside: avoid; page-break-inside: avoid; }
  body { background: white; color: black; }
}
```

Secciones 2, 5, 7, 8 sin `fve-no-print`; el resto lleva la clase. Header de print con logo + título "Dossier del Proyecto" inyectado vía `fve-print-only`.

## SEO

`index.html` ya es global y cubre el dominio. Para per-route uso `useSEO` (hook existente del proyecto):

- `title`: "Forestal Valle Escondido — Parcelas DL 3.516 Hualañé Maule"
- `description`: "Parcelación rural bajo DL 3.516 en Hualañé, Región del Maule. Parcelas de 5.000 m² con roles SII individuales, escrituras y derechos de agua."
- `canonicalUrl`: `https://ofertaterrenos.com/forestal-valle-escondido`
- `jsonLd`: `RealEstateListing` agregado con datos del proyecto
- OG image: Unsplash placeholder

## /investors (mock login)

Página simple centrada con card shadcn: logo + título "Acceso Inversionistas", inputs email/password, botón "Ingresar" que solo muestra toast "Próximamente — contacto IR en ir@ofertaterrenos.cl". Sin lógica de auth real. Link "Volver" al landing.

## Datos placeholder (chilenos realistas)

- **Lotes**: numeración A-01…A-15, superficies 5.000–7.500 m², orientaciones N/NE/E/SE, precios UF 1.200–2.800, estados mezcla (10 disp / 3 reservados / 2 vendidos).
- **Coords**: -35.0489, -71.9876 (Hualañé aprox).
- **RUTs**: Forestal Valle Escondido SpA RUT 77.123.456-K; Inversiones Bioenergy SpA RUT 76.987.654-3.
- **CAPEX**: Caminos UF 8.500, Electrificación UF 6.200, Pozo + derechos UF 3.800, Topografía/subdivisión UF 2.400, Escrituración UF 1.800, Comercialización UF 4.500, Contingencia UF 2.300 → Total ~UF 29.500.
- **Proyecciones**: Velocidad 2 parcelas/mes, ticket promedio UF 1.950, absorción 4.2%.

## Restricciones respetadas

- Sin emojis en UI (solo iconos lucide).
- Sin fotos stock genéricas: Unsplash con queries específicos del Maule rural.
- Sin lenguaje de urgencia.
- Tono institucional en copy (revisión manual al redactar).
- Mobile-first: nav colapsa a menú hamburguesa shadcn `Sheet`; gantt scroll horizontal en mobile; tabla lotes con scroll-x.

## Fuera de alcance (confirmado)

- No se integra con DB ni RLS — todo hardcoded en `data/`.
- No se toca el `Layout` global, sidebar, ni rutas existentes salvo añadir 2 rutas en `publicRoutes.tsx`.
- No se modifica `index.css` global; tokens scoped a `.fve-theme`.
- Sin auth real en `/investors`.

## Verificación al terminar

- Build pasa (automático).
- Navegar `/forestal-valle-escondido` en preview: hero carga, scroll smooth a anchors, modal "Solicitar documento" abre, form mailto abre cliente, accordion FAQ funciona, mobile <768 nav colapsa.
- `Ctrl+P` muestra solo secciones 2/5/7/8 con header Dossier.
- `/forestal-valle-escondido/investors` renderiza login mock.

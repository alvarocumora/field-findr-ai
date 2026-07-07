
## Contexto — qué existe hoy

- **Ruta pública:** `/pricing` (`src/pages/Pricing.tsx`) con tabs Comprador / Agente / Inmobiliaria.
- **Definiciones:** `src/hooks/useSubscription.ts` → `PLAN_DETAILS`, `LATAM_PRICES` (UF/CLP/USD/ARS/COP/MXN), `LISTING_ADDONS`, `ADDON_PRICES`.
- **Checkout:** `useCreateCheckout` → edge function `mercadopago` (suscripción). Retornos `/subscription/{success,pending,failure}`. Webhook `mercadopago-webhook` sincroniza `subscriptions` + rol.
- **Add-ons ya existentes:** Básica (incluida) · Destacada 0.5 UF (3× visibilidad) · Super Destacada 1.5 UF (10× visibilidad).
- **Planes actuales (UF/mes):** free 0 · Starter 2.0 · Growth 4.5 · Scale 8.0 · Enterprise 15.0.

## Benchmark competencia (jul-2026)

| Portal | Entrada | Medio | Alto | Modelo |
|---|---|---|---|---|
| **ChilePropiedades** | $3.990 CLP (30 prop / 5 dest) | $6.990 (60/10) → $9.990 (90/15) | $15.990 (ilim / 20 dest) | SaaS mensual, 2 meses gratis anual |
| **Portalinmobiliario** | Sales-led (Plata/Oro/Platino) | — | Tienda Oficial + branding | Enterprise sales, sin precios públicos |
| **TocToc** | Contactar ejecutiva | — | Perfil auto-administrado | Sales-led, personalizado |
| **Yapo — Pack Inmo** | Créditos por cupo/tiempo | — | — | Pay-per-slot |
| **Zonaprop (AR)** | Simple por aviso | Destacado | Super Destacado | Pay-per-listing con visibilidad tiered |
| **EasyBroker (MX SaaS)** | $490 MXN (10 anun.) | $990 (25) → $1.490 (50) | $1.990+ (custom) | SaaS por inventario, foco CRM |
| **Inmuebles24 / Vivanuncios** | Combo mensual (contactar) | — | — | Sales-led combo multi-portal |

**Conclusiones clave:**
1. El mercado chileno tiene una **entrada muy barata** ($4–7k CLP) para captar corredores independientes. Nuestro Starter (UF 2 ≈ $75k) es 10× más caro sin justificarlo bien.
2. La **inmobiliaria grande** paga premium con sales-led (Portalinmobiliario, TocToc). Ahí compite valor: branding + BI + white-label.
3. Todos ofrecen **anual con 2 meses gratis** como estándar.
4. Nadie ofrece nuestro combo: **IA + mapa 3D + tasación + CRM + financiamiento directo**. Ese es el diferencial a monetizar.

## Estrategia de nueva oferta

Estructura de 5 planes con nombres orientados al negocio inmobiliario chileno, precios en UF (base) con conversión LATAM:

| Plan | UF/mes | ~CLP | Target | Lotes | Publicaciones | Destacadas incluidas |
|---|---|---|---|---|---|---|
| **Free** | 0 | $0 | Prueba | 5 | 3 | 0 |
| **Corredor** ⭐ nuevo entry | **1.0** | ~$38k | Corredor independiente | 15 | 15 | 1 destacada |
| **Corredora** | **2.5** | ~$94k | Oficina 1-3 agentes | 60 | 60 | 3 destacadas + 1 super |
| **Inmobiliaria** (Growth) | **5.0** | ~$188k | Desarrollador 1-3 proyectos | 200 | 200 | 10 destacadas + 3 super |
| **Grupo** (Scale) | **9.0** | ~$338k | Multi-proyecto, equipo | 500 | 500 | ilim destacadas + 10 super |
| **Enterprise** | Custom | — | Cadenas, holdings | Ilimitado | Ilimitado | White-label + API + SLA |

**Cambios respecto al actual:**
- Añadir tier **Corredor 1 UF** (competitivo con ChilePropiedades pero superior en features).
- Renombrar tiers a nombres del rubro (Corredor / Corredora / Inmobiliaria / Grupo) — hoy son Starter/Growth/Scale.
- Incluir **N destacadas gratis dentro del plan** (hoy son 100% add-on). Reduce fricción y compite con ChilePropiedades.
- Toggle **Mensual / Anual −17%** (2 meses gratis) — estándar del mercado.
- **Primer mes 50% OFF** para nuevo corredor (badge en Pricing).
- Enterprise pasa a "Contactar ventas" (sales-led como Portalinmobiliario).

## Cambios de código

**1. `src/hooks/useSubscription.ts`**
- Ampliar `PlanType` a `'free' | 'corredor' | 'corredora' | 'inmobiliaria' | 'grupo' | 'enterprise'` (mantener retrocompatibilidad con `starter/growth/scale` mapeando en el hook).
- Reescribir `PLAN_DETAILS` con nuevos nombres, `maxUnits`, `maxPublications`, `includedFeatured`, `includedSuperFeatured`, `annualDiscountMonths: 2`.
- Reescribir `LATAM_PRICES` para mensual y añadir `LATAM_PRICES_ANNUAL` (10 × mensual).
- Añadir `PLAN_TARGET` (texto de a quién apunta cada tier) y `PLAN_HIGHLIGHTS` (3 bullets diferenciadores).

**2. `src/pages/Pricing.tsx`**
- Toggle Mensual / Anual (12 meses × 10) con badge "Ahorra 2 meses".
- Reordenar tabs → **Corredores** (Corredor/Corredora), **Inmobiliarias** (Inmobiliaria/Grupo/Enterprise), **Comprador**.
- En cada card: badge "N destacadas incluidas/mes", CTA "Empieza gratis 14 días" en tier destacado.
- Nueva sección debajo: tabla comparativa **"Ofertaterrenos vs competencia"** con 6-8 filas (precio entry, publicaciones, destacadas, CRM, mapa 3D, tasación IA, financiamiento, soporte). Datos hard-coded en `src/config/pricingBenchmark.ts` (nuevo).
- Nueva sección FAQ pricing: cambio de plan, prorrateo, factura, cancelación.

**3. `src/config/pricingBenchmark.ts`** (nuevo)
- Export const con la tabla benchmark ChilePropiedades / Portalinmobiliario / TocToc / Zonaprop / EasyBroker + nuestra oferta.

**4. Landings dedicadas — nueva ruta pública**
- `/para-corredoras` → `src/pages/marketing/CorredorasLanding.tsx`: hero con dolor ("¿pagas $9.990 en ChilePropiedades y no vendes?"), propuesta única (IA + mapa + CRM), 3 planes destacados (Corredor / Corredora / Inmobiliaria), testimonios, CTA a `/auth?redirect=/pricing`.
- `/para-inmobiliarias` → `src/pages/marketing/InmobiliariasLanding.tsx`: hero enterprise (multi-proyecto, white-label, API), planes Inmobiliaria / Grupo / Enterprise, ROI calculator simple (lotes × ticket × comisión).
- Registrar ambas en `src/routes/publicRoutes.tsx`.
- Link desde `FooterSection` y `StickyHeader`.

**5. Backend — sin migración obligatoria**
- `subscriptions.plan_type` es text libre → basta actualizar constantes. Los planes legacy (`starter/growth/scale`) siguen funcionando; el hook mapea legacy → nuevo nombre para mostrar.
- La edge function `mercadopago` recibe `plan_type` string; no requiere cambios de esquema, solo actualizar el mapeo de precios interno cuando confirmes los precios finales.

## Fuera de alcance de este PR

- Cambios en Mercado Pago (crear planes nuevos en su dashboard) — lo hacemos después de aprobar precios.
- Cupones / trials automáticos (requiere lógica extra en `subscriptions`). Se puede dejar como copy "50% primer mes" y aplicar manualmente hasta el próximo sprint.
- Migración de usuarios existentes a nuevos nombres (mapping en UI es suficiente por ahora).

## Preguntas para confirmar antes de implementar

1. **Precios:** ¿te sirven los valores propuestos en UF, o quieres subirlos/bajarlos? (ej. Corredor 1 UF vs 1.5 UF).
2. **Trial:** ¿14 días gratis o "primer mes 50% off"? (elige uno; ambos requieren copy distinto).
3. **Destacadas incluidas:** ¿ok con incluirlas en el plan, o prefieres seguir 100% add-on?
4. **Landings dedicadas:** ¿creo `/para-corredoras` y `/para-inmobiliarias`, o basta con reforzar `/pricing`?

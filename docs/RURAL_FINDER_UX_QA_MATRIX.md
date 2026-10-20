# Rural Finder · QA público UX / rutas

## Objetivo y alcance

Esta suite de **Chromium real** sirve como smoke test complementario al CI habitual
(typecheck, Vitest, build). No simula compras ni usa claves de producción.

Se ejecuta automáticamente en PR que cambian rutas, páginas públicas o componentes
de navegación y manualmente desde GitHub Actions → **Public browser smoke**.

### Cobertura automatizada

| Flujo | Puntos de control |
|---|---|
| Portada → Explorar | Hero visible, enlace Parcelas → filtro `?type=parcela_rural` |
| Portada → Visita | CTA real, query `meeting_type=visita_terreno`, formulario adaptado |
| Proyecto contextual → Agendar | Muestra el proyecto y prellena el mensaje |
| Rutas históricas | Alias conserva `utm_source`, demás parámetros y `#ancla` |
| Error 404 | Explicación legible y recuperación hacia /explorar |
| Contacto | No asegura envío al servidor; anuncia preparación del correo |
| Menú móvil | Apertura, selección y cierre a navegación |
| Mapa sin WebGL | UI del explorador persiste aunque no haya canvas 3D |

Ejecuta en tres anchos: **320, 390 y 1440 px**. Chromium debe reportar éxito
para fusionar cambios de navegación pública, además del CI de código.

## Incidencia detectada por la primera ejecución de navegador

El primer pase real obtuvo **26 pruebas aprobadas y 3 fallidas**: la landing de
Valle Escondido mostraba el error global en los tres anchos. El trace comprobó
`cannot add postgres_changes callbacks ... after subscribe()`. Varias secciones
consumían `useVelLots` y cada una intentaba abrir el mismo topic Realtime.

Corregido en este PR: se eliminó la suscripción Realtime **por consumidor**,
manteniendo la consulta compartida `get_public_lots` con refresco de 20 s,
invalidación de stock al fallar RPC y todas las salvaguardas de disponibilidad.
Se añadió un test de doble montaje del hook para impedir regresiones.

La segunda ejecución de navegador debe validar los tres anchos antes del merge.

## Verificaciones manuales que siguen siendo obligatorias

- Sesión real por contexto comprador, broker, empresa y plataforma con RLS.
- Inventario real y precio CLP/UF en ficha y mapa, con RPC fallida y parcial.
- Flujo de reserva real, estados de error, callbacks de pago y correos.
- Comportamiento de mapas reales y tour 360 (incluyendo fallback sin WebGL).
- Revisar landing bespoke de Caone, Explora Park y Valle Escondido en móvil.
- Validar que no haya doble scroll, tapa de FABs o solapamiento de barras móviles.
- Verificar lector de pantalla, teclado, alto contraste y nivel de zoom ≥200%.
- Verificar sincronización efectiva GitHub–Lovable en el dominio publicado; CI no
  equivale a una publicación verificada.

## Ejecutar localmente (sin tocar la infraestructura)

Tras `npm ci`, instalar temporalmente el runner:

```sh
npm install --no-save --package-lock=false --ignore-scripts @playwright/test@1.56.1
npx playwright install chromium
npm run build
npx playwright test --config=e2e/playwright.config.mjs
```

La configuración levanta `vite preview` en `http://127.0.0.1:4173`.
Los tests no requieren sesión ni mutan el inventario.

## Reglas de diseño compartido

- `.theme-rural` debe cubrir header, contenido y footer en las páginas que
  usan `PublicLayout`. Las landings bespoke mantienen su propia composición.
- Los CTAs «Consultar», «Agendar visita» y «Reservar» tienen semánticas distintas:
  lead/consulta, petición de visita y reserva con lote verificado.
- `/explorar?listing=<id>` abre la publicación independientemente del paginado.
- Los alias conservan la query y el fragmento. El manifiesto es la fuente
  única de rutas y permisos.
- `src/lib/publicUrls.ts` y `src/lib/landing/paths.ts` definen canónicos.
- Nunca presentar fallas de RPC como inventario a cero o reserva disponible.

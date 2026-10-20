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


## Validación de transiciones públicas → espacios privados

**Automatizado en PR de roles:**
- `/comprador/inicio?tab=...#...`, `/asesor/projects?tab=...#...` y
  `/admin/dashboard?view=...#...` redirigen a `/auth` sin perder parámetros.
- El destino posterior al login se valida como ruta interna: nunca se acepta
  una URL absoluta, protocol-relative ni un bucle de regreso a `/auth`.
- Se verifica el manifiesto de acceso `public/auth/agent/admin` y que
  herramientas de CRM mantengan su política por capability + feature.
- El selector de contextos no ofrece Broker si falta el rol Agent, aunque
  exista un perfil comercial activo.

**QA manual posterior con cuentas autorizadas (no se simula ni se afirma aquí):**
| Perfil | Recorrido de aceptación |
| --- | --- |
| Comprador | Publicación → autenticación → favoritos, visitas y reservas propias |
| Broker | Selección de Broker → proyectos asignados, captaciones, links y CRM permitido |
| Inmobiliaria | Selección Empresa → inventario, lotes, equipo y permisos organizacionales |
| Administrador | Plataforma → organizaciones, suscripciones y auditoría |
| Cuenta multi-rol | Elegir espacio → alternar al permitido → volver a landing sin perder sesión |
| Cuenta sin permisos | URL directa a CRM/admin produce denegación sin cargar datos restringidos |

Las pruebas automatizadas de rutas **no sustituyen** la verificación de RLS
ni las comprobaciones de servidor mediante credenciales de testing asignadas.
No usar cuentas reales, copiar tokens ni modificar datos comerciales durante QA.


## Integridad comercial y estados de datos

Se diferencia el error real de lectura de un conjunto verdaderamente vacío,
sin presentar un CRM, agenda o cartera «vacíos» cuando falla una consulta.
Cada módulo ofrece una acción **Reintentar consulta**, sin ejecutar mutaciones.

- CRM / Leads: el error impide mostrar «Sin leads» como si se hubiera consultado
  correctamente la base de datos.
- Proyectos: se abandona el cálculo ficticio de ingresos que multiplicaba lotes
  vendidos por **$25.000.000 CLP** sin evidencia de transacciones. La tarjeta
  ahora muestra la cantidad verificable de proyectos con estado activo.
- Visitas: el error de lectura muestra un aviso, no «No hay visitas registradas».
- Reservas: el error de lectura impide mostrar métricas de ingresos y reservas
  en cero o acciones basadas en datos posiblemente obsoletos.

**QA adicional con cuentas autorizadas:** simular un error de red/consulta para
cada módulo y comprobar que se preserve la sesión, aparezca el aviso, no se
realicen cambios al inventario y una recuperación válida permita navegar.
Mantener explícito que los valores de `projects.sold_lots` son resúmenes de
proyecto, no prueba de una escritura o un pago recibido.

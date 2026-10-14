# Auditoría de calidad técnica y estabilidad — 2026-10-14

Base auditada: `958244f39c26c8ce3c1789e40b368f312e841634` de `main`.
Alcance: instalación reproducible, controles de CI, tipos, pruebas, build y riesgos estáticos de ejecución. No certifica seguridad, flujos autenticados ni comportamiento visual en navegador.

## Evidencia de partida

- 345 pruebas pasaron en 54 archivos con Vitest.
- Vite completó el build, incluidas 57 rutas sociales de 5 proyectos y la PWA. En este entorno Node necesita `NODE_USE_ENV_PROXY=1` para las consultas públicas de Supabase.
- Servidor de desarrollo: HTML y transformación de React comprobados por HTTP. Supabase público y `get-mapbox-token`: HTTP 200.
- `tsc --noEmit` sobre el tsconfig raíz no comprueba los proyectos referenciados: `files` está vacío. La comprobación real de la app detectó errores en las actualizaciones de listings y tickets; la configuración de Node pasó.
- `npm ci` falla: manifest y lockfile no coinciden. CI y deploy usan instalación mutable. La resolución sin lock instaló SWC 1.16.18, cuyo caché nativo falla en esta máquina; 1.15.8 funcionó.
- ESLint: 501 errores y 432 advertencias en 876 archivos. 461 errores son `no-explicit-any`; no se propone una limpieza masiva ni desactivar reglas.
- `CityLanding.tsx` llama `useSEO` después de retornar cuando no encuentra ciudad: puede cambiar el orden de hooks al navegar entre slugs válidos e inválidos.
- `CartographicHero.tsx` tiene un manejador llamado `useExample` que activa la regla de hooks por su nombre; su cuerpo no llama hooks.
- Bundles grandes: Mapbox (~2 MB), Three (~1.6 MB) y entradas compartidas; los tamaños por sí solos no prueban un defecto de rendimiento.
- La auditoría histórica `AUDIT_REPORT.md` contiene afirmaciones desactualizadas (por ejemplo, la exclusión de JS en PWA). No se usa como evidencia actual.
- El PR #168, abierto antes de esta auditoría, intenta activar el typecheck junto con otros arreglos sobre una base antigua y está en conflicto. El PR 1 de este plan toma solo el arreglo necesario para el `main` actual; no incorpora ni cierra automáticamente ese trabajo anterior.
- El workflow de deploy de `main` falló en la corrida `37088978620`: faltan los secretos `DREAMHOST_HOST`, `DREAMHOST_USER`, `DREAMHOST_PATH` y `DREAMHOST_SSH_KEY` en el entorno GitHub `production`. Es una limitación de despliegue independiente de CI; no se requieren sus valores en el chat ni para las correcciones de código.

## Plan por PR

| Orden | Objetivo único | Cambios | Criterio de aceptación |
|---|---|---|---|
| 1 | Hacer efectivo el control de tipos | Comando `typecheck` para app y Node, usarlo en CI/deploy; payloads de mutaciones con `TablesUpdate` | Typecheck, pruebas y build pasan sin casts para ocultar errores |
| 2 | Estabilizar hooks de landings | Orden invariable de `useSEO` y nombre correcto del manejador de ejemplos | Regresión al navegar válido → inválido → válido; ESLint de hooks sin errores en ambos archivos |
| 3 | Recuperar instalación reproducible | Reparar lockfile conservando resoluciones existentes donde sea posible; alinear scripts y CI/deploy con instalación congelada | Instalación limpia, typecheck, pruebas y build con la versión de Node de CI; revisar diff de dependencias |
| 4 | Reducir deuda de lint por módulo | Priorizar errores de ejecución y expresiones vacías; después tipos explícitos por dominio | Cada PR reduce el baseline sin desactivar reglas y aporta pruebas donde cambia comportamiento |
| 5 | Medir y optimizar carga inicial | Medir rutas públicas en navegador antes de cambiar chunks o lazy loading | Comparación repetible de transferencia, render y navegación; mapas, PDF y PWA sin regresiones |

## Política de ejecución y merge

Una rama y un objetivo por PR. Incluir problema, alcance, validación y limitaciones. Releer el diff y comprobar que solo incluye cambios del objetivo. No tocar secretos, migraciones, datos remotos ni archivos generados de Supabase en estos PR.

Abrir cada PR contra `main`, revisar checks y conflictos, y fusionarlo solo con las validaciones pertinentes aprobadas. Respetar protecciones de rama, sin bypass ni force push. Un merge a `main` puede activar el workflow de despliegue existente; no desplegar por otro mecanismo. Actualizar la base antes del PR siguiente.

Las cifras anteriores corresponden al entorno y resolución de dependencias de esta auditoría. Una corrida futura puede diferir hasta que se repare el lockfile. Los PR posteriores deben registrar sus propias comprobaciones; este documento no los declara ejecutados.

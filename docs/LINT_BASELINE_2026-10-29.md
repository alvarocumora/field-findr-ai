# ESLint — corrección de arranque y línea base

La combinación congelada ESLint 9.39.4/typescript-eslint 8.11.0 delega `no-unused-expressions` a una regla core que lee opciones durante su inicialización. Sin opciones explícitas, `npm run lint` abortaba con `Cannot read properties of undefined (reading 'allowShortCircuit')`.

Se declaran explícitamente los valores predeterminados en `eslint.config.js`. La regla conserva nivel error, sin permitir short circuit, ternarios ni tagged templates. No cambian dependencias, lockfile ni código de aplicación.

## Validación

- Ejecución completa de `npm run lint -- --format json`: 935 archivos; cero errores fatales de análisis; 521 errores y 555 advertencias. Exit code 1 por diagnósticos reales, no por caída de la herramienta.
- Sondas con la API real de ESLint y configuración del repositorio: una llamada válida no genera diagnóstico; una expresión sin efecto, short circuit, ternario y tagged template generan cada uno el diagnóstico esperado. No se desactiva la regla para evitar la excepción.
- `git diff --check`: correcto.
- Instalación, typecheck, 457 pruebas y build completo se validaron en PR 0. Esta corrección solo modifica configuración de lint y documentación; no se repiten tests de aplicación ni build al no cambiar sus entradas.

| Regla | Errores |
|---|---:|
| @typescript-eslint/no-explicit-any | 483 |
| no-empty | 16 |
| @typescript-eslint/no-unused-expressions | 5 |
| prefer-const | 4 |
| no-var | 4 |
| @typescript-eslint/no-empty-object-type | 2 |
| no-useless-escape | 2 |
| @typescript-eslint/no-unsafe-function-type | 2 |
| no-control-regex | 1 |
| no-extra-boolean-cast | 1 |
| @typescript-eslint/no-require-imports | 1 |

Priorizar los diagnósticos en módulos comerciales que se modifiquen y corregirlos por dominio, sin bajar severidades ni mezclar una limpieza masiva con cambios de negocio. Esta línea base no declara lint aprobado.

Actions sigue bloqueado por pagos/límite de gasto, según anotación de CI del PR 0; resolver en la cuenta GitHub y repetir controles remotos. No se alteran workflows ni protecciones.

## Corrección posterior de los diagnósticos

Los 38 diagnósticos estructurales se corrigieron en #221. La tanda posterior elimina los 483 usos explícitos de `any` con inferencia, tipos de esquema, contratos de los SDK y validación de JSON. Los errores capturados mantienen mensajes de objetos PostgREST, además de instancias Error.

Se distinguen los lotes de la RPC pública de las filas privadas, las proyecciones de reservas/créditos y la prioridad del lead de su estado comercial. El contador de interesados se identifica como muestra de los últimos diez contactos, conforme al límite de la consulta. Las anotaciones de tours conservan coordenadas angulares e IDs de lote.

El build demostró que `supabase/functions/mcp/index.ts` es una salida del plugin MCP: regenera las cuatro declaraciones `var` que se habían corregido manualmente en #221. Se conserva la salida del generador y se excluye únicamente ese archivo de lint, igual que `dist`; sus fuentes mantenidas en `src/lib/mcp/**` y las demás Edge Functions siguen analizadas con las mismas reglas. No se retiran banners de generación ni se añaden supresiones de reglas.

CI incorpora `npm run lint` para impedir regresiones de errores; las advertencias existentes siguen visibles. No se modifican dependencias, lockfile, SQL, RLS ni configuración de despliegue. Las funciones Deno no se desplegaron ni se certificaron contra un backend autenticado; la validación local cubre tipos de aplicación, lint, pruebas y build. La suite completa pasó con Node 20: 83 archivos, 465 pruebas.

Última pasada global: 944 archivos, cero errores, cero errores fatales y 549 advertencias. Las advertencias quedan como deuda visible para una tanda posterior; no impiden que el comando lint termine correctamente.

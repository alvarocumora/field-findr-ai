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

# Parcel Designer V2.1

## Objetivo

Evolucionar el diseñador 3D de parcelas sobre la base V2 ya integrada en `main`, manteniendo el flujo de revisión mediante rama + pull request antes de cualquier merge a producción.

## Alcance propuesto

- Multiselección de objetos.
- Agrupar / desagrupar.
- Copiar / pegar.
- Edición de nodos de caminos, senderos y cercos después de dibujarlos.
- Reordenamiento y organización de objetos en la escena.
- Retiros automáticos respecto de deslindes.
- Indicadores de pendiente y orientación norte.
- Mejoras de precisión para mover / rotar / escalar.
- Persistencia compatible con diseños V2 existentes.
- Mantener visibles Guardar, Compartir, PDF, Undo y Redo.

## Reglas de implementación

1. No trabajar directamente sobre `main`.
2. Cada cambio funcional debe quedar en esta rama.
3. CI debe pasar: typecheck, tests y build.
4. Revisar el diff antes de marcar el PR como listo para merge.
5. No modificar geometría KMZ del lote.
6. No eliminar funciones existentes del diseñador.
7. Mantener compatibilidad con modelos GLB y modelos integrados.

## Criterios de aceptación

- El usuario puede seleccionar más de un objeto sin perder el control individual.
- Caminos, senderos y cercos pueden editar sus puntos después de creados.
- Los controles principales permanecen visibles en resoluciones pequeñas y medianas.
- Los diseños guardados previamente siguen cargando.
- TypeScript, tests y build terminan correctamente.
- El PR se revisa antes de merge a `main`.

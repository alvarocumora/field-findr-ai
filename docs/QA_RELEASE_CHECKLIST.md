# QA & Release Checklist — OfertaTerrenos / Field Findr AI

## 1. Checklist antes de cada PR

- El PR tiene un objetivo único.
- El PR incluye resumen claro.
- El PR incluye riesgos.
- El PR incluye QA manual sugerido.
- No expone secretos ni tokens.
- No mezcla refactor con feature compleja.
- No rompe compatibilidad con Lovable.

## 2. Comandos mínimos

Ejecutar cuando sea posible:

```sh
npm run lint
npm run build
```

Si no se ejecutan, declararlo explícitamente en el PR.

## 3. QA de rutas públicas

Verificar:

- `/`
- `/explorar`
- `/propiedad/:id`
- `/proyecto/:id`
- `/pricing`
- `/tools`
- `/search`
- `/oportunidades`
- `/blog`

Resultado esperado:

- La página carga.
- No hay pantalla blanca.
- La navegación principal responde.
- No hay errores visibles en UI.

## 4. QA de autenticación

Verificar sin sesión:

- `/buyer/home` redirige o bloquea correctamente.
- `/favoritos` redirige o bloquea correctamente.
- `/mi-terreno` redirige o bloquea correctamente.
- `/asesor/dashboard` bloquea acceso.
- `/admin/dashboard` bloquea acceso.

Verificar con sesión:

- Login funciona.
- Logout funciona.
- Redirect posterior no queda en loop.

## 5. QA de roles

### Buyer

- Puede ver panel comprador.
- No puede entrar a panel asesor si no tiene rol.
- No puede entrar a admin.

### Agent

- Puede entrar a `/asesor/dashboard`.
- Puede ver inventario y leads.
- No puede entrar a admin salvo que también sea admin.

### Admin

- Puede entrar a admin.
- Puede entrar a asesor.

## 6. QA de ficha de propiedad

Verificar:

- Hero visual carga.
- Precio se muestra correctamente.
- Superficie se muestra correctamente.
- CTA de WhatsApp funciona.
- Botón de agendar visita funciona o muestra flujo claro.
- Botón PDF no falla silenciosamente.
- Galería no rompe layout.
- Vista mobile mantiene CTA accesible.

## 7. QA de Visual Scenarios

Cuando el módulo exista, verificar:

- Escenario con imagen base.
- Escenario con overlay.
- Escenario sin overlay.
- Varios escenarios.
- Estado `draft` no se presenta como aprobado.
- Estado `concept` muestra disclaimer.
- Estado `approved` no implica permiso estatal salvo evidencia.
- Mobile responsive.

## 8. QA de IA

Verificar:

- Loading visible.
- Error visible.
- Resultado separa resumen, supuestos, riesgos y próximos pasos.
- No inventa permisos.
- No inventa IFC.
- No inventa subdivisiones aprobadas.
- No inventa factibilidad normativa.
- Muestra disclaimer.

## 9. QA de Mapbox

Verificar:

- Token carga desde Edge Function o fallback.
- Si no hay token, muestra error controlado.
- El mapa no bloquea toda la ficha.
- Mobile no queda congelado.
- No carga Mapbox en rutas innecesarias si se implementa lazy loading.

## 10. QA de PWA

Verificar:

- App instala correctamente si aplica.
- No queda cache viejo después de deploy.
- Datos privados no se sirven incorrectamente desde cache.
- Offline indicator funciona.

## 11. QA de PDF

Verificar:

- Descarga PDF.
- PDF abre correctamente.
- Incluye imagen si existe.
- No falla si falta imagen.
- Incluye precio, ubicación y superficie.
- Incluye disclaimer.
- Incluye CTA de contacto.

## 12. QA responsive

Probar:

- Desktop ancho.
- Notebook.
- Tablet.
- Mobile.

Puntos críticos:

- Navbar.
- Hero visual.
- Botonera lateral de ficha.
- Galería.
- Formularios.
- Dashboards.

## 13. Seguridad

Revisar:

- No hay claves privadas en frontend.
- No hay service role key.
- No hay tokens hardcodeados.
- Rutas privadas tienen protección.
- Edge Functions validan usuario si manejan datos privados.
- RLS activa en tablas sensibles.

## 14. Release checklist

Antes de publicar:

- Build OK.
- Lint revisado.
- Rutas críticas revisadas.
- Login/logout revisado.
- Ficha de propiedad revisada.
- WhatsApp CTA revisado.
- PDF revisado si aplica.
- Mapbox revisado.
- Supabase functions activas.
- Variables de entorno configuradas.
- Lovable publish revisado.

## 15. Rollback

Si algo falla:

1. Identificar PR o commit.
2. Revertir el PR si el error es crítico.
3. Verificar build.
4. Publicar versión estable.
5. Documentar causa.

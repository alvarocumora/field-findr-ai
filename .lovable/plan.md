

# Plan: Integración de Mejoras Disruptivas para Portal Inmobiliario

## Diagnóstico del Estado Actual

La plataforma tiene una base robusta con: landing 3D con scrollytelling, explorador con mapa Mapbox, detalle de proyecto con tabs (Mapa, Cotizador, Lotes, Info, Comparar, Reseñas, Brochure, Tour 360), diseñador de parcelas 3D, CRM completo, sistema de reservas y créditos. Sin embargo, hay oportunidades significativas de mejora en UX, conversión y diferenciación competitiva.

---

## Fase 1: Experiencia de Proyecto Premium (Alto impacto visual)

### 1.1 Hero Inmersivo en ProjectDetail
- Reemplazar el header plano actual por un hero con imagen de fondo del proyecto (primera imagen de galería) con overlay gradient
- Stats superpuestos tipo "glassmorphism" (lotes disponibles, precio desde, área)
- Barra de progreso visual de ventas (disponible/reservado/vendido como barra horizontal animada)

### 1.2 Galería tipo Airbnb
- Grid asimétrico: 1 imagen grande + 2 pequeñas en lugar del grid 3x1 actual
- Lightbox fullscreen con swipe (ya existe el Dialog pero sin el grid premium)
- Botón "Ver todas las fotos" cuando hay más de 3

### 1.3 Cards de Lotes Mejoradas
- Agregar thumbnail de imagen satelital del lote usando Mapbox Static API
- Indicador de popularidad ("3 personas viendo este lote")
- Badge de urgencia para últimos lotes disponibles ("¡Último disponible!")

**Archivos:** `src/pages/ProjectDetail.tsx`, `src/components/lots/EnhancedLotCard.tsx`

---

## Fase 2: Conversión y Engagement

### 2.1 Widget de Cotización Flotante
- Mini-cotizador sticky en desktop (sidebar derecho) que muestra el lote seleccionado con precio y botón "Reservar"
- En mobile, barra inferior expandible con swipe-up para ver detalles del lote seleccionado

### 2.2 Formulario de Interés Inteligente
- Modal que captura nombre, email, teléfono, presupuesto y preferencia de lote
- Se activa automáticamente después de 60 segundos o al hacer scroll al 70% de la página
- Guarda como lead en la BD vinculado al proyecto

### 2.3 Notificaciones de Actividad Social (Social Proof)
- Toast discreto: "Juan de Santiago reservó el Lote 15 hace 2 horas"
- Basado en datos reales de reservas recientes (últimas 48h)
- Solo visible en la vista pública del proyecto

**Archivos:** `src/pages/ProjectDetail.tsx`, nuevo `src/components/projects/FloatingQuoter.tsx`, nuevo `src/components/projects/SocialProofToast.tsx`

---

## Fase 3: Mapa Interactivo Mejorado

### 3.1 Filtros Visuales en el Mapa de Lotes
- Toggle para colorear lotes por: precio (heatmap verde-rojo), área (gradiente), orientación
- Leyenda dinámica según el filtro activo
- Ya existe `LotMapView` pero sin filtrado visual por atributo

### 3.2 Mini Ficha en Hover
- Al hacer hover sobre un lote en el mapa, mostrar popup compacto con: número, área, precio, estado
- Click abre el LotDetailSheet existente

### 3.3 Modo Street View
- Botón para abrir Google Street View embebido en las coordenadas del proyecto
- Iframe con `google.com/maps/embed` usando lat/lng del proyecto

**Archivos:** `src/components/lots/LotMapView.tsx`

---

## Fase 4: Experiencia del Comprador

### 4.1 Página "Mi Terreno" Mejorada
- Dashboard personal del comprador con: estado de su reserva, pagos pendientes, documentos, timeline de cierre
- Acceso al diseñador 3D de su lote
- Actualmente `MiTerreno.tsx` existe pero necesita conexión real con reservas del usuario

### 4.2 Comparador Visual Side-by-Side
- Mejorar `LotComparatorInProject` para mostrar comparación visual con mini-mapas de cada lote
- Tabla de diferencias resaltando ventajas de cada uno

### 4.3 Timeline de Compra
- Stepper visual que muestra: Interés → Reserva → Promesa → Escritura → Inscripción
- Ya existe `closing_steps` en BD pero no hay visualización para el comprador

**Archivos:** `src/pages/MiTerreno.tsx`, `src/components/projects/LotComparatorInProject.tsx`, nuevo `src/components/buyer/PurchaseTimeline.tsx`

---

## Fase 5: Herramientas Admin/Agente

### 5.1 Dashboard de Proyecto con KPIs
- Vista rápida por proyecto: velocidad de venta, tasa de conversión lead→reserva, ingreso proyectado vs real
- Gráfico de embudo: visitas → interés → reserva → venta

### 5.2 Automatización de Seguimiento
- Recordatorios automáticos cuando un lead no ha sido contactado en 48h
- Email/WhatsApp templates predefinidos para cada etapa del funnel

### 5.3 Reportes Exportables
- PDF de estado de proyecto con mapa, tabla de lotes, gráficos de venta
- Ya existe `reportPdfGenerator` pero falta integración con datos reales del proyecto

**Archivos:** `src/pages/dashboard/ExecutiveDashboard.tsx`, `src/components/dashboard/ProjectKPIs.tsx` (nuevo)

---

## Orden de Implementación Recomendado

| Prioridad | Fase | Impacto | Esfuerzo |
|-----------|------|---------|----------|
| 1 | 1.1 Hero Inmersivo | Alto (primera impresión) | Medio |
| 2 | 1.2 Galería Airbnb | Alto (visual) | Bajo |
| 3 | 2.1 Cotizador Flotante | Alto (conversión) | Medio |
| 4 | 2.3 Social Proof | Alto (conversión) | Bajo |
| 5 | 3.1 Filtros en Mapa | Medio (UX) | Medio |
| 6 | 4.1 Mi Terreno | Medio (retención) | Alto |
| 7 | 4.3 Timeline Compra | Medio (UX) | Medio |
| 8 | 1.3 Cards Mejoradas | Medio (visual) | Bajo |
| 9 | 5.1 KPIs Proyecto | Medio (gestión) | Alto |
| 10 | 2.2 Formulario Interés | Medio (conversión) | Medio |

---

## Diferenciadores vs Competencia (lanube360, latitud360, portalinmobiliario)

- **Tour 360 integrado en el flujo de compra** (no como link externo)
- **Diseñador 3D de parcela** con terreno satelital real
- **Cotizador público** con simulación financiera en tiempo real
- **Social proof** con actividad real de reservas
- **Comparador de lotes** visual dentro del proyecto

Selecciona qué fases quieres implementar primero o si prefieres abordar todas en orden.




# Plan: Mejoras al Modulo de Proyectos

## Resumen Ejecutivo
Implementar mejoras significativas en el sistema de gestion de proyectos inmobiliarios, incluyendo una nueva pestana legal para documentacion y compliance, tarjetas de lotes mejoradas con mas informacion visual, y un modulo de calculo de financiamiento integrado en la vista de proyecto.

---

## 1. Nueva Pestana Legal en Proyectos

### Objetivo
Agregar una pestana "Legal" al detalle del proyecto que muestre toda la informacion juridica y documental relevante.

### Contenido de la Pestana Legal

**Seccion Documentos del Proyecto:**
- Titulo de dominio
- Planos aprobados
- Certificado de subdivisión
- Permisos municipales
- Recepcion final (si aplica)
- Factibilidad de servicios (agua, electricidad)

**Seccion Estado Juridico:**
- ROL de la propiedad
- Situacion catastral
- Gravamenes e hipotecas
- Prohibiciones
- Litigios pendientes

**Seccion Permisos y Aprobaciones:**
- Permiso de loteo
- Resolucion sanitaria
- Informe de impacto ambiental
- Certificado de urbanizacion

### Componente a Crear
`src/components/projects/LegalTab.tsx`

### Cambios en Base de Datos
Agregar nuevas columnas a la tabla `projects`:
- `legal_documents` (jsonb) - almacena lista de documentos con estado
- `legal_status` (text) - estado legal general del proyecto
- `rol_number` (text) - numero de ROL catastral
- `permits` (jsonb) - permisos y aprobaciones

---

## 2. Tarjetas de Lotes Mejoradas

### Mejoras Visuales

**Informacion Adicional a Mostrar:**
- Precio por m2 calculado automaticamente
- Indicador visual de orientacion (si disponible)
- Mini-preview del poligono del lote
- Tiempo en venta / dias desde reserva
- Historial de cambios de precio

**Mejoras de Interaccion:**
- Animacion al seleccionar
- Vista rapida (quick view) sin abrir modal
- Comparacion directa entre lotes seleccionados
- Indicador de "ultimo disponible" cuando queden pocos

### Indicadores Visuales
- Badge de "Destacado" para lotes premium
- Icono de servicios disponibles mas prominente
- Progress bar visual de financiamiento (si aplica)
- Etiqueta de descuento si hay promocion activa

### Componentes a Modificar
- `src/components/lots/LotCard.tsx`
- `src/pages/ProjectDetail.tsx` (seccion de lista de lotes)

---

## 3. Modulo de Calculo de Financiamiento

### Ubicacion
Integrado en la sidebar del detalle del proyecto, aparece al seleccionar un lote.

### Calculadoras Incluidas

**3.1 Simulador de Cuotas:**
- Precio del lote (precargado)
- Porcentaje de pie (slider 10-50%)
- Plazo en meses (12, 24, 36, 48, 60)
- Tasa de interes mensual
- Resultado: cuota mensual, total a pagar, CAE estimado

**3.2 Capacidad de Compra:**
- Ingreso mensual del comprador
- Porcentaje maximo de endeudamiento (25-40%)
- Resultado: precio maximo que puede pagar

**3.3 Comparador de Escenarios:**
- Comparar 2-3 escenarios de financiamiento
- Tabla comparativa de cuotas y totales
- Recomendacion automatica

### Componente a Crear
`src/components/projects/FinancingCalculator.tsx`

### Integracion
- Aparece en sidebar cuando se selecciona un lote disponible
- Boton "Simular Financiamiento" en las tarjetas de lotes
- Puede generar cotizacion en PDF

---

## Estructura de Archivos

```text
src/
├── components/
│   ├── projects/
│   │   ├── LegalTab.tsx          (NUEVO)
│   │   ├── FinancingCalculator.tsx (NUEVO)
│   │   ├── LegalDocumentCard.tsx  (NUEVO)
│   │   └── KMZImportDialog.tsx   (existente)
│   └── lots/
│       └── LotCard.tsx           (MODIFICAR)
└── pages/
    └── ProjectDetail.tsx         (MODIFICAR)
```

---

## Flujo de Usuario

```text
Usuario en ProjectDetail.tsx
         │
         ├─► Tab "Legal" ──► Ver documentos, estados, permisos
         │
         ├─► Tab "Lotes" ──► Tarjetas mejoradas con mas info
         │        │
         │        └─► Click en lote ──► Sidebar con:
         │                                  ├─ Detalle del lote
         │                                  ├─ Boton "Simular Financiamiento"
         │                                  └─ Calculadora desplegable
         │
         └─► Tab "Mapa 3D" ──► Click en poligono ──► Mismo flujo
```

---

## Detalles Tecnicos

### Migracion de Base de Datos

```sql
-- Agregar columnas legales a projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS legal_documents jsonb DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS legal_status text DEFAULT 'pending';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rol_number text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS permits jsonb DEFAULT '[]'::jsonb;
```

### Estructura de legal_documents (jsonb)
```json
[
  {
    "type": "titulo_dominio",
    "name": "Titulo de Dominio",
    "status": "verified", // pending | verified | rejected
    "file_url": "...",
    "verified_at": "2025-01-15",
    "notes": "..."
  }
]
```

### Estructura de permits (jsonb)
```json
[
  {
    "type": "permiso_loteo",
    "name": "Permiso de Loteo",
    "number": "RES-2024-1234",
    "status": "approved",
    "issued_date": "2024-06-15",
    "expiry_date": "2026-06-15"
  }
]
```

### Formulas de Financiamiento

**Cuota Mensual (Sistema Frances):**
```
M = P * [r(1+r)^n] / [(1+r)^n - 1]

Donde:
M = Cuota mensual
P = Principal (monto a financiar)
r = Tasa de interes mensual (en decimal)
n = Numero total de cuotas
```

**CAE Aproximado:**
```
CAE = ((Total Pagado / Principal) ^ (1/años)) - 1
```

---

## Orden de Implementacion

1. **Migracion de BD** - Agregar columnas legales a projects
2. **LegalTab.tsx** - Componente de pestana legal
3. **FinancingCalculator.tsx** - Calculadora de financiamiento
4. **LotCard.tsx** - Mejoras visuales
5. **ProjectDetail.tsx** - Integrar nuevas pestanas y calculadora
6. **Actualizar tipos TypeScript** - Reflejar nuevas columnas

---

## Consideraciones

- La pestana legal solo mostrara informacion publica al visitante
- Los campos editables de documentos solo estaran disponibles para el dueno del proyecto (dashboard)
- El modulo de financiamiento usara tasas de referencia chilenas actualizables
- Las tarjetas de lotes mantendran compatibilidad con la vista actual


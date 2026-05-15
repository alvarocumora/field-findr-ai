
# Sistema QR · Validador público · Tasación Live · Trazabilidad

Construyo el sistema en tres capas. Las dos primeras (QR + validador + live + hash auditado en Lovable Cloud) las implemento ahora. La capa blockchain la diseño como módulo opcional a activar después.

## 1. Capa de datos: registro auditado de tasaciones

Nueva tabla `tasaciones_publicadas` en Lovable Cloud. Cada vez que el tasador genera el PDF y lo "publica", se guarda un registro inmutable con:

- `id` (uuid público corto, usado en la URL del validador)
- `listing_id` (opcional)
- `comuna`, `region`, `direccion`, `rol`
- `valor_uf`, `valor_clp`, `valor_m2_uf`, `superficie_m2`
- `fecha_emision`, `tasador_nombre`, `lang`
- `pdf_path` (ruta en bucket `tasaciones`)
- `pdf_sha256` (huella SHA-256 del PDF — cualquier modificación cambia el hash)
- `firma_data_hash` (SHA-256 del trazo de firma)
- `payload_json` (snapshot completo de `TasacionData` para reconstrucción)
- `payload_hash` (SHA-256 del payload canónico)
- `version` (incremental por listing)
- `revoked_at`, `revoked_reason` (para invalidar una tasación)
- `blockchain_anchor` (jsonb null por ahora; ver capa 3)

RLS:
- INSERT: solo `appraiser` o `admin`.
- SELECT: público (los detalles de validación son públicos por diseño — el QR está hecho para verificarse sin login).
- UPDATE/DELETE: solo `admin`. La revocación es un `update`, no un delete.

## 2. Generación del QR y publicación

En `TasacionTeno.tsx`, junto a "Compartir" agrego un botón **"Publicar y generar QR"**:

1. Construye el PDF, calcula `sha256(blob)` con `crypto.subtle.digest`.
2. Sube el PDF a `tasaciones/<id>/<filename>.pdf`.
3. Inserta el registro en `tasaciones_publicadas`.
4. Genera el QR (lib `qrcode`) que apunta a:
   `https://ofertaterrenos.com/tasacion/v/<id>`
5. Muestra: QR descargable PNG/SVG, link copiable, hash visible y badge "Publicado · v{n}".
6. El QR queda **embebido en el propio PDF** (esquina inferior derecha de la portada y de la página de firma) en una nueva versión re-generada que incluye el QR, hash y URL del validador. Ese segundo PDF se vuelve a subir como `pdf_final` y su hash se sella en la fila.

## 3. Tasación Live (`/tasacion/v/:id`)

Página pública nueva. Renderiza la tasación dinámicamente desde `payload_json`, no desde el PDF:

- Header con badge **Verificada / Revocada / No encontrada**.
- Datos clave: predio, comuna, fecha, valor UF, valor CLP, valor/m².
- Tasador firmante + fecha + miniatura de firma.
- **Hash SHA-256 del PDF** (con copiar al portapapeles).
- Botón "Descargar PDF original" (signed URL del bucket).
- Botón "Verificar archivo" → input file: el usuario sube su copia del PDF y comparamos `sha256(uploaded) === pdf_sha256` en cliente. Resultado en verde/rojo.
- Comparables y sección 12 íntegros (reusa `TasacionTeno` en modo `readOnly`).
- Botón "Ver en idioma EN/ES" (usa el mismo i18n existente).
- Si `revoked_at` no es null: banner rojo con motivo y fecha.

Misma página accesible escaneando el QR del PDF.

## 4. Validador independiente (`/tasacion/validar`)

Página pública con dos modos:

- **Por código**: pegar el id del informe.
- **Por archivo**: subir el PDF; calculamos su SHA-256 y buscamos coincidencia en `tasaciones_publicadas.pdf_sha256` o `pdf_final_sha256` vía función pública `find_tasacion_by_hash(hash)` (security definer, expone solo: estado, fecha, tasador, valor, link al detalle).

Resultado: redirige al detalle live + muestra "Documento auténtico ✔" o "No coincide con ningún informe emitido ✘".

## 5. Trazabilidad blockchain (módulo opcional, lo dejo preparado)

Tres opciones, ordenadas por costo/fricción:

1. **OpenTimestamps (Bitcoin) — recomendada para empezar**
   - Edge function `anchor-tasacion` toma `pdf_sha256`, llama a `https://a.pool.opentimestamps.org/digest`, recibe un `.ots` (proof) y lo guarda en `blockchain_anchor.ots_proof` + `blockchain_anchor.network = 'bitcoin'`.
   - Costo: 0. Confirmación: minutos para attestation, 1-6 h para upgrade a Bitcoin block.
   - El validador muestra "Anclado en Bitcoin · bloque #xxx · timestamp xxx" y un botón "Verificar prueba" (verificación local con `javascript-opentimestamps`).
   - Ventaja: sin cuentas, sin gas, sin privadas. Lo más razonable para un MVP de notarización.

2. **EVM (Polygon/Base) con contrato `Notary`**
   - Contrato mínimo: `mapping(bytes32 => uint256) public anchored;` con `function notarize(bytes32 hash) external { anchored[hash] = block.timestamp; emit Anchored(hash, msg.sender, block.timestamp); }`.
   - Edge function firma con una wallet de servicio (clave en secret) y llama al contrato.
   - Costo: ~0.001 USD por tasación en Polygon. Necesita custodiar una privada y MATIC.
   - Mejor si quieren UX "ver en Polygonscan" + smart contracts futuros (NFT del informe, royalties, etc).

3. **Cardano / Algorand metadata transactions**
   - Costos estables (~0.17 ADA), buen storytelling LATAM. Más fricción de tooling.

Recomendación: implemento ahora la **estructura** (campo `blockchain_anchor`, badge "Sin anclar / Anclado en {network}", función edge stub `anchor-tasacion` que retorna 501) y dejamos OpenTimestamps lista para activar con una decisión tuya. No agrego dependencias EVM ni privadas hasta que confirmes.

## 6. Archivos que tocaré

Nuevos:
- `supabase/migrations/...` — tabla + RLS + función `find_tasacion_by_hash`.
- `supabase/functions/anchor-tasacion/index.ts` — stub para futura activación blockchain.
- `src/lib/tasacionHash.ts` — `sha256` de Blob/JSON canónico.
- `src/lib/tasacionPublish.ts` — orquesta upload + insert + QR + re-PDF con QR.
- `src/components/property/TasacionQRPanel.tsx` — UI de publicación, QR, hash.
- `src/pages/TasacionLive.tsx` — `/tasacion/v/:id`.
- `src/pages/TasacionValidator.tsx` — `/tasacion/validar`.

Modificados:
- `src/lib/tasacionPdfGenerator.ts` — recibe `qrDataUrl`, `validatorUrl`, `pdfHashShort` y los pinta en portada + firma.
- `src/components/property/TasacionTeno.tsx` — nuevo botón "Publicar".
- `src/App.tsx` — rutas nuevas.

## 7. Dependencia nueva

`qrcode` (~50 KB, MIT). Usada para generar dataURL PNG y string SVG.

## 8. Lo que dejo fuera de este pase

- Notificaciones por email del comprador/vendedor cuando se publica.
- Pago para "premium verification".
- NFT del informe (depende de capa 3 opción 2).
- Multi-firmante (notario + tasador). Hoy una firma.

Procedo con capas 1, 2, 3 (live), 4 (validador) y la estructura preparada para la 5. ¿Avanzo con OpenTimestamps como red por defecto cuando llegue el momento de activar el anclaje, o prefieres EVM/Polygon?

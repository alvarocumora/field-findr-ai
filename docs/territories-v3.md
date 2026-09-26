# Territories V3 — Chile administrative hierarchy

OfertaTerrenos uses `chilean-territorial-divisions@1.0.1` as the local build-time
administrative dataset for Chile.

Source repository: `hsvchcl/chilean-territorial-divisions` (MIT).

The package provides:

- 16 regions
- 56 provinces
- 346 communes
- ISO 3166-2 codes for regions
- CUT (Código Único Territorial) codes for communes

The application wraps the package in `src/lib/territories.ts`. UI modules must
use that wrapper rather than importing the package directly. This keeps aliases
such as `Maule` / `Región del Maule` compatible with historical project data.

## Canonical project geography

Current database columns remain backwards-compatible:

- `country = Chile`
- `region = Maule` (canonical short name)
- `city = Licantén` (canonical commune name)

Derived metadata is resolved at runtime:

- official region: Región del Maule
- ISO: CL-ML
- province: Curicó
- commune: Licantén
- CUT: 07303

Hualañé resolves to CUT `07302`, also in Provincia de Curicó.

## UI flow

Atlas:

`Chile → Región → Comuna → Proyecto → Parcela`

Project creation/edit:

`Región → Comuna` cascading selectors, with province/CUT displayed as
read-only administrative context.

## Future database migration

A later migration can persist `region_iso`, `province_name` and
`commune_code` on projects. V3 deliberately derives these values first so
existing projects continue working without a destructive migration.

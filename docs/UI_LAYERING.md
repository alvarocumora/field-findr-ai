# UI Layering Contract

Single source of truth for z-index, safe areas, and floating stacks across the app.
**Never** use ad-hoc values like `z-[123]`, `z-50`, or `bottom-6`. Use the semantic tokens below.

## Z-index scale

Defined once as CSS vars in `src/index.css` and exposed as Tailwind classes via `tailwind.config.ts`.

| Class            | Var              | Value | Purpose                                        |
| ---------------- | ---------------- | ----- | ---------------------------------------------- |
| `z-base`         | `--z-base`       | 0     | Default flow                                    |
| `z-content`      | `--z-content`    | 10    | Card hover states, in-flow highlights           |
| `z-map-overlay`  | `--z-map-overlay`| 20    | Chips/legends/controls INSIDE a map container   |
| `z-sticky`       | `--z-sticky`     | 30    | In-page sticky bars (filter summaries, tabs)    |
| `z-header`       | `--z-header`     | 40    | Global fixed app header (`StickyHeader`)        |
| `z-fab`          | `--z-fab`        | 45    | Floating action buttons + `CompareFloatingBar`  |
| `z-overlay`      | `--z-overlay`    | 50    | Full-viewport overlays (AI search, transitions) |
| `z-modal`        | `--z-modal`      | 60    | Dialog, Sheet, dropdown menus, cinematic 3D     |
| `z-toast`        | `--z-toast`      | 70    | Toasts, sonner                                  |
| `z-tour`         | `--z-tour`       | 80    | Onboarding tour spotlight                       |

## Safe-area & stacking utilities

Defined in the `@layer utilities` block of `src/index.css`.

| Class                | Effect                                                                      |
| -------------------- | --------------------------------------------------------------------------- |
| `pb-safe` / `pt-safe`| Respect iOS `env(safe-area-inset-*)` for padding                            |
| `bottom-safe`        | `bottom` that clears iOS home indicator                                     |
| `bottom-safe-nav`    | Above mobile bottom nav (uses `--bottom-nav-h`, set when nav is mounted)    |
| `bottom-safe-compare`| Above nav AND `CompareFloatingBar` (uses `--compare-bar-h`)                 |
| `top-header`         | `top: var(--header-h)`. Use for anything anchored below the global header   |
| `pt-header`          | `padding-top: var(--header-h)` — for full-page split-views                  |

## FAB stacking order (bottom → top)

```
┌────────────────────────────────────┐
│  ScrollToTop / minor FABs          │  bottom-safe-nav
│  ┌──────────────────────────────┐  │
│  │  CompareFloatingBar (--h)    │  │  bottom-safe-nav, z-fab
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Modo Swipe / primary FAB    │  │  bottom-safe-compare, z-fab
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

## Rules

1. Only 3 things may set a hardcoded z-index: shadcn `Dialog` / `Sheet` / `Popover` primitives (Radix defaults). All app-level components must use the tokens above.
2. `CompareFloatingBar` publishes `--compare-bar-h` on `<html>` while mounted. Any secondary FAB that could collide MUST use `bottom-safe-compare`.
3. Any fixed element anchored below the global header uses `top-header`, never `top-16` / `top-14`.
4. Map controls stay INSIDE map containers with `z-map-overlay`. Do not lift them to `z-fab`.
5. Full-screen backdrops (search overlays, cinematic transitions) use `z-overlay`. Modals sit above at `z-modal`.

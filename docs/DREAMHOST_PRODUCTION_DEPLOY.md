# DreamHost Production Deploy — OfertaTerrenos

## Objetivo

Hacer que cada merge validado a `main` pueda llegar a `https://ofertaterrenos.com` de forma reproducible, auditable y con health checks.

## Arquitectura

```text
PR
  → GitHub Actions CI
    → typecheck
    → tests
    → production build
    → artifact dist

merge main
  → Deploy DreamHost (push a main o workflow_dispatch)
    → build
    → SSH/rsync
    → backup de archivos reemplazados
    → health checks
    → verificación version.json
```

## 1. Configuración Apache / SPA

`public/.htaccess` se copia automáticamente a `dist/.htaccess` durante el build de Vite.

Reglas:

- archivos y directorios reales se sirven normalmente;
- cualquier otra URL cae a `index.html`;
- esto permite refrescar directamente rutas de React Router como `/planes-loteos`, `/contacto-loteos`, `/explorar`, `/p/:slug`, etc.;
- `index.html` y service worker no se cachean agresivamente;
- assets versionados pueden usar cache largo.

## 2. GitHub Actions CI

Workflow: `.github/workflows/ci.yml`.

Corre en PR hacia `main` y push a `main`:

```bash
npm install --no-audit --no-fund
npx tsc --noEmit
npm test
npm run build
```

También valida que `dist/.htaccess` exista y que las rutas comerciales críticas estén en el sitemap.

### Nota temporal sobre package-lock

Al crear este sprint se detectó drift entre `package.json` y `package-lock.json` para `jspdf`: `package.json` fija 4.2.1 mientras el lock raíz todavía declara ^4.1.0. Por eso el workflow usa temporalmente `npm install` en vez de `npm ci`.

Cuando el lockfile quede sincronizado, cambiar ambos workflows a `npm ci`.

## 3. Configurar GitHub para DreamHost

En GitHub → Settings → Environments → **production** → Environment secrets.

### Secrets requeridos (environment `production`)

- `DREAMHOST_HOST`: hostname SSH de DreamHost (por ejemplo `iad1-shared-xxxx.dreamhost.com`, **no** el dominio).
- `DREAMHOST_USER`: usuario SSH del sitio (usuario shell, no el de FTP web).
- `DREAMHOST_PATH`: ruta absoluta del document root, por ejemplo `/home/usuario/ofertaterrenos.com`.
- `DREAMHOST_SSH_KEY`: llave privada SSH completa, incluyendo las líneas `-----BEGIN ...-----` y `-----END ...-----` y el salto de línea final.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_MAPBOX_TOKEN`.

El job corre con `environment: production`, así que los secrets deben estar en ese environment
(los repository secrets también funcionan, pero conviene mantenerlos en un solo lugar).

No existe ninguna variable de habilitación: el deploy corre en cada push a `main` y con
`workflow_dispatch`. El workflow valida los secrets antes de tocar SSH y falla con un mensaje
explícito si falta alguno o si la llave está truncada.

## 4. Llave SSH recomendada

Generar una llave exclusiva para GitHub Actions, no reutilizar una llave personal.

Ejemplo local:

```bash
ssh-keygen -t ed25519 -C "github-actions-ofertaterrenos" -f ofertaterrenos_deploy -N ""
```

- contenido completo de `ofertaterrenos_deploy` → secret `DREAMHOST_SSH_KEY`;
- contenido de `ofertaterrenos_deploy.pub` → agregar a `~/.ssh/authorized_keys` del usuario DreamHost:

```bash
ssh USUARIO@HOST "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys" < ofertaterrenos_deploy.pub
ssh USUARIO@HOST "chmod 600 ~/.ssh/authorized_keys"
```

Verificación local antes de correr el workflow:

```bash
ssh -i ofertaterrenos_deploy -o BatchMode=yes USUARIO@HOST 'echo ssh-ok && pwd'
```

El paso `Configure SSH` del workflow repite esa misma prueba y aborta con un error claro si la
llave pública no está autorizada.

Nunca subir ninguna llave al repositorio.


## 5. Deploy

El workflow usa `rsync` sobre SSH.

Antes de reemplazar/eliminar archivos, rsync conserva los anteriores en:

```text
DREAMHOST_PATH/.deploy-backups/<commit-sha>/
```

El directorio de backups se excluye de `--delete`.

## 6. Release identificable

Cada deploy genera:

```text
/version.json
```

con:

- commit SHA;
- GitHub Actions run id;
- fecha UTC del deploy.

Esto permite verificar si el dominio está ejecutando el último `main`.

## 7. Health checks post-deploy

El deploy falla si no responden correctamente:

- `/`
- `/planes-loteos`
- `/contacto-loteos`
- `/explorar`
- `/version.json`

Luego comprueba que `/version.json` contenga exactamente el SHA desplegado.

## 8. Rollback

Los archivos reemplazados por cada release quedan en `.deploy-backups/<sha>`.

El rollback es deliberadamente manual en Sprint 0 para evitar automatizar una restauración destructiva sin conocer todavía la estructura exacta del hosting.

Procedimiento:

1. identificar el SHA anterior sano;
2. conectarse por SSH;
3. revisar `.deploy-backups/<sha>`;
4. restaurar los archivos requeridos;
5. volver a ejecutar health checks.

Cuando tengamos validada la ruta exacta de DreamHost, el siguiente incremento puede implementar releases atómicos por directorio + symlink.

## 9. Supabase

El deploy del frontend no aplica migraciones automáticamente.

Antes de publicar features que dependan de DB:

```bash
npx supabase db push
```

Las Edge Functions deben desplegarse de forma explícita cuando cambien. No mezclar migraciones automáticas de producción con el primer Sprint 0 de hosting.

## 10. Activación inicial

Antes del primer deploy:

- confirmar host SSH;
- confirmar usuario;
- confirmar `DREAMHOST_PATH`;
- probar login SSH con la llave de deploy;
- verificar que el usuario puede escribir en el document root;
- respaldar el sitio actual;
- confirmar que el dominio apunta a ese document root.

Después:

1. cargar los cuatro secrets `DREAMHOST_*` en el environment `production`;
2. ejecutar `Deploy DreamHost` manualmente con `workflow_dispatch`;

3. revisar health checks;
4. probar refresh directo en `/planes-loteos` y `/contacto-loteos`;
5. confirmar `/version.json`.

## Definition of Done Sprint 0

- CI bloquea código que no typecheckea, testea o compila.
- `.htaccess` viaja dentro del build.
- rutas SPA funcionan con refresh directo en Apache.
- deploy queda automatizado pero gated por variable.
- producción expone commit desplegado.
- health checks verifican rutas comerciales.
- credenciales no viven en Git.

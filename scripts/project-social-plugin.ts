import type { Plugin } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { canonicalPathForSlug, isPublicSlug } from '../src/lib/landing/paths';
import { projectSocial, renderProjectHtml, type SocialProject, type SocialLot } from '../src/lib/landing/projectSocial';

type PublishedProject = SocialProject & { status: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Anonymous reads only: never supply a service-role key to this build. */
export function projectSocialPlugin(apiUrl: string, publishableKey: string): Plugin {
  let outDir: string;
  return {
    name: 'project-social-html',
    apply: 'build',
    enforce: 'post',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir); },
    async closeBundle() {
      const headers = { apikey: publishableKey, Authorization: `Bearer ${publishableKey}`, 'Content-Type': 'application/json' };
      const request = async (path: string, body?: object) => {
        const response = await fetch(`${apiUrl}/rest/v1/${path}`, {
          headers, method: body ? 'POST' : 'GET', body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) throw new Error(`Public project preview request failed (${response.status})`);
        return response.json();
      };
      // Complete pagination; a project disappearing from the public API is not exported.
      const projects: PublishedProject[] = [];
      for (let offset = 0; ; offset += 100) {
        const page = await request(`projects?select=id,slug,name,city,location,region,images,landing_config,status&status=eq.active&order=id&limit=100&offset=${offset}`);
        if (!Array.isArray(page)) throw new Error('Invalid public projects response');
        projects.push(...page);
        if (page.length < 100) break;
      }
      const template = await readFile(resolve(outDir, 'index.html'), 'utf8');
      const paths = new Set<string>();
      let exportedProjects = 0;
      for (const project of projects) {
        if (project.status !== 'active' || !uuid.test(project.id)) continue;
        exportedProjects++;
        const lots = await request('rpc/get_public_lots', { p_project_id: project.id }) as SocialLot[];
        if (!Array.isArray(lots)) throw new Error('Invalid public inventory response');
        const html = renderProjectHtml(template, projectSocial(project, lots));
        const routes = [`/proyecto/${project.id}`];
        if (isPublicSlug(project.slug)) routes.push(`/p/${project.slug}`, canonicalPathForSlug(project.slug));
        for (const route of new Set(routes)) {
          if (paths.has(route)) throw new Error(`Duplicate project preview route: ${route}`);
          paths.add(route);
          const target = resolve(outDir, `.${route}`, 'index.html');
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, html);
        }
      }
      // Valle de Hualañé is a bespoke public landing and must have crawler-
      // readable metadata even when the project row is not yet public in DB.
      // WhatsApp/Facebook do not execute the SPA, so these static HTML files
      // are the source of truth for the share card.
      const valleImage = 'https://ofertaterrenos.com/social/valle-hualane-og.jpg';
      const writeSocialRoute = async (
        route: string,
        social: { title: string; description: string; url: string; image: string },
      ) => {
        paths.add(route);
        const target = resolve(outDir, `.${route}`, 'index.html');
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, renderProjectHtml(template, social));
      };

      const valleMain = {
        title: 'Valle de Hualañé',
        description: 'Parcelas de 1 hectárea en Sector Caone, Hualañé. Desde $19.990.000; con kit casa mediterránea $23.990.000. Crédito directo.',
        url: 'https://ofertaterrenos.com/valle-hualane',
        image: valleImage,
      };
      await writeSocialRoute('/valle-hualane', valleMain);
      await writeSocialRoute('/parcelas-caone-hualane', valleMain);

      const valleTour = {
        title: 'Valle de Hualañé · Tour 3D',
        description: 'Explora el proyecto sobre imagen satelital 3D y revisa cada parcela del ROL 168-921.',
        url: 'https://ofertaterrenos.com/valle-hualane/tour',
        image: valleImage,
      };
      await writeSocialRoute('/valle-hualane/tour', valleTour);
      await writeSocialRoute('/parcelas-caone-hualane/tour', valleTour);

      const vallePlan = {
        title: 'Valle de Hualañé · Masterplan',
        description: 'Masterplan ROL 168-921 generado desde la geometría KMZ del proyecto. Parcelas, superficies y servidumbres.',
        url: 'https://ofertaterrenos.com/valle-hualane/plano',
        image: valleImage,
      };
      await writeSocialRoute('/valle-hualane/plano', vallePlan);
      await writeSocialRoute('/valle-de-hualane/masterplan', vallePlan);

      for (let lot = 1; lot <= 40; lot++) {
        await writeSocialRoute(`/valle-hualane/l/${lot}`, {
          title: `Valle de Hualañé · Lote ${lot}`,
          description: `Revisa el Lote ${lot} en el tour 3D de Valle de Hualañé y consulta superficie, precio y disponibilidad.`,
          url: `https://ofertaterrenos.com/valle-hualane/l/${lot}`,
          image: valleImage,
        });
      }

      await writeFile(resolve(outDir, 'project-previews.json'), JSON.stringify({
        generatedAt: new Date().toISOString(), projects: exportedProjects, routes: [...paths],
      }, null, 2));
      console.log(`Project social HTML: ${exportedProjects} public projects, ${paths.size} routes`);
    },
  };
}

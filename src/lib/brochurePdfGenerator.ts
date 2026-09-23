import { generateProjectDossierPdf, type KitProject, type KitLot } from '@/lib/pdf/projectKit';
import { parseLandingConfig } from '@/lib/landing/config';

export interface BrochureAIContent {
  headline: string;
  elevatorPitch: string;
  pillars: Array<{ title: string; text: string }>;
  investmentProjection: string;
  technicalSpecs: Array<{ label: string; value: string }>;
  ctaVisit: string;
  ctaMasterPlan: string;
}

interface BrochureData {
  project: KitProject & { city?: string | null; landing_config?: unknown };
  lots: KitLot[];
  conditions: KitProject['conditions'];
  aiContent?: BrochureAIContent;
}

/** Basic and AI brochures use the same visual engine as the public project kit. */
export const generateProjectBrochurePDF = ({ project, lots, conditions, aiContent }: BrochureData) => {
  const cfg = parseLandingConfig(project.landing_config);
  return generateProjectDossierPdf({
    ...project,
    location: project.city || project.location,
    conditions,
    images: [cfg.hero.image, ...cfg.gallery, ...(project.images ?? [])].filter((src): src is string => Boolean(src)),
    highlights: cfg.highlights,
    contact: project.contact ?? cfg.contact,
  }, lots, {
    editorial: aiContent ? {
      headline: aiContent.headline,
      pitch: aiContent.elevatorPitch,
      sections: aiContent.pillars,
      projection: aiContent.investmentProjection,
      specs: aiContent.technicalSpecs,
    } : undefined,
  });
};

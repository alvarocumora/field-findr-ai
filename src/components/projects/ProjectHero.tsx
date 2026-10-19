import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShareButtons } from '@/components/social/ShareButtons';
import { projectSocial } from '@/lib/landing/projectSocial';
import {
  MapPin, Phone, MessageCircle, ArrowLeft, DollarSign, Maximize2, TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ProjectHeroProps {
  project: any;
  lots: any[];
  inventoryReady?: boolean;
  availableLots: any[];
  reservedLots: any[];
  soldLots: any[];
  priceRange: { min: number; max: number } | null;
  areaRange: { min: number; max: number } | null;
  isMobile: boolean;
  onCall: () => void;
  onMessage: () => void;
}

const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  }).format(price);
};

const formatArea = (area: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(area);

const GlassCard = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) => (
  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3">
    <div className="flex items-center gap-2 mb-1">
      <span className={accent}>{icon}</span>
      <span className="text-[11px] text-white/50 uppercase tracking-wider">{label}</span>
    </div>
    <p className={`text-sm font-bold ${accent}`}>{value}</p>
  </div>
);

export const ProjectHero = ({
  project, lots, availableLots, reservedLots, soldLots, inventoryReady = true,
  priceRange, areaRange, isMobile, onCall, onMessage,
}: ProjectHeroProps) => {
  const heroImage = (project as any)?.images?.[0];
  const social = projectSocial(project, inventoryReady ? lots : undefined);
  const totalLots = lots.length;
  const soldPercent = totalLots > 0 ? Math.round((soldLots.length / totalLots) * 100) : 0;
  const reservedPercent = totalLots > 0 ? Math.round((reservedLots.length / totalLots) * 100) : 0;

  return (
    <div className="relative overflow-hidden">
      {/* Background Image */}
      {heroImage ? (
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={project.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-background to-emerald-900/50" />
      )}

      <div className="relative z-10 container px-4">
        {/* Back nav */}
        <div className="pt-4 pb-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pb-8 pt-4"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="font-editorial text-3xl md:text-4xl lg:text-5xl font-medium text-white tracking-tight">
                {project.name}
              </h1>
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{project.city}, {project.region}</span>
              </div>
              {project.description && (
                <p className="text-white/60 text-sm max-w-2xl leading-relaxed line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>

            {/* Contact buttons - desktop */}
            {!isMobile && (
              <div className="flex gap-2 shrink-0">
                <ShareButtons
                  title={project.name}
                  description={social.description}
                  url={social.url}
                />
                <Button
                  size="sm"
                  className="gap-2 bg-white text-black hover:bg-white/90 rounded-xl"
                  onClick={onCall}
                >
                  <Phone className="h-4 w-4" />
                  Llamar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 border-white/30 text-white hover:bg-white/10 rounded-xl"
                  onClick={onMessage}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            )}
          </div>

          {/* Glassmorphism stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <GlassCard
              icon={<MapPin className="h-4 w-4" />}
              label="Disponibles"
              value={availableLots.length.toString()}
              accent="text-emerald-400"
            />
            <GlassCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Desde"
              value={priceRange ? formatPrice(priceRange.min) : 'Consultar'}
              accent="text-white"
            />
            <GlassCard
              icon={<Maximize2 className="h-4 w-4" />}
              label="Superficie"
              value={areaRange ? `${formatArea(areaRange.min)}–${formatArea(areaRange.max)} m²` : '—'}
              accent="text-white/90"
            />
            <GlassCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Total Lotes"
              value={totalLots.toString()}
              accent="text-white/90"
            />
          </div>

          {/* Sales progress bar */}
          {totalLots > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span>Progreso de ventas</span>
                <span>{soldPercent + reservedPercent}% comprometido</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden flex backdrop-blur-sm">
                <div
                  className="bg-emerald-500 transition-all duration-700"
                  style={{ width: `${soldPercent}%` }}
                />
                <div
                  className="bg-amber-500 transition-all duration-700"
                  style={{ width: `${reservedPercent}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-[11px] text-white/50">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {soldLots.length} vendidos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  {reservedLots.length} reservados
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  {availableLots.length} disponibles
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

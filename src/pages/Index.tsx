import { lazy, Suspense } from 'react';
import PublicLayout from '@/components/layouts/PublicLayout';
import HowItWorks from '@/components/landing/HowItWorks';
import TrustBadges from '@/components/landing/TrustBadges';
import FloatingCTA from '@/components/landing/FloatingCTA';
import LogoCloud from '@/components/landing/LogoCloud';
import TestimonialMarquee from '@/components/landing/TestimonialMarquee';
import CountrySelector from '@/components/landing/CountrySelector';
import ConversationalSearch from '@/components/explore/ConversationalSearch';

const CartographicHero = lazy(() => import('@/components/landing/CartographicHero'));
const ScrollytellingSection = lazy(() => import('@/components/landing/ScrollytellingSection'));

const LazyFallback = () => (
  <div className="h-screen flex items-center justify-center bg-background">
    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
  </div>
);

const Index = () => {
  return (
    <PublicLayout showFooter={true}>
      {/* ===== 3D GLOBE HERO — Scroll-driven zoom to Chile ===== */}
      <Suspense fallback={<LazyFallback />}>
        <CartographicHero />
      </Suspense>

      {/* ===== LOGO CLOUD ===== */}
      <LogoCloud />

      {/* ===== SCROLLYTELLING PROJECTS ===== */}
      <Suspense fallback={null}>
        <ScrollytellingSection />
      </Suspense>

      {/* ===== Section divider ===== */}
      <div className="container px-4">
        <div className="divider-cartographic">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
            Cómo funciona
          </span>
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <HowItWorks />

      {/* ===== TESTIMONIALS ===== */}
      <TestimonialMarquee />

      {/* ===== COUNTRIES ===== */}
      <CountrySelector />

      {/* ===== TRUST ===== */}
      <TrustBadges />

      {/* ===== FLOATING CTA ===== */}
      <FloatingCTA />
    </PublicLayout>
  );
};

export default Index;

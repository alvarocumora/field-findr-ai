import { lazy, Suspense } from 'react';
import PublicLayout from '@/components/layouts/PublicLayout';
import FloatingCTA from '@/components/landing/FloatingCTA';
import TestimonialMarquee from '@/components/landing/TestimonialMarquee';
import TrustBadges from '@/components/landing/TrustBadges';
import ValueProposition from '@/components/landing/ValueProposition';
import InvestmentShowcase from '@/components/landing/InvestmentShowcase';
import AgentCTA from '@/components/landing/AgentCTA';
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
      {/* ===== HERO — Globe zoom to Chile ===== */}
      <Suspense fallback={<LazyFallback />}>
        <CartographicHero />
      </Suspense>

      {/* ===== AI CONVERSATIONAL SEARCH ===== */}
      <section className="container px-4 -mt-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          <ConversationalSearch className="bg-card rounded-2xl shadow-xl p-6 border" />
        </div>
      </section>

      {/* ===== SCROLLYTELLING PROJECTS ===== */}
      <Suspense fallback={null}>
        <ScrollytellingSection />
      </Suspense>

      {/* ===== VALUE PROPOSITION — 3 audiences ===== */}
      <ValueProposition />

      {/* ===== INVESTMENT SHOWCASE — KPIs ===== */}
      <InvestmentShowcase />

      {/* ===== AGENT CTA — Broker lead-gen ===== */}
      <AgentCTA />

      {/* ===== TESTIMONIALS ===== */}
      <TestimonialMarquee />

      {/* ===== TRUST ===== */}
      <TrustBadges />

      {/* ===== FLOATING CTA ===== */}
      <FloatingCTA />
    </PublicLayout>
  );
};

export default Index;

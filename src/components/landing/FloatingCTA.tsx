import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLandingStats } from '@/hooks/useLandingStats';

const FloatingCTA = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const { data: stats } = useLandingStats();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.5);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const lotsCount = stats?.totalLots ?? 0; // Now filtered by status='available'

  return (
    <div
      style={{ zIndex: 'var(--z-fab)' }}
      aria-hidden={!isVisible}
      inert={!isVisible ? '' : undefined}
      className={`fixed bottom-safe-nav left-1/2 -translate-x-1/2 transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <div className="glass-strong rounded-full px-2 py-2 flex items-center gap-2 shadow-2xl border border-primary/20">
        {lotsCount > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-4">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-sm text-muted-foreground">{lotsCount} lotes disponibles</span>
          </div>
        )}
        <Button
          onClick={() => navigate('/explorar')}
          aria-label="Explorar terrenos disponibles ahora"
          className="rounded-full h-12 px-6 btn-glow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
          Explorar ahora
          <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};

export default FloatingCTA;

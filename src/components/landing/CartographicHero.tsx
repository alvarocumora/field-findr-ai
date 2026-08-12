import { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, useScroll, useTransform, useReducedMotion, MotionValue } from 'framer-motion';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useLandingStats } from '@/hooks/useLandingStats';
import { Button } from '@/components/ui/button';
import { ArrowRight, Compass } from 'lucide-react';

const CHILE_CENTER: [number, number] = [-70.6693, -33.4489];

/* ─── Hero Content overlay ─── */
const HeroContent = ({
  prefersReducedMotion,
  titleY,
  coordOpacity,
  coordY,
}: {
  prefersReducedMotion: boolean | null;
  titleY: MotionValue<string>;
  coordOpacity: MotionValue<number>;
  coordY: MotionValue<string>;
}) => {
  const { data: stats } = useLandingStats();

  // Fallback cualitativo cuando el número es débil (evita mostrar "1 región")
  const q = (n: number, min: number, weak: string, format: (v: number) => string) =>
    n >= min ? format(n) : weak;

  const metrics = [
    {
      value: q(stats?.totalListings ?? 0, 10, 'Catálogo en crecimiento', (v) => `+${v.toLocaleString()}`),
      label: 'Terrenos publicados',
    },
    {
      value: q(stats?.totalRegions ?? 0, 3, 'LATAM', (v) => `${v}`),
      label: 'Regiones activas',
    },
    {
      value: q(stats?.totalHectares ?? 0, 100, 'Mapeo activo', (v) => `${v.toLocaleString()} ha`),
      label: 'Hectáreas mapeadas',
    },
  ];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-4">
      <motion.div
        className="text-center max-w-4xl"
        style={prefersReducedMotion ? {} : { y: titleY }}
      >
        <motion.p
          className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.4em] text-primary/70 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Inteligencia Territorial para Invertir con Certeza
        </motion.p>

        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tight leading-[0.9] text-foreground"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' as const }}
        >
          <span className="block">OFERTA</span>
          <span className="block gradient-text-hero">TERRENOS</span>
        </motion.h1>

        <motion.p
          className="mt-6 max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
        >
          El marketplace inteligente para terrenos rurales, industriales y de inversión en LATAM.
          Datos verificados, análisis IA y contacto directo con corredores.
        </motion.p>

        {/* Animated metrics */}
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {metrics.map((m) => (
            <div key={m.label} className="text-center min-w-[110px]">
              <p className="text-base sm:text-xl md:text-2xl font-heading font-bold text-foreground">{m.value}</p>
              <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1">{m.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Coordinates */}
        <motion.div
          className="mt-6 font-mono text-[10px] sm:text-xs text-muted-foreground tracking-[0.2em]"
          style={prefersReducedMotion ? {} : { opacity: coordOpacity, y: coordY }}
        >
          <span className="text-primary">−33.4489° S</span>
          <span className="mx-3 text-border">|</span>
          <span className="text-primary">−70.6693° W</span>
          <span className="mx-3 text-border">|</span>
          <span>Santiago, Chile</span>
        </motion.div>

        {/* Triple CTA */}
        <motion.div
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <Button asChild size="lg" className="btn-glow text-base px-8">
            <Link to="/explorar">
              <Compass className="h-4 w-4 mr-2" />
              Explorar Terrenos
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="border-border/50 backdrop-blur-sm bg-background/30">
            <Link to="/oportunidades">
              Ver Oportunidades
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button variant="ghost" asChild size="lg" className="text-muted-foreground hover:text-foreground">
            <Link to="/pricing">Soy Corredor</Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

/* ─── Main Component ─── */
const CartographicHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const progressRef = useRef(0);
  const easedRef = useRef(0);
  const spinRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const { token, loading: tokenLoading } = useMapboxToken();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.55, 0.95], [1, 1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], ['0%', '-22%']);
  const coordOpacity = useTransform(scrollYProgress, [0.25, 0.55], [0, 1]);
  const coordY = useTransform(scrollYProgress, [0.25, 0.55], ['16px', '0px']);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    if (!mapContainerRef.current || !token || tokenLoading) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-30, 20],
      zoom: 1.5,
      projection: 'globe',
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
    });
    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(8, 12, 18)',
        'high-color': 'rgb(20, 30, 45)',
        'horizon-blend': 0.08,
        'space-color': 'rgb(5, 5, 12)',
        'star-intensity': 0.6,
      });
      setMapReady(true);
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [token, tokenLoading]);

  // Track scroll into a ref only — never drive the camera directly (avoids jitter).
  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => { progressRef.current = v; });
    return () => unsub();
  }, [scrollYProgress]);

  // Single damped rAF loop: idle spin + scroll-driven camera in one place.
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    if (prefersReducedMotion) {
      map.jumpTo({ center: CHILE_CENTER, zoom: isMobile ? 3.2 : 3.8, pitch: 0, bearing: 0 });
      return;
    }

    let frame = 0;
    const maxZoom = isMobile ? 7.5 : 9.5;
    const tick = () => {
      const target = progressRef.current;
      // critically-damped follow → no stutter between scroll events
      easedRef.current += (target - easedRef.current) * 0.12;
      const t = easedRef.current;
      if (t < 0.015) spinRef.current += 0.02;

      const e = t * t * (3 - 2 * t); // smoothstep
      map.jumpTo({
        center: [-30 + e * (CHILE_CENTER[0] + 30), 20 + e * (CHILE_CENTER[1] - 20)],
        zoom: 1.5 + e * (maxZoom - 1.5),
        pitch: e * (isMobile ? 30 : 45),
        bearing: spinRef.current * (1 - e) + e * -12,
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mapReady, prefersReducedMotion, isMobile]);

  return (
    <section ref={containerRef} className="relative h-[180vh] md:h-[240vh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-background">
        <motion.div className="absolute inset-0" style={{ opacity }}>
          <div ref={mapContainerRef} className="w-full h-full" />
          {(!mapReady || tokenLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
          )}
        </motion.div>

        {/* Vignette overlays */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_25%,hsl(var(--background))_88%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-40 md:h-48 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/50 to-transparent pointer-events-none" />

        <HeroContent
          prefersReducedMotion={prefersReducedMotion}
          titleY={titleY}
          coordOpacity={coordOpacity}
          coordY={coordY}
        />

        {/* Scroll indicator — desktop only (evita choque con los CTA en móvil) */}
        <motion.div
          className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-3 z-10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-muted-foreground">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-primary/60 to-transparent" />
        </motion.div>

        <motion.div className="absolute bottom-0 left-0 h-px bg-primary/40 z-20" style={{ width: progressWidth }} />
      </div>
    </section>
  );
};

export default CartographicHero;

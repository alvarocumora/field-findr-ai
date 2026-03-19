import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useMapboxToken } from '@/hooks/useMapboxToken';

/* ─── Chile target coordinates ─── */
const CHILE_CENTER: [number, number] = [-70.6693, -33.4489];

const CartographicHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const { token, loading: tokenLoading } = useMapboxToken();
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.4, 0.9, 1], [1, 1, 0.6, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], ['0%', '-30%']);
  const coordOpacity = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);
  const coordY = useTransform(scrollYProgress, [0.3, 0.6], ['20px', '0px']);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // Scroll-driven camera animation
  const animateCamera = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const t = progressRef.current;

    // Zoom: 1.5 (orbital) → 6 (Chile country) → 10 (Santiago close)
    const zoom = 1.5 + t * t * 8.5;
    // Center: gradually shift to Chile
    const lng = -30 + t * (CHILE_CENTER[0] - (-30));
    const lat = 20 + t * (CHILE_CENTER[1] - 20);
    // Pitch: flat → 45° tilt
    const pitch = t * 45;
    // Bearing: slight rotation
    const bearing = t * -15;

    map.jumpTo({
      center: [lng, lat],
      zoom: Math.min(zoom, 10),
      pitch: Math.min(pitch, 50),
      bearing,
    });
  }, []);

  // Initialize Mapbox globe
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
      // Atmosphere / fog for the globe
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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token, tokenLoading]);

  // Link scroll progress to camera
  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => {
      progressRef.current = v;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(animateCamera);
    });
    return () => {
      unsub();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [scrollYProgress, animateCamera]);

  // Idle rotation when at top
  useEffect(() => {
    if (!mapReady || prefersReducedMotion) return;
    let frame: number;
    let bearing = 0;

    const spin = () => {
      if (progressRef.current < 0.02 && mapRef.current) {
        bearing += 0.03;
        mapRef.current.jumpTo({ bearing });
      }
      frame = requestAnimationFrame(spin);
    };

    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, [mapReady, prefersReducedMotion]);

  return (
    <section ref={containerRef} className="relative h-[250vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-background">
        {/* Mapbox globe canvas */}
        <motion.div className="absolute inset-0" style={{ opacity }}>
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Loading state */}
          {(!mapReady || tokenLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
          )}
        </motion.div>

        {/* Vignette overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,hsl(var(--background))_85%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/50 to-transparent" />

        {/* Typography overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <motion.div
            className="text-center"
            style={prefersReducedMotion ? {} : { y: titleY }}
          >
            <motion.p
              className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.4em] text-primary/70 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              Plataforma de Inversión en Terrenos
            </motion.p>

            <motion.h1
              className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-heading font-bold tracking-tight leading-[0.85] text-foreground"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            >
              <span className="block">OFERTA</span>
              <span className="block gradient-text-hero">TERRENOS</span>
            </motion.h1>

            <motion.div
              className="mt-8 font-mono text-xs sm:text-sm text-muted-foreground tracking-[0.2em]"
              style={prefersReducedMotion ? {} : { opacity: coordOpacity, y: coordY }}
            >
              <span className="text-primary">−33.4489° S</span>
              <span className="mx-3 text-border">|</span>
              <span className="text-primary">−70.6693° W</span>
              <span className="mx-3 text-border">|</span>
              <span>Santiago, Chile</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-muted-foreground">
            Scroll
          </span>
          <div className="w-px h-10 bg-gradient-to-b from-primary/60 to-transparent" />
        </motion.div>

        {/* Progress line */}
        <motion.div
          className="absolute bottom-0 left-0 h-px bg-primary/40 z-20"
          style={{ width: progressWidth }}
        />
      </div>
    </section>
  );
};

export default CartographicHero;

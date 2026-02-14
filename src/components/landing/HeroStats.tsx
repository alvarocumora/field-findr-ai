import { MapPin, Layers, Map, Mountain } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLandingStats } from '@/hooks/useLandingStats';
import { motion, useReducedMotion } from 'framer-motion';

const AnimatedCounter = ({
  value, suffix = '', prefix = '', duration = 2000,
}: {
  value: number; suffix?: string; prefix?: string; duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 },
    );
    const el = document.getElementById('stats-section');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || value === 0) return;
    const steps = 60;
    const increment = value / steps;
    const stepDuration = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, stepDuration);
    return () => clearInterval(timer);
  }, [isVisible, value, duration]);

  return <span>{prefix}{count.toLocaleString('es-CL')}{suffix}</span>;
};

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
} as const;
const item = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' as const } },
} as const;

const HeroStats = () => {
  const { data: stats } = useLandingStats();
  const prefersReducedMotion = useReducedMotion();

  const STATS = [
    { value: stats?.totalProjects ?? 0, suffix: '', label: 'Proyectos activos', icon: MapPin },
    { value: stats?.totalLots ?? 0, suffix: '', label: 'Lotes disponibles', icon: Layers },
    { value: stats?.totalRegions ?? 0, suffix: '', label: 'Regiones cubiertas', icon: Map },
    { value: stats?.totalHectares ?? 0, suffix: ' há', label: 'Hectáreas disponibles', icon: Mountain },
  ];

  return (
    <motion.div
      id="stats-section"
      className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto"
      variants={prefersReducedMotion ? {} : container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {STATS.map((stat) => (
        <motion.div
          key={stat.label}
          variants={prefersReducedMotion ? {} : item}
          whileHover={{ y: -4 }}
          className="group relative rounded-2xl p-4 md:p-6 text-center border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300"
        >
          <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
          <div className="text-xl md:text-3xl font-bold text-foreground">
            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default HeroStats;

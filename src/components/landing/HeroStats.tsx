import { MapPin, Layers, ShieldCheck, CalendarCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLandingStats } from '@/hooks/useLandingStats';

const AnimatedCounter = ({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
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

  return (
    <span>
      {prefix}{count}{suffix}
    </span>
  );
};

const HeroStats = () => {
  const { data: stats } = useLandingStats();

  const STATS = [
    { value: stats?.totalProjects ?? 0, suffix: '', label: 'Proyectos activos', icon: MapPin },
    { value: stats?.totalLots ?? 0, suffix: '', label: 'Lotes disponibles', icon: Layers },
    { value: stats?.totalReservations ?? 0, suffix: '', label: 'Reservas pagadas', icon: CalendarCheck },
    { value: 100, suffix: '%', label: 'Datos verificados', icon: ShieldCheck },
  ];

  return (
    <div id="stats-section" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
      {STATS.map((stat, index) => (
        <div
          key={stat.label}
          className="group relative glass rounded-2xl p-4 md:p-6 text-center card-hover border-gradient overflow-hidden"
          style={{ animationDelay: `${0.4 + index * 0.1}s` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity" />
            <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-primary mx-auto mb-2 relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="text-xl md:text-3xl font-bold text-foreground relative z-10">
            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
          </div>
          <div className="text-xs md:text-sm text-muted-foreground relative z-10">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HeroStats;

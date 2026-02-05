import { MapPin, Zap, TrendingUp, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

const STATS = [
  { value: 15000, suffix: '+', label: 'Terrenos', icon: MapPin },
  { value: 98, suffix: '%', label: 'Precisión IA', icon: Zap },
  { value: 2.5, suffix: 'B', prefix: '$', label: 'En ventas', icon: TrendingUp },
  { value: 100, suffix: '%', label: 'Verificados', icon: Shield },
];

const AnimatedCounter = ({ 
  value, 
  suffix = '', 
  prefix = '',
  duration = 2000 
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
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('stats-section');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const steps = 60;
    const increment = value / steps;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible, value, duration]);

  const displayValue = value >= 1000 
    ? (count / 1000).toFixed(count >= value ? 0 : 0) + 'K'
    : value < 10 
      ? count.toFixed(1)
      : count;

  return (
    <span>
      {prefix}{value >= 1000 ? `${Math.floor(count / 1000)}K` : value < 10 ? count.toFixed(1) : count}{suffix}
    </span>
  );
};

const HeroStats = () => {
  return (
    <div id="stats-section" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
      {STATS.map((stat, index) => (
        <div
          key={stat.label}
          className="group relative glass rounded-2xl p-4 md:p-6 text-center card-hover border-gradient overflow-hidden"
          style={{ animationDelay: `${0.4 + index * 0.1}s` }}
        >
          {/* Hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Icon with pulse */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity" />
            <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-primary mx-auto mb-2 relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          
          {/* Animated counter */}
          <div className="text-xl md:text-3xl font-bold text-foreground relative z-10">
            <AnimatedCounter 
              value={stat.value} 
              suffix={stat.suffix}
              prefix={stat.label === 'En ventas' ? '$' : ''}
            />
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

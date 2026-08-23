import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, Heart, Search, MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/explorar', icon: Compass, label: 'Explorar' },
  { path: '/favoritos', icon: Heart, label: 'Favoritos' },
  { path: '/explorar?search=true', icon: Search, label: 'Buscar', isCenter: true },
  { path: '/mi-terreno', icon: MapPin, label: 'Mi Terreno' },
  { path: '/perfil', icon: User, label: 'Perfil' },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Publish bottom-nav height so FABs can stack above it via .bottom-safe-nav
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) return;
    document.documentElement.style.setProperty('--bottom-nav-h', '4rem');
    return () => { document.documentElement.style.setProperty('--bottom-nav-h', '0rem'); };
  }, []);

  const handleNav = (item: typeof navItems[0]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    if (item.path.includes('?search=true')) {
      navigate('/explorar', { state: { openSearch: true } });
    } else {
      navigate(item.path);
    }
  };

  const isActive = (path: string) => {
    const cleanPath = path.split('?')[0];
    return location.pathname === cleanPath;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-bottom"
      style={{ zIndex: 'var(--z-header)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item)}
                className="relative -mt-6 flex flex-col items-center"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
                >
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </motion.div>
                <span className="text-[10px] mt-1 text-muted-foreground">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => handleNav(item)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 relative"
            >
              <motion.div whileTap={{ scale: 0.85 }}>
                <Icon className={cn(
                  "h-5 w-5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )} />
              </motion.div>
              <span className={cn(
                "text-[10px] transition-colors",
                active ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-6 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;

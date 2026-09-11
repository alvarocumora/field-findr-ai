import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Zap, WifiOff, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePWA } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

interface InstallPromptProps {
  variant?: 'banner' | 'modal' | 'inline';
  className?: string;
}

const InstallPrompt = ({ variant = 'banner', className }: InstallPromptProps) => {
  const { canInstall, promptInstall, isInstalled } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isEligible, setIsEligible] = useState(variant !== 'banner');

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedAt = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) setIsDismissed(true);
    }

    if (variant !== 'banner') return;

    const visits = Number(localStorage.getItem('pwa-eligible-visits') || '0') + 1;
    localStorage.setItem('pwa-eligible-visits', String(visits));

    // The install banner is a retention prompt, not a first-visit conversion surface.
    if (visits < 2) return;

    const timer = window.setTimeout(() => setIsEligible(true), 18000);
    return () => window.clearTimeout(timer);
  }, [variant]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    const installed = await promptInstall();
    setIsInstalling(false);
    if (installed) setIsDismissed(true);
  };

  if (!canInstall || isDismissed || isInstalled || !isEligible) return null;

  if (variant === 'inline') {
    return (
      <Card className={cn('p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20', className)}>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Instalar Ofertaterrenos</h3>
            <p className="text-xs text-muted-foreground">Accede más rápido desde tu pantalla de inicio</p>
          </div>
          <Button size="sm" onClick={handleInstall} disabled={isInstalling}>
            {isInstalling ? 'Instalando...' : 'Instalar'}
          </Button>
        </div>
      </Card>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <Card className={cn('relative max-w-md w-full p-6 animate-in zoom-in-95 duration-200', className)}>
          <button onClick={handleDismiss} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="text-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">Instala Ofertaterrenos</h2>
            <p className="text-muted-foreground text-sm">Obtén la experiencia completa instalando la app en tu dispositivo</p>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"><Zap className="h-5 w-5 text-primary" /><div><p className="font-medium text-sm">Acceso instantáneo</p><p className="text-xs text-muted-foreground">Abre directo desde tu pantalla de inicio</p></div></div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"><WifiOff className="h-5 w-5 text-primary" /><div><p className="font-medium text-sm">Modo offline</p><p className="text-xs text-muted-foreground">Accede a mapas y propiedades sin conexión</p></div></div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"><MapPin className="h-5 w-5 text-primary" /><div><p className="font-medium text-sm">Notificaciones</p><p className="text-xs text-muted-foreground">Recibe alertas de nuevos terrenos</p></div></div>
          </div>
          <div className="space-y-2">
            <Button className="w-full" size="lg" onClick={handleInstall} disabled={isInstalling}><Download className="h-4 w-4 mr-2" />{isInstalling ? 'Instalando...' : 'Instalar ahora'}</Button>
            <Button variant="ghost" className="w-full" onClick={handleDismiss}>Ahora no</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('fixed bottom-4 right-4 max-w-xs z-40 animate-in slide-in-from-bottom-4 duration-300', className)}>
      <Card className="relative p-3 bg-background/92 backdrop-blur-xl border border-border/60 shadow-2xl">
        <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 rounded-lg hover:bg-muted transition-colors">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3 pr-6">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">Instalar app</p>
            <p className="text-[11px] text-muted-foreground">Acceso rápido y modo offline</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleInstall} disabled={isInstalling} className="h-8 px-3 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />{isInstalling ? '...' : 'Instalar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default InstallPrompt;

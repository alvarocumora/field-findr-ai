import { useEffect, useState } from 'react';
import { WifiOff, Wifi, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePWA } from '@/hooks/usePWA';

const OfflineIndicator = () => {
  const { isOnline, isOfflineReady, isUpdateAvailable, updateApp } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Show "back online" message briefly
      setShowBanner(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Show update banner
  if (isUpdateAvailable) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground rounded-xl shadow-lg">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <div className="flex-1">
            <p className="font-medium text-sm">Nueva versión disponible</p>
            <p className="text-xs opacity-90">Actualiza para obtener las últimas mejoras</p>
          </div>
          <button
            onClick={updateApp}
            className="px-3 py-1.5 bg-primary-foreground text-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Actualizar
          </button>
        </div>
      </div>
    );
  }

  if (!showBanner) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 animate-in slide-in-from-bottom-4 duration-300",
      )}
    >
      <div 
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-colors duration-300",
          isOnline 
            ? "bg-green-500/90 text-white" 
            : "bg-amber-500/90 text-white"
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="h-5 w-5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Conexión restaurada</p>
              <p className="text-xs opacity-90">Sincronizando datos...</p>
            </div>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Sin conexión</p>
              <p className="text-xs opacity-90">
                {isOfflineReady 
                  ? "Modo offline activo • Datos guardados disponibles" 
                  : "Algunas funciones no estarán disponibles"
                }
              </p>
            </div>
            {isOfflineReady && (
              <CloudOff className="h-4 w-4 opacity-75" />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;

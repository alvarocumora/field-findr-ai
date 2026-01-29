import { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Zap, 
  WifiOff, 
  MapPin, 
  Bell, 
  Share,
  MoreVertical,
  Plus,
  CheckCircle2,
  ArrowRight,
  Apple,
  Chrome
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWA } from '@/hooks/usePWA';
import PublicLayout from '@/components/layouts/PublicLayout';

const InstallPage = () => {
  const { canInstall, promptInstall, isInstalled, isOfflineReady } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    await promptInstall();
    setIsInstalling(false);
  };

  const features = [
    {
      icon: Zap,
      title: 'Acceso instantáneo',
      description: 'Abre la app directamente desde tu pantalla de inicio, sin navegador',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: WifiOff,
      title: 'Modo offline',
      description: 'Accede a mapas y propiedades guardadas incluso sin conexión a internet',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: MapPin,
      title: 'Mapas en terreno',
      description: 'Visualiza terrenos con GPS y mapas 3D mientras visitas propiedades',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Bell,
      title: 'Notificaciones',
      description: 'Recibe alertas cuando aparezcan terrenos que coincidan con tu búsqueda',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  const renderInstallInstructions = () => {
    if (platform === 'ios') {
      return (
        <Card className="p-6 bg-muted/30">
          <div className="flex items-center gap-2 mb-4">
            <Apple className="h-5 w-5" />
            <h3 className="font-semibold">Instrucciones para iPhone/iPad</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">1</div>
              <div>
                <p className="font-medium">Toca el botón Compartir</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  Busca el ícono <Share className="h-4 w-4 inline" /> en la barra del navegador
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">2</div>
              <div>
                <p className="font-medium">Selecciona "Añadir a pantalla de inicio"</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  Busca el ícono <Plus className="h-4 w-4 inline" /> en el menú
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">3</div>
              <div>
                <p className="font-medium">Toca "Añadir"</p>
                <p className="text-sm text-muted-foreground">La app aparecerá en tu pantalla de inicio</p>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    if (platform === 'android') {
      return (
        <Card className="p-6 bg-muted/30">
          <div className="flex items-center gap-2 mb-4">
            <Chrome className="h-5 w-5" />
            <h3 className="font-semibold">Instrucciones para Android</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">1</div>
              <div>
                <p className="font-medium">Toca el menú del navegador</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  Busca los tres puntos <MoreVertical className="h-4 w-4 inline" /> en la esquina
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">2</div>
              <div>
                <p className="font-medium">Selecciona "Instalar app" o "Añadir a inicio"</p>
                <p className="text-sm text-muted-foreground">La opción puede variar según tu navegador</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">3</div>
              <div>
                <p className="font-medium">Confirma la instalación</p>
                <p className="text-sm text-muted-foreground">La app se instalará como una aplicación nativa</p>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-6 bg-muted/30">
        <div className="flex items-center gap-2 mb-4">
          <Chrome className="h-5 w-5" />
          <h3 className="font-semibold">Instrucciones para Desktop</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">1</div>
            <div>
              <p className="font-medium">Busca el ícono de instalación</p>
              <p className="text-sm text-muted-foreground">Aparece en la barra de direcciones del navegador</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">2</div>
            <div>
              <p className="font-medium">Haz clic en "Instalar"</p>
              <p className="text-sm text-muted-foreground">La app se instalará en tu computadora</p>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 shadow-lg shadow-primary/25">
              <Smartphone className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Instala Ofertaterrenos
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Obtén acceso rápido, modo offline y la mejor experiencia para encontrar tu terreno ideal
            </p>

            {isInstalled ? (
              <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 text-green-600 rounded-full">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">App instalada correctamente</span>
              </div>
            ) : canInstall ? (
              <Button 
                size="lg" 
                className="mt-8 gap-2"
                onClick={handleInstall}
                disabled={isInstalling}
              >
                <Download className="h-5 w-5" />
                {isInstalling ? 'Instalando...' : 'Instalar ahora'}
              </Button>
            ) : (
              <Badge variant="secondary" className="mt-8">
                {platform === 'ios' ? 'Sigue las instrucciones abajo' : 'Instalación automática no disponible'}
              </Badge>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <Card className={`p-4 ${isOfflineReady ? 'border-green-500/50 bg-green-500/5' : 'border-amber-500/50 bg-amber-500/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isOfflineReady ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                  <WifiOff className={`h-5 w-5 ${isOfflineReady ? 'text-green-500' : 'text-amber-500'}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">Modo Offline</p>
                  <p className="text-xs text-muted-foreground">
                    {isOfflineReady ? 'Listo para uso sin conexión' : 'Instala la app para habilitar'}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className={`p-4 ${isInstalled ? 'border-green-500/50 bg-green-500/5' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isInstalled ? 'bg-green-500/20' : 'bg-muted'}`}>
                  <Download className={`h-5 w-5 ${isInstalled ? 'text-green-500' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">Estado de instalación</p>
                  <p className="text-xs text-muted-foreground">
                    {isInstalled ? 'Instalada como app nativa' : 'No instalada'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Manual Installation Instructions */}
          {!isInstalled && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold mb-4">Cómo instalar manualmente</h2>
              {renderInstallInstructions()}
            </div>
          )}

          {/* CTA */}
          {!isInstalled && (
            <div className="text-center">
              <Button variant="outline" size="lg" className="gap-2" asChild>
                <a href="/explorar">
                  Explorar terrenos primero
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default InstallPage;

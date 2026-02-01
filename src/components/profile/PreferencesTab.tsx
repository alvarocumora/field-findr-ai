import { useState } from 'react';
import { Bell, Sun, Moon, Monitor, Globe, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useToast } from '@/hooks/use-toast';

const PreferencesTab = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  // Local state for preferences (could be persisted to database later)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newListingAlerts, setNewListingAlerts] = useState(true);
  const [priceDropAlerts, setPriceDropAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const handlePreferenceChange = (preference: string, value: boolean) => {
    toast({
      title: "Preferencia actualizada",
      description: `${preference} ha sido ${value ? 'activado' : 'desactivado'}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Apariencia
          </CardTitle>
          <CardDescription>
            Personaliza cómo se ve la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
              <SelectTrigger id="theme" className="w-full md:w-[200px]">
                <SelectValue placeholder="Seleccionar tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Claro
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Oscuro
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Sistema
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Elige entre tema claro, oscuro o automático según tu sistema
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Configura cómo quieres recibir alertas y actualizaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base">
                Notificaciones por Email
              </Label>
              <p className="text-sm text-muted-foreground">
                Recibe actualizaciones importantes en tu correo
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={(checked) => {
                setEmailNotifications(checked);
                handlePreferenceChange('Notificaciones por email', checked);
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-listing-alerts" className="text-base">
                Alertas de Nuevas Propiedades
              </Label>
              <p className="text-sm text-muted-foreground">
                Recibe avisos cuando se publiquen propiedades que coincidan con tus búsquedas guardadas
              </p>
            </div>
            <Switch
              id="new-listing-alerts"
              checked={newListingAlerts}
              onCheckedChange={(checked) => {
                setNewListingAlerts(checked);
                handlePreferenceChange('Alertas de nuevas propiedades', checked);
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="price-drop-alerts" className="text-base">
                Alertas de Baja de Precio
              </Label>
              <p className="text-sm text-muted-foreground">
                Notificaciones cuando baje el precio de propiedades en tus favoritos
              </p>
            </div>
            <Switch
              id="price-drop-alerts"
              checked={priceDropAlerts}
              onCheckedChange={(checked) => {
                setPriceDropAlerts(checked);
                handlePreferenceChange('Alertas de baja de precio', checked);
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-emails" className="text-base">
                Emails de Marketing
              </Label>
              <p className="text-sm text-muted-foreground">
                Recibe ofertas especiales, tips del mercado y novedades
              </p>
            </div>
            <Switch
              id="marketing-emails"
              checked={marketingEmails}
              onCheckedChange={(checked) => {
                setMarketingEmails(checked);
                handlePreferenceChange('Emails de marketing', checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Idioma y Región
          </CardTitle>
          <CardDescription>
            Configura tu idioma y preferencias regionales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Select defaultValue="es">
              <SelectTrigger id="language" className="w-full md:w-[200px]">
                <SelectValue placeholder="Seleccionar idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español (Chile)</SelectItem>
                <SelectItem value="en" disabled>English (próximamente)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moneda Preferida</Label>
            <Select defaultValue="clp">
              <SelectTrigger id="currency" className="w-full md:w-[200px]">
                <SelectValue placeholder="Seleccionar moneda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clp">CLP (Peso Chileno)</SelectItem>
                <SelectItem value="uf">UF (Unidad de Fomento)</SelectItem>
                <SelectItem value="usd">USD (Dólar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreferencesTab;

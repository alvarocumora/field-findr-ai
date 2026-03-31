import { useEffect } from 'react';
import { Bell, Sun, Moon, Monitor, Globe, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useProfile, ProfileUpdate } from '@/hooks/useProfile';
import { getAllCurrencies } from '@/lib/latam';
import { useState } from 'react';

const PreferencesTab = () => {
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile, isUpdating } = useProfile();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newListingAlerts, setNewListingAlerts] = useState(true);
  const [priceDropAlerts, setPriceDropAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [currency, setCurrency] = useState('CLP');
  const [language, setLanguage] = useState('es');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      setEmailNotifications(profile.email_notifications ?? true);
      setNewListingAlerts(profile.new_listing_alerts ?? true);
      setPriceDropAlerts(profile.price_drop_alerts ?? true);
      setMarketingEmails(profile.marketing_emails ?? false);
      setCurrency(profile.preferred_currency || 'CLP');
      setLanguage(profile.preferred_language || 'es');
    }
  }, [profile]);

  const markChanged = () => setHasChanges(true);

  const handleSave = () => {
    const updates: ProfileUpdate = {
      email_notifications: emailNotifications,
      new_listing_alerts: newListingAlerts,
      price_drop_alerts: priceDropAlerts,
      marketing_emails: marketingEmails,
      preferred_currency: currency,
      preferred_language: language,
    };
    updateProfile(updates);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Apariencia
          </CardTitle>
          <CardDescription>Personaliza cómo se ve la aplicación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select value={theme} onValueChange={(v: 'light' | 'dark' | 'system') => setTheme(v)}>
              <SelectTrigger id="theme" className="w-full md:w-[200px]">
                <SelectValue placeholder="Seleccionar tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light"><div className="flex items-center gap-2"><Sun className="h-4 w-4" />Claro</div></SelectItem>
                <SelectItem value="dark"><div className="flex items-center gap-2"><Moon className="h-4 w-4" />Oscuro</div></SelectItem>
                <SelectItem value="system"><div className="flex items-center gap-2"><Monitor className="h-4 w-4" />Sistema</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>Configura cómo quieres recibir alertas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { id: 'email-notifications', label: 'Notificaciones por Email', desc: 'Recibe actualizaciones importantes en tu correo', value: emailNotifications, setter: setEmailNotifications },
            { id: 'new-listing-alerts', label: 'Alertas de Nuevas Propiedades', desc: 'Avisos de propiedades que coincidan con tus búsquedas', value: newListingAlerts, setter: setNewListingAlerts },
            { id: 'price-drop-alerts', label: 'Alertas de Baja de Precio', desc: 'Notificaciones cuando baje el precio en tus favoritos', value: priceDropAlerts, setter: setPriceDropAlerts },
            { id: 'marketing-emails', label: 'Emails de Marketing', desc: 'Ofertas especiales, tips del mercado y novedades', value: marketingEmails, setter: setMarketingEmails },
          ].map((item, i) => (
            <div key={item.id}>
              {i > 0 && <Separator className="mb-6" />}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={item.id} className="text-base">{item.label}</Label>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  id={item.id}
                  checked={item.value}
                  onCheckedChange={(checked) => { item.setter(checked); markChanged(); }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Idioma y Región
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Select value={language} onValueChange={(v) => { setLanguage(v); markChanged(); }}>
              <SelectTrigger id="language" className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español (Chile)</SelectItem>
                <SelectItem value="en" disabled>English (próximamente)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda Preferida</Label>
            <Select value={currency} onValueChange={(v) => { setCurrency(v); markChanged(); }}>
              <SelectTrigger id="currency" className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAllCurrencies().map(cur => (
                  <SelectItem key={cur.code} value={cur.code}>
                    {cur.symbol} {cur.code} ({cur.label})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />Guardar Preferencias</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PreferencesTab;

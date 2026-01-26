import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellOff, Check, Trash2, Settings, DollarSign, MapPin, MessageSquare, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Alerts = () => {
  const { toast } = useToast();
  const [alertSettings, setAlertSettings] = useState({
    priceChanges: true,
    newMatches: true,
    messages: true,
    reminders: true,
    emailNotifications: false,
    pushNotifications: true,
  });

  const notifications = [
    {
      id: 1,
      type: "price_drop",
      title: "Bajó el precio de una parcela que te interesa",
      message: "Lote 45 - Valle Verde ahora está $2M más barato",
      time: "Hace 2 horas",
      read: false,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      id: 2,
      type: "new_match",
      title: "Nueva parcela coincide con tu búsqueda",
      message: "Lote 67 en Los Aromos cumple tus criterios",
      time: "Hace 5 horas",
      read: false,
      icon: MapPin,
      color: "text-blue-600",
    },
    {
      id: 3,
      type: "message",
      title: "Nuevo mensaje de tu agente",
      message: "Carlos Fernández respondió tu consulta sobre Lote 32",
      time: "Ayer",
      read: false,
      icon: MessageSquare,
      color: "text-purple-600",
    },
    {
      id: 4,
      type: "reminder",
      title: "Recordatorio de visita programada",
      message: "Visita a Lote 45 - Valle Verde mañana a las 15:00",
      time: "Ayer",
      read: true,
      icon: Calendar,
      color: "text-orange-600",
    },
    {
      id: 5,
      type: "price_drop",
      title: "Bajó el precio",
      message: "Lote 18 - Los Aromos ahora $1.5M más barato",
      time: "Hace 2 días",
      read: true,
      icon: DollarSign,
      color: "text-green-600",
    },
  ];

  const savedSearches = [
    {
      id: 1,
      name: "Parcelas agrícolas Los Ángeles",
      criteria: "Agrícola • 3-8 há • $20M-$40M",
      matches: 12,
      lastMatch: "Hace 5 horas",
      active: true,
    },
    {
      id: 2,
      name: "Terrenos con agua en Bío Bío",
      criteria: "Con derechos de agua • >5 há",
      matches: 8,
      lastMatch: "Hace 2 días",
      active: true,
    },
    {
      id: 3,
      name: "Loteos en desarrollo",
      criteria: "Estado: En desarrollo • Residencial",
      matches: 5,
      lastMatch: "Hace 1 semana",
      active: false,
    },
  ];

  const handleMarkAsRead = (id: number) => {
    toast({
      title: "Marcado como leído",
      description: "La notificación se ha marcado como leída",
    });
  };

  const handleDelete = (id: number) => {
    toast({
      title: "Notificación eliminada",
      description: "La notificación se ha eliminado",
    });
  };

  const handleToggleSetting = (setting: string) => {
    setAlertSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev],
    }));
    toast({
      title: "Configuración actualizada",
      description: "Tus preferencias de notificación se han guardado",
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alertas y Notificaciones</h1>
          <p className="text-muted-foreground">Mantente informado sobre cambios importantes</p>
        </div>
        <Badge variant={unreadCount > 0 ? "destructive" : "secondary"} className="text-lg">
          <Bell className="mr-2 h-4 w-4" />
          {unreadCount} sin leer
        </Badge>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="searches">Búsquedas Guardadas</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* Notificaciones */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Check className="mr-2 h-4 w-4" />
                Marcar todas como leídas
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar leídas
              </Button>
            </div>
          </Card>

          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 ${!notification.read ? "border-primary/50 bg-primary/5" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg bg-muted ${notification.color}`}>
                    <notification.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{notification.title}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                  <div className="flex gap-1">
                    {!notification.read && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Búsquedas Guardadas */}
        <TabsContent value="searches" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Tus Búsquedas Guardadas</h3>
              <Button size="sm">
                Nueva Búsqueda
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Recibe notificaciones cuando aparezcan parcelas que coincidan con tus criterios
            </p>
          </Card>

          <div className="space-y-3">
            {savedSearches.map((search) => (
              <Card key={search.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{search.name}</h3>
                      {search.active ? (
                        <Badge variant="default">
                          <Bell className="h-3 w-3 mr-1" />
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <BellOff className="h-3 w-3 mr-1" />
                          Pausada
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{search.criteria}</p>
                  </div>
                  <Switch checked={search.active} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {search.matches} coincidencias • Última: {search.lastMatch}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Configuración */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Preferencias de Notificaciones</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Tipos de Alertas</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="price-changes" className="text-base">Cambios de precio</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones cuando baje el precio de parcelas guardadas
                    </p>
                  </div>
                  <Switch
                    id="price-changes"
                    checked={alertSettings.priceChanges}
                    onCheckedChange={() => handleToggleSetting("priceChanges")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="new-matches" className="text-base">Nuevas coincidencias</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertas sobre parcelas que coincidan con tus búsquedas
                    </p>
                  </div>
                  <Switch
                    id="new-matches"
                    checked={alertSettings.newMatches}
                    onCheckedChange={() => handleToggleSetting("newMatches")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="messages" className="text-base">Mensajes</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones de mensajes de agentes
                    </p>
                  </div>
                  <Switch
                    id="messages"
                    checked={alertSettings.messages}
                    onCheckedChange={() => handleToggleSetting("messages")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reminders" className="text-base">Recordatorios</Label>
                    <p className="text-sm text-muted-foreground">
                      Recordatorios de visitas y eventos programados
                    </p>
                  </div>
                  <Switch
                    id="reminders"
                    checked={alertSettings.reminders}
                    onCheckedChange={() => handleToggleSetting("reminders")}
                  />
                </div>
              </div>

              <div className="pt-6 border-t space-y-4">
                <h4 className="font-semibold text-foreground">Canales de Notificación</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email" className="text-base">Notificaciones por email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe resúmenes diarios por correo electrónico
                    </p>
                  </div>
                  <Switch
                    id="email"
                    checked={alertSettings.emailNotifications}
                    onCheckedChange={() => handleToggleSetting("emailNotifications")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push" className="text-base">Notificaciones push</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones en tiempo real en tu navegador
                    </p>
                  </div>
                  <Switch
                    id="push"
                    checked={alertSettings.pushNotifications}
                    onCheckedChange={() => handleToggleSetting("pushNotifications")}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Alerts;

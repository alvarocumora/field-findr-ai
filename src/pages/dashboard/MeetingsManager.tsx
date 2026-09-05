import { useMemo, useState } from 'react';
import { CalendarClock, Check, Copy, ExternalLink, Video, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMeetings, useUpdateMeeting, type Meeting } from '@/hooks/useMeetings';
import {
  MEETING_BLOCK_LABELS,
  MEETING_STATUS_LABELS,
  MEETING_TYPE_LABELS,
  canTransition,
  type MeetingStatus,
} from '@/lib/meetings/status';

const statusVariant: Record<MeetingStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'secondary',
  confirmed: 'default',
  completed: 'outline',
  cancelled: 'destructive',
  no_show: 'destructive',
};

const formatScheduled = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleString('es-CL', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^\d]/g, '')}`;

type FilterTab = 'pending' | 'confirmed' | 'all';

const MeetingsManager = () => {
  const { data: meetings = [], isLoading } = useMeetings();
  const updateMeeting = useUpdateMeeting();
  const [tab, setTab] = useState<FilterTab>('pending');
  const [confirming, setConfirming] = useState<Meeting | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');

  const filtered = useMemo(() => {
    if (tab === 'all') return meetings;
    return meetings.filter((m) => m.status === tab);
  }, [meetings, tab]);

  const counts = useMemo(() => ({
    pending: meetings.filter((m) => m.status === 'pending').length,
    confirmed: meetings.filter((m) => m.status === 'confirmed').length,
  }), [meetings]);

  const setStatus = async (meeting: Meeting, status: MeetingStatus) => {
    if (!canTransition(meeting.status, status)) return;
    try {
      await updateMeeting.mutateAsync({ id: meeting.id, status });
      toast.success(`Reunión ${MEETING_STATUS_LABELS[status].toLowerCase()}`);
    } catch (error) {
      console.error('Meeting update error:', error);
      toast.error('No se pudo actualizar la reunión.');
    }
  };

  const openConfirm = (meeting: Meeting) => {
    setConfirming(meeting);
    setScheduledAt(meeting.scheduled_at ? meeting.scheduled_at.slice(0, 16) : '');
    setMeetingUrl(meeting.meeting_url ?? '');
  };

  const handleConfirm = async () => {
    if (!confirming) return;
    if (!scheduledAt) {
      toast.error('Indica fecha y hora de la reunión.');
      return;
    }
    try {
      await updateMeeting.mutateAsync({
        id: confirming.id,
        status: 'confirmed',
        scheduled_at: new Date(scheduledAt).toISOString(),
        meeting_url: meetingUrl.trim() || null,
      });
      toast.success('Reunión confirmada');
      setConfirming(null);
    } catch (error) {
      console.error('Meeting confirm error:', error);
      toast.error('No se pudo confirmar la reunión.');
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reuniones</h1>
          <p className="text-sm text-muted-foreground">
            Solicitudes de /agendar: confirma el horario, pega el link de Meet o Zoom y avisa por WhatsApp.
          </p>
        </div>
        <Tabs value={tab} onValueChange={(value) => setTab(value as FilterTab)}>
          <TabsList>
            <TabsTrigger value="pending">Por confirmar ({counts.pending})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmadas ({counts.confirmed})</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Cargando reuniones...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarClock className="mx-auto mb-3 h-10 w-10 opacity-40" />
            No hay reuniones {tab === 'pending' ? 'por confirmar' : tab === 'confirmed' ? 'confirmadas' : 'registradas'}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((meeting) => (
            <Card key={meeting.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {meeting.requester_name}
                    <span className="ml-3 text-sm font-normal text-muted-foreground">
                      {MEETING_TYPE_LABELS[meeting.meeting_type]}
                    </span>
                  </CardTitle>
                  <Badge variant={statusVariant[meeting.status]}>
                    {MEETING_STATUS_LABELS[meeting.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    <a className="font-medium text-foreground underline-offset-2 hover:underline" href={waLink(meeting.requester_phone)} target="_blank" rel="noreferrer">
                      {meeting.requester_phone}
                    </a>
                    {meeting.requester_email && <span className="ml-2">{meeting.requester_email}</span>}
                  </div>
                  <div className="sm:text-right">
                    {meeting.status === 'pending' && (
                      <>
                        Prefiere: {meeting.preferred_date ?? 'sin fecha'}
                        {meeting.preferred_block ? ` · ${MEETING_BLOCK_LABELS[meeting.preferred_block]}` : ''}
                      </>
                    )}
                    {meeting.scheduled_at && (
                      <span className="font-medium text-foreground">{formatScheduled(meeting.scheduled_at)}</span>
                    )}
                  </div>
                </div>

                {meeting.context && (
                  <p className="rounded-md bg-muted/50 p-3 text-sm">{meeting.context}</p>
                )}

                {meeting.meeting_url && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-primary" />
                    <a className="max-w-[280px] truncate text-primary underline-offset-2 hover:underline" href={meeting.meeting_url} target="_blank" rel="noreferrer">
                      {meeting.meeting_url}
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => copyUrl(meeting.meeting_url!)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {canTransition(meeting.status, 'confirmed') && (
                    <Button size="sm" onClick={() => openConfirm(meeting)}>
                      <CalendarClock className="mr-1 h-4 w-4" />
                      Confirmar horario
                    </Button>
                  )}
                  {canTransition(meeting.status, 'completed') && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(meeting, 'completed')}>
                      <Check className="mr-1 h-4 w-4" />
                      Realizada
                    </Button>
                  )}
                  {canTransition(meeting.status, 'no_show') && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(meeting, 'no_show')}>
                      No asistió
                    </Button>
                  )}
                  {canTransition(meeting.status, 'cancelled') && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(meeting, 'cancelled')}>
                      <X className="mr-1 h-4 w-4" />
                      Cancelar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" asChild>
                    <a href={waLink(meeting.requester_phone)} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reunión con {confirming?.requester_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {confirming?.preferred_date && (
              <p className="text-sm text-muted-foreground">
                Prefiere: {confirming.preferred_date}
                {confirming.preferred_block ? ` · ${MEETING_BLOCK_LABELS[confirming.preferred_block]}` : ''}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Fecha y hora *</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingUrl">Link de la videollamada (Meet / Zoom)</Label>
              <Input
                id="meetingUrl"
                type="url"
                value={meetingUrl}
                onChange={(event) => setMeetingUrl(event.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(null)}>Volver</Button>
            <Button onClick={handleConfirm} disabled={updateMeeting.isPending}>
              {updateMeeting.isPending ? 'Guardando...' : 'Confirmar reunión'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeetingsManager;

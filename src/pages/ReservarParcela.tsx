import { useSearchParams } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import { Badge } from '@/components/ui/badge';
import ReservationFormWizard from '@/components/reservations/form/ReservationFormWizard';

/**
 * Formulario público de reserva conectado al stock real.
 * Enlace para asesores: /reservar?proyecto=<id|slug>&lote=<lot_id>
 */
const ReservarParcela = () => {
  const [searchParams] = useSearchParams();
  const initialProject = searchParams.get('proyecto') || searchParams.get('project_id');
  const initialLotId = searchParams.get('lote') || searchParams.get('lot_id');

  return (
    <PublicLayout showAssistant={false}>
      <div className="theme-rural min-h-[70vh] bg-background text-foreground">
        <section className="border-b border-border/50 bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="container py-10 md:py-14">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4">
                Formulario de reserva
              </Badge>
              <h1 className="font-editorial text-3xl font-medium tracking-tight md:text-4xl">Reserva tu parcela</h1>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                Elige una parcela disponible, completa los datos de la compra y queda bloqueada 48 horas mientras
                transfieres la reserva.
              </p>
            </div>
          </div>
        </section>
        <section className="container py-8 md:py-12">
          <div className="mx-auto max-w-3xl">
            <ReservationFormWizard initialProject={initialProject} initialLotId={initialLotId} />
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default ReservarParcela;

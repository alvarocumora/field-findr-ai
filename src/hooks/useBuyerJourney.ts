import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JourneyEvent {
  key: string;
  date: string | null;
  title: string;
  description?: string;
  status: 'done' | 'current' | 'pending';
  documentUrl?: string | null;
}

export interface BuyerJourney {
  reservation: any;
  lead: any | null;
  closingSteps: any[];
  credit: any | null;
  creditPayments: any[];
  commission: any | null;
  events: JourneyEvent[];
}

/**
 * Aggregates the full buyer journey for a reservation:
 * lead → reserva → pago seña → venta → contrato → crédito/cuotas → cierre.
 * The reservation is the anchor; the lead links via lead_id or buyer email.
 */
export const useBuyerJourney = (reservationId: string | null) => {
  return useQuery({
    queryKey: ['buyer-journey', reservationId],
    enabled: !!reservationId,
    queryFn: async (): Promise<BuyerJourney> => {
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('*, lots(id, lot_number, name, area, price, project_id, projects(id, name, location, city))')
        .eq('id', reservationId!)
        .single();
      if (resError) throw resError;

      const [leadRes, stepsRes, creditRes, commissionRes] = await Promise.all([
        reservation.lead_id
          ? supabase.from('leads').select('*').eq('id', reservation.lead_id).maybeSingle()
          : reservation.buyer_email
            ? supabase.from('leads').select('*').eq('email', reservation.buyer_email)
                .order('created_at', { ascending: true }).limit(1).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        supabase.from('closing_steps').select('*').eq('reservation_id', reservationId!)
          .order('created_at', { ascending: true }),
        supabase.from('credits').select('*').eq('reservation_id', reservationId!).maybeSingle(),
        supabase.from('agent_commissions').select('*').eq('reservation_id', reservationId!).maybeSingle(),
      ]);

      const lead = leadRes.data ?? null;
      const closingSteps = stepsRes.data ?? [];
      const credit = creditRes.data ?? null;
      const commission = commissionRes.data ?? null;

      let creditPayments: any[] = [];
      if (credit) {
        const { data } = await supabase
          .from('credit_payments')
          .select('*')
          .eq('credit_id', credit.id)
          .order('payment_number', { ascending: true });
        creditPayments = data ?? [];
      }

      // ── Build the ordered event list ──
      const events: JourneyEvent[] = [];

      events.push({
        key: 'lead',
        date: lead?.created_at ?? null,
        title: 'Lead capturado',
        description: lead
          ? `Origen: ${lead.source || 'directo'}${lead.lead_score ? ` · Score ${lead.lead_score}` : ''}`
          : 'Sin lead asociado — reserva directa',
        status: lead ? 'done' : 'pending',
      });

      events.push({
        key: 'reserva',
        date: reservation.created_at,
        title: 'Reserva creada',
        description: `Seña ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: reservation.currency || 'CLP', maximumFractionDigits: 0 }).format(reservation.reservation_amount || 0)}`,
        status: 'done',
      });

      events.push({
        key: 'pago',
        date: reservation.paid_at,
        title: 'Seña pagada',
        description: reservation.mercadopago_payment_id
          ? `MercadoPago #${reservation.mercadopago_payment_id}`
          : reservation.paid_at ? 'Confirmado manualmente' : undefined,
        status: reservation.paid_at
          ? 'done'
          : reservation.status === 'pending_payment' ? 'current' : 'pending',
      });

      events.push({
        key: 'venta',
        date: reservation.converted_at,
        title: 'Convertida en venta',
        description: reservation.converted_at && reservation.lots?.price
          ? `Precio final ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(reservation.lots.price))}`
          : undefined,
        status: reservation.converted_at
          ? 'done'
          : reservation.status === 'paid' ? 'current' : 'pending',
      });

      const promesa = closingSteps.find((s: any) => s.step_type === 'promesa');
      events.push({
        key: 'contrato',
        date: promesa?.completed_at ?? null,
        title: 'Promesa firmada',
        description: reservation.contract_id ? `Contrato ${reservation.contract_id}` : undefined,
        status: promesa?.status === 'completed'
          ? 'done'
          : promesa?.status === 'in_progress' ? 'current' : 'pending',
        documentUrl: promesa?.document_url ?? null,
      });

      if (credit) {
        const paidCount = creditPayments.filter((p: any) => p.status === 'paid').length;
        events.push({
          key: 'credito',
          date: credit.started_at,
          title: 'Crédito directo activo',
          description: `${paidCount}/${credit.term_months} cuotas pagadas · ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: credit.currency || 'CLP', maximumFractionDigits: 0 }).format(credit.monthly_payment)}/mes`,
          status: credit.status === 'completed' ? 'done' : 'current',
        });
      }

      for (const stepType of ['escritura', 'inscripcion_cbr'] as const) {
        const step = closingSteps.find((s: any) => s.step_type === stepType);
        if (!step) continue;
        events.push({
          key: stepType,
          date: step.completed_at,
          title: stepType === 'escritura' ? 'Escritura' : 'Inscripción CBR',
          description: step.notes ?? undefined,
          status: step.status === 'completed' ? 'done' : step.status === 'in_progress' ? 'current' : 'pending',
          documentUrl: step.document_url ?? null,
        });
      }

      return { reservation, lead, closingSteps, credit, creditPayments, commission, events };
    },
  });
};

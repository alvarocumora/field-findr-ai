import { getErrorMessage } from '@/lib/errorMessage';
import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VEL_PROJECT } from '../data/project';

// Owner of Valle Escondido Licantén project (public — used only to attribute leads server-side)
const VEL_OWNER_ID = '92f58f83-8218-4949-a258-7aea393c37c6';

export type LeadReason =
  | 'informacion'
  | 'visita'
  | 'reserva'
  | 'financiamiento'
  | 'inversion';

const REASON_LABEL: Record<LeadReason, string> = {
  informacion: 'Quiero más información',
  visita: 'Agendar visita al terreno',
  reserva: 'Reservar una parcela',
  financiamiento: 'Consultar financiamiento',
  inversion: 'Evaluar como inversión',
};

const BUDGET_RANGES: { key: string; label: string; min: number; max: number | null }[] = [
  { key: 'lt10', label: 'Menos de $10M CLP', min: 0, max: 10_000_000 },
  { key: '10_15', label: '$10M – $15M CLP', min: 10_000_000, max: 15_000_000 },
  { key: '15_20', label: '$15M – $20M CLP', min: 15_000_000, max: 20_000_000 },
  { key: '20_30', label: '$20M – $30M CLP', min: 20_000_000, max: 30_000_000 },
  { key: 'gt30', label: 'Más de $30M CLP', min: 30_000_000, max: null },
  { key: 'unset', label: 'Prefiero conversarlo', min: 0, max: null },
];

const Schema = z.object({
  firstName: z.string().trim().min(2, 'Nombre muy corto').max(80),
  lastName: z.string().trim().max(80).optional(),
  email: z.string().trim().email('Email inválido').max(200),
  phone: z.string().trim().max(30).optional(),
  reason: z.enum(['informacion', 'visita', 'reserva', 'financiamiento', 'inversion']),
  budgetKey: z.string(),
  message: z.string().trim().max(600).optional(),
});

export interface VelLeadFormProps {
  lotId?: string;
  lotNumber?: string;
  lotStatus?: 'available' | 'reserved' | 'sold';
  defaultReason?: LeadReason;
  onSuccess?: () => void;
  compact?: boolean;
}

export default function VelLeadForm({
  lotId,
  lotNumber,
  lotStatus,
  defaultReason = 'informacion',
  onSuccess,
  compact = false,
}: VelLeadFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState<LeadReason>(defaultReason);
  const [budgetKey, setBudgetKey] = useState('unset');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Schema.safeParse({ firstName, lastName, email, phone, reason, budgetKey, message });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Revisa los campos');
      return;
    }

    const budget = BUDGET_RANGES.find((b) => b.key === budgetKey);
    const notesParts = [
      `[Motivo] ${REASON_LABEL[reason]}`,
      lotNumber ? `[Lote] ${lotNumber}${lotStatus ? ` (${lotStatus})` : ''}` : null,
      budget && budgetKey !== 'unset' ? `[Presupuesto] ${budget.label}` : null,
      message.trim() ? `[Mensaje] ${message.trim()}` : null,
    ].filter(Boolean).join(' · ');

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-interest', {
        body: {
          projectOwnerId: VEL_OWNER_ID,
          projectId: VEL_PROJECT.id,
          lotId: lotId || undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim(),
          phone: phone.trim() || undefined,
          source: lotId ? `valle-escondido-licanten-lote-${lotNumber || ''}` : 'valle-escondido-licanten-landing',
          notes: notesParts,
          budgetMin: budget?.min ?? undefined,
          budgetMax: budget?.max ?? undefined,
        },
      });
      if (error || (data)?.error) throw new Error((data)?.error || error?.message);
      setDone(true);
      toast.success('¡Contacto enviado! Te escribiremos pronto.');
      onSuccess?.();
    } catch (err: unknown) {
      toast.error( getErrorMessage(err) || 'No pudimos enviar tu consulta. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-sm border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <div className="serif text-xl text-[var(--hue-bone)] mb-2">Recibimos tu consulta ✓</div>
        <p className="text-[13px] text-[var(--hue-bone)]/65">
          Un asesor de Valle Escondido Licantén te contactará dentro de las próximas 24 horas hábiles.
        </p>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[13px] text-[var(--hue-bone)] placeholder:text-[var(--hue-bone)]/35 focus:border-[var(--hue-amber)]/50 focus:outline-none';
  const labelCls = 'text-[10px] tracking-[0.22em] uppercase text-[var(--hue-bone)]/50 mb-1.5 block';

  return (
    <form onSubmit={handleSubmit} className={`grid gap-4 text-left ${compact ? '' : 'md:grid-cols-2'}`}>
      {lotNumber && (
        <div className={`${compact ? '' : 'md:col-span-2'} rounded-sm border border-[var(--hue-amber)]/30 bg-[var(--hue-amber)]/5 px-3 py-2 text-[12px] text-[var(--hue-bone)]/80`}>
          Consulta sobre <strong>Lote {lotNumber}</strong>
          {lotStatus ? ` · estado: ${lotStatus}` : ''}
        </div>
      )}
      <div>
        <label className={labelCls}>Nombre*</label>
        <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} required maxLength={80} />
      </div>
      <div>
        <label className={labelCls}>Apellido</label>
        <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={80} />
      </div>
      <div>
        <label className={labelCls}>Email*</label>
        <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
      </div>
      <div>
        <label className={labelCls}>Teléfono</label>
        <input type="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
      </div>
      <div>
        <label className={labelCls}>Motivo*</label>
        <select className={inputCls} value={reason} onChange={(e) => setReason(e.target.value as LeadReason)}>
          {(Object.keys(REASON_LABEL) as LeadReason[]).map((k) => (
            <option key={k} value={k}>{REASON_LABEL[k]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>Rango de presupuesto</label>
        <select className={inputCls} value={budgetKey} onChange={(e) => setBudgetKey(e.target.value)}>
          {BUDGET_RANGES.map((b) => (
            <option key={b.key} value={b.key}>{b.label}</option>
          ))}
        </select>
      </div>
      <div className={compact ? '' : 'md:col-span-2'}>
        <label className={labelCls}>Mensaje (opcional)</label>
        <textarea className={inputCls} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={600} />
      </div>
      <div className={compact ? '' : 'md:col-span-2'}>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-[var(--hue-amber)]/50 bg-[var(--hue-amber)]/15 px-6 py-3 text-[12px] tracking-[0.22em] uppercase text-[var(--hue-bone)] hover:bg-[var(--hue-amber)]/25 disabled:opacity-60 transition"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? 'Enviando…' : 'Enviar consulta'}
        </button>
        <p className="mt-2 text-center text-[10px] text-[var(--hue-bone)]/45">
          Al enviar aceptas ser contactado por el equipo comercial de Valle Escondido Licantén.
        </p>
      </div>
    </form>
  );
}

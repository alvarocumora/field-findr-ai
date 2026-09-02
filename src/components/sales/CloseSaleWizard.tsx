import { useMemo, useState } from 'react';
import { FileText, PenLine, CreditCard, BadgeDollarSign, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SalesClosing } from '@/hooks/useSalesClosings';

const money = (n: number, currency = 'CLP') =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 })
    .format(n || 0);

const STEPS = [
  { key: 'contract', label: 'Contrato', icon: FileText },
  { key: 'signature', label: 'Firma', icon: PenLine },
  { key: 'payment', label: 'Pago', icon: CreditCard },
  { key: 'commission', label: 'Comisión', icon: BadgeDollarSign },
] as const;

export interface CloseSaleResult {
  contract_url: string | null;
  contract_signed_at: string;
  status: 'closed';
  closed_at: string;
  notes: string | null;
}

interface Props {
  closing: SalesClosing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: CloseSaleResult) => Promise<unknown> | void;
  isSubmitting?: boolean;
}

const PAYMENT_METHODS = [
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'credito_hipotecario', label: 'Crédito hipotecario' },
  { value: 'credito_directo', label: 'Crédito directo del proyecto' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'efectivo', label: 'Efectivo / caja' },
];

const CloseSaleWizard = ({ closing, open, onOpenChange, onConfirm, isSubmitting }: Props) => {
  const [step, setStep] = useState(0);
  const [contractUrl, setContractUrl] = useState('');
  const [signedAt, setSignedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [signerName, setSignerName] = useState('');
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  const currency = closing?.currency || 'CLP';
  const saleAmount = Number(closing?.sale_amount || 0);
  const rate = Number(closing?.commission_rate || 0);
  const commission = useMemo(() => Math.round((saleAmount * rate) / 100), [saleAmount, rate]);

  const reset = () => {
    setStep(0);
    setContractUrl(closing?.contract_url || '');
    setSignerName(closing?.buyer_name || '');
    setSignatureConfirmed(false);
    setPaymentRef('');
    setPaymentAmount(saleAmount ? String(saleAmount) : '');
    setExtraNotes('');
  };

  const handleOpenChange = (v: boolean) => {
    if (v) reset();
    onOpenChange(v);
  };

  const canAdvance = () => {
    if (step === 0) return contractUrl.trim().length > 0;
    if (step === 1) return signatureConfirmed && signerName.trim().length > 0 && !!signedAt;
    if (step === 2) return Number(paymentAmount) > 0;
    return true;
  };

  const confirm = async () => {
    const paymentLabel = PAYMENT_METHODS.find((p) => p.value === paymentMethod)?.label ?? paymentMethod;
    const trail = [
      closing?.notes?.trim() || '',
      `Contrato firmado por ${signerName.trim()} el ${signedAt}.`,
      `Pago ${money(Number(paymentAmount), currency)} vía ${paymentLabel}${paymentRef ? ` (ref. ${paymentRef})` : ''}.`,
      `Comisión ${rate}% = ${money(commission, currency)}.`,
      extraNotes.trim(),
    ].filter(Boolean).join('\n');

    await onConfirm({
      contract_url: contractUrl.trim() || null,
      contract_signed_at: new Date(`${signedAt}T12:00:00`).toISOString(),
      status: 'closed',
      closed_at: new Date().toISOString(),
      notes: trail || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cerrar venta{closing ? ` · ${closing.buyer_name}` : ''}</DialogTitle>
          <DialogDescription>
            Contrato, firma y pago. Al confirmar se genera la comisión en Comisiones.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2" aria-label="Pasos del cierre">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const state = i < step ? 'done' : i === step ? 'current' : 'todo';
            return (
              <li key={s.key} className="flex-1">
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs',
                    state === 'current' && 'border-primary bg-primary/10 text-primary font-medium',
                    state === 'done' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
                    state === 'todo' && 'border-border text-muted-foreground',
                  )}
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  {state === 'done'
                    ? <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    : <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                  <span className="truncate">{s.label}</span>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="space-y-4 py-2">
          {step === 0 && (
            <>
              <div>
                <Label htmlFor="cw-contract">Enlace al contrato (promesa / compraventa) *</Label>
                <Input
                  id="cw-contract"
                  placeholder="https://..."
                  value={contractUrl}
                  onChange={(e) => setContractUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pega la URL del PDF firmado o del documento en revisión.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium">{closing?.buyer_name}</p>
                <p className="text-muted-foreground">
                  Venta {money(saleAmount, currency)} · Comisión {rate}%
                </p>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cw-signer">Firmante *</Label>
                  <Input id="cw-signer" value={signerName} onChange={(e) => setSignerName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="cw-signed">Fecha de firma *</Label>
                  <Input id="cw-signed" type="date" value={signedAt} onChange={(e) => setSignedAt(e.target.value)} />
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={signatureConfirmed}
                  onCheckedChange={(v) => setSignatureConfirmed(v === true)}
                  aria-label="Confirmar firma del contrato"
                />
                <span>Confirmo que el contrato fue firmado por ambas partes y está respaldado.</span>
              </label>
            </>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Medio de pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger aria-label="Medio de pago"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cw-amount">Monto pagado *</Label>
                <Input
                  id="cw-amount" type="number" min={0} value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cw-ref">Referencia / comprobante</Label>
                <Input id="cw-ref" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Comisión a generar</p>
                <p className="text-2xl font-bold text-emerald-700">{money(commission, currency)}</p>
                <p className="text-sm text-muted-foreground">
                  {rate}% sobre {money(saleAmount, currency)} · quedará como pendiente en Comisiones.
                </p>
              </div>
              <div>
                <Label htmlFor="cw-notes">Notas del cierre</Label>
                <Textarea id="cw-notes" rows={3} value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? onOpenChange(false) : setStep((s) => s - 1))}
            disabled={isSubmitting}
          >
            {step === 0 ? 'Cancelar' : 'Atrás'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>Continuar</Button>
          ) : (
            <Button onClick={confirm} disabled={isSubmitting}>
              Confirmar cierre y generar comisión
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseSaleWizard;

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Landmark,
  Loader2,
  MapPin,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useReservableLots,
  useReservableProjects,
  useSubmitReservationForm,
  type ReservableLot,
  type SubmittedReservation,
} from '@/hooks/usePublicReservationForm';
import { toFormDetails, type ReservationFormValues } from '@/lib/reservations/reservationForm';
import { RESERVATION_PAYMENT_ACCOUNT, RESERVATION_TERMS } from '@/lib/reservations/reservationTerms';
import { downloadReservationFormPdf, reservationFolio } from '@/lib/reservations/reservationFormPdf';
import { FormFieldShell, PartyFields } from './PartyFields';
import {
  WIZARD_STEPS,
  defaultFormShape,
  errorMessage,
  parseFullForm,
  stepForPath,
  validateStep,
  type ReservationFormShape,
  type StepIssue,
  type WizardStep,
} from './formShape';

const clp = (value: number | null | undefined) =>
  typeof value === 'number' && value > 0 ? `$${Math.round(value).toLocaleString('es-CL')}` : '—';

const lotLabel = (lot: ReservableLot) =>
  `Lote ${lot.lot_number} · ${Math.round(lot.area).toLocaleString('es-CL')} m² · ${clp(lot.price)}`;

interface ReservationFormWizardProps {
  /** id o slug del proyecto a preseleccionar (?proyecto=). */
  initialProject?: string | null;
  /** id del lote a preseleccionar (?lote=). */
  initialLotId?: string | null;
}

interface Completed {
  submitted: SubmittedReservation;
  values: ReservationFormValues;
  lot: ReservableLot;
  projectName: string;
}

export const ReservationFormWizard = ({ initialProject, initialLotId }: ReservationFormWizardProps) => {
  const [step, setStep] = useState<WizardStep>('parcela');
  const [completed, setCompleted] = useState<Completed | null>(null);
  const form = useForm<ReservationFormShape>({ defaultValues: defaultFormShape() });
  const { control, register, setValue, getValues, setError, clearErrors, formState } = form;
  const errors = formState.errors;

  const projectsQuery = useReservableProjects();
  const projectId = useWatch({ control, name: 'projectId' });
  const lotId = useWatch({ control, name: 'lotId' });
  const hasSecondBuyer = useWatch({ control, name: 'hasSecondBuyer' });
  const lotsQuery = useReservableLots(projectId || null);
  const submit = useSubmitReservationForm();

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const lots = useMemo(() => lotsQuery.data ?? [], [lotsQuery.data]);
  const project = projects.find((p) => p.id === projectId) ?? null;
  const lot = lots.find((l) => l.id === lotId) ?? null;

  // Al corregir un campo, su error desaparece sin esperar a "Continuar".
  useEffect(() => {
    const subscription = form.watch((_value, { name }) => {
      if (name) clearErrors(name);
    });
    return () => subscription.unsubscribe();
  }, [form, clearErrors]);

  // Preselección desde el enlace del asesor (?proyecto=<id|slug>&lote=<id>).
  useEffect(() => {
    if (!initialProject || getValues('projectId') || projects.length === 0) return;
    const match = projects.find((p) => p.id === initialProject || p.slug === initialProject);
    if (match) setValue('projectId', match.id);
  }, [initialProject, projects, getValues, setValue]);

  useEffect(() => {
    if (!initialLotId || getValues('lotId') || lots.length === 0) return;
    if (lots.some((l) => l.id === initialLotId)) setValue('lotId', initialLotId);
  }, [initialLotId, lots, getValues, setValue]);

  // Si la parcela elegida dejó de estar disponible (otro comprador), se libera.
  useEffect(() => {
    if (lotId && lotsQuery.isSuccess && !lots.some((l) => l.id === lotId)) {
      setValue('lotId', '');
      toast.warning('La parcela que elegiste ya no está disponible. Elige otra.');
    }
  }, [lotId, lots, lotsQuery.isSuccess, setValue]);

  const showIssues = (issues: StepIssue[]) => {
    for (const issue of issues) {
      setError(issue.path as never, { type: 'validate', message: issue.message });
    }
    const first = issues[0];
    if (first) {
      // Los ids de los campos siguen la ruta del formulario con guiones.
      const el = document.getElementById(first.path.replace(/\./g, '-'));
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
    }
  };

  const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === step);

  const goNext = () => {
    clearErrors();
    const issues = validateStep(step, getValues());
    if (step === 'parcela' && getValues('lotId') && !lot) {
      issues.push({ path: 'lotId', message: 'La parcela ya no está disponible' });
    }
    if (issues.length) {
      showIssues(issues);
      return;
    }
    setStep(WIZARD_STEPS[stepIndex + 1].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    clearErrors();
    setStep(WIZARD_STEPS[Math.max(0, stepIndex - 1)].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async () => {
    clearErrors();
    const parsed = parseFullForm(getValues());
    if (!parsed.values) {
      const target = stepForPath(parsed.issues[0]?.path ?? '');
      setStep(target);
      // Espera a que el paso se monte para poder marcar y enfocar el campo.
      window.setTimeout(() => showIssues(parsed.issues), 0);
      return;
    }
    if (!lot || !project) {
      setStep('parcela');
      toast.error('La parcela ya no está disponible. Elige otra.');
      return;
    }
    try {
      const submitted = await submit.mutateAsync(parsed.values);
      setCompleted({ submitted, values: parsed.values, lot, projectName: project.name });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No pudimos registrar la reserva.');
    }
  };

  if (completed) return <ReservationDone {...completed} />;

  const amount = lot?.reservation_amount ?? null;

  return (
    <div className="space-y-6">
      <ol className="grid grid-cols-3 gap-2" aria-label="Pasos del formulario">
        {WIZARD_STEPS.map((s, i) => (
          <li
            key={s.id}
            aria-current={s.id === step ? 'step' : undefined}
            className={`rounded-lg border px-2 py-2 text-center text-xs font-medium sm:text-sm ${
              i < stepIndex
                ? 'border-primary/30 bg-primary/10 text-primary'
                : s.id === step
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground'
            }`}
          >
            <span className="mr-1 font-semibold">{i + 1}.</span>
            {s.label}
          </li>
        ))}
      </ol>

      <Card className="rural-shadow">
        <CardContent className="space-y-6 p-4 sm:p-6">
          {step === 'parcela' && (
            <section className="space-y-5" aria-labelledby="paso-parcela">
              <h2 id="paso-parcela" className="text-lg font-semibold">
                Elige la parcela
              </h2>
              <FormFieldShell id="projectId" label="Proyecto" error={errorMessage(errors, 'projectId')}>
                <Controller
                  control={control}
                  name="projectId"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setValue('lotId', '');
                      }}
                      disabled={projectsQuery.isLoading}
                    >
                      <SelectTrigger id="projectId">
                        <SelectValue placeholder={projectsQuery.isLoading ? 'Cargando proyectos…' : 'Selecciona un proyecto'} />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                            {p.city ? ` · ${p.city}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormFieldShell>

              <FormFieldShell id="lotId" label="Parcela disponible" error={errorMessage(errors, 'lotId')}>
                <Controller
                  control={control}
                  name="lotId"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={!projectId || lotsQuery.isLoading || lots.length === 0}
                    >
                      <SelectTrigger id="lotId">
                        <SelectValue
                          placeholder={
                            !projectId
                              ? 'Primero elige el proyecto'
                              : lotsQuery.isLoading
                                ? 'Consultando stock…'
                                : lots.length === 0
                                  ? 'Sin parcelas disponibles'
                                  : 'Selecciona una parcela'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {lots.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {lotLabel(l)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormFieldShell>
              {projectId && lotsQuery.isSuccess && (
                <p className="text-xs text-muted-foreground">
                  {lots.length} {lots.length === 1 ? 'parcela disponible' : 'parcelas disponibles'} en este momento. El
                  stock se actualiza solo.
                </p>
              )}
              {lotsQuery.isError && (
                <p className="text-sm text-destructive">No pudimos consultar el stock. Intenta nuevamente.</p>
              )}

              {lot && (
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm sm:grid-cols-4">
                  <Stat label="Parcela" value={`N° ${lot.lot_number}`} />
                  <Stat label="Superficie" value={`${Math.round(lot.area).toLocaleString('es-CL')} m²`} />
                  <Stat label="Valor" value={clp(lot.price)} />
                  <Stat label="Reserva" value={clp(lot.reservation_amount)} />
                </div>
              )}
            </section>
          )}

          {step === 'compradores' && (
            <section className="space-y-6" aria-labelledby="paso-compradores">
              <h2 id="paso-compradores" className="text-lg font-semibold">
                Datos del comprador
              </h2>
              <PartyFields party="primary" control={control} register={register} errors={errors} />

              <Controller
                control={control}
                name="hasSecondBuyer"
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <UserPlus className="h-4 w-4 text-primary" />
                      Compran dos personas
                    </span>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </label>
                )}
              />

              {hasSecondBuyer && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-base font-semibold">Comprador 2</h3>
                  <PartyFields party="secondary" control={control} register={register} errors={errors} />
                </div>
              )}
            </section>
          )}

          {step === 'confirmacion' && (!lot || !project) && (
            <p className="text-sm text-muted-foreground">
              La parcela seleccionada ya no está disponible. Vuelve al primer paso y elige otra.
            </p>
          )}

          {step === 'confirmacion' && lot && project && (
            <section className="space-y-6" aria-labelledby="paso-confirmacion">
              <h2 id="paso-confirmacion" className="text-lg font-semibold">
                Pago de la reserva y condiciones
              </h2>

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
                <p className="font-medium">
                  {project.name} · Lote {lot.lot_number}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Reserva: <span className="font-semibold text-foreground">{clp(amount)} CLP</span>. La parcela queda
                  bloqueada 48 horas mientras se acredita el pago.
                </p>
              </div>

              <PaymentAccountCard amount={amount} />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormFieldShell
                  id="estimatedDeedDate"
                  label="Fecha estimada de escritura (opcional)"
                  error={errorMessage(errors, 'estimatedDeedDate')}
                >
                  <Input
                    id="estimatedDeedDate"
                    type="date"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    {...register('estimatedDeedDate')}
                  />
                </FormFieldShell>
                <FormFieldShell
                  id="observations"
                  label="Observaciones (opcional)"
                  error={errorMessage(errors, 'observations')}
                  className="sm:col-span-2"
                >
                  <Textarea id="observations" rows={3} maxLength={800} {...register('observations')} />
                </FormFieldShell>
              </div>

              <details className="group rounded-xl border bg-card">
                <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">
                  Leer las condiciones de la reserva
                </summary>
                <div className="max-h-80 space-y-3 overflow-y-auto border-t px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                  {RESERVATION_TERMS.map((clause) => (
                    <p key={clause.title}>
                      <span className="font-semibold uppercase text-foreground">{clause.title}: </span>
                      {clause.body}
                    </p>
                  ))}
                </div>
              </details>

              <Controller
                control={control}
                name="acceptTerms"
                render={({ field }) => (
                  <div>
                    <label htmlFor="acceptTerms" className="flex items-start gap-3 text-sm">
                      <Checkbox
                        id="acceptTerms"
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        className="mt-0.5"
                      />
                      <span>
                        Declaro haber leído y aceptar las condiciones de la reserva, incluido que el monto de reserva no
                        es un abono al precio y no se devuelve si desisto de la compra.
                      </span>
                    </label>
                    {errorMessage(errors, 'acceptTerms') && (
                      <p className="mt-1 text-xs text-destructive">{errorMessage(errors, 'acceptTerms')}</p>
                    )}
                  </div>
                )}
              />
            </section>
          )}

          <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-between">
            {stepIndex > 0 ? (
              <Button type="button" variant="outline" className="min-h-11" onClick={goBack} disabled={submit.isPending}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            ) : (
              <span />
            )}
            {step !== 'confirmacion' ? (
              <Button type="button" className="min-h-11" onClick={goNext}>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" className="min-h-11" onClick={onSubmit} disabled={submit.isPending}>
                {submit.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Enviar reserva
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

const PaymentAccountCard = ({ amount }: { amount: number | null }) => {
  const account = RESERVATION_PAYMENT_ACCOUNT;
  const copy = async () => {
    const text = [
      account.holder,
      `RUT ${account.holderRut}`,
      account.bank,
      `Cuenta ${account.accountNumber}`,
      amount ? `Monto ${clp(amount)}` : null,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Datos de transferencia copiados');
    } catch {
      toast.error('No se pudo copiar. Anótalos manualmente.');
    }
  };
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Landmark className="h-4 w-4 text-primary" />
          Datos para transferir la reserva
        </p>
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          <Copy className="mr-1 h-3.5 w-3.5" />
          Copiar
        </Button>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Titular</dt>
        <dd className="font-medium">{account.holder}</dd>
        <dt className="text-muted-foreground">RUT</dt>
        <dd className="rural-data">{account.holderRut}</dd>
        <dt className="text-muted-foreground">Banco</dt>
        <dd>{account.bank}</dd>
        <dt className="text-muted-foreground">N° de cuenta</dt>
        <dd className="rural-data">{account.accountNumber}</dd>
        {amount ? (
          <>
            <dt className="text-muted-foreground">Monto</dt>
            <dd className="font-semibold">{clp(amount)} CLP</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
};

const ReservationDone = ({ submitted, values, lot, projectName }: Completed) => {
  const folio = reservationFolio(submitted.reservationId);
  const download = () => {
    try {
      downloadReservationFormPdf({
        reservationId: submitted.reservationId,
        createdAt: submitted.createdAt,
        termsAcceptedAt: submitted.createdAt,
        termsVersion: submitted.termsVersion,
        expiresAt: submitted.expiresAt,
        projectName,
        lotNumber: lot.lot_number,
        lotArea: lot.area,
        lotPrice: lot.price,
        reservationAmount: submitted.reservationAmount,
        details: toFormDetails(values),
      });
    } catch {
      toast.error('No se pudo generar el PDF. Intenta nuevamente.');
    }
  };
  return (
    <Card className="rural-shadow">
      <CardContent className="space-y-6 p-5 sm:p-8">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-3 text-2xl font-semibold">Reserva registrada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Folio <span className="rural-data font-semibold text-foreground">{folio}</span> · {projectName} · Lote{' '}
            {lot.lot_number}
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            La parcela queda bloqueada hasta el{' '}
            <strong>{format(new Date(submitted.expiresAt), "d 'de' MMMM, HH:mm", { locale: es })}</strong>. Transfiere{' '}
            <strong>{clp(submitted.reservationAmount)}</strong> y envía el comprobante a tu asesor indicando el folio{' '}
            {folio}.
          </p>
        </div>
        <PaymentAccountCard amount={submitted.reservationAmount} />
        <Button type="button" className="min-h-11 w-full" onClick={download}>
          <Download className="mr-2 h-4 w-4" />
          Descargar formulario de reserva (PDF)
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReservationFormWizard;

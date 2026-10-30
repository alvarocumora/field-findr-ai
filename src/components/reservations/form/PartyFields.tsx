import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MARITAL_STATUS_OPTIONS,
  hasPartner,
  partnerRequired,
  type MaritalStatus,
} from '@/lib/reservations/reservationForm';
import { formatRut } from '@/lib/reservations/rut';
import { errorMessage, type ReservationFormShape } from './formShape';

type PartyKey = 'primary' | 'secondary';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormFieldShell = ({ id, label, error, className, children }: FieldProps) => (
  <div className={className}>
    <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </Label>
    <div className="mt-1">{children}</div>
    {error && (
      <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
        {error}
      </p>
    )}
  </div>
);

interface PartyFieldsProps {
  party: PartyKey;
  control: Control<ReservationFormShape>;
  register: UseFormRegister<ReservationFormShape>;
  errors: FieldErrors<ReservationFormShape>;
}

/** Bloque comprador + cónyuge/conviviente (se repite para el comprador 2). */
export const PartyFields = ({ party, control, register, errors }: PartyFieldsProps) => {
  const marital = useWatch({ control, name: `${party}.buyer.maritalStatus` }) as MaritalStatus | '';
  const hasSpouse = useWatch({ control, name: `${party}.hasSpouse` });
  const partner = hasPartner(marital);
  const required = partnerRequired(marital);
  const showSpouse = required || (partner && hasSpouse);

  const msg = (path: string) => errorMessage(errors, path);
  const id = (field: string) => `${party}-${field}`;

  const text = (
    scope: 'buyer' | 'spouse',
    field: string,
    label: string,
    opts: { type?: string; autoComplete?: string; inputMode?: 'text' | 'tel' | 'email'; className?: string; rut?: boolean } = {},
  ) => {
    const path = `${party}.${scope}.${field}` as const;
    const error = msg(path);
    const reg = register(path as never);
    return (
      <FormFieldShell id={id(`${scope}-${field}`)} label={label} error={error} className={opts.className}>
        <Input
          id={id(`${scope}-${field}`)}
          type={opts.type ?? 'text'}
          inputMode={opts.inputMode}
          autoComplete={opts.autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id(`${scope}-${field}`)}-error` : undefined}
          {...reg}
          onBlur={(event) => {
            if (opts.rut && event.target.value.trim()) {
              event.target.value = formatRut(event.target.value);
              void reg.onChange(event);
            }
            void reg.onBlur(event);
          }}
        />
      </FormFieldShell>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-6">
        {text('buyer', 'fullName', 'Nombre completo', { autoComplete: 'name', className: 'sm:col-span-6' })}
        {text('buyer', 'rut', 'RUT', { className: 'sm:col-span-2', rut: true })}
        {text('buyer', 'nationality', 'Nacionalidad', { className: 'sm:col-span-2' })}
        <FormFieldShell
          id={id('buyer-maritalStatus')}
          label="Estado civil"
          error={msg(`${party}.buyer.maritalStatus`)}
          className="sm:col-span-2"
        >
          <Controller
            control={control}
            name={`${party}.buyer.maritalStatus`}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id={id('buyer-maritalStatus')} aria-invalid={!!msg(`${party}.buyer.maritalStatus`)}>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormFieldShell>
        {text('buyer', 'profession', 'Profesión u oficio', { className: 'sm:col-span-6' })}
        {text('buyer', 'address', 'Dirección', { autoComplete: 'street-address', className: 'sm:col-span-4' })}
        {text('buyer', 'commune', 'Comuna', { className: 'sm:col-span-2' })}
        {text('buyer', 'phone', 'Celular', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', className: 'sm:col-span-2' })}
        {text('buyer', 'email', 'E-mail', { type: 'email', inputMode: 'email', autoComplete: 'email', className: 'sm:col-span-4' })}
      </div>

      {partner && !required && (
        <Controller
          control={control}
          name={`${party}.hasSpouse`}
          render={({ field }) => (
            <label className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
              <span>Agregar datos del cónyuge (opcional con separación de bienes)</span>
              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
            </label>
          )}
        />
      )}

      {showSpouse && (
        <fieldset className="space-y-4 rounded-xl border border-dashed p-4">
          <legend className="px-1 text-sm font-semibold">
            {marital === 'union_civil' ? 'Conviviente civil' : 'Cónyuge'}
          </legend>
          <div className="grid gap-4 sm:grid-cols-6">
            {text('spouse', 'fullName', 'Nombre completo', { className: 'sm:col-span-4' })}
            {text('spouse', 'rut', 'RUT', { className: 'sm:col-span-2', rut: true })}
            {text('spouse', 'nationality', 'Nacionalidad', { className: 'sm:col-span-2' })}
            {text('spouse', 'profession', 'Profesión u oficio', { className: 'sm:col-span-4' })}
            {text('spouse', 'address', 'Dirección', { className: 'sm:col-span-4' })}
            {text('spouse', 'commune', 'Comuna', { className: 'sm:col-span-2' })}
            {text('spouse', 'phone', 'Celular', { type: 'tel', inputMode: 'tel', className: 'sm:col-span-2' })}
            {text('spouse', 'email', 'E-mail', { type: 'email', inputMode: 'email', className: 'sm:col-span-4' })}
          </div>
        </fieldset>
      )}
    </div>
  );
};

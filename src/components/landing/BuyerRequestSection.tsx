import { FormEvent, useRef, useState } from "react";
import { ArrowUpRight, Check, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateMeetingRequest } from "@/hooks/useMeetings";

/** Reuses the public commercial meeting inbox; no parallel lead store or claimed booking. */
export default function BuyerRequestSection() {
  const request = useCreateMeetingRequest();
  const submitting = useRef(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    zone: "",
    budget: "",
  });
  const set = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setError(null);
    try {
      await request.mutateAsync({
        meetingType: "reunion_comercial",
        requesterName: form.name.trim(),
        requesterPhone: form.phone.trim(),
        context: `Busca una parcela. Zona: ${form.zone.trim() || "Por definir"}. Presupuesto: ${form.budget || "Por definir"}. Autoriza contacto sobre esta solicitud.`,
        source: "portada_asesoria",
      });
      setSent(true);
    } catch {
      setError(
        "No pudimos enviar tu solicitud. Tus datos siguen aquí; vuelve a intentarlo.",
      );
    } finally {
      submitting.current = false;
    }
  };
  return (
    <section
      id="encuentra-tu-parcela"
      className="scroll-mt-20 border-y bg-secondary/50 py-10 sm:py-14 lg:py-16"
      aria-labelledby="buyer-request-title"
    >
      <div className="container grid gap-8 px-4 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div className="max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Hablemos de lo que buscas
          </p>
          <h2
            id="buyer-request-title"
            className="mt-3 font-editorial text-4xl font-medium leading-tight tracking-tight sm:text-5xl"
          >
            Tu idea de parcela.
            <br />
            <span className="text-primary">Nuestro punto de partida.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Cuéntanos dónde te gustaría estar y cuánto quieres invertir. Deja tu
            contacto para conversar con el equipo comercial.
          </p>
          <div className="mt-6 flex items-start gap-3 border-t pt-5 text-sm">
            <MessageCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p>
              Sin crear una cuenta.
              <br />
              <span className="text-muted-foreground">
                Tú decides cuándo dar el siguiente paso.
              </span>
            </p>
          </div>
        </div>
        <div className="min-w-0 rounded-2xl border bg-card p-5 sm:p-7">
          {sent ? (
            <div
              role="status"
              className="flex min-h-64 flex-col items-start justify-center"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Check aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-editorial text-2xl">
                Solicitud recibida
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                El equipo comercial recibió tus preferencias y tu teléfono para
                contactarte. Esto no confirma una visita ni reserva una parcela.
              </p>
            </div>
          ) : (
            <form
              onSubmit={submit}
              aria-label="Solicitar orientación para comprar"
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="buyer-name"
                    className="mb-2 block text-xs font-semibold"
                  >
                    Tu nombre *
                  </label>
                  <Input
                    id="buyer-name"
                    autoComplete="name"
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="h-11 text-base"
                    placeholder="¿Cómo te llamas?"
                  />
                </div>
                <div>
                  <label
                    htmlFor="buyer-phone"
                    className="mb-2 block text-xs font-semibold"
                  >
                    Teléfono / WhatsApp *
                  </label>
                  <Input
                    id="buyer-phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    minLength={8}
                    maxLength={25}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className="h-11 text-base"
                    placeholder="+56 9..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="buyer-zone"
                    className="mb-2 block text-xs font-semibold"
                  >
                    Zona que te interesa
                  </label>
                  <Input
                    id="buyer-zone"
                    maxLength={160}
                    value={form.zone}
                    onChange={(e) => set("zone", e.target.value)}
                    className="h-11 text-base"
                    placeholder="Comuna o región"
                  />
                </div>
                <div>
                  <label
                    htmlFor="buyer-budget"
                    className="mb-2 block text-xs font-semibold"
                  >
                    Tu presupuesto
                  </label>
                  <select
                    id="buyer-budget"
                    value={form.budget}
                    onChange={(e) => set("budget", e.target.value)}
                    className="h-11 w-full min-w-0 rounded-md border bg-background px-3 text-sm focus-ring"
                  >
                    <option value="">Lo estoy definiendo</option>
                    <option>Hasta $20 millones CLP</option>
                    <option>$20 a $40 millones CLP</option>
                    <option>$40 a $80 millones CLP</option>
                    <option>Más de $80 millones CLP</option>
                  </select>
                </div>
              </div>
              <label className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                Acepto que OfertaTerrenos me contacte por teléfono o WhatsApp
                sobre esta solicitud.
              </label>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={request.isPending}
                className="h-12 w-full rounded-xl"
              >
                {request.isPending ? (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                Quiero que me contacten{" "}
                <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

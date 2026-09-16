import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import { VEL_PROJECT } from '../data/project';
import { useVelLots } from '../data/useVelLots';
import { VEL_CONTACT, whatsappDigits } from '../data/commercial';
import VelLeadForm from '../components/VelLeadForm';

const WHATSAPP_TEXT = encodeURIComponent('Hola, me interesa Valle Escondido Licantén');

export default function VelContacto() {
  const { lots } = useVelLots();
  const availableLots = useMemo(
    () => lots.filter((lot) => lot.status === 'available').length,
    [lots],
  );
  const wa = whatsappDigits(VEL_CONTACT.whatsapp);
  const waHref = wa ? `https://wa.me/${wa}?text=${WHATSAPP_TEXT}` : '';

  return (
    <section id="contacto" className="relative scroll-mt-16 px-6 py-24 md:px-16">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="text-center"
        >
          <div className="hue-eyebrow mb-4">Contacto directo</div>
          <h2 className="serif text-[clamp(2.2rem,5vw,3.4rem)] leading-tight">
            Agenda tu visita{' '}
            <span className="italic text-[var(--hue-bone)]/55">a Valle Escondido.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--hue-bone)]/65">
            Coordinamos visitas guiadas al loteo en Licantén y respondemos consultas sobre las{' '}
            {availableLots} parcelas disponibles, formas de pago, reserva y documentación legal.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.2fr]">
          <div className="grid content-start gap-4">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 rounded-sm border border-white/10 bg-white/[0.02] p-5 transition hover:border-[var(--hue-amber)]/40 hover:bg-white/[0.05]"
              >
                <MessageCircle className="h-5 w-5 text-[var(--hue-amber)]" />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--hue-bone)]/55">
                    WhatsApp
                  </div>
                  <div className="text-[var(--hue-bone)]">Escribir por WhatsApp</div>
                </div>
              </a>
            )}

            {VEL_CONTACT.phone && (
              <a
                href={`tel:${VEL_CONTACT.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-4 rounded-sm border border-white/10 bg-white/[0.02] p-5 transition hover:border-[var(--hue-amber)]/40 hover:bg-white/[0.05]"
              >
                <Phone className="h-5 w-5 text-[var(--hue-amber)]" />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--hue-bone)]/55">
                    Teléfono
                  </div>
                  <div className="text-[var(--hue-bone)]">{VEL_CONTACT.phone}</div>
                </div>
              </a>
            )}

            <a
              href={`mailto:${VEL_CONTACT.email}?subject=Consulta%20Valle%20Escondido%20Licant%C3%A9n`}
              className="flex items-center gap-4 rounded-sm border border-white/10 bg-white/[0.02] p-5 transition hover:border-[var(--hue-amber)]/40 hover:bg-white/[0.05]"
            >
              <Mail className="h-5 w-5 text-[var(--hue-amber)]" />
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--hue-bone)]/55">
                  Email
                </div>
                <div className="break-all text-[var(--hue-bone)]">{VEL_CONTACT.email}</div>
              </div>
            </a>
          </div>

          <div className="rounded-sm border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <div className="mb-5">
              <div className="hue-eyebrow mb-2">Formulario</div>
              <h3 className="serif text-2xl text-[var(--hue-bone)]">Déjanos tus datos</h3>
              <p className="mt-1 text-[12px] text-[var(--hue-bone)]/55">
                Indica motivo y presupuesto para que el asesor llegue preparado.
              </p>
            </div>
            <VelLeadForm />
          </div>
        </div>
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import { EXPLORA_PARK_PROJECT } from '../data/project';
import EpLeadForm from '../components/EpLeadForm';

export default function EpContact() {
  return (
    <section id="contacto" className="relative px-6 py-24 md:px-16 scroll-mt-16">
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
            Agenda tu visita <span className="italic text-[var(--hue-bone)]/55">a Explora Park.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[var(--hue-bone)]/65 max-w-2xl mx-auto">
            Nuestro equipo comercial coordina visitas guiadas al proyecto en Hualañé y responde
            consultas sobre {EXPLORA_PARK_PROJECT.availableLots} parcelas disponibles, formas de pago
            y documentación legal.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.2fr]">
          {/* Quick channels */}
          <div className="grid gap-4 content-start">
            <a
              href="https://wa.me/56900000000?text=Hola,%20me%20interesa%20Explora%20Park"
              target="_blank"
              rel="noreferrer"
              className="group rounded-sm border border-white/10 bg-white/[0.02] p-5 hover:border-[var(--hue-amber)]/40 hover:bg-white/[0.05] transition flex items-center gap-4"
            >
              <MessageCircle className="h-5 w-5 text-[var(--hue-amber)]" />
              <div>
                <div className="text-[10px] tracking-[0.28em] uppercase text-[var(--hue-bone)]/55">WhatsApp</div>
                <div className="text-[var(--hue-bone)]">Escribir por WhatsApp</div>
              </div>
            </a>
            <a
              href="tel:+56900000000"
              className="group rounded-sm border border-white/10 bg-white/[0.02] p-5 hover:border-[var(--hue-amber)]/40 hover:bg-white/[0.05] transition flex items-center gap-4"
            >
              <Phone className="h-5 w-5 text-[var(--hue-amber)]" />
              <div>
                <div className="text-[10px] tracking-[0.28em] uppercase text-[var(--hue-bone)]/55">Teléfono</div>
                <div className="text-[var(--hue-bone)]">+56 9 0000 0000</div>
              </div>
            </a>
            <a
              href="mailto:contacto@ofertaterrenos.com?subject=Consulta%20Explora%20Park"
              className="group rounded-sm border border-white/10 bg-white/[0.02] p-5 hover:border-[var(--hue-amber)]/40 hover:bg-white/[0.05] transition flex items-center gap-4"
            >
              <Mail className="h-5 w-5 text-[var(--hue-amber)]" />
              <div>
                <div className="text-[10px] tracking-[0.28em] uppercase text-[var(--hue-bone)]/55">Email</div>
                <div className="text-[var(--hue-bone)] break-all">contacto@ofertaterrenos.com</div>
              </div>
            </a>
          </div>

          {/* Lead form */}
          <div className="rounded-sm border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <div className="mb-5">
              <div className="hue-eyebrow mb-2">Formulario</div>
              <h3 className="serif text-2xl text-[var(--hue-bone)]">Déjanos tus datos</h3>
              <p className="mt-1 text-[12px] text-[var(--hue-bone)]/55">
                Indica motivo y rango de presupuesto para que el asesor llegue preparado.
              </p>
            </div>
            <EpLeadForm />
          </div>
        </div>
      </div>
    </section>
  );
}

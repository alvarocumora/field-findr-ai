import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PaContact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = encodeURIComponent(
      `Nombre: ${fd.get('name')}\nEmail: ${fd.get('email')}\nTeléfono: ${fd.get('phone')}\nInterés: ${fd.get('interest')}\nMensaje: ${fd.get('message')}`
    );
    window.location.href = `mailto:contacto@ofertaterrenos.com?subject=Playa%20Álvaro%20-%20Solicitud%20de%20información&body=${body}`;
    setSent(true);
  };

  return (
    <section className="relative overflow-hidden px-6 py-32 md:px-16">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050908] via-[#050908]/90 to-[#050908]" />

      <div className="relative mx-auto grid max-w-6xl gap-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="hue-eyebrow mb-4">Cupos limitados · Etapa 1</div>
          <h2 className="serif text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.95]">
            Solicitar <br />
            <span className="italic text-[var(--hue-bone)]/60">brochure comercial.</span>
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--hue-bone)]/65">
            Recibe el plano oficial, precios actualizados por lote, condiciones de reserva
            y agenda visita guiada al predio.
          </p>

          <div className="hue-divider my-10" />

          <div className="space-y-6 text-sm text-[var(--hue-bone)]/75">
            <div>
              <div className="hue-eyebrow mb-1">Ubicación</div>
              Costa Pacífico · Región de Los Lagos, Chile
            </div>
            <div>
              <div className="hue-eyebrow mb-1">Reservas</div>
              Online con pago Mercado Pago · validación 24h
            </div>
            <div>
              <div className="hue-eyebrow mb-1">Contacto directo</div>
              contacto@ofertaterrenos.com · +56 9 0000 0000
            </div>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="space-y-5"
        >
          <Field name="name" label="Nombre completo" required />
          <div className="grid gap-5 md:grid-cols-2">
            <Field name="email" label="Email" type="email" required />
            <Field name="phone" label="Teléfono" />
          </div>
          <div>
            <label className="hue-eyebrow mb-2 block">Interés principal</label>
            <select
              name="interest"
              className="w-full border-b border-[var(--hue-bone)]/20 bg-transparent py-3 text-sm text-[var(--hue-bone)] focus:border-[var(--hue-amber)] focus:outline-none"
            >
              <option value="parcela_05" className="bg-black">Parcela 0,5 — 1 ha</option>
              <option value="parcela_2_5" className="bg-black">Parcela 2 — 5 ha</option>
              <option value="parcela_10_20" className="bg-black">Lote grande 10 — 20 ha</option>
              <option value="macrolote" className="bg-black">Macrolote 20+ ha (inversionista)</option>
              <option value="info" className="bg-black">Información general</option>
            </select>
          </div>
          <Field name="message" label="Mensaje" textarea />

          <button
            type="submit"
            className="group mt-4 inline-flex items-center gap-4 border border-[var(--hue-amber)]/50 px-8 py-4 text-xs uppercase tracking-[0.24em] text-[var(--hue-bone)] transition-all hover:bg-[var(--hue-amber)] hover:text-[#050908]"
          >
            {sent ? 'Enviado ✓' : 'Solicitar brochure'}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </motion.form>
      </div>
    </section>
  );
}

function Field({
  name, label, type = 'text', required, textarea,
}: { name: string; label: string; type?: string; required?: boolean; textarea?: boolean }) {
  return (
    <div>
      <label className="hue-eyebrow mb-2 block">{label}{required && <span className="text-[var(--hue-amber)]"> *</span>}</label>
      {textarea ? (
        <textarea
          name={name}
          rows={4}
          className="w-full border-b border-[var(--hue-bone)]/20 bg-transparent py-3 text-sm text-[var(--hue-bone)] focus:border-[var(--hue-amber)] focus:outline-none resize-none"
        />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          className="w-full border-b border-[var(--hue-bone)]/20 bg-transparent py-3 text-sm text-[var(--hue-bone)] focus:border-[var(--hue-amber)] focus:outline-none"
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { LOTES } from '../data/lotes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

export default function FveContacto() {
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', lote: '', mensaje: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      `Consulta Forestal Valle Escondido${form.lote ? ` — Lote ${form.lote}` : ''}`
    );
    const body = encodeURIComponent(
      `Nombre: ${form.nombre}\nEmail: ${form.email}\nTeléfono: ${form.telefono}\nLote de interés: ${form.lote || '—'}\n\nMensaje:\n${form.mensaje}`
    );
    window.location.href = `mailto:ventas@ofertaterrenos.cl?subject=${subject}&body=${body}`;
  };

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section
      id="contacto"
      className="fve-no-print py-24 md:py-32"
      style={{ background: 'hsl(var(--fve-forest-deep))', color: 'hsl(var(--fve-offwhite))' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
          10 · Contacto
        </p>
        <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight max-w-3xl mb-14 text-white">
          Conversemos.
        </h2>

        <div className="grid lg:grid-cols-12 gap-12">
          <form onSubmit={submit} className="lg:col-span-7 grid md:grid-cols-2 gap-5">
            <div className="md:col-span-1">
              <Label htmlFor="c-nombre" className="text-white/70 text-xs uppercase tracking-wider">Nombre</Label>
              <Input id="c-nombre" required value={form.nombre} onChange={upd('nombre')} className="bg-white/5 border-white/20 text-white placeholder:text-white/40 mt-2" />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="c-email" className="text-white/70 text-xs uppercase tracking-wider">Email</Label>
              <Input id="c-email" type="email" required value={form.email} onChange={upd('email')} className="bg-white/5 border-white/20 text-white placeholder:text-white/40 mt-2" />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="c-tel" className="text-white/70 text-xs uppercase tracking-wider">Teléfono</Label>
              <Input id="c-tel" value={form.telefono} onChange={upd('telefono')} placeholder="+56 9 ..." className="bg-white/5 border-white/20 text-white placeholder:text-white/40 mt-2" />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="c-lote" className="text-white/70 text-xs uppercase tracking-wider">Lote de interés</Label>
              <select
                id="c-lote" value={form.lote} onChange={upd('lote')}
                className="mt-2 flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="" className="text-black">Sin preferencia</option>
                {LOTES.map((l) => (
                  <option key={l.numero} value={l.numero} className="text-black">
                    {l.numero} — {l.superficie.toLocaleString('es-CL')} m² · UF {l.precioUF.toLocaleString('es-CL')}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="c-msg" className="text-white/70 text-xs uppercase tracking-wider">Mensaje</Label>
              <Textarea id="c-msg" rows={5} value={form.mensaje} onChange={upd('mensaje')} className="bg-white/5 border-white/20 text-white placeholder:text-white/40 mt-2" />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="px-8 py-3.5 text-sm uppercase tracking-[0.18em] font-medium transition-all hover:translate-y-[-1px]"
                style={{ background: 'hsl(var(--fve-gold))', color: '#1A1A1A' }}
              >
                Enviar consulta
              </button>
            </div>
          </form>

          <aside className="lg:col-span-4 lg:col-start-9 space-y-7">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--fve-gold))] mb-3">
                Oficina comercial
              </div>
              <ul className="space-y-3 text-sm text-white/85">
                <li className="flex gap-3"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-white/60" /> StartupLab, Piso 3, Santiago de Chile</li>
                <li className="flex gap-3"><Phone className="w-4 h-4 mt-0.5 shrink-0 text-white/60" /> +56 2 2XXX XXXX</li>
                <li className="flex gap-3"><MessageCircle className="w-4 h-4 mt-0.5 shrink-0 text-white/60" /> WhatsApp Business +56 9 XXXX XXXX</li>
                <li className="flex gap-3"><Mail className="w-4 h-4 mt-0.5 shrink-0 text-white/60" /> ventas@ofertaterrenos.cl</li>
              </ul>
            </div>

            <div className="pt-6 border-t border-white/15">
              <div className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--fve-gold))] mb-3">
                Inversionistas y financiadores
              </div>
              <a href="mailto:ir@ofertaterrenos.cl" className="text-base text-white underline underline-offset-4 decoration-[hsl(var(--fve-gold))]">
                ir@ofertaterrenos.cl
              </a>
              <p className="text-xs text-white/55 mt-2">
                Memoria de inversión y modelo financiero bajo NDA.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

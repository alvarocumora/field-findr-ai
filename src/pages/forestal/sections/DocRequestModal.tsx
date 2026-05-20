import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docTitle: string;
}

export default function DocRequestModal({ open, onOpenChange, docTitle }: Props) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [mensaje, setMensaje] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Solicitud de documento — ${docTitle}`);
    const body = encodeURIComponent(
      `Solicitante: ${nombre}\nEmail: ${email}\nEmpresa: ${empresa}\n\nDocumento solicitado: ${docTitle}\n\nMensaje:\n${mensaje}`
    );
    window.location.href = `mailto:ir@ofertaterrenos.cl?subject=${subject}&body=${body}`;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif-fve text-2xl">Solicitar documento</DialogTitle>
          <DialogDescription>
            {docTitle}. La solicitud será atendida por el equipo de Investor Relations.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 mt-2">
          <div>
            <Label htmlFor="dr-nombre">Nombre</Label>
            <Input id="dr-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dr-email">Email</Label>
            <Input id="dr-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dr-empresa">Empresa / institución</Label>
            <Input id="dr-empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dr-mensaje">Propósito de la solicitud</Label>
            <Textarea id="dr-mensaje" rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
          </div>
          <button
            type="submit"
            className="w-full px-5 py-3 text-sm uppercase tracking-[0.18em] font-medium mt-2"
            style={{ background: 'hsl(var(--fve-forest))', color: 'white' }}
          >
            Enviar solicitud
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

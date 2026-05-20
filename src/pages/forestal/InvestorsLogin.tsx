import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './forestal.css';

export default function InvestorsLogin() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Acceso próximamente',
      description: 'Para acceso al data room contacte a ir@ofertaterrenos.cl',
    });
  };

  return (
    <div
      className="fve-theme min-h-screen flex flex-col"
      style={{ background: 'hsl(var(--fve-forest-deep))' }}
    >
      <div className="p-6 lg:p-10">
        <Link
          to="/forestal-valle-escondido"
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al sitio
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-5 border border-white/20">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-serif-fve text-3xl text-white">Acceso Inversionistas</h1>
            <p className="text-sm text-white/60 mt-3">
              Data room privado · Forestal Valle Escondido
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5 bg-white/[0.04] border border-white/10 p-8">
            <div>
              <Label htmlFor="i-email" className="text-white/70 text-xs uppercase tracking-wider">Email institucional</Label>
              <Input
                id="i-email" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="i-pass" className="text-white/70 text-xs uppercase tracking-wider">Contraseña</Label>
              <Input
                id="i-pass" type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 mt-2"
              />
            </div>
            <button
              type="submit"
              className="w-full px-7 py-3.5 text-sm uppercase tracking-[0.18em] font-medium transition-all"
              style={{ background: 'hsl(var(--fve-gold))', color: '#1A1A1A' }}
            >
              Ingresar
            </button>
            <p className="text-xs text-white/55 text-center pt-2">
              ¿Sin credenciales? Solicítelas a{' '}
              <a href="mailto:ir@ofertaterrenos.cl" className="text-white underline underline-offset-4">
                ir@ofertaterrenos.cl
              </a>
            </p>
          </form>
        </div>
      </div>

      <div className="p-6 text-center text-xs text-white/40">
        Forestal Valle Escondido SpA · Parte de Inversiones Bioenergy SpA
      </div>
    </div>
  );
}

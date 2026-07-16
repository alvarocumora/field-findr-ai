import { Mail, Phone, MapPin, Linkedin, Twitter, Instagram, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '@/components/brand/Logo';
import { useLandingStats } from '@/hooks/useLandingStats';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';

const FooterSection = () => {
  const currentYear = new Date().getFullYear();
  const { data: stats } = useLandingStats();
  const { isAdmin } = useSmartRedirect();

  const links = {
    platform: [
      { name: 'Explorar terrenos', href: '/explorar' },
      { name: 'Herramientas IA', href: '/tools' },
      { name: 'Planes', href: '/pricing' },
      { name: 'Instalar App', href: '/instalar' },
    ],
    investors: [
      { name: 'Comparador territorial', href: '/comparar' },
      { name: 'Quiz de inversión', href: '/quiz' },
      { name: 'Calculadoras', href: '/tools' },
      { name: 'Blog', href: '/blog' },
    ],
    regions: [
      { name: 'Valparaíso', href: '/region/valparaiso' },
      { name: 'O\'Higgins', href: '/region/ohiggins' },
      { name: 'Maule', href: '/region/maule' },
      { name: 'Biobío', href: '/region/biobio' },
      { name: 'La Araucanía', href: '/region/araucania' },
      { name: 'Los Lagos', href: '/region/los-lagos' },
    ],
    pro: [
      { name: 'Para Corredores', href: '/pricing' },
      { name: 'Registrarse', href: '/auth' },
      { name: 'Contacto', href: '/contacto' },
    ],
    legal: [
      { name: 'Términos de uso', href: '/contacto' },
      { name: 'Privacidad', href: '/contacto' },
    ],
  };

  return (
    <footer className="relative border-t border-border/50 bg-background">
      <div className="container px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <Logo size="md" />
            </Link>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              La plataforma de inteligencia territorial más avanzada de Chile.
            </p>

            {/* Live counter */}
            {stats && stats.totalListings > 0 && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-foreground font-medium">
                  {stats.totalListings} terrenos disponibles
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Datos verificados por SII
            </div>

            <div className="flex gap-3">
              {[Linkedin, Twitter, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Plataforma</h4>
            <ul className="space-y-2.5">
              {links.platform.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Investors */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Para Inversionistas</h4>
            <ul className="space-y-2.5">
              {links.investors.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Regions */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Regiones</h4>
            <ul className="space-y-2.5">
              {links.regions.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Contacto</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:ventas@ofertaterrenos.com" className="hover:text-primary transition-colors">ventas@ofertaterrenos.com</a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:+56983823005" className="hover:text-primary transition-colors">+56 9 8382 3005</a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                Cerro El Plomo 5420, Las Condes
              </li>
            </ul>

            <h4 className="font-semibold text-foreground mb-3 mt-6 text-sm">Profesionales</h4>
            <ul className="space-y-2.5">
              {links.pro.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Ofertaterrenos. Todos los derechos reservados.
          </p>
          <ul className="flex items-center gap-6">
            {links.legal.map((link) => (
              <li key={link.name}>
                <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.name}</Link>
              </li>
            ))}
            {isAdmin && (
              <li>
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground/70 hover:text-primary transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

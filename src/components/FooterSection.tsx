import { Mail, Phone, MapPin, Linkedin, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '@/components/brand/Logo';

const FooterSection = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    platform: [
      { name: 'Explorar terrenos', href: '/explorar' },
      { name: 'Proyectos de loteo', href: '/explorar' },
      { name: 'Precios', href: '/pricing' },
    ],
    company: [
      { name: 'Sobre nosotros', href: '#' },
      { name: 'Contacto', href: '/contacto' },
    ],
    legal: [
      { name: 'Términos de uso', href: '#' },
      { name: 'Privacidad', href: '#' },
    ],
  };

  return (
    <footer className="relative border-t border-border/50 bg-background">
      <div className="container px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <Logo size="md" />
            </Link>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              La plataforma más avanzada para comercializar proyectos de loteo con inteligencia artificial.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Plataforma</h4>
            <ul className="space-y-3">
              {links.platform.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Contacto</h4>
            <ul className="space-y-3">
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
                Cerro El Plomo 5420, Las Condes, Santiago
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Ofertaterrenos. Todos los derechos reservados.
          </p>
          <ul className="flex gap-6">
            {links.legal.map((link) => (
              <li key={link.name}>
                <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

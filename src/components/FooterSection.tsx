import { Mountain, Mail, Phone, MapPin, Linkedin, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

const FooterSection = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    platform: [
      { name: 'Explorar terrenos', href: '/search' },
      { name: 'Herramientas IA', href: '/tools' },
      { name: 'Predictor de precios', href: '/price-predictor' },
      { name: 'Análisis de riesgos', href: '/risk-analysis' },
    ],
    company: [
      { name: 'Sobre nosotros', href: '#' },
      { name: 'Carreras', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Contacto', href: '#' },
    ],
    legal: [
      { name: 'Términos de uso', href: '#' },
      { name: 'Privacidad', href: '#' },
      { name: 'Cookies', href: '#' },
    ],
  };

  return (
    <footer className="relative border-t border-white/5 bg-background">
      <div className="container px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Mountain className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Ofertaterrenos</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              La plataforma más avanzada para invertir en terrenos con inteligencia artificial.
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

          {/* Platform Links */}
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

          {/* Company Links */}
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

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                hola@ofertaterrenos.cl
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                +56 2 2345 6789
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Santiago, Chile
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-white/5">
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

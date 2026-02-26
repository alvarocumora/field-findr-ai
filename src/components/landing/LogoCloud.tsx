import { motion, useReducedMotion } from 'framer-motion';

const PARTNERS = [
  { name: 'Conservador de Bienes Raíces', abbr: 'CBR' },
  { name: 'Servicio de Impuestos Internos', abbr: 'SII' },
  { name: 'IDE Chile', abbr: 'IDE' },
  { name: 'MercadoPago', abbr: 'MP' },
  { name: 'Mapbox', abbr: 'Mapbox' },
  { name: 'Google AI', abbr: 'Google AI' },
];

const LogoCloud = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-10 border-y border-border/30">
      <div className="container px-4">
        <p className="text-xs text-center text-muted-foreground uppercase tracking-widest mb-6">
          Integrado con las mejores plataformas
        </p>
        <motion.div
          className="flex flex-wrap justify-center items-center gap-6 md:gap-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {PARTNERS.map((partner) => (
            <motion.div
              key={partner.name}
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border/30"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{partner.abbr.slice(0, 2)}</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">{partner.name}</span>
              <span className="text-sm font-medium text-muted-foreground sm:hidden">{partner.abbr}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LogoCloud;

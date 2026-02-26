import { memo } from 'react';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { LATAM_COUNTRIES } from '@/lib/latam';
import { useNavigate } from 'react-router-dom';

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } } as const;
const item = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } } } as const;

const COUNTRY_IMAGES: Record<string, string> = {
  CL: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop',
  AR: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&h=400&fit=crop',
  CO: 'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=600&h=400&fit=crop',
  MX: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=600&h=400&fit=crop',
  PE: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&h=400&fit=crop',
};

const COUNTRY_TAGLINES: Record<string, string> = {
  CL: 'Parcelas, campos y sitios desde Arica a Magallanes',
  AR: 'Campos, estancias y lotes en todas las provincias',
  CO: 'Fincas, lotes y predios en todo el territorio',
  MX: 'Terrenos, ranchos y predios de costa a costa',
  PE: 'Terrenos agrícolas y urbanos en todas las regiones',
};

const CountrySelector = memo(() => {
  const navigate = useNavigate();
  const countries = LATAM_COUNTRIES.filter(c => ['CL', 'AR', 'CO', 'MX'].includes(c.code));

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="outline" className="border-primary/30 text-primary mb-4">
            <Globe className="h-3 w-3 mr-1.5" />
            Expansión LATAM
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
            Terrenos en toda <span className="gradient-text">Latinoamérica</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
            Explora oportunidades de inversión en los mercados más dinámicos de la región
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {countries.map((country) => (
            <motion.button
              key={country.code}
              variants={item}
              whileHover={{ y: -6 }}
              onClick={() => navigate(`/pais/${country.code.toLowerCase()}`)}
              className="group relative text-left rounded-2xl overflow-hidden border border-border/50 h-52 md:h-64 shadow-sm hover:shadow-xl transition-shadow"
            >
              <img
                src={COUNTRY_IMAGES[country.code] || ''}
                alt={`Terrenos en ${country.name}`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

              <div className="relative z-10 flex flex-col justify-end h-full p-5">
                <span className="text-3xl mb-2">{country.flag}</span>
                <h3 className="text-lg font-bold text-foreground mb-1">{country.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {COUNTRY_TAGLINES[country.code]}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                    {country.regions.length} regiones
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {country.currencies[0].code}
                  </Badge>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

CountrySelector.displayName = 'CountrySelector';
export default CountrySelector;

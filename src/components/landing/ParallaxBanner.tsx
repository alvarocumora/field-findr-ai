import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import parallaxImg from '@/assets/parallax-banner.jpg';

const ParallaxBanner = () => {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <section ref={ref} className="relative h-[50vh] md:h-[60vh] overflow-hidden">
      <motion.div
        className="absolute inset-0 -top-[20%] h-[140%]"
        style={prefersReducedMotion ? {} : { y }}
      >
        <img
          src={parallaxImg}
          alt="Vista aérea de terrenos en Chile"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </motion.div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-sm md:text-base uppercase tracking-widest text-primary font-semibold mb-3"
        >
          La plataforma líder en Chile
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground max-w-3xl"
        >
          Miles de hectáreas esperan por ti
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-muted-foreground text-lg md:text-xl mt-4 max-w-xl"
        >
          Datos verificados, análisis predictivo y reserva 100% digital
        </motion.p>
      </div>
    </section>
  );
};

export default ParallaxBanner;

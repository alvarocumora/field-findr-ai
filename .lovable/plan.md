

# Mejorar Landing Page con Imagenes y Animaciones WOW

## Resumen
Transformar la landing page de una experiencia mayormente textual a una experiencia visual inmersiva con imagenes de paisajes chilenos, animaciones de scroll con framer-motion, y efectos parallax que generen impacto desde el primer segundo.

## Cambios Principales

### 1. Hero Section con Imagen de Fondo y Parallax
- Agregar imagen de fondo de paisaje chileno (terreno/campo) usando Unsplash
- Efecto parallax sutil con framer-motion `useScroll` + `useTransform`
- El texto se mueve a diferente velocidad que el fondo al hacer scroll
- Animaciones de entrada escalonadas con `motion.div` en vez de CSS classes

### 2. Seccion "Como Funciona" con Animaciones de Scroll
- Cada paso aparece con `whileInView` de framer-motion
- Los iconos hacen una animacion de "pop" al entrar en viewport
- La linea conectora se anima progresivamente de izquierda a derecha
- Imagenes ilustrativas al lado de cada paso (alternando izquierda/derecha en desktop)

### 3. Seccion de Regiones con Imagenes de Fondo
- Cada tarjeta de region tiene una imagen de fondo representativa del paisaje de esa region
- Overlay con gradiente oscuro para legibilidad
- Efecto hover con zoom sutil en la imagen
- Animacion staggered al entrar en viewport

### 4. Seccion "Featured Projects" con Imagenes Hero
- Las tarjetas de proyecto muestran imagen del masterplan o galeria si existe
- Layout tipo "bento grid" donde la primera tarjeta es mas grande
- Animacion de entrada con scale + fade

### 5. Seccion "Terrenos Destacados" con Animaciones
- Cada ListingCard entra con animacion staggered usando `motion.div`
- Efecto parallax ligero en el contenedor

### 6. Nueva Seccion: Banner Visual con Parallax
- Entre secciones, agregar un banner a ancho completo con imagen de paisaje
- Texto superpuesto con estadistica impactante
- Efecto parallax en la imagen al hacer scroll

### 7. Trust Badges con Animacion de Entrada
- Los badges se animan secuencialmente al entrar en viewport
- Efecto de "count up" en numeros

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Index.tsx` | Agregar framer-motion, reorganizar secciones, agregar banner parallax |
| `src/components/landing/HowItWorks.tsx` | Animaciones whileInView con framer-motion, imagenes ilustrativas |
| `src/components/landing/RegionCards.tsx` | Imagenes de fondo por region, animaciones de entrada |
| `src/components/landing/FeaturedProjects.tsx` | Animaciones de entrada, layout mejorado con imagenes |
| `src/components/landing/TrustBadges.tsx` | Animaciones de scroll con framer-motion |
| `src/components/landing/HeroStats.tsx` | Animaciones mejoradas con motion |
| `src/components/landing/ParallaxBanner.tsx` | NUEVO - Banner visual con efecto parallax |

## Seccion Tecnica

### Imagenes de Unsplash utilizadas
- Hero: Paisaje agricola/campo chileno (landscape)
- Banner parallax: Vista aerea de terrenos
- Regiones: Imagenes genericas de paisajes naturales (lagos, montanas, costa, campo)

### Framer Motion - Patrones utilizados
- `useScroll` + `useTransform` para parallax en Hero y Banner
- `motion.div` con `whileInView` para animaciones de scroll en todas las secciones
- `staggerChildren` en variantes para animaciones escalonadas en grids
- `viewport={{ once: true, margin: '-80px' }}` para trigger optimizado

### ParallaxBanner (nuevo componente)
- Imagen a ancho completo con `object-cover`
- `useScroll({ target: ref })` para rastrear posicion del contenedor
- `useTransform(scrollYProgress, [0, 1], ['0%', '20%'])` para mover imagen
- Overlay con gradiente y texto/estadistica central

### Respeta prefers-reduced-motion
- Todas las animaciones verifican `prefers-reduced-motion` mediante `useReducedMotion()` de framer-motion
- Si el usuario prefiere menos movimiento, las animaciones se desactivan


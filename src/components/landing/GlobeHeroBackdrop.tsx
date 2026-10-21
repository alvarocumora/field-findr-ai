import { lazy, Suspense, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import globeImage from '@/assets/brand/ot-globe-wide.jpg';

// Do not load Mapbox until the hero mounts. Its map is optional; the bundled
// globe image is always rendered to avoid an empty hero on iOS or token errors.
const InteractiveEarth = lazy(() => import('./InteractiveEarth'));

const GlobeHeroBackdrop = () => {
  const reducedMotion = useReducedMotion();
  const [webglAvailable, setWebglAvailable] = useState(false);
  const [earthReady, setEarthReady] = useState(false);

  useEffect(() => {
    try {
      // Mapbox GL JS v3 requires WebGL2.
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      setWebglAvailable(Boolean(gl));
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      setWebglAvailable(false);
    }
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <img
        src={globeImage}
        alt=""
        aria-hidden="true"
        width={1920}
        height={1088}
        loading="eager"
        className={`absolute inset-0 h-full w-full object-cover object-[69%_center] transition-opacity duration-700 lg:object-[73%_center] ${earthReady ? 'opacity-35' : 'opacity-65'}`}
      />
      {webglAvailable && (
        <div
          className={`absolute inset-y-0 right-0 w-full transition-opacity duration-700 lg:w-[72%] ${earthReady ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <Suspense fallback={null}>
            <InteractiveEarth
              reducedMotion={Boolean(reducedMotion)}
              onReady={() => setEarthReady(true)}
            />
          </Suspense>
        </div>
      )}
      {/* Keep text and search usable without hiding the Earth on the right. */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/25 lg:via-background/80 lg:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-transparent to-background/90" />
    </div>
  );
};

export default GlobeHeroBackdrop;

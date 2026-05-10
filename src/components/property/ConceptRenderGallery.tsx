import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X } from 'lucide-react';
import render1 from '@/assets/teno-render/render-1.jpg';
import render2 from '@/assets/teno-render/render-2.jpg';
import render3 from '@/assets/teno-render/render-3.jpg';
import render4 from '@/assets/teno-render/render-4.jpg';

const RENDERS = [
  { src: render1, title: 'Vista aérea del packing', desc: 'Emplazamiento sobre el terreno con acceso a Ruta 5 Sur' },
  { src: render2, title: 'Andén de carga refrigerado', desc: 'Bahías de despacho con camiones reefer' },
  { src: render3, title: 'Cámara de frío + oficinas', desc: 'Módulo administrativo de 2 pisos adosado' },
  { src: render4, title: 'Estacionamiento de camiones', desc: 'Área de maniobras con báscula y portería' },
];

const ConceptRenderGallery = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Visión del Proyecto
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">Render conceptual — referencial</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Visualización generada con IA del potencial del terreno como packing frutícola. Las imágenes son referenciales y no constituyen un proyecto aprobado.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {RENDERS.map((r, i) => (
            <button
              key={i}
              onClick={() => setOpenIdx(i)}
              className="group relative aspect-[3/2] rounded-lg overflow-hidden ring-1 ring-border/50 hover:ring-primary/50 transition-all"
              aria-label={`Ver render: ${r.title}`}
            >
              <img
                src={r.src}
                alt={r.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
                <p className="text-white text-[11px] font-semibold leading-tight line-clamp-1">{r.title}</p>
                <p className="text-white/75 text-[9px] leading-tight line-clamp-1 hidden md:block">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>

      <Dialog open={openIdx !== null} onOpenChange={(o) => !o && setOpenIdx(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black border-none [&>button]:hidden">
          {openIdx !== null && (
            <div className="relative">
              <button
                onClick={() => setOpenIdx(null)}
                className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
              <img src={RENDERS[openIdx].src} alt={RENDERS[openIdx].title} className="w-full h-auto" />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white font-semibold">{RENDERS[openIdx].title}</p>
                <p className="text-white/80 text-sm">{RENDERS[openIdx].desc}</p>
                <p className="text-white/50 text-[10px] mt-1">Render conceptual generado con IA — referencial</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ConceptRenderGallery;

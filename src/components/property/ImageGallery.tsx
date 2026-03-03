import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn,
  Grid3X3
} from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const displayImages = images.length > 0 ? images : ['/placeholder.svg'];

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  }, [displayImages.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  }, [displayImages.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') setIsFullscreen(false);
  }, [nextImage, prevImage]);

  const sideImages = displayImages.slice(1, 5);

  return (
    <>
      {/* Airbnb-style Grid */}
      <div
        className="rounded-2xl overflow-hidden cursor-pointer group"
        onClick={() => setIsFullscreen(true)}
      >
        {displayImages.length >= 5 ? (
          /* 5+ images: main + 2x2 grid */
          <div className="grid grid-cols-2 gap-1.5 aspect-[16/9]">
            <div className="relative row-span-2 overflow-hidden">
              <img
                src={displayImages[0]}
                alt={`${title} - Imagen 1`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="grid grid-rows-2 gap-1.5">
              {sideImages.slice(0, 2).map((img, idx) => (
                <div key={idx} className="relative overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : displayImages.length >= 3 ? (
          /* 3-4 images: main + column */
          <div className="grid grid-cols-3 gap-1.5 aspect-[16/9]">
            <div className="relative col-span-2 overflow-hidden">
              <img
                src={displayImages[0]}
                alt={`${title} - Imagen 1`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="grid grid-rows-2 gap-1.5">
              {sideImages.slice(0, 2).map((img, idx) => (
                <div key={idx} className="relative overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 1-2 images: single hero */
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={displayImages[currentIndex]}
              alt={`${title} - Imagen ${currentIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Navigation Arrows for single image mode */}
            {displayImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 glass hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 glass hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Overlay controls */}
        <div className="relative">
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ marginTop: '-48px' }}>
            <Button
              variant="ghost"
              size="sm"
              className="glass hover:bg-white/30 text-white"
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
            >
              <ZoomIn className="h-4 w-4 mr-2" />
              Ver {displayImages.length} fotos
            </Button>
          </div>
          {displayImages.length > 5 && (
            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ marginTop: '-48px' }}>
              <Button
                variant="ghost"
                size="sm"
                className="glass hover:bg-white/30 text-white"
                onClick={(e) => { e.stopPropagation(); setShowGrid(true); }}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Todas las fotos
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 glass hover:bg-white/20 text-white"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            <img
              src={displayImages[currentIndex]}
              alt={`${title} - Imagen ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {displayImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 glass hover:bg-white/20 text-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 glass hover:bg-white/20 text-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Counter */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full glass text-white text-sm">
              {currentIndex + 1} / {displayImages.length}
            </div>

            {/* Thumbnails Strip */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto p-2 rounded-lg glass">
              {displayImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`
                    flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all
                    ${idx === currentIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}
                  `}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grid Modal */}
      <Dialog open={showGrid} onOpenChange={setShowGrid}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setShowGrid(false);
                  setIsFullscreen(true);
                }}
                className="aspect-[4/3] rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGallery;

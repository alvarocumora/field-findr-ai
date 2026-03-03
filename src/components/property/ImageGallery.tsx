import { useState, useCallback, useRef, TouchEvent } from 'react';
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

  // Swipe gesture state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

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

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) nextImage();
      else prevImage();
    }
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
          <div className="grid grid-cols-4 grid-rows-2 gap-1 h-[28vw] min-h-[260px] max-h-[480px]">
            <div className="relative col-span-2 row-span-2 overflow-hidden">
              <img
                src={displayImages[0]}
                alt={`${title} - 1`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            {sideImages.map((img, idx) => (
              <div key={idx} className="relative overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                {idx === 3 && displayImages.length > 5 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">+{displayImages.length - 5}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : displayImages.length >= 3 ? (
          <div className="grid grid-cols-3 gap-1 h-[28vw] min-h-[220px] max-h-[400px]">
            <div className="relative col-span-2 overflow-hidden">
              <img
                src={displayImages[0]}
                alt={`${title} - 1`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="grid grid-rows-2 gap-1">
              {sideImages.slice(0, 2).map((img, idx) => (
                <div key={idx} className="relative overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="relative aspect-[16/10] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={displayImages[currentIndex]}
              alt={`${title} - ${currentIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {displayImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Overlay CTA */}
        <div className="relative">
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ marginTop: '-48px' }}>
            <Button
              variant="secondary"
              size="sm"
              className="bg-background/80 backdrop-blur-sm hover:bg-background/95 shadow-md"
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
            >
              <ZoomIn className="h-4 w-4 mr-1.5" />
              Ver {displayImages.length} fotos
            </Button>
          </div>
          {displayImages.length > 5 && (
            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ marginTop: '-48px' }}>
              <Button
                variant="secondary"
                size="sm"
                className="bg-background/80 backdrop-blur-sm hover:bg-background/95 shadow-md"
                onClick={(e) => { e.stopPropagation(); setShowGrid(true); }}
              >
                <Grid3X3 className="h-4 w-4 mr-1.5" />
                Todas las fotos
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent 
          className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-black border-none rounded-none [&>button]:hidden"
          onKeyDown={handleKeyDown}
        >
          <div
            className="relative w-full h-full flex items-center justify-center select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Counter */}
            <div className="absolute top-4 left-4 z-50 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-white text-sm font-medium">
              {currentIndex + 1} / {displayImages.length}
            </div>

            {/* Main Image */}
            <img
              src={displayImages[currentIndex]}
              alt={`${title} - ${currentIndex + 1}`}
              className="max-w-[90vw] max-h-[80vh] object-contain"
              draggable={false}
            />

            {/* Nav Arrows */}
            {displayImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white h-12 w-12"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-7 w-7" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white h-12 w-12"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-7 w-7" />
                </Button>
              </>
            )}

            {/* Thumbnail Strip */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[90vw] overflow-x-auto p-2 rounded-xl bg-black/50 backdrop-blur-sm">
              {displayImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${
                    idx === currentIndex
                      ? 'border-white opacity-100 scale-110'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grid Modal */}
      <Dialog open={showGrid} onOpenChange={setShowGrid}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => { setCurrentIndex(idx); setShowGrid(false); setIsFullscreen(true); }}
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

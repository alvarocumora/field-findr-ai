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

  return (
    <>
      {/* Main Gallery */}
      <div className="space-y-3">
        {/* Main Image */}
        <div 
          className="relative aspect-[16/10] rounded-2xl overflow-hidden glass cursor-pointer group"
          onClick={() => setIsFullscreen(true)}
        >
          <img
            src={displayImages[currentIndex]}
            alt={`${title} - Imagen ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Navigation Arrows */}
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

          {/* Zoom Indicator */}
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="glass hover:bg-white/30 text-white"
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
            >
              <ZoomIn className="h-4 w-4 mr-2" />
              Ver galería
            </Button>
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full glass text-white text-sm">
            {currentIndex + 1} / {displayImages.length}
          </div>
        </div>

        {/* Thumbnails */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {displayImages.slice(0, 5).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`
                  flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all
                  ${idx === currentIndex 
                    ? 'border-primary ring-2 ring-primary/30' 
                    : 'border-transparent hover:border-white/30'
                  }
                `}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
            {displayImages.length > 5 && (
              <button
                onClick={() => setShowGrid(true)}
                className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-white/30 bg-muted/50 flex items-center justify-center"
              >
                <div className="text-center">
                  <Grid3X3 className="h-4 w-4 mx-auto text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">+{displayImages.length - 5}</span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 glass hover:bg-white/20 text-white"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Main Image */}
            <img
              src={displayImages[currentIndex]}
              alt={`${title} - Imagen ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Navigation */}
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

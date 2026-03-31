import { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, X, MessageCircle, MapPin, Maximize2, DollarSign, ChevronLeft } from 'lucide-react';
import { Listing } from '@/hooks/useListings';
import { useNavigate } from 'react-router-dom';
import InvestmentScoreBadge from '@/components/explore/InvestmentScoreBadge';

interface SwipeExplorerProps {
  listings: Listing[];
  onFavorite?: (listing: Listing) => void;
  onDismiss?: (listing: Listing) => void;
  onContact?: (listing: Listing) => void;
  onBack?: () => void;
}

const SWIPE_THRESHOLD = 100;

const SwipeExplorer = ({ listings, onFavorite, onDismiss, onContact, onBack }: SwipeExplorerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const favoriteOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const dismissOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const contactOpacity = useTransform(y, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const current = listings[currentIndex];
    if (!current) return;

    if (info.offset.x > SWIPE_THRESHOLD) {
      onFavorite?.(current);
      if ('vibrate' in navigator) navigator.vibrate(20);
      setCurrentIndex(i => i + 1);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onDismiss?.(current);
      setCurrentIndex(i => i + 1);
    } else if (info.offset.y < -SWIPE_THRESHOLD) {
      onContact?.(current);
      setCurrentIndex(i => i + 1);
    }
  }, [currentIndex, listings, onFavorite, onDismiss, onContact]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);

  if (currentIndex >= listings.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <p className="text-lg font-semibold">¡Has visto todos los terrenos!</p>
        <p className="text-sm text-muted-foreground">Vuelve más tarde para ver nuevas publicaciones.</p>
        <Button onClick={() => setCurrentIndex(0)} variant="outline">Ver de nuevo</Button>
      </div>
    );
  }

  const current = listings[currentIndex];
  const next = listings[currentIndex + 1];
  const imageUrl = current.images?.[0] || '/placeholder.svg';

  return (
    <div className="relative flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {listings.length}
        </span>
      </div>

      {/* Card Stack */}
      <div className="flex-1 relative px-4 pb-24">
        {/* Next card (behind) */}
        {next && (
          <div className="absolute inset-x-4 top-0 bottom-24">
            <Card className="h-full opacity-50 scale-95 overflow-hidden">
              <div className="h-full bg-muted" />
            </Card>
          </div>
        )}

        {/* Current card */}
        <motion.div
          className="absolute inset-x-4 top-0 bottom-0"
          style={{ x, y, rotate }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
        >
          <Card
            className="h-full overflow-hidden cursor-grab active:cursor-grabbing"
            onClick={() => navigate(`/propiedad/${current.id}`)}
          >
            {/* Image */}
            <div className="relative h-3/5">
              <img
                src={imageUrl}
                alt={current.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
              {/* Swipe indicators */}
              <motion.div
                style={{ opacity: favoriteOpacity }}
                className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
              >
                <Heart className="h-20 w-20 text-green-500 fill-green-500" />
              </motion.div>
              <motion.div
                style={{ opacity: dismissOpacity }}
                className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
              >
                <X className="h-20 w-20 text-red-500" />
              </motion.div>
              <motion.div
                style={{ opacity: contactOpacity }}
                className="absolute inset-0 bg-blue-500/20 flex items-center justify-center"
              >
                <MessageCircle className="h-20 w-20 text-blue-500" />
              </motion.div>

              <div className="absolute top-3 left-3">
                <Badge className="bg-background/80 text-foreground backdrop-blur-sm">{current.type}</Badge>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-lg line-clamp-1">{current.title}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {current.location}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-primary flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {formatPrice(current.price)}
                </span>
                {current.area_m2 && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Maximize2 className="h-4 w-4" />
                    {current.area_m2.toLocaleString()} m²
                  </span>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-6 pb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-2 border-destructive text-destructive"
          onClick={() => { onDismiss?.(current); setCurrentIndex(i => i + 1); }}
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-2 border-blue-500 text-blue-500"
          onClick={() => { onContact?.(current); setCurrentIndex(i => i + 1); }}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-2 border-green-500 text-green-500"
          onClick={() => { onFavorite?.(current); setCurrentIndex(i => i + 1); }}
        >
          <Heart className="h-6 w-6" />
        </Button>
      </div>

      {/* Hint */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <p className="text-[10px] text-muted-foreground">
          ← Descartar • ↑ Contactar • Favorito →
        </p>
      </div>
    </div>
  );
};

export default SwipeExplorer;

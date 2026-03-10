import { useState } from 'react';
import { Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StreetViewPreviewProps {
  lat: number;
  lng: number;
  className?: string;
}

const StreetViewPreview = ({ lat, lng, className }: StreetViewPreviewProps) => {
  const [expanded, setExpanded] = useState(false);

  const streetViewUrl = `https://www.google.com/maps/embed?pb=!4v${Date.now()}!6m8!1m7!1s!2m2!1d${lat}!2d${lng}!3f0!4f0!5f0.7820865974627469`;
  const staticUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x200&location=${lat},${lng}&heading=0&pitch=0`;

  if (!expanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(true)}
        className={cn(
          'gap-2 text-xs bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/60 border border-white/10',
          className
        )}
      >
        <Navigation className="h-3.5 w-3.5" />
        Street View
      </Button>
    );
  }

  return (
    <div className={cn('relative rounded-xl overflow-hidden border border-white/10 shadow-xl', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setExpanded(false)}
        className="absolute top-2 right-2 z-10 h-7 w-7 bg-black/60 text-white hover:bg-black/80 rounded-full"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
      <iframe
        src={`https://www.google.com/maps/embed/v1/streetview?key=&location=${lat},${lng}&heading=0&pitch=0`}
        width="100%"
        height="200"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Street View"
      />
    </div>
  );
};

export default StreetViewPreview;

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Share2, Loader2 } from 'lucide-react';
import { Listing } from '@/hooks/useListings';

interface StoryGeneratorProps {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StoryGenerator = ({ listing, open, onOpenChange }: StoryGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);

  const generateStory = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    const ctx = canvas.getContext('2d')!;
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Try to load the listing image
    const imgUrl = listing.images?.[0];
    if (imgUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imgUrl;
        });
        // Draw image in top 60%
        const imgH = H * 0.6;
        ctx.drawImage(img, 0, 0, W, imgH);
        // Gradient overlay
        const imgGradient = ctx.createLinearGradient(0, imgH - 200, 0, imgH);
        imgGradient.addColorStop(0, 'rgba(15,52,96,0)');
        imgGradient.addColorStop(1, 'rgba(15,52,96,1)');
        ctx.fillStyle = imgGradient;
        ctx.fillRect(0, imgH - 200, W, 200);
      } catch {
        // No image, keep gradient
      }
    }

    const textY = H * 0.65;

    // Property type badge
    ctx.fillStyle = '#e94560';
    ctx.beginPath();
    ctx.roundRect(60, textY, ctx.measureText(listing.type).width + 40, 44, 22);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(listing.type, 80, textY + 30);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px system-ui, sans-serif';
    const titleLines = wrapText(ctx, listing.title, W - 120, 48);
    titleLines.forEach((line, i) => {
      ctx.fillText(line, 60, textY + 100 + i * 60);
    });

    const infoY = textY + 100 + titleLines.length * 60 + 40;

    // Location
    ctx.fillStyle = '#a0aec0';
    ctx.font = '28px system-ui, sans-serif';
    ctx.fillText(`📍 ${listing.location}`, 60, infoY);

    // Price
    ctx.fillStyle = '#48bb78';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.fillText(formatPrice(listing.price), 60, infoY + 80);

    // Area
    if (listing.area_m2) {
      ctx.fillStyle = '#a0aec0';
      ctx.font = '32px system-ui, sans-serif';
      ctx.fillText(`📐 ${listing.area_m2.toLocaleString()} m²`, 60, infoY + 130);
    }

    // Brand footer
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ofertaterrenos.com', W / 2, H - 60);
    ctx.textAlign = 'left';

    const url = canvas.toDataURL('image/png');
    setGeneratedUrl(url);
    setIsGenerating(false);
  }, [listing]);

  const handleDownload = () => {
    if (!generatedUrl) return;
    const a = document.createElement('a');
    a.href = generatedUrl;
    a.download = `terreno-${listing.id.slice(0, 8)}-story.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!generatedUrl || !navigator.share) {
      handleDownload();
      return;
    }

    try {
      const blob = await (await fetch(generatedUrl)).blob();
      const file = new File([blob], 'terreno-story.png', { type: 'image/png' });
      await navigator.share({ files: [file], title: listing.title });
    } catch {
      handleDownload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir como Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="relative aspect-[9/16] bg-muted rounded-lg overflow-hidden max-h-[400px]">
            <canvas ref={canvasRef} className="w-full h-full object-contain hidden" />
            {generatedUrl ? (
              <img src={generatedUrl} alt="Story preview" className="w-full h-full object-contain" />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Haz clic en "Generar" para crear la story
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!generatedUrl ? (
              <Button onClick={generateStory} disabled={isGenerating} className="flex-1">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Generar Story
              </Button>
            ) : (
              <>
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button onClick={handleShare} className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 3); // max 3 lines
}

export default StoryGenerator;

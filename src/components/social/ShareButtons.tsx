import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Share2, Facebook, Twitter, Link2, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShareButtonsProps {
  title: string;
  description?: string;
  url?: string;
  variant?: 'default' | 'icon';
  className?: string;
}

export const ShareButtons = ({ title, description, url, variant = 'default', className }: ShareButtonsProps) => {
  const shareUrl = url || window.location.href;
  const shareText = description || title;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          toast({ title: 'No se pudo compartir', description: 'Prueba con Copiar enlace.', variant: 'destructive' });
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Enlace copiado', description: 'El enlace ha sido copiado al portapapeles.' });
    } catch {
      toast({ title: 'No se pudo copiar', description: 'Puedes copiar el enlace desde la barra del navegador.', variant: 'destructive' });
    }
  };

  const openShare = (platform: string) => {
    const attributedUrl = new URL(shareUrl, window.location.origin);
    attributedUrl.searchParams.set('utm_source', platform);
    attributedUrl.searchParams.set('utm_medium', 'share');
    const encoded = encodeURIComponent(attributedUrl.href);
    const encodedText = encodeURIComponent(description ? `${title}\n${description}` : title);
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      twitter: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encoded}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encoded}`,
    };
    window.open(urls[platform], '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon" className={className} aria-label="Compartir proyecto">
            <Share2 className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
            <Share2 className="h-4 w-4" />
            Compartir
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {'share' in navigator && (
          <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
            <Share2 className="h-4 w-4 mr-2" />
            Compartir...
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => openShare('facebook')} className="cursor-pointer">
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShare('twitter')} className="cursor-pointer">
          <Twitter className="h-4 w-4 mr-2" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShare('whatsapp')} className="cursor-pointer">
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.118.55 4.108 1.512 5.84L0 24l6.335-1.652A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82a9.78 9.78 0 01-5.282-1.544l-.38-.226-3.935 1.028 1.05-3.83-.249-.395A9.776 9.776 0 012.18 12 9.82 9.82 0 0112 2.18 9.82 9.82 0 0121.82 12 9.82 9.82 0 0112 21.82z"/>
          </svg>
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShare('email')} className="cursor-pointer">
          <Mail className="h-4 w-4 mr-2" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <Link2 className="h-4 w-4 mr-2" />
          Copiar enlace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

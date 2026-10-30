import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Instagram, MessageCircle, Facebook, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSocialCopyGenerator, type SocialCopyInput } from '@/hooks/useAI';

type Platform = 'instagram' | 'whatsapp' | 'facebook';

interface Props {
  input: SocialCopyInput;
  /** Ficha del proyecto, ya con ?ref= del broker cuando corresponde. El modelo
   * nunca escribe URLs; el link real se agrega aquí al copiar. */
  link: string;
}

const textFor = (copy: ReturnType<typeof useSocialCopyGenerator>['copy'], platform: Platform, link: string) => {
  if (!copy) return '';
  if (platform === 'instagram') return `${copy.instagram.caption}\n\n${copy.instagram.hashtags.join(' ')}\n\n${link}`;
  if (platform === 'whatsapp') return `${copy.whatsapp.message}\n\n${link}`;
  return `${copy.facebook.post}\n\n${link}`;
};

export const ProjectSocialCopyGenerator = ({ input, link }: Props) => {
  const { copy, isLoading, generateSocialCopy } = useSocialCopyGenerator();
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [copied, setCopied] = useState<Platform | null>(null);

  const handleCopy = async (p: Platform) => {
    await navigator.clipboard.writeText(textFor(copy, p, link));
    setCopied(p);
    toast.success('Copy copiado');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Copy para redes sociales</CardTitle>
            <CardDescription>
              Genera texto por plataforma a partir de los datos reales de este proyecto; el link se agrega solo.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => void generateSocialCopy(input)} disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando…</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" />{copy ? 'Generar de nuevo' : 'Generar copy con IA'}</>
          )}
        </Button>

        {copy && (
          <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="instagram" className="gap-2"><Instagram className="h-4 w-4" />Instagram</TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-2"><MessageCircle className="h-4 w-4" />WhatsApp</TabsTrigger>
              <TabsTrigger value="facebook" className="gap-2"><Facebook className="h-4 w-4" />Facebook</TabsTrigger>
            </TabsList>

            <TabsContent value="instagram" className="space-y-3">
              <p className="whitespace-pre-line text-sm">{copy.instagram.caption}</p>
              <div className="flex flex-wrap gap-1.5">
                {copy.instagram.hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="whatsapp" className="space-y-3">
              <p className="whitespace-pre-line text-sm">{copy.whatsapp.message}</p>
            </TabsContent>
            <TabsContent value="facebook" className="space-y-3">
              <p className="whitespace-pre-line text-sm">{copy.facebook.post}</p>
            </TabsContent>

            <Button variant="outline" size="sm" onClick={() => void handleCopy(platform)}>
              {copied === platform ? (
                <><Check className="h-4 w-4 mr-2" />Copiado (incluye el link)</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" />Copiar con el link</>
              )}
            </Button>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectSocialCopyGenerator;

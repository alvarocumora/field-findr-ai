import { useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  DEFAULT_FICHA_THEME,
  exportFichaTheme,
  getFichaTheme,
  importFichaTheme,
  resetFichaTheme,
  setFichaTheme,
  type FichaFontFamily,
  type FichaTheme,
  type FichaThemeColors,
} from '@/lib/pdf/fichaTheme';
import { generatePredioUrbanoFicha } from '@/lib/pdf/fichaTemplates';

const COLOR_LABELS: Record<keyof FichaThemeColors, string> = {
  emerald: 'Primario (acentos y viñetas)',
  sky: 'Secundario',
  forest: 'Cabecera principal',
  dark: 'Texto principal',
  gray: 'Texto secundario',
  line: 'Líneas y bordes',
  soft: 'Fondos suaves',
  white: 'Blanco / contraste',
  accent: 'Cabecera alternativa (predios)',
};

const FONTS: { value: FichaFontFamily; label: string }[] = [
  { value: 'helvetica', label: 'Helvetica (sans)' },
  { value: 'times', label: 'Times (serif)' },
  { value: 'courier', label: 'Courier (mono)' },
];

export default function FichaBranding() {
  const [theme, setTheme] = useState<FichaTheme>(() => getFichaTheme());
  const fileRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const colorKeys = useMemo(
    () => Object.keys(theme.colors) as (keyof FichaThemeColors)[],
    [theme.colors]
  );

  const patch = (p: Partial<FichaTheme>) => setTheme((t) => ({ ...t, ...p }));

  const save = () => {
    setFichaTheme(theme);
    toast.success('Branding guardado. Todas las fichas se generarán con el nuevo tema.');
  };

  const onLogoFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setTheme((t) => ({ ...t, logo: { ...t.logo, imageDataUrl: reader.result as string } }));
    reader.readAsDataURL(file);
  };

  const onImportJson = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setTheme(importFichaTheme(reader.result as string));
        toast.success('Tema importado y aplicado');
      } catch {
        toast.error('El archivo no es un tema válido');
      }
    };
    reader.readAsText(file);
  };

  const download = () => {
    const blob = new Blob([exportFichaTheme()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ficha-theme.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const preview = async () => {
    setFichaTheme(theme);
    await generatePredioUrbanoFicha({
      rol: '00-000',
      direccion: 'Ficha de prueba de branding',
      destino: 'Habitacional',
      propietario: theme.brandName,
      avaluoTotal: 125000000,
      avaluoActualizado: 131500000,
      contribucionSemestral: 480000,
      periodo: '2026 · 1er semestre',
      expropiacion: 'Documento de prueba generado para validar logo, colores y tipografias del tema activo.',
      documentos: ['Certificado de dominio vigente', 'Certificado de avaluo fiscal', 'Plano de loteo'],
      comuna: 'Santiago',
    });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <Helmet>
        <title>Branding de fichas PDF | Configuración</title>
        <meta
          name="description"
          content="Configura logo, colores y tipografías de todas las fichas PDF y regenera los documentos con el nuevo tema."
        />
      </Helmet>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Branding de fichas</h1>
        <p className="text-sm text-muted-foreground">
          Cambia logo, colores y tipografías por configuración. Todas las fichas (dossier, lote y
          predio urbano) se regeneran con el tema activo sin tocar el código.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identidad</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brandName">Nombre de marca (pie de página)</Label>
            <Input
              id="brandName"
              value={theme.brandName}
              onChange={(e) => patch({ brandName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerSuffix">Dominio en el pie</Label>
            <Input
              id="footerSuffix"
              value={theme.footerSuffix}
              onChange={(e) => patch({ footerSuffix: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoPrimary">Logotipo · palabra 1</Label>
            <Input
              id="logoPrimary"
              value={theme.logo.primary}
              onChange={(e) => patch({ logo: { ...theme.logo, primary: e.target.value } })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoSecondary">Logotipo · palabra 2</Label>
            <Input
              id="logoSecondary"
              value={theme.logo.secondary}
              onChange={(e) => patch({ logo: { ...theme.logo, secondary: e.target.value } })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publicOrigin">Origen público (QR y enlaces)</Label>
            <Input
              id="publicOrigin"
              value={theme.publicOrigin}
              onChange={(e) => patch({ publicOrigin: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Logo en imagen (PNG/JPG)</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => onLogoFile(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                Subir logo
              </Button>
              {theme.logo.imageDataUrl && (
                <>
                  <img
                    src={theme.logo.imageDataUrl}
                    alt="Logo cargado para las fichas PDF"
                    className="h-8 w-auto rounded bg-muted p-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => patch({ logo: { ...theme.logo, imageDataUrl: null } })}
                  >
                    Quitar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Colores</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {colorKeys.map((key) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`color-${key}`}>{COLOR_LABELS[key]}</Label>
              <div className="flex items-center gap-2">
                <input
                  id={`color-${key}`}
                  type="color"
                  aria-label={COLOR_LABELS[key]}
                  value={theme.colors[key]}
                  onChange={(e) =>
                    patch({ colors: { ...theme.colors, [key]: e.target.value.toUpperCase() } })
                  }
                  className="h-9 w-12 cursor-pointer rounded border border-border bg-background"
                />
                <Input
                  value={theme.colors[key]}
                  onChange={(e) =>
                    patch({ colors: { ...theme.colors, [key]: e.target.value.toUpperCase() } })
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipografías</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(['heading', 'body'] as const).map((kind) => (
            <div key={kind} className="space-y-2">
              <Label>{kind === 'heading' ? 'Títulos' : 'Cuerpo de texto'}</Label>
              <Select
                value={theme.fonts[kind]}
                onValueChange={(v: FichaFontFamily) =>
                  patch({ fonts: { ...theme.fonts, [kind]: v } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save}>Guardar y aplicar</Button>
        <Button variant="outline" onClick={preview}>
          Regenerar ficha de prueba
        </Button>
        <Button variant="outline" onClick={download}>
          Exportar tema (JSON)
        </Button>
        <input
          ref={jsonRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => onImportJson(e.target.files?.[0])}
        />
        <Button variant="outline" onClick={() => jsonRef.current?.click()}>
          Importar tema
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            resetFichaTheme();
            setTheme(DEFAULT_FICHA_THEME);
            toast.success('Branding restaurado al tema por defecto');
          }}
        >
          Restaurar por defecto
        </Button>
      </div>
    </div>
  );
}

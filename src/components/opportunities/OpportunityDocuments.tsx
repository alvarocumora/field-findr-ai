import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText, Upload, CheckCircle2, AlertTriangle, Eye,
  Image, Map, Scale, File, Loader2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DOC_CATEGORIES = [
  { key: 'deed', label: 'Escritura', icon: Scale, required: true },
  { key: 'certificate', label: 'Certificados', icon: FileText, required: true },
  { key: 'map', label: 'Planos / Mapas', icon: Map, required: true },
  { key: 'legal', label: 'Documentos Legales', icon: Scale, required: true },
  { key: 'images', label: 'Fotografías', icon: Image, required: false },
  { key: 'technical', label: 'Informes Técnicos', icon: File, required: false },
];

interface DocItem {
  id: string;
  name: string;
  category: string;
  url?: string;
  uploadedAt?: string;
}

interface OpportunityDocumentsProps {
  listingId: string;
}

export const OpportunityDocuments = ({ listingId }: OpportunityDocumentsProps) => {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('deed');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      setDocs(prev => [...prev, {
        id: crypto.randomUUID(),
        name: file.name,
        category: selectedCategory,
        uploadedAt: new Date().toISOString(),
      }]);
      setUploading(false);
    }, 800);
  };

  const removeDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const docsByCategory = DOC_CATEGORIES.map(cat => ({
    ...cat,
    docs: docs.filter(d => d.category === cat.key),
  }));

  const requiredCount = DOC_CATEGORIES.filter(c => c.required).length;
  const completedRequired = DOC_CATEGORIES.filter(c => c.required && docs.some(d => d.category === c.key)).length;
  const progress = requiredCount > 0 ? Math.round((completedRequired / requiredCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card>
        <CardContent className="py-4 px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Carpeta Documental</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {completedRequired}/{requiredCount} requeridos
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
          {progress < 100 && (
            <p className="text-xs text-muted-foreground mt-2">
              Faltan {requiredCount - completedRequired} documentos obligatorios
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardContent className="py-4 px-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="flex h-9 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {DOC_CATEGORIES.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.kmz,.kml" />
            <Button size="sm" className="h-9 gap-1.5" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Subir Documento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {docsByCategory.map(cat => {
          const CatIcon = cat.icon;
          const hasDocs = cat.docs.length > 0;
          return (
            <Card key={cat.key} className={cn(
              'transition-colors',
              cat.required && !hasDocs ? 'border-amber-500/30' : hasDocs ? 'border-green-500/30' : ''
            )}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CatIcon className={cn('h-4 w-4', hasDocs ? 'text-green-500' : 'text-muted-foreground')} />
                    <span className="text-sm font-medium">{cat.label}</span>
                  </div>
                  {cat.required && (
                    hasDocs
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                      : <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                {cat.docs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {cat.required ? 'Documento requerido — pendiente de subida' : 'Sin documentos'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {cat.docs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1.5">
                        <span className="truncate max-w-[70%]">{doc.name}</span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeDoc(doc.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

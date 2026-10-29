import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WorkspaceLoadError({ title, onRetry }: { title: string; onRetry: () => unknown }) {
  return <div role="alert" className="m-4 rounded-xl border border-destructive/40 bg-card p-5 space-y-3">
    <div className="flex gap-2 items-center font-medium"><AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />{title}</div>
    <p className="text-sm text-muted-foreground">No pudimos consultar los datos. Esto no significa que no haya registros.</p>
    <Button type="button" variant="outline" onClick={() => void onRetry()}><RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />Reintentar consulta</Button>
  </div>;
}

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkspaceLoadErrorProps {
  title: string;
  description: string;
  onRetry: () => unknown;
}

/** A failed tenant-scoped query is not an empty pipeline, inventory or payment list. */
const WorkspaceLoadError = ({ title, description, onRetry }: WorkspaceLoadErrorProps) => (
  <section role="alert" className="theme-rural mx-auto max-w-2xl rounded-2xl border border-destructive/30 bg-card p-6 text-center text-foreground sm:p-8">
    <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" aria-hidden="true" />
    <h2 className="font-editorial text-2xl font-medium">{title}</h2>
    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
    <Button type="button" className="mt-5 min-h-11 gap-2" variant="outline" onClick={() => void onRetry()}>
      <RefreshCw className="h-4 w-4" aria-hidden="true" />Reintentar consulta
    </Button>
  </section>
);

export default WorkspaceLoadError;

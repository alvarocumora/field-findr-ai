import { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** Human label: "el tour 360", "el mapa de parcelas"… */
  label: string;
  className?: string;
}

interface State { hasError: boolean }

/**
 * Isolates a visual engine (WebGL map, 360 tour, 3D) so a technical failure
 * never takes down the commercial page (price, documents, contact).
 */
class ViewerErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`ViewerErrorBoundary (${this.props.label}):`, error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted/40 p-6 text-center ${this.props.className ?? ''}`}>
        <AlertTriangle className="h-6 w-6 text-warning" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">Error técnico al mostrar {this.props.label}.</p>
        <p className="max-w-sm text-xs text-muted-foreground">La ficha, los precios y el contacto siguen disponibles abajo.</p>
        <Button size="sm" variant="outline" onClick={() => this.setState({ hasError: false })}>
          <RotateCcw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />Reintentar
        </Button>
      </div>
    );
  }
}

export default ViewerErrorBoundary;

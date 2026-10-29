import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * App-wide error boundary so an uncaught render error shows a recovery screen
 * instead of a blank white page.
 */
class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {

    console.error("Uncaught error:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-foreground mb-3">Algo salió mal</h1>
            <p className="text-muted-foreground mb-6">
              Ocurrió un error inesperado. Intenta recargar la página.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;

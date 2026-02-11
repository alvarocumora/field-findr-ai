import { Component, ReactNode } from 'react';
import MapErrorState from './MapErrorState';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: string | null;
}

class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    console.error('MapErrorBoundary caught:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <MapErrorState
          error={this.state.error}
          onRetry={this.handleRetry}
          className="w-full h-full"
        />
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;

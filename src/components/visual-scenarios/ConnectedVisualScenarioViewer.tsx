import { useParams } from 'react-router-dom';

import { useVisualScenarios } from '@/hooks/useVisualScenarios';
import type { VisualScenario } from '@/types/visualScenario';
import VisualScenarioViewerBase from './VisualScenarioViewer';

interface ConnectedVisualScenarioViewerProps {
  scenarios: VisualScenario[];
  className?: string;
  title?: string;
  onAnalyze?: (scenario: VisualScenario) => void;
  onExportPdf?: (scenario: VisualScenario) => void;
}

const ConnectedVisualScenarioViewer = ({
  scenarios,
  ...props
}: ConnectedVisualScenarioViewerProps) => {
  const { id: propertyId } = useParams<{ id?: string }>();
  const { data: persistedScenarios = [] } = useVisualScenarios(propertyId);

  const resolvedScenarios = persistedScenarios.length > 0 ? persistedScenarios : scenarios;

  return <VisualScenarioViewerBase scenarios={resolvedScenarios} {...props} />;
};

export default ConnectedVisualScenarioViewer;

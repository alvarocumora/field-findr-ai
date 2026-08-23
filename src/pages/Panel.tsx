import { Navigate } from 'react-router-dom';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';
import { PageLoader } from '@/routes/routeUtils';

/**
 * Puerta única del área privada: `/panel`.
 * Resuelve el panel correcto según el rol y deja una sola entrada memorizable
 * en lugar de que cada rol tenga que conocer su URL interna.
 */
const Panel = () => {
  const { getRedirectPath, isLoading } = useSmartRedirect();

  if (isLoading) return <PageLoader />;

  return <Navigate to={getRedirectPath()} replace />;
};

export default Panel;

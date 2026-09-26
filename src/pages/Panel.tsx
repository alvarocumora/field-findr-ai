import { Navigate, useNavigate } from 'react-router-dom';
import { PageLoader } from '@/routes/routeUtils';
import { usePanelContext } from '@/hooks/usePanelContext';
import ContextChooser from '@/components/access/ContextChooser';

/**
 * Puerta única del área privada.
 *
 * /panel no decide por una jerarquía fija de roles: resuelve los contextos
 * disponibles (comprador, broker, empresa, plataforma), recuerda el último y
 * pide elección cuando una cuenta multi-perfil entra por primera vez.
 */
const Panel = () => {
  const navigate = useNavigate();
  const { active, options, setContext, needsChoice, isLoading } = usePanelContext();

  if (isLoading) return <PageLoader />;

  if (options.length === 0) {
    return <Navigate to="/comenzar" replace />;
  }

  if (needsChoice || !active) {
    return (
      <ContextChooser
        options={options}
        onSelect={(context) => {
          const selected = options.find((option) => option.id === context);
          if (!selected) return;
          setContext(context);
          navigate(selected.home, { replace: true });
        }}
      />
    );
  }

  return <Navigate to={active.home} replace />;
};

export default Panel;

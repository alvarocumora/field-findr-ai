import { useLocation } from 'react-router-dom';
import StickyHeader from '@/components/navigation/StickyHeader';
import FooterSection from '@/components/FooterSection';
import AIFloatingButton from '@/components/AIFloatingButton';

interface PublicLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  showAssistant?: boolean;
}

const PublicLayout = ({ children, showFooter = true, showAssistant = true }: PublicLayoutProps) => {
  const { pathname } = useLocation();
  const isProjectSurface = pathname.startsWith('/proyecto/');
  const shouldShowAssistant = showAssistant && !isProjectSurface;

  return (
    <div className="theme-rural flex min-h-screen flex-col bg-background text-foreground">
      <div className="noise-overlay" />
      <StickyHeader />
      <main id="contenido-principal" className="flex-1 pt-16">{children}</main>
      {showFooter && <FooterSection />}
      {shouldShowAssistant && <AIFloatingButton />}
    </div>
  );
};

export default PublicLayout;

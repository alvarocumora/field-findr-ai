import StickyHeader from '@/components/navigation/StickyHeader';
import FooterSection from '@/components/FooterSection';
import AIFloatingButton from '@/components/AIFloatingButton';

interface PublicLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

const PublicLayout = ({ children, showFooter = true }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Noise overlay for texture */}
      <div className="noise-overlay" />
      
      {/* Sticky Header */}
      <StickyHeader />
      
      {/* Main Content with top padding for fixed header */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* Footer */}
      {showFooter && <FooterSection />}

      {/* AI Floating Button */}
      <AIFloatingButton />
    </div>
  );
};

export default PublicLayout;

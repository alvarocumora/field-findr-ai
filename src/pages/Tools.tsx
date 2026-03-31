import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIChatAssistant } from '@/components/ai/AIChatAssistant';
import { PricePredictorPanel } from '@/components/ai/PricePredictorPanel';
import { SmartSearchBar } from '@/components/ai/SmartSearchBar';
import { ContentGeneratorPanel } from '@/components/ai/ContentGeneratorPanel';
import { FinancialCalculators } from '@/components/tools/FinancialCalculators';
import SIILookupPanel from '@/components/cadastral/SIILookupPanel';
import InvestmentComparator from '@/components/tools/InvestmentComparator';
import { StoryGenerator } from '@/components/social/StoryGenerator';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Bot, Calculator, TrendingUp, Search, Wand2, 
  Sparkles, FileText, Scale, Share2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';

const Tools = () => {
  const [activeTab, setActiveTab] = useState('ai-chat');
  const { user } = useAuth();
  const { isAgent, isAdmin } = useSmartRedirect();
  const isPro = isAgent || isAdmin;

  const publicTabs = [
    { id: 'ai-chat', label: 'Asistente IA', icon: Bot },
    { id: 'price-predictor', label: 'Predictor', icon: TrendingUp },
    { id: 'smart-search', label: 'Búsqueda IA', icon: Search },
    { id: 'calculators', label: 'Calculadoras', icon: Calculator },
    { id: 'sii', label: 'Catastro SII', icon: FileText },
    { id: 'comparator', label: 'Comparador', icon: Scale },
  ];

  const proTabs = isPro ? [
    { id: 'content-gen', label: 'Contenido', icon: Wand2 },
  ] : [];

  const tabs = [...publicTabs, ...proTabs];

  const proLinks = [
    { name: 'CRM Avanzado', href: '/asesor/crm', icon: Users, desc: 'Gestión completa de clientes y pipeline' },
    { name: 'Analytics', href: '/asesor/analytics', icon: BarChart3, desc: 'Reportes e inteligencia de negocio' },
  ];

  return (
    <Layout>
      <div className="container py-6 px-4">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Centro de Herramientas</h1>
          </div>
          <p className="text-muted-foreground">
            Herramientas potenciadas con IA para optimizar tu gestión de loteos
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid mb-6 h-auto ${tabs.length <= 5 ? 'grid-cols-5' : 'grid-cols-3 lg:grid-cols-6'}`}>
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-xs">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="ai-chat">
            <div className="grid lg:grid-cols-2 gap-6">
              <AIChatAssistant />
              <div className="space-y-4">
                <SmartSearchBar />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="price-predictor">
            <PricePredictorPanel />
          </TabsContent>

          <TabsContent value="smart-search">
            <div className="max-w-4xl mx-auto">
              <SmartSearchBar className="mb-8" />
              <p className="text-center text-muted-foreground">
                Usa lenguaje natural para buscar propiedades. Por ejemplo:
                "Parcela con agua cerca de Santiago por menos de 100 millones"
              </p>
            </div>
          </TabsContent>

          <TabsContent value="content-gen">
            <ContentGeneratorPanel />
          </TabsContent>

          <TabsContent value="calculators">
            <FinancialCalculators />
          </TabsContent>

          <TabsContent value="sii">
            <SIILookupPanel />
          </TabsContent>

          <TabsContent value="comparator">
            <InvestmentComparator />
          </TabsContent>
        </Tabs>

        {/* Pro tools links */}
        {isPro && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Herramientas Profesionales</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {proLinks.map(link => (
                <Link key={link.href} to={link.href}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center gap-4 pb-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <link.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {link.name}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>{link.desc}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tools;

import { useState } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIChatAssistant } from '@/components/ai/AIChatAssistant';
import { PricePredictorPanel } from '@/components/ai/PricePredictorPanel';
import { SmartSearchBar } from '@/components/ai/SmartSearchBar';
import { ContentGeneratorPanel } from '@/components/ai/ContentGeneratorPanel';
import { FinancialCalculators } from '@/components/tools/FinancialCalculators';
import SIILookupPanel from '@/components/cadastral/SIILookupPanel';
import AppreciationCalculator from '@/components/tools/AppreciationCalculator';
import InvestmentComparator from '@/components/tools/InvestmentComparator';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Bot, Calculator, TrendingUp, Search, Wand2, 
  Sparkles, FileText, Scale
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';

const Tools = () => {
  const [activeTab, setActiveTab] = useState('ai-chat');
  const { user } = useAuth();
  const { isAgent, isAdmin } = useSmartRedirect();
  const isPro = isAgent || isAdmin;

  const aiTabs = [
    { id: 'ai-chat', label: 'Asistente IA', icon: Bot },
    { id: 'price-predictor', label: 'Predictor', icon: TrendingUp },
    { id: 'smart-search', label: 'Búsqueda IA', icon: Search },
  ];

  const financeTabs = [
    { id: 'calculators', label: 'Calculadoras', icon: Calculator },
    { id: 'comparator', label: 'Comparador', icon: Scale },
  ];

  const dataTabs = [
    { id: 'sii', label: 'Catastro SII', icon: FileText },
  ];

  const proTabs = isPro ? [
    { id: 'content-gen', label: 'Contenido', icon: Wand2 },
  ] : [];

  const tabs = [...aiTabs, ...financeTabs, ...dataTabs, ...proTabs];

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
          <TabsList className={`grid mb-6 h-auto ${tabs.length <= 5 ? 'grid-cols-5' : tabs.length <= 7 ? 'grid-cols-4 lg:grid-cols-7' : 'grid-cols-4 lg:grid-cols-' + tabs.length}`}>
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

          <TabsContent value="plusvalia">
            <AppreciationCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Tools;

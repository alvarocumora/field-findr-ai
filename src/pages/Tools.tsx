import { useState } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIChatAssistant } from '@/components/ai/AIChatAssistant';
import { PricePredictorPanel } from '@/components/ai/PricePredictorPanel';
import { SmartSearchBar } from '@/components/ai/SmartSearchBar';
import { ContentGeneratorPanel } from '@/components/ai/ContentGeneratorPanel';
import { LotComparator } from '@/components/tools/LotComparator';
import { FinancialCalculators } from '@/components/tools/FinancialCalculators';
import { AnalyticsDashboard } from '@/components/tools/AnalyticsDashboard';
import { EnhancedCRM } from '@/components/tools/EnhancedCRM';
import { 
  Bot, Calculator, TrendingUp, Search, Wand2, 
  Scale, BarChart3, Users, Sparkles 
} from 'lucide-react';

const Tools = () => {
  const [activeTab, setActiveTab] = useState('ai-chat');

  const tabs = [
    { id: 'ai-chat', label: 'Asistente IA', icon: Bot },
    { id: 'price-predictor', label: 'Predictor', icon: TrendingUp },
    { id: 'smart-search', label: 'Búsqueda IA', icon: Search },
    { id: 'content-gen', label: 'Contenido', icon: Wand2 },
    { id: 'comparator', label: 'Comparador', icon: Scale },
    { id: 'calculators', label: 'Calculadoras', icon: Calculator },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'crm', label: 'CRM', icon: Users },
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
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-6 h-auto">
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

          <TabsContent value="comparator">
            <LotComparator />
          </TabsContent>

          <TabsContent value="calculators">
            <FinancialCalculators />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="crm">
            <EnhancedCRM />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Tools;

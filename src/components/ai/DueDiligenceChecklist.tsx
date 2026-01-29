import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  FileCheck, 
  AlertCircle, 
  Clock, 
  DollarSign,
  MapPin,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  ListChecks
} from 'lucide-react';
import type { DueDiligenceResult, DueDiligenceItem } from '@/hooks/useInvestmentCopilot';

interface DueDiligenceChecklistProps {
  result: DueDiligenceResult;
}

const priorityConfig = {
  crítico: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle },
  importante: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: AlertTriangle },
  recomendado: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: CheckCircle2 },
};

const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  Legal: { icon: <FileCheck className="h-4 w-4" />, color: 'text-purple-500' },
  Técnico: { icon: <ListChecks className="h-4 w-4" />, color: 'text-blue-500' },
  Financiero: { icon: <DollarSign className="h-4 w-4" />, color: 'text-green-500' },
  Ambiental: { icon: <MapPin className="h-4 w-4" />, color: 'text-emerald-500' },
  Urbanístico: { icon: <MapPin className="h-4 w-4" />, color: 'text-orange-500' },
};

export const DueDiligenceChecklist = ({ result }: DueDiligenceChecklistProps) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const { checklist, legalStatus, estimatedTotalCost, estimatedTotalTime, criticalAlerts, nextSteps } = result;

  const toggleItem = (item: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  };

  // Group items by category
  const groupedItems = checklist.reduce<Record<string, DueDiligenceItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const completedCount = checkedItems.size;
  const totalCount = checklist.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Checklist de Due Diligence
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {completedCount}/{totalCount} completados
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Costo estimado:</span>
                <span className="font-medium">${estimatedTotalCost.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tiempo estimado:</span>
                <span className="font-medium">{estimatedTotalTime}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              Alertas Críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {criticalAlerts.map((alert, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-red-400 shrink-0" />
                  {alert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Legal Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-primary" />
            Estado Legal Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-3">{legalStatus.currentStatus}</p>
          
          {legalStatus.concerns.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-muted-foreground mb-1">Preocupaciones:</h5>
              <ul className="space-y-1">
                {legalStatus.concerns.map((concern, i) => (
                  <li key={i} className="text-xs flex items-start gap-2 text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {legalStatus.recommendations.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-1">Recomendaciones:</h5>
              <ul className="space-y-1">
                {legalStatus.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs flex items-start gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist by Category */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedItems)}>
            {Object.entries(groupedItems).map(([category, items]) => {
              const config = categoryConfig[category] || { icon: <FileCheck className="h-4 w-4" />, color: 'text-primary' };
              const categoryChecked = items.filter(item => checkedItems.has(item.item)).length;
              
              return (
                <AccordionItem key={category} value={category} className="border-b last:border-b-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className={config.color}>{config.icon}</span>
                      <span className="font-medium">{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {categoryChecked}/{items.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {items.map((item, idx) => {
                        const priorityCfg = priorityConfig[item.priority];
                        const PriorityIcon = priorityCfg.icon;
                        
                        return (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-lg border ${
                              checkedItems.has(item.item) ? 'bg-muted/50 border-primary/30' : 'bg-background'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={`item-${category}-${idx}`}
                                checked={checkedItems.has(item.item)}
                                onCheckedChange={() => toggleItem(item.item)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <label 
                                    htmlFor={`item-${category}-${idx}`}
                                    className={`text-sm font-medium cursor-pointer ${
                                      checkedItems.has(item.item) ? 'line-through text-muted-foreground' : ''
                                    }`}
                                  >
                                    {item.item}
                                  </label>
                                  <Badge className={`${priorityCfg.color} text-xs`}>
                                    <PriorityIcon className="h-3 w-3 mr-1" />
                                    {item.priority}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                                
                                <div className="flex flex-wrap gap-3 text-xs">
                                  {item.estimatedCost && (
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                      <DollarSign className="h-3 w-3" />
                                      ${item.estimatedCost.toLocaleString('es-CL')}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {item.estimatedTime}
                                  </span>
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {item.whereToGet}
                                  </span>
                                </div>
                                
                                {item.redFlags.length > 0 && (
                                  <div className="mt-2 pt-2 border-t">
                                    <span className="text-xs text-red-500 font-medium">Red Flags:</span>
                                    <ul className="mt-1">
                                      {item.redFlags.map((flag, fi) => (
                                        <li key={fi} className="text-xs text-red-400 flex items-center gap-1">
                                          <ChevronRight className="h-3 w-3" />
                                          {flag}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-primary" />
            Próximos Pasos Recomendados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {nextSteps.map((step, i) => (
              <li key={i} className="text-sm flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

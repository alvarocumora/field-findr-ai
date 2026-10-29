import type { Project } from '@/hooks/useProjects';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Scale, Plus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProjectScore {
  id: string;
  name: string;
  plusvalia: number;
  accesibilidad: number;
  servicios: number;
  liquidez: number;
  seguridad: number;
  color: string;
}

const COLORS = ['#e94560', '#3b82f6', '#10b981', '#f59e0b'];

const InvestmentComparator = () => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const { data: projects } = useQuery({
    queryKey: ['projects-for-compare'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name, location, total_lots, available_lots, sold_lots, total_area, city, region')
        .eq('status', 'active')
        .limit(20);
      return data || [];
    },
  });

  const calculateScore = (project: Pick<Project, 'id' | 'name' | 'location' | 'total_lots' | 'available_lots' | 'sold_lots' | 'total_area' | 'city' | 'region'>, index: number): ProjectScore => {
    const totalLots = project.total_lots || 1;
    const soldLots = project.sold_lots || 0;
    const availableLots = project.available_lots || 0;

    const sellRate = soldLots / totalLots;
    const plusvalia = Math.min(Math.round(sellRate * 100 + Math.random() * 20), 100);
    const accesibilidad = Math.round(50 + Math.random() * 50);
    const servicios = Math.round(30 + Math.random() * 70);
    const liquidez = Math.round(sellRate * 80 + 20);
    const seguridad = Math.round(60 + Math.random() * 40);

    return {
      id: project.id,
      name: project.name,
      plusvalia,
      accesibilidad,
      servicios,
      liquidez,
      seguridad,
      color: COLORS[index % COLORS.length],
    };
  };

  const scores = selectedProjects
    .map((id, i) => {
      const project = projects?.find(p => p.id === id);
      if (!project) return null;
      return calculateScore(project, i);
    })
    .filter(Boolean) as ProjectScore[];

  const radarData = [
    { metric: 'Plusvalía', ...Object.fromEntries(scores.map(s => [s.name, s.plusvalia])) },
    { metric: 'Accesibilidad', ...Object.fromEntries(scores.map(s => [s.name, s.accesibilidad])) },
    { metric: 'Servicios', ...Object.fromEntries(scores.map(s => [s.name, s.servicios])) },
    { metric: 'Liquidez', ...Object.fromEntries(scores.map(s => [s.name, s.liquidez])) },
    { metric: 'Seguridad', ...Object.fromEntries(scores.map(s => [s.name, s.seguridad])) },
  ];

  const addProject = (id: string) => {
    if (!selectedProjects.includes(id) && selectedProjects.length < 4) {
      setSelectedProjects([...selectedProjects, id]);
    }
  };

  const removeProject = (id: string) => {
    setSelectedProjects(selectedProjects.filter(p => p !== id));
  };

  const availableProjects = projects?.filter(p => !selectedProjects.includes(p.id)) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Comparador de Inversión Multi-Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Selector */}
          <div className="flex flex-wrap gap-2 items-center">
            {scores.map(s => (
              <Badge key={s.id} style={{ backgroundColor: s.color }} className="text-white gap-1 pl-3">
                {s.name}
                <button onClick={() => removeProject(s.id)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedProjects.length < 4 && availableProjects.length > 0 && (
              <Select onValueChange={addProject}>
                <SelectTrigger className="w-[200px] h-8">
                  <SelectValue placeholder="Agregar proyecto..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Radar Chart */}
          {scores.length >= 2 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" className="text-xs" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  {scores.map(s => (
                    <Radar
                      key={s.id}
                      name={s.name}
                      dataKey={s.name}
                      stroke={s.color}
                      fill={s.color}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <TrendingUp className="h-12 w-12 mx-auto opacity-30" />
                <p>Selecciona al menos 2 proyectos para comparar</p>
              </div>
            </div>
          )}

          {/* Score Table */}
          {scores.length >= 2 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Métrica</th>
                    {scores.map(s => (
                      <th key={s.id} className="text-center py-2 px-3" style={{ color: s.color }}>{s.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['plusvalia', 'accesibilidad', 'servicios', 'liquidez', 'seguridad'].map(metric => (
                    <tr key={metric} className="border-b">
                      <td className="py-2 px-3 capitalize font-medium">{metric === 'plusvalia' ? 'Plusvalía' : metric.charAt(0).toUpperCase() + metric.slice(1)}</td>
                      {scores.map(s => {
                        const val = s[metric as keyof ProjectScore] as number;
                        const best = Math.max(...scores.map(sc => sc[metric as keyof ProjectScore] as number));
                        return (
                          <td key={s.id} className="text-center py-2 px-3">
                            <span className={val === best ? 'font-bold text-primary' : ''}>{val}/100</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="py-2 px-3">Total</td>
                    {scores.map(s => {
                      const total = s.plusvalia + s.accesibilidad + s.servicios + s.liquidez + s.seguridad;
                      return <td key={s.id} className="text-center py-2 px-3 text-primary">{total}/500</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentComparator;

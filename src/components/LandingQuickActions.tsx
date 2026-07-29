
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Plus, 
  BarChart3, 
  Users, 
  Zap, 
  Target,
  ArrowRight
} from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      title: 'Buscar Propiedades',
      description: 'Encuentra el terreno perfecto con filtros inteligentes',
      icon: Search,
      color: 'bg-green-500',
      href: '/search'
    },
    {
      title: 'Publicar Propiedad',
      description: 'Sube tu terreno con ayuda de IA',
      icon: Plus,
      color: 'bg-blue-500',
      href: '/publicar'
    },
    {
      title: 'Comparar Terrenos',
      description: 'Compara propiedades lado a lado',
      icon: BarChart3,
      color: 'bg-purple-500',
      href: '/comparar'
    },
    {
      title: 'Panel de Agente',
      description: 'Gestiona tus propiedades y clientes',
      icon: Users,
      color: 'bg-orange-500',
      href: '/asesor/dashboard'
    },
    {
      title: 'Herramientas',
      description: 'Calculadoras, tasación y análisis con IA',
      icon: Zap,
      color: 'bg-green-600',
      href: '/tools'
    },
    {
      title: 'Oportunidades',
      description: 'Terrenos con potencial de inversión',
      icon: Target,
      color: 'bg-blue-600',
      href: '/oportunidades'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Qué quieres hacer hoy?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Accede rápidamente a todas las herramientas que necesitas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{action.description}</p>
                    <Button variant="outline" size="sm" className="group-hover:bg-green-50 group-hover:border-green-500">
                      Ir ahora
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActions;

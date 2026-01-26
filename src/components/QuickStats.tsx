
import { TrendingUp, MapPin, Shield, Users } from 'lucide-react';

const QuickStats = () => {
  const stats = [
    { 
      title: 'Propiedades Activas', 
      value: '2,847', 
      icon: MapPin, 
      color: 'text-green-600',
      change: '+15% este mes'
    },
    { 
      title: 'Agentes Verificados', 
      value: '156', 
      icon: Shield, 
      color: 'text-blue-600',
      change: 'Todos verificados'
    },
    { 
      title: 'Ventas Exitosas', 
      value: '1,932', 
      icon: TrendingUp, 
      color: 'text-purple-600',
      change: '+8% esta semana'
    },
    { 
      title: 'Usuarios Activos', 
      value: '8,421', 
      icon: Users, 
      color: 'text-orange-600',
      change: 'Creciendo diario'
    }
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-1">{stat.title}</div>
              <div className="text-xs text-gray-500">{stat.change}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickStats;

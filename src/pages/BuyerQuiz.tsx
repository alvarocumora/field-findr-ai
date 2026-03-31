import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Home, TrendingUp, TreePine, Store, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface QuizStep {
  question: string;
  key: string;
  options: { value: string; label: string; icon: React.ReactNode; description: string }[];
}

const steps: QuizStep[] = [
  {
    question: '¿Para qué quieres el terreno?',
    key: 'purpose',
    options: [
      { value: 'house', label: 'Construir mi casa', icon: <Home className="h-8 w-8" />, description: 'Un hogar para vivir con tu familia' },
      { value: 'investment', label: 'Inversión', icon: <TrendingUp className="h-8 w-8" />, description: 'Rentabilidad y plusvalía a largo plazo' },
      { value: 'country', label: 'Casa de campo', icon: <TreePine className="h-8 w-8" />, description: 'Escapar de la ciudad los fines de semana' },
      { value: 'business', label: 'Proyecto comercial', icon: <Store className="h-8 w-8" />, description: 'Desarrollo inmobiliario o negocio' },
    ],
  },
  {
    question: '¿Cuánto quieres invertir?',
    key: 'budget',
    options: [
      { value: 'low', label: 'Hasta $15M', icon: <span className="text-2xl font-bold">$</span>, description: 'Terrenos accesibles' },
      { value: 'mid', label: '$15M - $50M', icon: <span className="text-2xl font-bold">$$</span>, description: 'Rango medio con buenas opciones' },
      { value: 'high', label: '$50M - $150M', icon: <span className="text-2xl font-bold">$$$</span>, description: 'Terrenos premium' },
      { value: 'premium', label: 'Más de $150M', icon: <span className="text-2xl font-bold">$$$$</span>, description: 'Exclusivo y sin límite' },
    ],
  },
  {
    question: '¿Qué tamaño de terreno buscas?',
    key: 'size',
    options: [
      { value: 'small', label: 'Hasta 500 m²', icon: <span className="text-lg">◽</span>, description: 'Ideal para una casa familiar' },
      { value: 'medium', label: '500 - 2.000 m²', icon: <span className="text-lg">◻️</span>, description: 'Espacio para jardín y proyecto' },
      { value: 'large', label: '2.000 - 10.000 m²', icon: <span className="text-lg">⬜</span>, description: 'Parcela con amplitud' },
      { value: 'xlarge', label: 'Más de 1 hectárea', icon: <span className="text-lg">🏔️</span>, description: 'Gran escala o agrícola' },
    ],
  },
  {
    question: '¿Qué tan lejos de la ciudad?',
    key: 'distance',
    options: [
      { value: 'urban', label: 'En la ciudad', icon: <span className="text-2xl">🏙️</span>, description: 'Dentro del radio urbano' },
      { value: 'suburban', label: '15–30 min', icon: <span className="text-2xl">🚗</span>, description: 'Periferia accesible' },
      { value: 'rural', label: '30–60 min', icon: <span className="text-2xl">🌾</span>, description: 'Zona rural cercana' },
      { value: 'remote', label: 'Más de 1 hora', icon: <span className="text-2xl">🏕️</span>, description: 'Lejos de todo, naturaleza pura' },
    ],
  },
  {
    question: '¿Qué servicios son indispensables?',
    key: 'services',
    options: [
      { value: 'all', label: 'Todos (agua, luz, camino)', icon: <span className="text-2xl">✅</span>, description: 'Listo para construir' },
      { value: 'basic', label: 'Luz y agua al menos', icon: <span className="text-2xl">💧</span>, description: 'Lo esencial' },
      { value: 'partial', label: 'Con acceso a camino', icon: <span className="text-2xl">🛤️</span>, description: 'Puedo gestionar el resto' },
      { value: 'none', label: 'No importa', icon: <span className="text-2xl">🌿</span>, description: 'Busco terreno virgen' },
    ],
  },
];

const BuyerQuiz = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [step.key]: value };
    setAnswers(newAnswers);

    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    }
  };

  const handleFinish = async () => {
    if (!user) {
      toast.info('Inicia sesión para guardar tu perfil');
      navigate('/auth');
      return;
    }

    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_data: answers,
        })
        .eq('user_id', user.id);

      toast.success('¡Perfil guardado! Te mostraremos terrenos ideales para ti.');
      navigate('/explorar');
    } catch {
      toast.error('Error al guardar tu perfil');
    } finally {
      setSaving(false);
    }
  };

  const isComplete = Object.keys(answers).length === steps.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Matching Inteligente</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Encontremos tu terreno ideal
          </h1>
          <p className="text-muted-foreground">
            Responde 5 preguntas y usaremos IA para encontrar tu match perfecto
          </p>
        </motion.div>

        <Progress value={progress} className="mb-6 h-2" />

        <AnimatePresence mode="wait">
          {!isComplete ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-foreground text-center mb-6">
                {step.question}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {step.options.map((option) => (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-2 ${
                      answers[step.key] === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleSelect(option.value)}
                  >
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="text-primary mt-1">{option.icon}</div>
                      <div>
                        <p className="font-semibold text-foreground">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                ¡Perfil completado!
              </h2>
              <p className="text-muted-foreground mb-6">
                Ahora encontraremos terrenos que se ajusten a tu perfil
              </p>
              <Button size="lg" onClick={handleFinish} disabled={saving}>
                {saving ? 'Guardando...' : 'Ver mis matches'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BuyerQuiz;

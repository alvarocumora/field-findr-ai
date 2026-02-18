import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, Building2, MapPin, Users, ChevronRight, ChevronLeft, 
  CheckCircle2, Loader2, Phone, Globe, FileArchive, PlusCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const CHILE_REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío',
  'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
];

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { createProject } = useProjects();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile data
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [operatingRegion, setOperatingRegion] = useState('');

  // Project data
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectRegion, setProjectRegion] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [totalLots, setTotalLots] = useState<number>(0);
  const [totalArea, setTotalArea] = useState<number>(0);

  const steps = [
    { title: 'Bienvenida', icon: Rocket },
    { title: 'Tu Perfil', icon: Users },
    { title: 'Primer Proyecto', icon: Building2 },
    { title: '¡Listo!', icon: CheckCircle2 },
  ];

  const progress = ((step + 1) / steps.length) * 100;

  const handleSaveProfile = () => {
    if (!user) return;
    updateProfile({
      phone,
      first_name: profile?.first_name || companyName,
    });
  };

  const handleCreateProject = async () => {
    if (!projectName) {
      toast.error('Ingresa un nombre para tu proyecto');
      return;
    }
    setIsSubmitting(true);
    try {
      await handleSaveProfile();
      await createProject.mutateAsync({
        name: projectName,
        location: projectLocation,
        region: projectRegion,
        description: projectDescription,
        total_lots: totalLots,
        available_lots: totalLots,
        reserved_lots: 0,
        sold_lots: 0,
        total_area: totalArea || null,
        status: 'active',
      });
      setStep(3);
    } catch (error: any) {
      toast.error('Error al crear proyecto: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipProject = () => {
    handleSaveProfile();
    onComplete();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Paso {step + 1} de {steps.length}</span>
            <span>{steps[step].title}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((s, i) => (
              <div key={i} className={`flex items-center gap-1 text-xs ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                <s.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                <Rocket className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">¡Bienvenido a Ofertaterrenos!</h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  La plataforma inteligente para gestionar tus proyectos de loteo de principio a fin.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                {[
                  { icon: MapPin, title: 'Gestión de Lotes', desc: 'Mapa interactivo, importación KMZ, estados en tiempo real' },
                  { icon: Users, title: 'CRM Integrado', desc: 'Gestiona leads, reservas y cierres desde un solo lugar' },
                  { icon: Building2, title: 'Multi-Proyecto', desc: 'Administra múltiples loteos con dashboards independientes' },
                ].map((feature, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <feature.icon className="h-6 w-6 text-primary" />
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                ))}
              </div>
              <Button size="lg" className="gap-2" onClick={() => setStep(1)}>
                Comenzar Configuración
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Tu Perfil Comercial</h2>
                <p className="text-muted-foreground">Esta información ayuda a personalizar tu experiencia</p>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Nombre de Empresa / Razón Social</Label>
                  <Input 
                    id="company"
                    placeholder="ej: Inmobiliaria Valle del Sol SpA"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono de Contacto</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone"
                      className="pl-10"
                      placeholder="+56 9 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Región Principal de Operación</Label>
                  <select
                    id="region"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={operatingRegion}
                    onChange={(e) => setOperatingRegion(e.target.value)}
                  >
                    <option value="">Selecciona una región</option>
                    {CHILE_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Atrás
                </Button>
                <Button onClick={() => setStep(2)} className="gap-1">
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: First Project */}
        {step === 2 && (
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Tu Primer Proyecto</h2>
                <p className="text-muted-foreground">Configura los datos básicos de tu primer loteo</p>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Proyecto *</Label>
                  <Input 
                    placeholder="ej: Parcelas Valle Hermoso"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Región</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={projectRegion}
                      onChange={(e) => setProjectRegion(e.target.value)}
                    >
                      <option value="">Selecciona</option>
                      {CHILE_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación / Comuna</Label>
                    <Input 
                      placeholder="ej: Coquimbo"
                      value={projectLocation}
                      onChange={(e) => setProjectLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad de Lotes</Label>
                    <Input 
                      type="number"
                      placeholder="50"
                      value={totalLots || ''}
                      onChange={(e) => setTotalLots(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Superficie Total (m²)</Label>
                    <Input 
                      type="number"
                      placeholder="50000"
                      value={totalArea || ''}
                      onChange={(e) => setTotalArea(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea 
                    placeholder="Describe tu proyecto..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Atrás
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSkipProject}>
                    Omitir por ahora
                  </Button>
                  <Button 
                    onClick={handleCreateProject} 
                    disabled={!projectName || isSubmitting}
                    className="gap-1"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                    Crear Proyecto
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">¡Todo Listo!</h2>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Tu proyecto <strong className="text-foreground">{projectName}</strong> ha sido creado. Ya puedes empezar a gestionar tus lotes.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                <Button variant="outline" className="gap-2" onClick={onComplete}>
                  <Building2 className="h-4 w-4" />
                  Ir al Dashboard
                </Button>
                <Button className="gap-2" onClick={onComplete}>
                  <FileArchive className="h-4 w-4" />
                  Importar Lotes KMZ
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;

import { getErrorMessage } from '@/lib/errorMessage';
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
  CheckCircle2, Loader2, Phone, Globe, FileArchive, PlusCircle,
  Crown, TrendingUp, Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useProjects } from '@/hooks/useProjects';
import { PLAN_DETAILS, PlanType } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const LATAM_COUNTRIES = [
  { code: 'CL', name: 'Chile', flag: '🇨🇱', currency: 'CLP', regions: ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío', 'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'] },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', currency: 'ARS', regions: ['Buenos Aires', 'CABA', 'Córdoba', 'Mendoza', 'Santa Fe', 'Tucumán', 'Neuquén', 'Río Negro', 'Salta', 'Entre Ríos'] },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', currency: 'COP', regions: ['Bogotá D.C.', 'Antioquia', 'Valle del Cauca', 'Santander', 'Cundinamarca', 'Atlántico', 'Boyacá', 'Bolívar', 'Meta', 'Nariño'] },
  { code: 'MX', name: 'México', flag: '🇲🇽', currency: 'MXN', regions: ['CDMX', 'Estado de México', 'Jalisco', 'Nuevo León', 'Puebla', 'Guanajuato', 'Querétaro', 'Yucatán', 'Quintana Roo', 'Baja California'] },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', currency: 'USD', regions: ['Lima', 'Arequipa', 'La Libertad', 'Piura', 'Cusco', 'Junín', 'Lambayeque', 'Ica'] },
];

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const { updateProfileAsync } = useProfile();
  const { createProject } = useProjects();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Country & role
  const [selectedCountry, setSelectedCountry] = useState('CL');
  const [userType, setUserType] = useState<'buyer' | 'agent'>('agent');

  // Profile data
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [operatingRegion, setOperatingRegion] = useState('');
  const [estimatedUnits, setEstimatedUnits] = useState<number>(0);

  // Project data
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectRegion, setProjectRegion] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [totalLots, setTotalLots] = useState<number>(0);
  const [totalArea, setTotalArea] = useState<number>(0);

  const country = LATAM_COUNTRIES.find((c) => c.code === selectedCountry) || LATAM_COUNTRIES[0];

  const steps = userType === 'buyer'
    ? [
        { title: 'Bienvenida', icon: Rocket },
        { title: 'Tu País', icon: Globe },
        { title: '¡Listo!', icon: CheckCircle2 },
      ]
    : [
        { title: 'Bienvenida', icon: Rocket },
        { title: 'Tu País', icon: Globe },
        { title: 'Perfil', icon: Users },
        { title: 'Proyecto', icon: Building2 },
        { title: 'Plan', icon: Crown },
        { title: '¡Listo!', icon: CheckCircle2 },
      ];

  const progress = ((step + 1) / steps.length) * 100;

  const getRecommendedPlan = (): PlanType => {
    if (estimatedUnits <= 5) return 'free';
    if (estimatedUnits <= 30) return 'starter';
    if (estimatedUnits <= 150) return 'growth';
    if (estimatedUnits <= 500) return 'scale';
    return 'enterprise';
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    // The company name is NOT the person's first name — it lives in
    // onboarding_data (profiles has no company column).
    await updateProfileAsync({
      phone: phone || null,
      onboarding_completed: true,
      onboarding_data: {
        country: selectedCountry,
        userType,
        companyName,
        operatingRegion,
        estimatedUnits,
        completedAt: new Date().toISOString(),
      },
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
        country: country.name,
        description: projectDescription,
        total_lots: totalLots,
        available_lots: totalLots,
        reserved_lots: 0,
        sold_lots: 0,
        total_area: totalArea || null,
        status: 'active',
      });
      // Move to plan recommendation step
      setStep(4);
    } catch (error: unknown) {
      toast.error('Error al crear proyecto: ' + getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipProject = async () => {
    try {
      await handleSaveProfile();
    } catch {
      // toast already shown by the mutation; still let the user move on
    }
    setStep(4);
  };

  const recommended = getRecommendedPlan();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Paso {step + 1} de {steps.length}</span>
            <span>{steps[step]?.title}</span>
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
                <h1 className="text-3xl font-bold text-foreground">¡Bienvenido a Oferta Terrenos!</h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  La plataforma líder en gestión y venta de terrenos en Latinoamérica.
                </p>
              </div>

              {/* Role selector */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">¿Qué describe mejor tu perfil?</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setUserType('buyer')}
                    className={`p-4 rounded-xl border-2 transition-all text-left space-y-2 ${
                      userType === 'buyer'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <Users className={`h-6 w-6 ${userType === 'buyer' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold text-sm text-foreground">Comprador</p>
                      <p className="text-xs text-muted-foreground">Busco terrenos para comprar</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setUserType('agent')}
                    className={`p-4 rounded-xl border-2 transition-all text-left space-y-2 ${
                      userType === 'agent'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <Building2 className={`h-6 w-6 ${userType === 'agent' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold text-sm text-foreground">Agente / Desarrollador</p>
                      <p className="text-xs text-muted-foreground">Vendo o administro loteos</p>
                    </div>
                  </button>
                </div>
              </div>

              <Button size="lg" className="gap-2" onClick={() => setStep(1)}>
                Continuar
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Country */}
        {step === 1 && (
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">¿En qué país operas?</h2>
                <p className="text-muted-foreground">Esto nos permite adaptar precios, moneda y regiones</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {LATAM_COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCountry(c.code)}
                    className={`p-4 rounded-xl border-2 transition-all text-center space-y-1 ${
                      selectedCountry === c.code
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <span className="text-3xl">{c.flag}</span>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.currency}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Atrás
                </Button>
                <Button
                  onClick={() => {
                    if (userType === 'buyer') {
                      handleSaveProfile().catch(() => { /* toast shown by the mutation */ });
                      setStep(2); // Go to "Listo" for buyers
                    } else {
                      setStep(2); // Go to Profile for agents
                    }
                  }}
                  className="gap-1"
                >
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buyer final step */}
        {step === 2 && userType === 'buyer' && (
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">¡Estás listo!</h2>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Comienza a explorar terrenos en {country.name}. Usa el comparador, guarda favoritos y reserva online.
                </p>
              </div>
              <Button size="lg" className="gap-2" onClick={onComplete}>
                <MapPin className="h-4 w-4" />
                Explorar Terrenos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 (Agent): Profile */}
        {step === 2 && userType === 'agent' && (
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Tu Perfil Comercial</h2>
                <p className="text-muted-foreground">Personaliza tu experiencia de gestión</p>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Nombre de Empresa / Razón Social</Label>
                  <Input 
                    id="company"
                    placeholder="ej: Inmobiliaria Valle del Sol"
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
                      placeholder={country.code === 'CL' ? '+56 9 1234 5678' : '+XX XXXX XXXX'}
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
                    {country.regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="units">¿Cuántos lotes planeas gestionar?</Label>
                  <Input
                    id="units"
                    type="number"
                    placeholder="ej: 50"
                    value={estimatedUnits || ''}
                    onChange={(e) => setEstimatedUnits(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">Esto nos ayuda a recomendarte el plan ideal</p>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Atrás
                </Button>
                <Button onClick={() => setStep(3)} className="gap-1">
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 (Agent): First Project */}
        {step === 3 && userType === 'agent' && (
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Tu Primer Proyecto</h2>
                <p className="text-muted-foreground">Configura los datos básicos de tu primer loteo en {country.name}</p>
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
                      {country.regions.map(r => <option key={r} value={r}>{r}</option>)}
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
                <Button variant="ghost" onClick={() => setStep(2)} className="gap-1">
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

        {/* Step 4 (Agent): Plan Recommendation */}
        {step === 4 && userType === 'agent' && (
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Tu Plan Recomendado</h2>
                <p className="text-muted-foreground">
                  Basado en {estimatedUnits > 0 ? `${estimatedUnits} lotes` : 'tu perfil'}, te sugerimos:
                </p>
              </div>

              {/* Recommended plan card */}
              <div className="p-6 rounded-xl border-2 border-primary bg-primary/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {recommended === 'free' && <Sparkles className="h-5 w-5 text-primary" />}
                      {recommended === 'starter' && <Building2 className="h-5 w-5 text-primary" />}
                      {recommended === 'growth' && <TrendingUp className="h-5 w-5 text-primary" />}
                      {(recommended === 'scale' || recommended === 'enterprise') && <Rocket className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{PLAN_DETAILS[recommended].name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {PLAN_DETAILS[recommended].maxUnits ? `Hasta ${PLAN_DETAILS[recommended].maxUnits} lotes` : 'Lotes ilimitados'}
                      </p>
                    </div>
                  </div>
                  <Badge>Recomendado</Badge>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {PLAN_DETAILS[recommended].price === 0
                    ? 'Gratis'
                    : `$${PLAN_DETAILS[recommended].price.toLocaleString('es-CL')}/mes`}
                </div>
                <ul className="grid gap-2">
                  {PLAN_DETAILS[recommended].features.slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="ghost" onClick={() => setStep(3)} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Atrás
                </Button>
                <div className="flex-1 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setStep(5)}>
                    Comenzar Gratis
                  </Button>
                  {recommended !== 'free' && (
                    <Button onClick={() => {
                      setStep(5);
                      // In production, redirect to checkout
                    }} className="gap-1">
                      <Crown className="h-4 w-4" />
                      Activar {PLAN_DETAILS[recommended].name}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5 (Agent): Complete */}
        {step === 5 && userType === 'agent' && (
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">¡Todo Listo!</h2>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  {projectName
                    ? <>Tu proyecto <strong className="text-foreground">{projectName}</strong> ha sido creado en {country.name}.</>
                    : <>Tu cuenta está configurada para operar en {country.name}.</>
                  }
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

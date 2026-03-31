import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, LogOut, User, Shield, Settings, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PersonalInfoTab from '@/components/profile/PersonalInfoTab';
import SecurityTab from '@/components/profile/SecurityTab';
import PreferencesTab from '@/components/profile/PreferencesTab';
import ProfileStatsCards from '@/components/profile/ProfileStatsCards';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = () => {
    const first = profile?.first_name?.[0] || user?.email?.[0] || 'U';
    const last = profile?.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  const isEmailConfirmed = !!user?.email_confirmed_at;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container max-w-3xl py-8 px-4">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="hidden sm:flex">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>

          <div className="flex items-center gap-6">
            {isLoading ? (
              <Skeleton className="h-24 w-24 rounded-full" />
            ) : (
              <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
                <AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-7 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-foreground truncate">
                    {profile?.first_name} {profile?.last_name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-muted-foreground truncate">{user?.email}</p>
                    {isEmailConfirmed && (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20">
                        <CheckCircle2 className="h-3 w-3" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
            <Button variant="outline" onClick={handleSignOut} className="sm:hidden" size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl py-6 px-4 space-y-6">
        {/* Stats Cards */}
        {user && !isLoading && <ProfileStatsCards userId={user.id} />}

        {/* Tabs */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Seguridad</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Preferencias</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <PersonalInfoTab
                profile={profile}
                user={user}
                updateProfile={updateProfile}
                isUpdating={isUpdating}
              />
            </TabsContent>
            <TabsContent value="security"><SecurityTab /></TabsContent>
            <TabsContent value="preferences"><PreferencesTab /></TabsContent>
          </Tabs>
        )}

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de la Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Miembro desde</p>
                <p className="font-medium">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Última actualización</p>
                <p className="font-medium">
                  {profile?.updated_at
                    ? new Date(profile.updated_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

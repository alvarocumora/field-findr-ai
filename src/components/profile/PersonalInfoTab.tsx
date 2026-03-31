import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, Mail, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Profile, ProfileUpdate } from '@/hooks/useProfile';
import { User as AuthUser } from '@supabase/supabase-js';
import { useEffect } from 'react';
import AvatarUploader from './AvatarUploader';

const profileSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido').max(50, 'Máximo 50 caracteres'),
  last_name: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  phone: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface PersonalInfoTabProps {
  profile: Profile | null;
  user: AuthUser | null;
  updateProfile: (updates: ProfileUpdate) => void;
  isUpdating: boolean;
}

const PersonalInfoTab = ({ profile, user, updateProfile, isUpdating }: PersonalInfoTabProps) => {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: '', last_name: '', phone: '' },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, form]);

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile({
      first_name: values.first_name || null,
      last_name: values.last_name || null,
      phone: values.phone || null,
    });
  };

  const handleAvatarUpload = (url: string) => {
    updateProfile({ avatar_url: url });
  };

  const getInitials = () => {
    const first = profile?.first_name?.[0] || user?.email?.[0] || 'U';
    const last = profile?.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Información Personal
        </CardTitle>
        <CardDescription>Actualiza tu información de contacto y foto de perfil</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex justify-center">
          <AvatarUploader
            currentUrl={profile?.avatar_url || null}
            userId={user?.id || ''}
            initials={getInitials()}
            onUpload={handleAvatarUpload}
          />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Tu nombre" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="+56 9 1234 5678" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>Número de contacto para comunicaciones</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input value={user?.email || ''} disabled className="pl-9 bg-muted" />
              </div>
              <p className="text-sm text-muted-foreground">El correo no se puede modificar</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />Guardar Cambios</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoTab;

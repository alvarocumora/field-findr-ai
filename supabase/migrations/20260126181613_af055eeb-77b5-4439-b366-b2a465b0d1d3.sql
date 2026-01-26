
-- =====================================================
-- FASE 1: Modelo de Datos Ofertaterrenos.com MVP
-- =====================================================

-- 1. Crear enum para roles de usuario
CREATE TYPE public.app_role AS ENUM ('buyer', 'agent', 'admin');

-- 2. Tabla user_roles - Roles de usuario (seguridad)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. Función has_role con SECURITY DEFINER para evitar recursión RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Tabla listings - Propiedades publicadas
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('parcela_rural', 'sitio_industrial', 'campo_agricola', 'terreno_urbano', 'terreno_costero', 'terreno_montana', 'inversion')),
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'CLP',
  area_m2 NUMERIC,
  area_ha NUMERIC,
  location TEXT NOT NULL,
  region TEXT,
  city TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  utilities JSONB DEFAULT '{}',
  zoning TEXT,
  rol TEXT,
  subdivision_eligible BOOLEAN DEFAULT false,
  legal_status TEXT DEFAULT 'pending' CHECK (legal_status IN ('pending', 'reviewing', 'verified', 'rejected')),
  featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'sold', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabla documents - Documentos de verificación
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('titulo', 'certificado_dominio', 'plano', 'informe_tasacion', 'otro')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'verified', 'rejected')),
  file_url TEXT,
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabla messages - Mensajería entre usuarios
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabla favorites - Propiedades guardadas
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- 8. Tabla saved_searches - Búsquedas guardadas
CREATE TABLE public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS - user_roles
-- =====================================================

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- POLÍTICAS RLS - listings
-- =====================================================

-- Lectura pública para listings activos
CREATE POLICY "Anyone can view active listings"
ON public.listings FOR SELECT
USING (status = 'active');

-- Propietarios y agentes pueden ver sus propios listings
CREATE POLICY "Owners can view their own listings"
ON public.listings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Agentes y admins pueden crear listings
CREATE POLICY "Agents can create listings"
ON public.listings FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND (public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin'))
);

-- Propietarios pueden actualizar sus listings
CREATE POLICY "Owners can update their listings"
ON public.listings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Propietarios pueden eliminar sus listings
CREATE POLICY "Owners can delete their listings"
ON public.listings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins pueden gestionar todos los listings
CREATE POLICY "Admins can manage all listings"
ON public.listings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- POLÍTICAS RLS - documents
-- =====================================================

CREATE POLICY "Users can view documents of their listings"
ON public.documents FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create documents for their listings"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their documents"
ON public.documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their documents"
ON public.documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS RLS - messages
-- =====================================================

CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their sent messages"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- =====================================================
-- POLÍTICAS RLS - favorites
-- =====================================================

CREATE POLICY "Users can view their favorites"
ON public.favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
ON public.favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS RLS - saved_searches
-- =====================================================

CREATE POLICY "Users can view their saved searches"
ON public.saved_searches FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create saved searches"
ON public.saved_searches FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved searches"
ON public.saved_searches FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved searches"
ON public.saved_searches FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER para updated_at en listings
-- =====================================================

CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ÍNDICES para mejor rendimiento
-- =====================================================

CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_type ON public.listings(type);
CREATE INDEX idx_listings_region ON public.listings(region);
CREATE INDEX idx_listings_price ON public.listings(price);
CREATE INDEX idx_listings_user_id ON public.listings(user_id);
CREATE INDEX idx_listings_featured ON public.listings(featured) WHERE featured = true;
CREATE INDEX idx_documents_listing_id ON public.documents(listing_id);
CREATE INDEX idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

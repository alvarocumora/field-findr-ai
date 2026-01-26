
-- Hacer user_id nullable temporalmente para permitir datos seed demo
-- Y agregar un campo is_demo para identificar listings de demostración
ALTER TABLE public.listings 
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN is_demo BOOLEAN DEFAULT false;

-- Actualizar la política de lectura para incluir listings demo
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
CREATE POLICY "Anyone can view active listings"
ON public.listings FOR SELECT
USING (status = 'active');

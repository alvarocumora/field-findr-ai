-- Agregar columnas legales a la tabla projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS legal_documents jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS legal_status text DEFAULT 'pending';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS rol_number text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS permits jsonb DEFAULT '[]'::jsonb;

-- Agregar comentarios para documentación
COMMENT ON COLUMN public.projects.legal_documents IS 'Lista de documentos legales del proyecto (título, permisos, planos)';
COMMENT ON COLUMN public.projects.legal_status IS 'Estado legal general: pending, verified, issues';
COMMENT ON COLUMN public.projects.rol_number IS 'Número de ROL catastral de la propiedad';
COMMENT ON COLUMN public.projects.permits IS 'Permisos y aprobaciones del proyecto';
-- Allow anyone to view active projects (public display)
CREATE POLICY "Anyone can view active projects" 
ON public.projects 
FOR SELECT 
USING (status = 'active');

-- Allow anyone to view lots from active projects (for public master plan)
CREATE POLICY "Anyone can view lots from active projects"
ON public.lots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = lots.project_id 
    AND projects.status = 'active'
  )
);
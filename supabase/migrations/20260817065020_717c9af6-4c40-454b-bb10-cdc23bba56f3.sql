DELETE FROM public.notifications WHERE (metadata->>'source') IN ('qa','qa-smoke');
DELETE FROM public.leads WHERE source IN ('qa','qa-smoke');
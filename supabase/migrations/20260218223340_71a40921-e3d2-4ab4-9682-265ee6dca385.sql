
-- Add lead_score column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score_breakdown jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_scored_at timestamp with time zone;

-- Create function to auto-calculate lead score
CREATE OR REPLACE FUNCTION public.calculate_lead_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _score integer := 0;
  _breakdown jsonb := '{}'::jsonb;
BEGIN
  -- Base: has contact info
  IF NEW.email IS NOT NULL THEN _score := _score + 10; _breakdown := _breakdown || '{"email": 10}'::jsonb; END IF;
  IF NEW.phone IS NOT NULL THEN _score := _score + 15; _breakdown := _breakdown || '{"phone": 15}'::jsonb; END IF;
  
  -- Has budget defined
  IF NEW.budget_min IS NOT NULL OR NEW.budget_max IS NOT NULL THEN 
    _score := _score + 20; _breakdown := _breakdown || '{"budget": 20}'::jsonb; 
  END IF;
  
  -- Has area preference
  IF NEW.preferred_area_min IS NOT NULL OR NEW.preferred_area_max IS NOT NULL THEN 
    _score := _score + 10; _breakdown := _breakdown || '{"area_pref": 10}'::jsonb; 
  END IF;
  
  -- Status-based scoring
  CASE NEW.status
    WHEN 'new' THEN _score := _score + 5; _breakdown := _breakdown || '{"status": 5}'::jsonb;
    WHEN 'contacted' THEN _score := _score + 15; _breakdown := _breakdown || '{"status": 15}'::jsonb;
    WHEN 'interested' THEN _score := _score + 30; _breakdown := _breakdown || '{"status": 30}'::jsonb;
    WHEN 'negotiating' THEN _score := _score + 40; _breakdown := _breakdown || '{"status": 40}'::jsonb;
    WHEN 'converted' THEN _score := _score + 50; _breakdown := _breakdown || '{"status": 50}'::jsonb;
    ELSE _score := _score + 0;
  END CASE;
  
  -- Has follow-up scheduled
  IF NEW.next_follow_up IS NOT NULL THEN 
    _score := _score + 10; _breakdown := _breakdown || '{"follow_up": 10}'::jsonb; 
  END IF;
  
  -- Has notes (engagement)
  IF NEW.notes IS NOT NULL AND length(NEW.notes) > 10 THEN 
    _score := _score + 5; _breakdown := _breakdown || '{"notes": 5}'::jsonb; 
  END IF;
  
  -- Associated to project/lot
  IF NEW.project_id IS NOT NULL THEN 
    _score := _score + 10; _breakdown := _breakdown || '{"project": 10}'::jsonb; 
  END IF;
  IF NEW.lot_id IS NOT NULL THEN 
    _score := _score + 15; _breakdown := _breakdown || '{"lot": 15}'::jsonb; 
  END IF;

  NEW.lead_score := LEAST(_score, 100);
  NEW.score_breakdown := _breakdown;
  NEW.last_scored_at := now();
  
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-score on insert/update
DROP TRIGGER IF EXISTS calculate_lead_score_trigger ON public.leads;
CREATE TRIGGER calculate_lead_score_trigger
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.calculate_lead_score();

-- Update existing leads scores
UPDATE public.leads SET updated_at = now() WHERE lead_score = 0 OR lead_score IS NULL;

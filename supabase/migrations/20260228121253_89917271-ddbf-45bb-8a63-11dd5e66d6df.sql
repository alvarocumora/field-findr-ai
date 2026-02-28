
-- Agent commissions table
CREATE TABLE public.agent_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  sale_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 3.0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view their own commissions"
  ON public.agent_commissions FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents insert their own commissions"
  ON public.agent_commissions FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents update their own commissions"
  ON public.agent_commissions FOR UPDATE
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents delete their own commissions"
  ON public.agent_commissions FOR DELETE
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins manage all commissions"
  ON public.agent_commissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Agent goals table
CREATE TABLE public.agent_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sales_target NUMERIC NOT NULL DEFAULT 0,
  sales_achieved NUMERIC NOT NULL DEFAULT 0,
  units_target INTEGER NOT NULL DEFAULT 0,
  units_achieved INTEGER NOT NULL DEFAULT 0,
  leads_target INTEGER NOT NULL DEFAULT 0,
  leads_achieved INTEGER NOT NULL DEFAULT 0,
  commission_target NUMERIC NOT NULL DEFAULT 0,
  commission_achieved NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, period_start, period_end)
);

ALTER TABLE public.agent_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view their own goals"
  ON public.agent_goals FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents manage their own goals"
  ON public.agent_goals FOR ALL
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins manage all goals"
  ON public.agent_goals FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_agent_commissions_updated_at
  BEFORE UPDATE ON public.agent_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_goals_updated_at
  BEFORE UPDATE ON public.agent_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

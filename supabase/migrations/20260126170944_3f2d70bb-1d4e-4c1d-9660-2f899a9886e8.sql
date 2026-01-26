-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table (real estate developments)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'Chile',
  total_area NUMERIC,
  total_lots INTEGER DEFAULT 0,
  available_lots INTEGER DEFAULT 0,
  reserved_lots INTEGER DEFAULT 0,
  sold_lots INTEGER DEFAULT 0,
  latitude NUMERIC,
  longitude NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'planning')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lots table (individual parcels)
CREATE TABLE public.lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lot_number TEXT NOT NULL,
  name TEXT,
  description TEXT,
  area NUMERIC NOT NULL,
  price NUMERIC,
  price_per_sqm NUMERIC,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  latitude NUMERIC,
  longitude NUMERIC,
  polygon JSONB,
  features JSONB,
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  reservation_date TIMESTAMP WITH TIME ZONE,
  sale_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table for CRM
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'negotiating', 'converted', 'lost')),
  notes TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  preferred_area_min NUMERIC,
  preferred_area_max NUMERIC,
  next_follow_up TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Lots policies
CREATE POLICY "Users can view their own lots"
  ON public.lots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create lots in their projects"
  ON public.lots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lots"
  ON public.lots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lots"
  ON public.lots FOR DELETE
  USING (auth.uid() = user_id);

-- Leads policies
CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON public.leads FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lots_updated_at
  BEFORE UPDATE ON public.lots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update project lot counts
CREATE OR REPLACE FUNCTION public.update_project_lot_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.projects SET
      total_lots = (SELECT COUNT(*) FROM public.lots WHERE project_id = OLD.project_id),
      available_lots = (SELECT COUNT(*) FROM public.lots WHERE project_id = OLD.project_id AND status = 'available'),
      reserved_lots = (SELECT COUNT(*) FROM public.lots WHERE project_id = OLD.project_id AND status = 'reserved'),
      sold_lots = (SELECT COUNT(*) FROM public.lots WHERE project_id = OLD.project_id AND status = 'sold')
    WHERE id = OLD.project_id;
    RETURN OLD;
  ELSE
    UPDATE public.projects SET
      total_lots = (SELECT COUNT(*) FROM public.lots WHERE project_id = NEW.project_id),
      available_lots = (SELECT COUNT(*) FROM public.lots WHERE project_id = NEW.project_id AND status = 'available'),
      reserved_lots = (SELECT COUNT(*) FROM public.lots WHERE project_id = NEW.project_id AND status = 'reserved'),
      sold_lots = (SELECT COUNT(*) FROM public.lots WHERE project_id = NEW.project_id AND status = 'sold')
    WHERE id = NEW.project_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update lot counts
CREATE TRIGGER update_lot_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.lots
  FOR EACH ROW EXECUTE FUNCTION public.update_project_lot_counts();

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_lots_project_id ON public.lots(project_id);
CREATE INDEX idx_lots_user_id ON public.lots(user_id);
CREATE INDEX idx_lots_status ON public.lots(status);
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_project_id ON public.leads(project_id);
CREATE INDEX idx_leads_status ON public.leads(status);
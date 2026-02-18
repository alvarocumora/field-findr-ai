
-- ============================================
-- TABLE: reviews (project reviews with ratings)
-- ============================================
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified_buyer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews on active projects
CREATE POLICY "Anyone can view reviews"
ON public.reviews FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects WHERE projects.id = reviews.project_id AND projects.status = 'active'
));

-- Authenticated users can create reviews (one per project)
CREATE POLICY "Users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: referrals (referral program)
-- ============================================
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, registered, converted
  reward_type TEXT DEFAULT 'discount', -- discount, credit, commission
  reward_amount NUMERIC DEFAULT 0,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer)
CREATE POLICY "Referrers can view their referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

-- Users can create referrals
CREATE POLICY "Users can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

-- Users can update their own referrals
CREATE POLICY "Users can update their referrals"
ON public.referrals FOR UPDATE
USING (auth.uid() = referrer_id);

-- Admins can manage all referrals
CREATE POLICY "Admins manage all referrals"
ON public.referrals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

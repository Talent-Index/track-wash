-- Create washes table for tracking car wash entries
CREATE TABLE public.washes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  vehicle_plate TEXT,
  vehicle_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty_accounts table
CREATE TABLE public.loyalty_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  washes_count INTEGER NOT NULL DEFAULT 0,
  free_washes_earned INTEGER NOT NULL DEFAULT 0,
  free_washes_redeemed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, business_id)
);

-- Create operator_invites table for invite codes
CREATE TABLE public.operator_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.washes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_invites ENABLE ROW LEVEL SECURITY;

-- Washes RLS policies
CREATE POLICY "Operators can create washes for their branch"
ON public.washes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.operators o
    WHERE o.id = washes.operator_id
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Operators can view today's washes for their branch"
ON public.washes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.operators o
    WHERE o.user_id = auth.uid()
    AND o.branch_id = washes.branch_id
  )
);

CREATE POLICY "Owners can view all washes for their business"
ON public.washes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.branches br
    JOIN public.businesses bus ON br.business_id = bus.id
    WHERE br.id = washes.branch_id
    AND bus.owner_id = auth.uid()
  )
);

CREATE POLICY "Customers can view their own washes"
ON public.washes FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all washes"
ON public.washes FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Loyalty accounts RLS policies
CREATE POLICY "Customers can view own loyalty"
ON public.loyalty_accounts FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Owners can view loyalty for their business"
ON public.loyalty_accounts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = loyalty_accounts.business_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "System can manage loyalty accounts"
ON public.loyalty_accounts FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'owner'::user_role));

-- Operator invites RLS policies
CREATE POLICY "Owners can manage invites for their branches"
ON public.operator_invites FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.branches br
    JOIN public.businesses bus ON br.business_id = bus.id
    WHERE br.id = operator_invites.branch_id
    AND bus.owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view valid invite codes"
ON public.operator_invites FOR SELECT
USING (used_by IS NULL AND expires_at > now());

-- Enable realtime for washes
ALTER PUBLICATION supabase_realtime ADD TABLE public.washes;

-- Create function to update loyalty on wash creation
CREATE OR REPLACE FUNCTION public.update_loyalty_on_wash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
  v_washes_count INTEGER;
BEGIN
  -- Only process if customer_id is set
  IF NEW.customer_id IS NOT NULL THEN
    -- Get business_id from branch
    SELECT br.business_id INTO v_business_id
    FROM branches br
    WHERE br.id = NEW.branch_id;
    
    -- Insert or update loyalty account
    INSERT INTO loyalty_accounts (customer_id, business_id, washes_count)
    VALUES (NEW.customer_id, v_business_id, 1)
    ON CONFLICT (customer_id, business_id)
    DO UPDATE SET 
      washes_count = loyalty_accounts.washes_count + 1,
      updated_at = now();
    
    -- Check if earned a free wash (every 10 washes)
    SELECT washes_count INTO v_washes_count
    FROM loyalty_accounts
    WHERE customer_id = NEW.customer_id AND business_id = v_business_id;
    
    IF v_washes_count % 10 = 0 THEN
      UPDATE loyalty_accounts
      SET free_washes_earned = free_washes_earned + 1
      WHERE customer_id = NEW.customer_id AND business_id = v_business_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for loyalty updates
CREATE TRIGGER on_wash_created
  AFTER INSERT ON public.washes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_on_wash();

-- Function to generate invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'TW-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;
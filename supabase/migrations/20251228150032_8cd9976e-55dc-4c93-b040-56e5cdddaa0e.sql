-- Create role enum for users
CREATE TYPE public.user_role AS ENUM ('customer', 'operator', 'owner', 'admin');

-- Create job status enum
CREATE TYPE public.job_status AS ENUM ('created', 'paid', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled');

-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('mpesa', 'crypto', 'cash');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
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

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Branches table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  town TEXT,
  county TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Operators (detailers) assigned to branches
CREATE TABLE public.operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, branch_id)
);

ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

-- Vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  color TEXT,
  license_plate TEXT,
  vehicle_type TEXT DEFAULT 'sedan',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Services offered
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_kes DECIMAL(10,2) NOT NULL,
  price_usd DECIMAL(10,2),
  duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT UNIQUE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  scheduled_date DATE,
  scheduled_time TIME,
  location_address TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_area TEXT,
  service_type TEXT DEFAULT 'at_branch',
  notes TEXT,
  status job_status DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Jobs table (service execution)
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  amount_kes DECIMAL(10,2),
  amount_usd DECIMAL(10,2),
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  mpesa_checkout_request_id TEXT,
  mpesa_merchant_request_id TEXT,
  mpesa_receipt_number TEXT,
  phone_number TEXT,
  tx_hash TEXT,
  wallet_address TEXT,
  chain_id INTEGER,
  token_symbol TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Activity log for bookings
CREATE TABLE public.booking_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_activity_logs ENABLE ROW LEVEL SECURITY;

-- Notification log
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  template TEXT,
  recipient TEXT,
  status TEXT DEFAULT 'sent',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Function to generate booking code
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Trigger to auto-generate booking code
CREATE OR REPLACE FUNCTION public.set_booking_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := public.generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_code_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_code();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies

-- Profiles
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Businesses
CREATE POLICY "Anyone can view businesses" ON public.businesses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners can manage own business" ON public.businesses FOR ALL TO authenticated USING (auth.uid() = owner_id);

-- Branches (FIXED: use business_id column)
CREATE POLICY "Anyone can view branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Business owners can manage branches" ON public.branches FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = public.branches.business_id AND owner_id = auth.uid()));

-- Operators
CREATE POLICY "Operators can view own record" ON public.operators FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners can manage operators" ON public.operators FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.branches b 
    JOIN public.businesses bus ON b.business_id = bus.id 
    WHERE b.id = public.operators.branch_id AND bus.owner_id = auth.uid()
  ));

-- Vehicles
CREATE POLICY "Users can manage own vehicles" ON public.vehicles FOR ALL TO authenticated USING (auth.uid() = owner_id);

-- Services
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Business owners can manage services" ON public.services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = public.services.business_id AND owner_id = auth.uid()));

-- Bookings
CREATE POLICY "Customers can view own bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Operators can view branch bookings" ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.operators o WHERE o.user_id = auth.uid() AND o.branch_id = public.bookings.branch_id));
CREATE POLICY "Operators can update branch bookings" ON public.bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.operators o WHERE o.user_id = auth.uid() AND o.branch_id = public.bookings.branch_id));
CREATE POLICY "Owners can manage all bookings" ON public.bookings FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.branches br 
    JOIN public.businesses bus ON br.business_id = bus.id 
    WHERE br.id = public.bookings.branch_id AND bus.owner_id = auth.uid()
  ));
CREATE POLICY "Admins can manage all bookings" ON public.bookings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Jobs
CREATE POLICY "Operators can view own jobs" ON public.jobs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.operators WHERE id = public.jobs.operator_id AND user_id = auth.uid()));
CREATE POLICY "Operators can update own jobs" ON public.jobs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.operators WHERE id = public.jobs.operator_id AND user_id = auth.uid()));
CREATE POLICY "Customers can view booking jobs" ON public.jobs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings WHERE id = public.jobs.booking_id AND customer_id = auth.uid()));

-- Payments
CREATE POLICY "Customers can view own payments" ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings WHERE id = public.payments.booking_id AND customer_id = auth.uid()));
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Activity logs
CREATE POLICY "View activity logs for own bookings" ON public.booking_activity_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings WHERE id = public.booking_activity_logs.booking_id AND customer_id = auth.uid()));
CREATE POLICY "Operators can view branch activity logs" ON public.booking_activity_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings b 
    JOIN public.operators o ON b.branch_id = o.branch_id 
    WHERE b.id = public.booking_activity_logs.booking_id AND o.user_id = auth.uid()
  ));

-- Notification logs
CREATE POLICY "Users can view own notifications" ON public.notification_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
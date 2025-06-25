
-- Drop existing policies that depend on the old tables
DROP POLICY IF EXISTS "Tutors can view parent profiles for unlocked contacts" ON public.profiles;
DROP POLICY IF EXISTS "Tutors can view parent info with requests" ON public.profiles;

-- Now drop the existing tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS public.unlocked_contacts CASCADE;
DROP TABLE IF EXISTS public.tutor_profiles CASCADE;
DROP TABLE IF EXISTS public.parent_requests CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the main profiles table (stores all user information)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL CHECK (city IN ('Kanpur', 'Lucknow', 'Unnao')),
  role TEXT NOT NULL CHECK (role IN ('parent', 'tutor')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create parent_requests table (stores tuition requirements from parents)
CREATE TABLE public.parent_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  board TEXT NOT NULL CHECK (board IN ('CBSE', 'ICSE', 'State')),
  class TEXT NOT NULL,
  subjects TEXT[] NOT NULL,
  preferred_timings TEXT NOT NULL,
  locality TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tutor_profiles table (stores tutor professional information)
CREATE TABLE public.tutor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subjects TEXT[] NOT NULL,
  class_range TEXT NOT NULL,
  locality_preferences TEXT[] NOT NULL,
  fee_per_class INTEGER NOT NULL,
  available_timings TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tutor_id)
);

-- Create contact_unlocks table (tracks when tutors unlock parent contacts)
CREATE TABLE public.contact_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.parent_requests(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tutor_id, parent_id, request_id)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Tutors can view parents in same city" ON public.profiles
  FOR SELECT USING (
    role = 'parent' AND 
    city = (SELECT city FROM public.profiles WHERE id = auth.uid() AND role = 'tutor')
  );

-- RLS Policies for parent_requests table
CREATE POLICY "Parents can manage own requests" ON public.parent_requests
  FOR ALL USING (auth.uid() = parent_id);

CREATE POLICY "Tutors can view requests in their city" ON public.parent_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p1, public.profiles p2
      WHERE p1.id = auth.uid() 
      AND p1.role = 'tutor'
      AND p2.id = parent_id 
      AND p2.role = 'parent'
      AND p1.city = p2.city
    )
  );

-- RLS Policies for tutor_profiles table
CREATE POLICY "Tutors can manage own profile" ON public.tutor_profiles
  FOR ALL USING (auth.uid() = tutor_id);

-- RLS Policies for contact_unlocks table
CREATE POLICY "Tutors can manage own unlocks" ON public.contact_unlocks
  FOR ALL USING (auth.uid() = tutor_id);

CREATE POLICY "Parents can view their unlocked contacts" ON public.contact_unlocks
  FOR SELECT USING (auth.uid() = parent_id);

-- Create indexes for better performance
CREATE INDEX idx_profiles_city_role ON public.profiles(city, role);
CREATE INDEX idx_parent_requests_parent_city ON public.parent_requests(parent_id);
CREATE INDEX idx_tutor_profiles_tutor ON public.tutor_profiles(tutor_id);
CREATE INDEX idx_contact_unlocks_tutor_parent ON public.contact_unlocks(tutor_id, parent_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, city, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'city',
    NEW.raw_user_meta_data ->> 'role'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

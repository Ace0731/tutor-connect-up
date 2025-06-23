
-- Create user profiles table
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

-- Create parent requests table
CREATE TABLE public.parent_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT,
  board TEXT NOT NULL CHECK (board IN ('CBSE', 'ICSE', 'State')),
  class TEXT NOT NULL,
  subjects TEXT[] NOT NULL,
  preferred_timings TEXT NOT NULL,
  locality TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tutor profiles table
CREATE TABLE public.tutor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subjects TEXT[] NOT NULL,
  class_range TEXT NOT NULL,
  locality_preferences TEXT[] NOT NULL,
  fee_per_class INTEGER NOT NULL,
  available_timings TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unlocked contacts table
CREATE TABLE public.unlocked_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tutor_id, parent_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for parent requests
CREATE POLICY "Parents can view their own requests" ON public.parent_requests
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents can create their own requests" ON public.parent_requests
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own requests" ON public.parent_requests
  FOR UPDATE USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their own requests" ON public.parent_requests
  FOR DELETE USING (auth.uid() = parent_id);

CREATE POLICY "Tutors can view parent requests in their city" ON public.parent_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'tutor'
      AND profiles.city = (
        SELECT city FROM public.profiles WHERE id = parent_id
      )
    )
  );

-- Create RLS policies for tutor profiles
CREATE POLICY "Tutors can view their own profile" ON public.tutor_profiles
  FOR SELECT USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create their own profile" ON public.tutor_profiles
  FOR INSERT WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can update their own profile" ON public.tutor_profiles
  FOR UPDATE USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can delete their own profile" ON public.tutor_profiles
  FOR DELETE USING (auth.uid() = tutor_id);

-- Create RLS policies for unlocked contacts
CREATE POLICY "Tutors can view their unlocked contacts" ON public.unlocked_contacts
  FOR SELECT USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create unlocked contacts" ON public.unlocked_contacts
  FOR INSERT WITH CHECK (auth.uid() = tutor_id);

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


-- Add missing RLS policies (handle existing ones gracefully)

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Tutors can view parents in same city" ON public.profiles;
DROP POLICY IF EXISTS "Parents can manage own requests" ON public.parent_requests;
DROP POLICY IF EXISTS "Tutors can view requests in their city" ON public.parent_requests;
DROP POLICY IF EXISTS "Tutors can manage own profile" ON public.tutor_profiles;
DROP POLICY IF EXISTS "Tutors can manage own unlocks" ON public.contact_unlocks;
DROP POLICY IF EXISTS "Parents can view their unlocked contacts" ON public.contact_unlocks;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_unlocks ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow tutors to view parent profiles for matchmaking (in same city)
CREATE POLICY "Tutors can view parents for matching" ON public.profiles
  FOR SELECT USING (
    role = 'parent' OR auth.uid() = id
  );

-- Allow parents to manage their own requests
CREATE POLICY "Parents can manage own requests" ON public.parent_requests
  FOR ALL USING (auth.uid() = parent_id);

-- Allow tutors to view all parent requests for matchmaking
CREATE POLICY "Tutors can view parent requests" ON public.parent_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'tutor'
    )
  );

-- Allow tutors to manage their own profiles
CREATE POLICY "Tutors can manage own profile" ON public.tutor_profiles
  FOR ALL USING (auth.uid() = tutor_id);

-- Allow tutors to view all tutor profiles (for reference)
CREATE POLICY "View tutor profiles" ON public.tutor_profiles
  FOR SELECT USING (true);

-- Allow tutors to manage contact unlocks
CREATE POLICY "Tutors can manage unlocks" ON public.contact_unlocks
  FOR ALL USING (auth.uid() = tutor_id);

-- Allow parents to view their unlocked contacts
CREATE POLICY "Parents can view unlocks" ON public.contact_unlocks
  FOR SELECT USING (auth.uid() = parent_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_city_role ON public.profiles(city, role);
CREATE INDEX IF NOT EXISTS idx_parent_requests_parent_city ON public.parent_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_tutor ON public.tutor_profiles(tutor_id);
CREATE INDEX IF NOT EXISTS idx_contact_unlocks_tutor_parent ON public.contact_unlocks(tutor_id, parent_id);

-- Create trigger for the handle_new_user function if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

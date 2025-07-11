-- This script updates the RLS policies to be more secure.

-- Drop existing policies
DROP POLICY IF EXISTS "Tutors can view parents for matching" ON public.profiles;
DROP POLICY IF EXISTS "Tutors can view parent requests" ON public.parent_requests;
DROP POLICY IF EXISTS "View tutor profiles" ON public.tutor_profiles;

-- More restrictive policy for tutors viewing parent profiles
CREATE POLICY "Tutors can view parents in the same city" ON public.profiles
  FOR SELECT USING (
    role = 'parent' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tutor' AND city = profiles.city)
  );

-- More restrictive policy for tutors viewing parent requests
CREATE POLICY "Tutors can view parent requests in their city" ON public.parent_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'tutor' AND p.city = (SELECT city FROM public.profiles WHERE id = parent_id)
    )
  );

-- Allow authenticated users to view all tutor profiles
CREATE POLICY "Authenticated users can view tutor profiles" ON public.tutor_profiles
  FOR SELECT USING (true);

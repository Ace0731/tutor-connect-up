
-- Add missing policies that tutors can view parent profiles for contact unlocking
CREATE POLICY "Tutors can view parent profiles for unlocked contacts" ON public.profiles
  FOR SELECT USING (
    role = 'parent' AND EXISTS (
      SELECT 1 FROM public.unlocked_contacts 
      WHERE unlocked_contacts.parent_id = profiles.id 
      AND unlocked_contacts.tutor_id = auth.uid()
    )
  );

-- Update parent requests policy to include parent profile information
CREATE POLICY "Tutors can view parent info with requests" ON public.profiles
  FOR SELECT USING (
    role = 'parent' AND EXISTS (
      SELECT 1 FROM public.parent_requests 
      WHERE parent_requests.parent_id = profiles.id
      AND EXISTS (
        SELECT 1 FROM public.profiles tutor_profile
        WHERE tutor_profile.id = auth.uid() 
        AND tutor_profile.role = 'tutor'
        AND tutor_profile.city = profiles.city
      )
    )
  );

-- Add index for better performance on location-based queries
CREATE INDEX idx_profiles_city_role ON public.profiles(city, role);
CREATE INDEX idx_parent_requests_parent_city ON public.parent_requests(parent_id);
CREATE INDEX idx_tutor_profiles_tutor_city ON public.tutor_profiles(tutor_id);

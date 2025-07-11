-- Add status column to contact_unlocks table
ALTER TABLE public.contact_unlocks
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';

-- Add a check constraint for valid status values
ALTER TABLE public.contact_unlocks
ADD CONSTRAINT contact_unlocks_status_check CHECK (status IN ('pending', 'approved', 'denied'));

-- Update existing records to 'approved' if they exist (assuming previous unlocks were implicitly approved)
UPDATE public.contact_unlocks
SET status = 'approved';

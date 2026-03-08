
-- Add posted_by column to track who published a job
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS posted_by uuid REFERENCES public.profiles(id);

-- Allow authenticated users to insert jobs
CREATE POLICY "Members can insert jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = posted_by);

-- Allow users to update their own jobs
CREATE POLICY "Members can update own jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = posted_by)
WITH CHECK (auth.uid() = posted_by);

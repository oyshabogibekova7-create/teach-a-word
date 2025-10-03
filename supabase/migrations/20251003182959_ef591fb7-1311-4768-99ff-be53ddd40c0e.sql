-- Drop the existing restrictive INSERT policy for submissions
DROP POLICY IF EXISTS "Anyone can create submissions" ON public.submissions;

-- Create a new PERMISSIVE policy that allows anyone to insert submissions
CREATE POLICY "Anyone can create submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (true);

-- Also ensure the answers policy is permissive
DROP POLICY IF EXISTS "Anyone can create answers" ON public.answers;

CREATE POLICY "Anyone can create answers" 
ON public.answers 
FOR INSERT 
WITH CHECK (true);
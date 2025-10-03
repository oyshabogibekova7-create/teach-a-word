-- Ensure anon/auth roles can access schema (harmless if already granted)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant explicit INSERT privileges required by PostgREST
GRANT INSERT ON TABLE public.submissions TO anon, authenticated;
GRANT INSERT ON TABLE public.answers TO anon, authenticated;

-- Recreate INSERT policies with explicit role targets
DROP POLICY IF EXISTS "Anyone can create submissions" ON public.submissions;
CREATE POLICY "Anyone can create submissions"
ON public.submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create answers" ON public.answers;
CREATE POLICY "Anyone can create answers"
ON public.answers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

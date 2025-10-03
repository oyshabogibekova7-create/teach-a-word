-- Create profiles table for teachers
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Word sets table
CREATE TABLE public.word_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.word_sets ENABLE ROW LEVEL SECURITY;

-- Word sets policies
CREATE POLICY "Anyone can view word sets"
  ON public.word_sets FOR SELECT
  USING (true);

CREATE POLICY "Teachers can create their own word sets"
  ON public.word_sets FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own word sets"
  ON public.word_sets FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own word sets"
  ON public.word_sets FOR DELETE
  USING (auth.uid() = teacher_id);

-- Words table
CREATE TABLE public.words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_set_id uuid REFERENCES public.word_sets(id) ON DELETE CASCADE NOT NULL,
  word text NOT NULL,
  position int NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;

-- Words policies
CREATE POLICY "Anyone can view words"
  ON public.words FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage words in their word sets"
  ON public.words FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.word_sets
      WHERE word_sets.id = words.word_set_id
      AND word_sets.teacher_id = auth.uid()
    )
  );

-- Submissions table
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_set_id uuid REFERENCES public.word_sets(id) ON DELETE CASCADE NOT NULL,
  student_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Submissions policies
CREATE POLICY "Anyone can create submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can view submissions for their word sets"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.word_sets
      WHERE word_sets.id = submissions.word_set_id
      AND word_sets.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete submissions for their word sets"
  ON public.submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.word_sets
      WHERE word_sets.id = submissions.word_set_id
      AND word_sets.teacher_id = auth.uid()
    )
  );

-- Answers table
CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  word_id uuid REFERENCES public.words(id) ON DELETE CASCADE NOT NULL,
  sentence text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Answers policies
CREATE POLICY "Anyone can create answers"
  ON public.answers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can view answers for their word sets"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions
      JOIN public.word_sets ON word_sets.id = submissions.word_set_id
      WHERE submissions.id = answers.submission_id
      AND word_sets.teacher_id = auth.uid()
    )
  );

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Teacher')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
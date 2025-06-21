
-- Create a table to store wizard progress
CREATE TABLE public.wizard_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  active_step TEXT NOT NULL DEFAULT 'exterior',
  step_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Add Row Level Security (RLS) to ensure users can only see their own progress
ALTER TABLE public.wizard_progress ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own wizard progress
CREATE POLICY "Users can view their own wizard progress" 
  ON public.wizard_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own wizard progress
CREATE POLICY "Users can create their own wizard progress" 
  ON public.wizard_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own wizard progress
CREATE POLICY "Users can update their own wizard progress" 
  ON public.wizard_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete their own wizard progress
CREATE POLICY "Users can delete their own wizard progress" 
  ON public.wizard_progress 
  FOR DELETE 
  USING (auth.uid() = user_id);
